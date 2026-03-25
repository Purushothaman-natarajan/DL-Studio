"""
model_engine.py — Central training orchestrator.

Imports all model families from services/models/ and runs:
  1. Classical ML benchmark (all traditional models)
  2. Configurable deep learning training (MLP by default, or user-selected)
  3. Artifact export (plots, SHAP, LIME, manifest)
"""
import datetime
import json
import os
import pickle

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server-side rendering
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import shap
import lime
import lime.lime_tabular
import tensorflow as tf

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.multioutput import MultiOutputRegressor

DEFAULT_TEST_SPLIT = 0.10  # 10% for test set

DEFAULT_TEST_SPLIT = 0.10  # 10% for test set

# --- Model Registry (absolute imports; FastAPI runs from backend/) ---
from services.models.traditional import TRADITIONAL_MODELS
from services.models.deep_learning import DEEP_LEARNING_MODELS
from services.models.deep_learning.mlp_model import MLPModel
from services.models.deep_learning.cnn_model import CNNModel
from services.models.deep_learning.rnn_models import LSTMModel, GRUModel
from services.models.deep_learning.transformer_model import TransformerModel

from core.config import get_run_dir, DEFAULT_VALIDATION_SPLIT, DEFAULT_PATIENCE
from core.logger import logger, run_log_context

# ─────────────────────────────────────────────
# REGISTRY: maps MODEL_ID → class for UI/API lookup
# ─────────────────────────────────────────────
DL_MODEL_REGISTRY = {
    "ann": MLPModel,
    "mlp": MLPModel,
    "cnn": CNNModel,
    "lstm": LSTMModel,
    "gru": GRUModel,
    "transformer": TransformerModel,
}

class EpochMetricsLogger(tf.keras.callbacks.Callback):
    """Emit per-epoch metrics into the shared logger for live UI streaming."""

    def __init__(self, total_epochs: int):
        super().__init__()
        self.total_epochs = max(int(total_epochs or 1), 1)

    def on_train_begin(self, logs=None):
        logger.info(f"DL training started - planned_epochs={self.total_epochs}")

    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}
        loss = logs.get("loss")
        val_loss = logs.get("val_loss")
        loss_value = float(loss) if loss is not None else float("nan")
        if val_loss is None:
            logger.info(f"Epoch {epoch + 1}/{self.total_epochs} - loss={loss_value:.6f}")
            return
        logger.info(
            f"Epoch {epoch + 1}/{self.total_epochs} - loss={loss_value:.6f} - val_loss={float(val_loss):.6f}"
        )

    def on_train_end(self, logs=None):
        logger.info("DL training finished.")

class BenchmarkEngine:
    """Runs all registered traditional ML models and returns comparable metrics."""

    def __init__(self):
        # Instantiate all traditional models lazily via their factory
        self._model_classes = TRADITIONAL_MODELS

    @staticmethod
    def _needs_multi_output_retry(exc: Exception) -> bool:
        text = str(exc).lower()
        return (
            "1d array" in text
            or "multidimensional target" in text
            or "multi-regression" in text
            or "multioutput" in text
        )

    @staticmethod
    def _compute_metrics(y_true, y_pred) -> dict:
        """Compute R2, MAE, MSE metrics."""
        return {
            "r2": float(r2_score(y_true, y_pred)),
            "mae": float(mean_absolute_error(y_true, y_pred)),
            "mse": float(mean_squared_error(y_true, y_pred)),
        }

    def fit_all(self, X_train, y_train, X_val, y_val, X_test=None, y_test=None) -> list:
        """
        Train all models on train set and evaluate on val and test sets.
        Returns metrics for all splits.
        """
        is_multi = y_train.shape[1] > 1
        y_train_1d = y_train.ravel() if not is_multi else y_train

        results = []
        for cls in self._model_classes:
            try:
                model = cls.get_model()
                wrapped_for_multi = is_multi and not cls.SUPPORTS_MULTI_OUTPUT
                if wrapped_for_multi:
                    model = MultiOutputRegressor(model)
                    y_fit = y_train
                else:
                    y_fit = y_train_1d

                try:
                    model.fit(X_train, y_fit)
                    preds_val = model.predict(X_val)
                    preds_train = model.predict(X_train)
                    preds_test = model.predict(X_test) if X_test is not None else None
                except Exception as exc:
                    # Some estimators advertise multi-output support but fail at runtime.
                    # Retry with sklearn's wrapper so benchmarks stay complete.
                    if is_multi and not wrapped_for_multi and self._needs_multi_output_retry(exc):
                        logger.warning(f"Benchmark retry with MultiOutputRegressor: {cls.DISPLAY_NAME}")
                        model = MultiOutputRegressor(cls.get_model())
                        model.fit(X_train, y_train)
                        preds_val = model.predict(X_val)
                        preds_train = model.predict(X_train)
                        preds_test = model.predict(X_test) if X_test is not None else None
                    else:
                        raise

                # Compute metrics for all splits
                train_metrics = self._compute_metrics(y_train, preds_train)
                val_metrics = self._compute_metrics(y_val, preds_val)
                
                result = {
                    "model": cls.DISPLAY_NAME,
                    "model_id": cls.MODEL_ID,
                    "r2": val_metrics["r2"],
                    "mae": val_metrics["mae"],
                    "mse": val_metrics["mse"],
                    "r2_train": train_metrics["r2"],
                    "mae_train": train_metrics["mae"],
                    "mse_train": train_metrics["mse"],
                    "r2_val": val_metrics["r2"],
                    "mae_val": val_metrics["mae"],
                    "mse_val": val_metrics["mse"],
                }

                if preds_test is not None and y_test is not None:
                    test_metrics = self._compute_metrics(y_test, preds_test)
                    result.update({
                        "r2_test": test_metrics["r2"],
                        "mae_test": test_metrics["mae"],
                        "mse_test": test_metrics["mse"],
                    })

                results.append(result)
                logger.info(f"Benchmark [OK] {cls.DISPLAY_NAME}: R2_val={result['r2_val']:.4f}")

                # Persist each trained benchmark model
                joblib.dump(model, get_run_dir(None) / "models" / f"{cls.MODEL_ID}.pkl" if False else
                            # Defer path — will be set at engine level
                            "/tmp/_benchmark_tmp.pkl")
            except Exception as exc:
                logger.error(f"Benchmark [FAIL] {cls.DISPLAY_NAME}: {exc}")

        return results


class ModelEngine:
    """
    Core ML engine.  Coordinates data prep, classical benchmarking,
    user-selected deep learning model training, explainability, and artifact export.
    """

    def __init__(self, data_df: pd.DataFrame, features: list, targets: list):
        self.df = data_df
        self.active_features = [f for f in features if self.df[f].nunique() > 1] or features
        self.targets = targets
        self.scaler = StandardScaler()
        self.run_id = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        self.run_dir = get_run_dir(self.run_id)
        self.X_train = self.X_val = self.X_test = None
        self.y_train = self.y_val = self.y_test = None
        self.plot_color = "#3b82f6"

    # ── Data ─────────────────────────────────────────────────────────────────

    def prepare_data(self, test_split: float = DEFAULT_TEST_SPLIT):
        """
        Split data into 3 parts: train (80%), val (10%), test (10%).
        Uses test_split parameter (default 10%) for the held-out test set.
        """
        df_clean = (
            self.df[self.active_features + self.targets]
            .apply(pd.to_numeric, errors="coerce")
            .dropna()
        )
        if len(df_clean) < 2:
            raise ValueError("Insufficient numeric rows for training.")

        X = df_clean[self.active_features].values
        y = df_clean[self.targets].values
        X_scaled = self.scaler.fit_transform(X)

        if len(df_clean) * test_split < 1:
            test_split = max(1 / len(df_clean), 0.01)

        # First split: 90% train+val, 10% test
        X_train_val, X_test, y_train_val, y_test = train_test_split(
            X_scaled, y, test_size=test_split, random_state=42
        )

        # Second split: 88.89% of remaining (80% of total) train, 11.11% of remaining (10% of total) val
        val_proportion = (1 - test_split) * test_split / (1 - test_split)
        self.X_train, self.X_val, self.y_train, self.y_val = train_test_split(
            X_train_val, y_train_val, test_size=val_proportion, random_state=42
        )
        self.X_test = X_test
        self.y_test = y_test

        # Save test data and feature names for random-datapoint endpoint
        self._save_test_data()

        logger.info(f"Data prepared - train: {len(self.X_train)}, val: {len(self.X_val)}, test: {len(self.X_test)}")

    def _save_test_data(self):
        """Save test data and feature names for inference playground."""
        try:
            data_dir = self.run_dir / "data"
            data_dir.mkdir(parents=True, exist_ok=True)
            
            # Save test features as numpy array
            np.save(str(data_dir / "X_test.npy"), self.X_val)
            
            # Save feature names as pickle
            with open(data_dir / "feature_names.pkl", "wb") as f:
                pickle.dump(self.active_features, f)
            
            # Also save test targets for reference
            np.save(str(data_dir / "y_test.npy"), self.y_val)
            
            # Save target names
            with open(data_dir / "target_names.pkl", "wb") as f:
                pickle.dump(self.targets, f)
            
            # Save scaler for potential future use
            joblib.dump(self.scaler, str(data_dir / "scaler.pkl"))
            
            logger.info(f"Test data saved to {data_dir}")
        except Exception as exc:
            logger.error(f"Failed to save test data: {exc}")

    # ── DL Model Builder ─────────────────────────────────────────────────────

    def _build_dl_model(self, model_type: str, layer_configs: list, training_config: dict) -> tf.keras.Model:
        """Dispatch to the correct DL model builder."""
        input_dim = len(self.active_features)
        output_dim = len(self.targets)
        optimizer = training_config.get("optimizer", "adam")
        loss = "mse"

        if model_type in {"ann", "mlp"}:
            return MLPModel.build(
                input_dim=input_dim, output_dim=output_dim,
                layer_configs=layer_configs, optimizer=optimizer, loss=loss
            )
        elif model_type == "cnn":
            return CNNModel.build(input_dim=input_dim, output_dim=output_dim,
                                  filters=training_config.get("cnn_filters", 64),
                                  kernel_size=training_config.get("cnn_kernel_size", 3),
                                  num_conv_layers=training_config.get("cnn_layers", 2),
                                  dense_units=training_config.get("cnn_dense_units", 64),
                                  dropout=training_config.get("cnn_dropout", 0.2),
                                  optimizer=optimizer, loss=loss)
        elif model_type == "lstm":
            return LSTMModel.build(input_dim=input_dim, output_dim=output_dim,
                                   optimizer=optimizer, loss=loss)
        elif model_type == "gru":
            return GRUModel.build(input_dim=input_dim, output_dim=output_dim,
                                  optimizer=optimizer, loss=loss)
        elif model_type == "transformer":
            return TransformerModel.build(input_dim=input_dim, output_dim=output_dim,
                                          optimizer=optimizer, loss=loss)
        else:  # default: ANN/MLP
            return MLPModel.build(
                input_dim=input_dim, output_dim=output_dim,
                layer_configs=layer_configs, optimizer=optimizer, loss=loss
            )

    # ── Main Pipeline ─────────────────────────────────────────────────────────

    @run_log_context
    def run_training_pipeline(self, layer_configs: list, training_config: dict) -> dict:
        logger.info(f"Starting training pipeline (Run: {self.run_id})")
        self.prepare_data(test_split=DEFAULT_TEST_SPLIT)
        self.plot_color = training_config.get("plotColor", "#3b82f6")

        # Save training data
        self.df.to_csv(self.run_dir / "data" / "training_data.csv", index=False)

        # 1. Classical benchmark ──────────────────────────────────────────────
        bench = BenchmarkEngine()
        comparison = bench.fit_all(
            self.X_train, self.y_train,
            self.X_val, self.y_val,
            self.X_test, self.y_test
        )

        # 2. Deep learning training ───────────────────────────────────────────
        model_type = training_config.get("modelType", "ann").lower()
        dl_model = self._build_dl_model(model_type, layer_configs, training_config)

        callbacks = self._setup_callbacks(training_config)
        planned_epochs = int(training_config.get("epochs", 50))
        logger.info(
            "Training config - "
            f"epochs={planned_epochs}, "
            f"batch_size={int(training_config.get('batchSize', 32))}, "
            f"optimizer={training_config.get('optimizer', 'adam')}, "
            f"test_split={DEFAULT_TEST_SPLIT:.2f}"
        )
        history = dl_model.fit(
            self.X_train, self.y_train,
            validation_data=(self.X_val, self.y_val),
            epochs=planned_epochs,
            batch_size=training_config.get("batchSize", 32),
            callbacks=callbacks,
            verbose=0,
        )

        # Evaluate DL model on all splits
        dl_preds_train = dl_model.predict(self.X_train)
        dl_preds_val = dl_model.predict(self.X_val)
        dl_preds_test = dl_model.predict(self.X_test)

        dl_name = DL_MODEL_REGISTRY.get(model_type, MLPModel).DISPLAY_NAME

        dl_result = {
            "model": dl_name,
            "model_id": model_type,
            "r2": float(r2_score(self.y_val, dl_preds_val)),
            "mae": float(mean_absolute_error(self.y_val, dl_preds_val)),
            "mse": float(mean_squared_error(self.y_val, dl_preds_val)),
            "r2_train": float(r2_score(self.y_train, dl_preds_train)),
            "mae_train": float(mean_absolute_error(self.y_train, dl_preds_train)),
            "mse_train": float(mean_squared_error(self.y_train, dl_preds_train)),
            "r2_val": float(r2_score(self.y_val, dl_preds_val)),
            "mae_val": float(mean_absolute_error(self.y_val, dl_preds_val)),
            "mse_val": float(mean_squared_error(self.y_val, dl_preds_val)),
            "r2_test": float(r2_score(self.y_test, dl_preds_test)),
            "mae_test": float(mean_absolute_error(self.y_test, dl_preds_test)),
            "mse_test": float(mean_squared_error(self.y_test, dl_preds_test)),
        }
        comparison.append(dl_result)
        logger.info(f"DL [OK] {dl_name}: R2_val={dl_result['r2_val']:.4f}, R2_test={dl_result['r2_test']:.4f}")

        # 3. Plots ─────────────────────────────────────────────────────────────
        self._export_residual_plot(self.y_val, dl_preds_val)
        self._export_learning_curve(history.history)
        self._export_correlation_matrix()
        self._export_feature_distributions()

        # 4. Manifest ──────────────────────────────────────────────────────────
        manifest = {
            "run_id": self.run_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "features": self.active_features,
            "targets": self.targets,
            "dl_model": model_type,
            "comparison": comparison,
            "training_config": training_config,
        }
        with open(self.run_dir / "manifest.json", "w") as f:
            json.dump(manifest, f, indent=4)

        # 5. Explainability ───────────────────────────────────────────────────
        shap_values = self._compute_shap(dl_model)
        lime_exp = self._compute_lime(dl_model)

        residuals = [
            {
                "actual": float(np.mean(self.y_val[i])),
                "predicted": float(np.mean(dl_preds_val[i])),
                "residual": float(np.mean(self.y_val[i])) - float(np.mean(dl_preds_val[i])),
            }
            for i in range(min(50, len(self.y_val)))
        ]

        return {
            "run_id": self.run_id,
            "model": dl_model,
            "history": history.history,
            "shap_values": shap_values,
            "lime": lime_exp,
            "features": self.active_features,
            "residuals": residuals,
            "comparison": comparison,
            "sensitivity": self._calculate_sensitivity(dl_model),
            "correlation": self._compute_correlation_data(),
        }

    # ── Explainability ────────────────────────────────────────────────────────

    def _compute_shap(self, model):
        try:
            explainer = shap.KernelExplainer(model.predict, shap.sample(self.X_train, min(10, len(self.X_train))))
            shap_values = explainer.shap_values(self.X_val[:10])
            
            # Generate clean bar chart manually with matplotlib
            plt.figure(figsize=(10, 6))
            mean_abs_shap = np.abs(shap_values).mean(axis=0)
            if mean_abs_shap.ndim > 1:
                mean_abs_shap = mean_abs_shap.mean(axis=1) if mean_abs_shap.shape[0] == len(self.active_features) else mean_abs_shap.mean(axis=0)
            mean_abs_shap = mean_abs_shap.flatten()[:len(self.active_features)]
            
            # Sort descending
            sorted_idx = np.argsort(mean_abs_shap)[::-1]
            sorted_names = [self.active_features[i] for i in sorted_idx]
            sorted_vals = mean_abs_shap[sorted_idx]
            
            colors = plt.cm.Blues(np.linspace(0.4, 0.9, len(sorted_names)))
            bars = plt.barh(range(len(sorted_names)), sorted_vals, color=colors)
            plt.yticks(range(len(sorted_names)), sorted_names, fontsize=10, fontweight='bold')
            plt.xlabel('Mean |SHAP Value| (Feature Impact)', fontsize=12, fontweight='bold')
            plt.ylabel('')
            plt.title('SHAP Feature Importance (Bar)', fontsize=14, fontweight='bold')
            plt.gca().invert_yaxis()
            
            # Add value labels
            for i, (bar, val) in enumerate(zip(bars, sorted_vals)):
                plt.text(bar.get_width() + max(sorted_vals) * 0.01, bar.get_y() + bar.get_height() / 2,
                        f'{val:.3f}', va='center', fontsize=9, color='#333')
            
            plt.tight_layout()
            plt.savefig(str(self.run_dir / "plots" / "shap_summary.png"), dpi=150, bbox_inches='tight')
            plt.close()
            logger.info("SHAP bar plot exported.")
            return shap_values
        except Exception as exc:
            logger.warning(f"SHAP failed: {exc}")
            return np.zeros((len(self.active_features),))

    def _compute_lime(self, model):
        """Compute LIME and generate bar plot for local feature importance."""
        try:
            lime_exp = lime.lime_tabular.LimeTabularExplainer(
                training_data=self.X_train,
                feature_names=self.active_features,
                class_names=self.targets,
                mode="regression",
            )
            
            # Explain first validation sample
            exp_instance = lime_exp.explain_instance(self.X_val[0], model.predict, num_features=len(self.active_features))
            lime_list = exp_instance.as_list()
            
            # Extract feature names and weights for plotting
            features_lime = []
            weights_lime = []
            for feat_weight in lime_list:
                parts = feat_weight[0].rsplit("<=", 1)
                if len(parts) > 1:
                    feat_name = parts[0].strip()
                else:
                    feat_name = feat_weight[0].split(">")[0].strip() if ">" in feat_weight[0] else feat_weight[0]
                features_lime.append(feat_name[:30])  # Truncate long names
                weights_lime.append(feat_weight[1])
            
            # Create LIME bar plot
            plt.figure(figsize=(10, 6))
            colors = ['green' if w > 0 else 'red' for w in weights_lime]
            plt.barh(features_lime, weights_lime, color=colors, alpha=0.7)
            plt.xlabel("Feature Contribution (Local Influence)")
            plt.title("DL-Studio: LIME Local Feature Importance")
            plt.tight_layout()
            plt.savefig(str(self.run_dir / "plots" / "lime_importance.png"), dpi=150)
            plt.close()
            logger.info("LIME bar plot exported.")
            
            return lime_list
        except Exception as exc:
            logger.error(f"LIME failed: {exc}")
            import traceback
            logger.error(traceback.format_exc())
            return []

    # ── Callbacks ─────────────────────────────────────────────────────────────

    def _setup_callbacks(self, config: dict) -> list:
        callbacks = [EpochMetricsLogger(config.get("epochs", 50))]
        if config.get("earlyStopping"):
            callbacks.append(tf.keras.callbacks.EarlyStopping(
                monitor="val_loss",
                patience=config.get("patience", DEFAULT_PATIENCE),
                restore_best_weights=True,
            ))
        checkpoint_path = str(self.run_dir / "models" / "best_model.keras")
        callbacks.append(tf.keras.callbacks.ModelCheckpoint(
            filepath=checkpoint_path,
            monitor="val_loss",
            save_best_only=config.get("saveBestOnly", True),
        ))
        return callbacks

    # ── Plot Exports ──────────────────────────────────────────────────────────

    def _export_residual_plot(self, y_val, y_pred):
        """Generate separate Actual vs Predicted plots for each target."""
        n_targets = y_val.shape[1] if y_val.ndim > 1 else 1
        
        for target_idx in range(n_targets):
            y_val_single = y_val[:, target_idx] if y_val.ndim > 1 else y_val.ravel()
            y_pred_single = y_pred[:, target_idx] if y_pred.ndim > 1 else y_pred.ravel()
            
            target_name = self.targets[target_idx] if target_idx < len(self.targets) else f"Target_{target_idx}"
            
            plt.figure(figsize=(10, 6))
            plt.scatter(y_val_single, y_pred_single, alpha=0.5, color=self.plot_color, 
                       edgecolors="white", lw=0.5)
            lims = [min(y_val_single.min(), y_pred_single.min()), 
                   max(y_val_single.max(), y_pred_single.max())]
            plt.plot(lims, lims, "r--", lw=2, label="Perfect Prediction")
            plt.title(f"DL-Studio: Actual vs Predicted - {target_name}")
            plt.xlabel("Ground Truth")
            plt.ylabel("Model Prediction")
            plt.legend()
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            plt.savefig(str(self.run_dir / "plots" / f"residuals.png"), dpi=150)
            plt.close()
            logger.info(f"Residual plot exported for {target_name}.")

    def _export_learning_curve(self, history: dict):
        """Export training and validation loss curves."""
        try:
            plt.figure(figsize=(12, 6))
            epochs = range(1, len(history.get('loss', [])) + 1)
            plt.plot(epochs, history.get('loss', []), 'b-', label='Training Loss', linewidth=2)
            if 'val_loss' in history:
                plt.plot(epochs, history['val_loss'], 'r-', label='Validation Loss', linewidth=2)
            plt.title('DL-Studio: Model Learning Convergence')
            plt.xlabel('Epoch')
            plt.ylabel('Loss')
            plt.legend()
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            plt.savefig(str(self.run_dir / "plots" / "learning_curve.png"), dpi=150)
            plt.close()
            logger.info("Learning curve exported.")
        except Exception as exc:
            logger.error(f"Learning curve export failed: {exc}")

    def _export_feature_distributions(self):
        """Generate separate Histogram + KDE plot for each input feature."""
        for feat in self.active_features:
            try:
                plt.figure(figsize=(10, 6))
                sns.histplot(self.df[feat].dropna(), kde=True, color=self.plot_color, bins=30)
                plt.title(f"DL-Studio: Distribution - {feat}")
                plt.xlabel(feat)
                plt.ylabel("Frequency")
                plt.tight_layout()
                plt.savefig(str(self.run_dir / "plots" / f"feature_distributions.png"), dpi=150)
                plt.close()
                logger.info(f"Distribution plot exported for {feat}.")
            except Exception as exc:
                logger.error(f"Distribution plot failed for {feat}: {exc}")

    def _export_correlation_matrix(self):
        """Export correlation matrix heatmap for all numeric features and targets."""
        try:
            # Convert to numeric and drop NaN to ensure valid correlation matrix
            df_numeric = self.df[self.active_features + self.targets].apply(
                pd.to_numeric, errors="coerce"
            ).dropna()
            
            if df_numeric.empty or len(df_numeric) < 2:
                logger.warning("Insufficient numeric data for correlation matrix.")
                return
            
            plt.figure(figsize=(14, 12))
            corr = df_numeric.corr()
            
            # Generate heatmap with all annotations
            sns.heatmap(corr, annot=True, cmap="RdBu_r", center=0, fmt=".2f",
                        linewidths=0.5, square=True, cbar_kws={"label": "Correlation"})
            plt.title("DL-Studio: Feature Correlation Matrix", fontsize=16, fontweight="bold")
            plt.tight_layout()
            
            # Save with explicit path
            plot_path = self.run_dir / "plots" / "correlation_matrix.png"
            plot_path.parent.mkdir(parents=True, exist_ok=True)
            plt.savefig(str(plot_path), dpi=150, bbox_inches="tight")
            plt.close()
            logger.info(f"Correlation matrix exported to {plot_path}")
        except Exception as exc:
            logger.error(f"Correlation matrix export failed: {exc}")
            import traceback
            logger.error(traceback.format_exc())

    def _compute_correlation_data(self) -> list:
        """Compute correlation matrix as JSON data for frontend rendering."""
        try:
            all_cols = self.active_features + self.targets
            with open(str(self.run_dir / "correlation_debug.txt"), "w") as dbg:
                dbg.write(f"all_cols: {all_cols}\n")
                dbg.write(f"df.shape: {self.df.shape}\n")
                dbg.write(f"df.columns: {list(self.df.columns)}\n")
                missing = [c for c in all_cols if c not in self.df.columns]
                dbg.write(f"missing: {missing}\n")
            df_numeric = self.df[all_cols].apply(pd.to_numeric, errors="coerce")
            df_numeric = df_numeric.dropna()
            if df_numeric.empty or len(df_numeric) < 2:
                return []
            corr = df_numeric.corr()
            result = []
            for y_col in corr.index:
                for x_col in corr.columns:
                    result.append({"x": x_col, "y": y_col, "value": float(corr.loc[y_col, x_col])})
            return result
        except Exception as e:
            with open(str(self.run_dir / "correlation_debug.txt"), "a") as dbg:
                dbg.write(f"EXCEPTION: {e}\n")
                import traceback
                dbg.write(traceback.format_exc() + "\n")
            return []

    # ── Sensitivity ───────────────────────────────────────────────────────────

    def _calculate_sensitivity(self, model) -> list:
        base = np.mean(self.X_train, axis=0)
        sensitivity = []
        for i, feat in enumerate(self.active_features):
            f_min, f_max = self.X_train[:, i].min(), self.X_train[:, i].max()
            step = (f_max - f_min) / 20 if f_max > f_min else 0
            points = []
            for s in range(21):
                vec = base.copy()
                vec[i] = f_min + step * s
                pred = float(np.mean(model.predict(vec.reshape(1, -1), verbose=0)[0]))
                points.append({"x": float(vec[i]), "y": pred})
            sensitivity.append({"feature": feat, "points": points})
        return sensitivity
