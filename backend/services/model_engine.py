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

MULTI_OUTPUT_EXCLUDED = {
    "svr", "adaboost", "lasso", "elastic_net", "knn"
}


class BenchmarkEngine:
    """Runs all registered traditional ML models and returns comparable metrics."""

    def __init__(self):
        # Instantiate all traditional models lazily via their factory
        self._model_classes = TRADITIONAL_MODELS

    def fit_all(self, X_train, y_train, X_val, y_val) -> list:
        is_multi = y_train.shape[1] > 1
        y_train_1d = y_train.ravel() if not is_multi else y_train

        results = []
        for cls in self._model_classes:
            try:
                model = cls.get_model()
                if is_multi and not cls.SUPPORTS_MULTI_OUTPUT:
                    model = MultiOutputRegressor(model)
                    y_fit = y_train
                else:
                    y_fit = y_train_1d

                model.fit(X_train, y_fit)
                preds = model.predict(X_val)

                results.append({
                    "model": cls.DISPLAY_NAME,
                    "model_id": cls.MODEL_ID,
                    "r2": float(r2_score(y_val, preds)),
                    "mae": float(mean_absolute_error(y_val, preds)),
                    "mse": float(mean_squared_error(y_val, preds)),
                })
                logger.info(f"Benchmark ✓ {cls.DISPLAY_NAME}: R2={results[-1]['r2']:.4f}")

                # Persist each trained benchmark model
                joblib.dump(model, get_run_dir(None) / "models" / f"{cls.MODEL_ID}.pkl" if False else
                            # Defer path — will be set at engine level
                            "/tmp/_benchmark_tmp.pkl")
            except Exception as exc:
                logger.error(f"Benchmark ✗ {cls.DISPLAY_NAME}: {exc}")

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
        self.X_train = self.X_val = self.y_train = self.y_val = None
        self.plot_color = "#3b82f6"

    # ── Data ─────────────────────────────────────────────────────────────────

    def prepare_data(self, val_split: float = DEFAULT_VALIDATION_SPLIT):
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

        if len(df_clean) * val_split < 1:
            val_split = max(1 / len(df_clean), 0.01)

        self.X_train, self.X_val, self.y_train, self.y_val = train_test_split(
            X_scaled, y, test_size=val_split, random_state=42
        )
        logger.info(f"Data prepared — train: {len(self.X_train)}, val: {len(self.X_val)}")

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
        logger.info(f"🚀 Starting training pipeline (Run: {self.run_id})")
        self.prepare_data(val_split=training_config.get("validationSplit", DEFAULT_VALIDATION_SPLIT))
        self.plot_color = training_config.get("plotColor", "#3b82f6")

        # Save training data
        self.df.to_csv(self.run_dir / "data" / "training_data.csv", index=False)

        # 1. Classical benchmark ──────────────────────────────────────────────
        bench = BenchmarkEngine()
        comparison = bench.fit_all(self.X_train, self.y_train, self.X_val, self.y_val)

        # 2. Deep learning training ───────────────────────────────────────────
        model_type = training_config.get("modelType", "ann").lower()
        dl_model = self._build_dl_model(model_type, layer_configs, training_config)

        callbacks = self._setup_callbacks(training_config)
        history = dl_model.fit(
            self.X_train, self.y_train,
            validation_data=(self.X_val, self.y_val),
            epochs=training_config.get("epochs", 50),
            batch_size=training_config.get("batchSize", 32),
            callbacks=callbacks,
            verbose=0,
        )

        dl_preds = dl_model.predict(self.X_val)
        dl_name = DL_MODEL_REGISTRY.get(model_type, MLPModel).DISPLAY_NAME
        comparison.append({
            "model": dl_name,
            "model_id": model_type,
            "r2": float(r2_score(self.y_val, dl_preds)),
            "mae": float(mean_absolute_error(self.y_val, dl_preds)),
            "mse": float(mean_squared_error(self.y_val, dl_preds)),
        })
        logger.info(f"DL ✓ {dl_name}: R2={comparison[-1]['r2']:.4f}")

        # 3. Plots ─────────────────────────────────────────────────────────────
        self._export_residual_plot(self.y_val, dl_preds)
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
                "predicted": float(np.mean(dl_preds[i])),
                "residual": float(np.mean(self.y_val[i])) - float(np.mean(dl_preds[i])),
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
        }

    # ── Explainability ────────────────────────────────────────────────────────

    def _compute_shap(self, model):
        try:
            explainer = shap.KernelExplainer(model.predict, shap.sample(self.X_train, min(10, len(self.X_train))))
            shap_values = explainer.shap_values(self.X_val[:10])
            plt.figure(figsize=(10, 6))
            shap.summary_plot(shap_values, self.X_val[:10], feature_names=self.active_features, show=False)
            plt.title("DL-Studio: SHAP Global Impact Analysis")
            plt.tight_layout()
            plt.savefig(str(self.run_dir / "plots" / "shap_summary.png"), dpi=150)
            plt.close()
            logger.info("SHAP plot exported.")
            return shap_values
        except Exception as exc:
            logger.warning(f"SHAP failed: {exc}")
            return np.zeros((len(self.active_features),))

    def _compute_lime(self, model):
        try:
            lime_exp = lime.lime_tabular.LimeTabularExplainer(
                training_data=self.X_train,
                feature_names=self.active_features,
                class_names=self.targets,
                mode="regression",
            )
            return lime_exp.explain_instance(self.X_val[0], model.predict).as_list()
        except Exception as exc:
            logger.warning(f"LIME failed: {exc}")
            return []

    # ── Callbacks ─────────────────────────────────────────────────────────────

    def _setup_callbacks(self, config: dict) -> list:
        callbacks = []
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
        y_val_f = y_val.ravel() if y_val.ndim > 1 and y_val.shape[1] == 1 else np.mean(y_val, axis=1)
        y_pred_f = y_pred.ravel() if y_pred.ndim > 1 and y_pred.shape[1] == 1 else np.mean(y_pred, axis=1)
        plt.figure(figsize=(10, 6))
        plt.scatter(y_val_f, y_pred_f, alpha=0.5, color=self.plot_color, edgecolors="white", lw=0.5)
        lims = [min(y_val_f.min(), y_pred_f.min()), max(y_val_f.max(), y_pred_f.max())]
        plt.plot(lims, lims, "r--", lw=2, label="Perfect Prediction")
        plt.title("DL-Studio: Actual vs Predicted")
        plt.xlabel("Ground Truth")
        plt.ylabel("Model Prediction")
        plt.legend()
        plt.tight_layout()
        plt.savefig(str(self.run_dir / "plots" / "residuals.png"), dpi=150)
        plt.close()

    def _export_learning_curve(self, history: dict):
        plt.figure(figsize=(10, 6))
        alt_color = "#10b981" if self.plot_color != "#10b981" else "#3b82f6"
        plt.plot(history["loss"], label="Train Loss", lw=3, color=self.plot_color)
        plt.plot(history["val_loss"], label="Val Loss", lw=3, color=alt_color, linestyle="--")
        plt.title("DL-Studio: Learning Convergence")
        plt.xlabel("Epoch")
        plt.ylabel("Loss (MSE)")
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(str(self.run_dir / "plots" / "learning_curve.png"), dpi=150)
        plt.close()

    def _export_correlation_matrix(self):
        plt.figure(figsize=(12, 10))
        corr = self.df[self.active_features + self.targets].corr()
        sns.heatmap(corr, annot=True, cmap="RdBu_r", center=0, fmt=".2f",
                    linewidths=0.5, square=True)
        plt.title("DL-Studio: Feature Correlation Matrix")
        plt.tight_layout()
        plt.savefig(str(self.run_dir / "plots" / "correlation_matrix.png"), dpi=150)
        plt.close()

    def _export_feature_distributions(self):
        n = len(self.active_features)
        cols = min(3, n)
        rows = (n + cols - 1) // cols
        plt.figure(figsize=(6 * cols, 4 * rows))
        for i, feat in enumerate(self.active_features):
            plt.subplot(rows, cols, i + 1)
            sns.histplot(self.df[feat].dropna(), kde=True, color=self.plot_color)
            plt.title(f"Distribution: {feat}")
        plt.tight_layout()
        plt.savefig(str(self.run_dir / "plots" / "feature_distributions.png"), dpi=150)
        plt.close()

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
