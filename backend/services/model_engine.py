import tensorflow as tf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import shap
import lime
import lime.lime_tabular
import os
import joblib
import datetime

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.multioutput import MultiOutputRegressor

# Model Imports
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, AdaBoostRegressor
from sklearn.svm import SVR
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.tree import DecisionTreeRegressor
from sklearn.neighbors import KNeighborsRegressor
import xgboost as xgb

from core.config import MODELS_DIR, PLOTS_DIR, RUNS_DIR, DEFAULT_VALIDATION_SPLIT, DEFAULT_PATIENCE, get_run_dir
from core.logger import logger
import json

class BenchmarkEngine:
    """Helper to orchestrate multiple classical ML algorithms for regression benchmarking."""
    
    def __init__(self):
        self.models = {
            "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42),
            "XGBoost": xgb.XGBRegressor(objective='reg:squarederror', random_state=42),
            "SVR": SVR(kernel='rbf'),
            "Gradient Boosting": GradientBoostingRegressor(random_state=42),
            "Linear Regression": LinearRegression(),
            "Ridge": Ridge(alpha=1.0),
            "Lasso": Lasso(alpha=0.1),
            "ElasticNet": ElasticNet(alpha=0.1, l1_ratio=0.5),
            "K-Neighbors": KNeighborsRegressor(n_neighbors=5),
            "Decision Tree": DecisionTreeRegressor(random_state=42),
            "AdaBoost": AdaBoostRegressor(n_estimators=50, random_state=42)
        }
        self.results = {}

    def fit_all(self, X_train, y_train, X_val, y_val):
        # We only flatten if single target, otherwise keep it 2D
        is_multi = y_train.shape[1] > 1
        y_train_fit = y_train.ravel() if not is_multi else y_train
        
        bench_data = []
        
        for name, model in self.models.items():
            try:
                current_model = model
                # Some models like SVR and AdaBoost don't support multi-output directly
                if is_multi and name in ["SVR", "AdaBoost", "Ridge", "Lasso", "ElasticNet", "K-Neighbors"]:
                    current_model = MultiOutputRegressor(model)
                
                current_model.fit(X_train, y_train_fit)
                preds = current_model.predict(X_val)
                
                r2 = float(r2_score(y_val, preds))
                mae = float(mean_absolute_error(y_val, preds))
                mse = float(mean_squared_error(y_val, preds))
                
                bench_data.append({
                    "model": name,
                    "r2": r2,
                    "mae": mae,
                    "mse": mse
                })
                logger.info(f"Benchmark - {name} fitted. R2: {r2:.4f}")
            except Exception as e:
                logger.error(f"Benchmark - {name} failed: {e}")
                
        return bench_data

class ModelEngine:
    """Core ML engine for training deep learning and classical regressors."""
    
    def __init__(self, data_df, features, targets):
        self.df = data_df
        self.active_features = [f for f in features if self.df[f].nunique() > 1]
        if not self.active_features: self.active_features = features
            
        self.targets = targets
        self.scaler = StandardScaler()
        self.run_id = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        self.run_dir = get_run_dir(self.run_id)
        self.X_train, self.X_val, self.y_train, self.y_val = None, None, None, None
        self.plot_color = '#3b82f6' # Default color

    def prepare_data(self, val_split=DEFAULT_VALIDATION_SPLIT):
        temp_df = self.df[self.active_features + self.targets].apply(pd.to_numeric, errors='coerce').dropna()
        if len(temp_df) < 2: raise ValueError("Insufficient numeric data for training.")
            
        X, y = temp_df[self.active_features].values, temp_df[self.targets].values
        X_scaled = self.scaler.fit_transform(X)
        
        if len(temp_df) * val_split < 1: val_split = 1 / len(temp_df) if len(temp_df) > 1 else 0.0
            
        self.X_train, self.X_val, self.y_train, self.y_val = train_test_split(
            X_scaled, y, test_size=val_split, random_state=42
        )

    def build_ann(self, layer_configs, training_config):
        model = tf.keras.Sequential()
        model.add(tf.keras.layers.Dense(layer_configs[0]['units'], activation=layer_configs[0]['activation'], input_shape=(len(self.active_features),)))
        for layer in layer_configs[1:]:
            model.add(tf.keras.layers.Dense(layer['units'], activation=layer['activation']))
            
        is_multi_output = len(self.targets) > 1
        model.add(tf.keras.layers.Dense(units=len(self.targets), activation='linear')) # Regression default
        
        model.compile(
            optimizer=training_config.get('optimizer', 'adam'),
            loss='mse',
            metrics=['mae', 'mse']
        )
        return model

    def run_training_pipeline(self, layer_configs, training_config):
        logger.info(f"Starting Integrated Pipeline Hub (Run: {self.run_id})")
        self.prepare_data(val_split=training_config.get('validationSplit', DEFAULT_VALIDATION_SPLIT))
        
        # Save training data for this run
        self.df.to_csv(self.run_dir / "data" / "training_data.csv", index=False)
        logger.info(f"Training data saved to {self.run_dir / 'data' / 'training_data.csv'}")
        
        # 1. Classical Benchmarking
        bench_engine = BenchmarkEngine()
        comparison = bench_engine.fit_all(self.X_train, self.y_train, self.X_val, self.y_val)
        
        # 2. ANN Strategy
        ann_model = self.build_ann(layer_configs, training_config)
        history = ann_model.fit(
            self.X_train, self.y_train,
            validation_data=(self.X_val, self.y_val),
            epochs=training_config.get('epochs', 50),
            batch_size=training_config.get('batchSize', 32),
            callbacks=self._setup_callbacks(training_config),
            verbose=0
        )
        
        self.plot_color = training_config.get('plotColor', '#3b82f6')
        
        # Add ANN to comparison
        ann_preds = ann_model.predict(self.X_val)
        comparison.append({
            "model": "ANN (Deep Learning)",
            "r2": float(r2_score(self.y_val, ann_preds)),
            "mae": float(mean_absolute_error(self.y_val, ann_preds)),
            "mse": float(mean_squared_error(self.y_val, ann_preds))
        })
        
        # 3. Artifact Exports
        self._export_residual_plot(self.y_val, ann_preds)
        self._export_learning_curve(history.history)
        self._export_correlation_matrix()
        self._export_feature_distributions()
        
        # 4. Save Run Manifest
        manifest = {
            "run_id": self.run_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "features": self.active_features,
            "targets": self.targets,
            "comparison": comparison,
            "training_config": training_config
        }
        with open(self.run_dir / "manifest.json", "w") as f:
            json.dump(manifest, f, indent=4)
        
        # 4. Explainable AI
        # Handle SHAP failures on small samples
        try:
            explainer = shap.KernelExplainer(ann_model.predict, shap.sample(self.X_train, 10))
            shap_values = explainer.shap_values(self.X_val[:10])
            
            # Export SHAP Summary Plot
            plt.figure(figsize=(10, 6))
            shap.summary_plot(shap_values, self.X_val[:10], feature_names=self.active_features, show=False)
            plt.title('DL-Studio: SHAP Global Impact Analysis')
            plt.tight_layout()
            plt.savefig(str(self.run_dir / "plots" / "shap_summary.png"))
            plt.close()
        except Exception as e:
            logger.warning(f"SHAP Plot failed: {e}")
            shap_values = np.zeros((len(self.active_features),))

        lime_explainer = lime.lime_tabular.LimeTabularExplainer(
            training_data=self.X_train, feature_names=self.active_features, class_names=self.targets, mode='regression'
        )
        lime_exp = lime_explainer.explain_instance(self.X_val[0], ann_model.predict).as_list()
        
        y_pred = ann_preds
        residuals = [{"actual": float(np.mean(self.y_val[i])), "predicted": float(np.mean(y_pred[i])), "residual": float(np.mean(self.y_val[i])) - float(np.mean(y_pred[i]))} for i in range(min(50, len(self.y_val)))]
        
        return {
            "run_id": self.run_id,
            "model": ann_model,
            "history": history.history,
            "shap_values": shap_values,
            "lime": lime_exp,
            "features": self.active_features,
            "residuals": residuals,
            "comparison": comparison,
            "sensitivity": self._calculate_sensitivity(ann_model)
        }

    def _setup_callbacks(self, config):
        callbacks = []
        if config.get('earlyStopping'):
            callbacks.append(tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=config.get('patience', DEFAULT_PATIENCE), restore_best_weights=True))
        
        checkpoint_path = self.run_dir / "models" / "best_ann.h5"
        callbacks.append(tf.keras.callbacks.ModelCheckpoint(
            filepath=str(checkpoint_path),
            monitor='val_loss',
            save_best_only=config.get('saveBestOnly', True)
        ))
        return callbacks

    def _export_residual_plot(self, y_val, y_pred):
        plt.figure(figsize=(10, 6))
        plt.scatter(y_val, y_pred, alpha=0.5, color=self.plot_color)
        plt.plot([y_val.min(), y_val.max()], [y_val.min(), y_val.max()], 'r--', lw=2)
        plt.title('DL-Studio: Prediction Residual Map')
        plt.xlabel('Ground Truth')
        plt.ylabel('Model Prediction')
        plt.tight_layout()
        plt.savefig(str(self.run_dir / "plots" / "residuals.png"))
        plt.close()

    def _export_learning_curve(self, history):
        plt.figure(figsize=(10, 6))
        plt.plot(history['loss'], label='Training Loss', lw=3, color=self.plot_color)
        plt.plot(history['val_loss'], label='Validation Loss', lw=3, color='#10b981' if self.plot_color != '#10b981' else '#3b82f6')
        plt.title('DL-Studio: Model Learning Convergence')
        plt.xlabel('Epochs')
        plt.ylabel('Loss (MSE)')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(str(self.run_dir / "plots" / "learning_curve.png"))
        plt.close()

    def _export_correlation_matrix(self):
        plt.figure(figsize=(12, 10))
        corr = self.df[self.active_features + self.targets].corr()
        sns.heatmap(corr, annot=True, cmap='RdBu_r', center=0, fmt='.2f')
        plt.title('DL-Studio: Feature Correlation Matrix')
        plt.tight_layout()
        plt.savefig(str(self.run_dir / "plots" / "correlation_matrix.png"))
        plt.close()

    def _export_feature_distributions(self):
        n_features = len(self.active_features)
        cols = 3
        rows = (n_features + cols - 1) // cols
        
        plt.figure(figsize=(15, 5 * rows))
        for i, feature in enumerate(self.active_features):
            plt.subplot(rows, cols, i + 1)
            sns.histplot(self.df[feature], kde=True, color=self.plot_color)
            plt.title(f'Distribution: {feature}')
        
        plt.tight_layout()
        plt.savefig(str(self.run_dir / "plots" / "feature_distributions.png"))
        plt.close()

    def _calculate_sensitivity(self, model):
        sensitivity_data = []
        base_input = np.mean(self.X_train, axis=0)
        for i, feature in enumerate(self.active_features):
            points = []
            f_min, f_max = np.min(self.X_train[:, i]), np.max(self.X_train[:, i])
            step = (f_max - f_min) / 20.0
            if step > 0:
                for v_idx in range(21):
                    val = f_min + (step * v_idx)
                    sweep_vec = base_input.copy()
                    sweep_vec[i] = val
                    sweep_pred = float(np.mean(model.predict(sweep_vec.reshape(1, -1))[0]))
                    points.append({"x": float(val), "y": sweep_pred})
            sensitivity_data.append({"feature": feature, "points": points})
        return sensitivity_data
