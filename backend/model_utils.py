import tensorflow as tf
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import shap
import lime
import lime.lime_tabular
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor
from sklearn.svm import SVR
import xgboost as xgb
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import joblib

def build_and_train(data_df, features, targets, layer_configs, training_config, checkpoint_dir="checkpoints"):
    # 1. Preprocessing
    X = data_df[features].values
    y = data_df[targets].values
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_val, y_train, y_val = train_test_split(
        X_scaled, y, 
        test_size=training_config.get('validationSplit', 0.2)
    )
    
    # 2. Build Model
    model = tf.keras.Sequential()
    for i, layer in enumerate(layer_configs):
        if i == 0:
            model.add(tf.keras.layers.Dense(
                units=layer['units'], 
                activation=layer['activation'], 
                input_shape=(len(features),)
            ))
        else:
            model.add(tf.keras.layers.Dense(
                units=layer['units'], 
                activation=layer['activation']
            ))
            
    # Output layer
    output_activation = 'softmax' if len(targets) > 1 else 'linear'
    model.add(tf.keras.layers.Dense(units=len(targets), activation=output_activation))
    
    # 3. Compile
    model.compile(
        optimizer=training_config['optimizer'],
        loss='mse' if output_activation == 'linear' else training_config['loss'],
        metrics=['accuracy', 'mae', 'mse'] if output_activation == 'linear' else ['accuracy']
    )
    
    # 4. Callbacks
    callbacks = []
    
    # Early Stopping
    if training_config.get('earlyStopping'):
        callbacks.append(tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=training_config.get('patience', 5),
            restore_best_weights=True
        ))
        
    # Model Checkpointing
    os.makedirs(checkpoint_dir, exist_ok=True)
    checkpoint_path = os.path.join(checkpoint_dir, "model_epoch_{epoch:02d}_loss_{val_loss:.4f}.h5")
    
    if training_config.get('saveBestOnly'):
        checkpoint_path = os.path.join(checkpoint_dir, "best_model.h5")
        
    callbacks.append(tf.keras.callbacks.ModelCheckpoint(
        filepath=checkpoint_path,
        save_weights_only=False,
        monitor='val_loss',
        mode='min',
        save_best_only=training_config.get('saveBestOnly', False),
        save_freq='epoch' if training_config.get('checkpointInterval', 1) == 1 else int(training_config.get('checkpointInterval', 1))
    ))
        
    # 5. Train ANN
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=training_config['epochs'],
        batch_size=training_config['batchSize'],
        callbacks=callbacks,
        verbose=0
    )
    
    # 5b. Train Classical ML Models for Comparison
    comparison_results = []
    
    # Random Forest
    rf = RandomForestRegressor(n_estimators=100)
    rf.fit(X_train, y_train.ravel())
    rf_pred = rf.predict(X_val)
    
    # SVR
    svr = SVR()
    svr.fit(X_train, y_train.ravel())
    svr_pred = svr.predict(X_val)
    
    # XGBoost
    xg_reg = xgb.XGBRegressor(objective ='reg:squarederror')
    xg_reg.fit(X_train, y_train.ravel())
    xg_pred = xg_reg.predict(X_val)
    
    # ANN Preds for metrics
    ann_pred = model.predict(X_val)
    
    models_to_compare = {
        "ANN": ann_pred,
        "Random Forest": rf_pred,
        "SVR": svr_pred,
        "XGBoost": xg_pred
    }
    
    for name, preds in models_to_compare.items():
        comparison_results.append({
            "model": name,
            "r2": float(r2_score(y_val, preds)),
            "mae": float(mean_absolute_error(y_val, preds)),
            "mse": float(mean_squared_error(y_val, preds))
        })
        
    # Save scikit models
    joblib.dump(rf, os.path.join(checkpoint_dir, "rf_model.pkl"))
    joblib.dump(svr, os.path.join(checkpoint_dir, "svr_model.pkl"))
    joblib.dump(xg_reg, os.path.join(checkpoint_dir, "xgboost_model.pkl"))

    # 6. XAI (SHAP & LIME)
    # SHAP
    explainer = shap.KernelExplainer(model.predict, shap.sample(X_train, 10))
    shap_values = explainer.shap_values(X_val[:10])
    
    # LIME
    lime_explainer = lime.lime_tabular.LimeTabularExplainer(
        training_data=X_train,
        feature_names=features,
        class_names=targets,
        mode='regression' if output_activation == 'linear' else 'classification'
    )
    
    lime_exp = lime_explainer.explain_instance(X_val[0], model.predict)
    lime_explanation = lime_exp.as_list()
    
    # 7. Residuals & Actual vs Predicted
    y_pred = ann_pred
    residuals = []
    for i in range(min(50, len(y_val))):
        act = float(np.mean(y_val[i]))
        pred = float(np.mean(y_pred[i]))
        residuals.append({
            "actual": act,    
            "predicted": pred,
            "residual": act - pred
        })

    # Save Residual Plot to PNG
    plt.figure(figsize=(10, 6))
    plt.scatter(y_val, y_pred, alpha=0.5)
    plt.plot([y_val.min(), y_val.max()], [y_val.min(), y_val.max()], 'r--', lw=2)
    plt.xlabel('Actual')
    plt.ylabel('Predicted')
    plt.title('Actual vs Predicted (ANN)')
    plt.savefig(os.path.join(os.path.dirname(checkpoint_dir), "plots", "residuals.png"))
    plt.close()

    # 8. Correlation Matrix
    corr_df = data_df[features + targets].corr()
    correlation_matrix = []
    for f1 in features:
        for f2 in features + targets:
            correlation_matrix.append({
                "x": f1,
                "y": f2,
                "value": float(corr_df.loc[f1, f2]) if pd.notnull(corr_df.loc[f1, f2]) else 0.0
            })
            
    # Save Correlation Heatmap to PNG
    plt.figure(figsize=(12, 10))
    sns.heatmap(corr_df, annot=True, cmap='coolwarm', fmt=".2f")
    plt.title('Feature-Target Correlation Matrix')
    plt.tight_layout()
    plt.savefig(os.path.join(os.path.dirname(checkpoint_dir), "plots", "correlation_matrix.png"))
    plt.close()
            
    # 9. Sensitivity Sweep
    sensitivity_data = []
    base_input = np.mean(X_train, axis=0)
    for i, feature in enumerate(features):
        points = []
        f_min, f_max = np.min(X_train[:, i]), np.max(X_train[:, i])
        step = (f_max - f_min) / 20.0
        if step > 0:
            for v_idx in range(21):
                val = f_min + (step * v_idx)
                sweep_vec = base_input.copy()
                sweep_vec[i] = val
                sweep_pred = float(np.mean(model.predict(sweep_vec.reshape(1, -1))[0]))
                orig_val = val * scaler.scale_[i] + scaler.mean_[i]
                points.append({"x": float(orig_val), "y": sweep_pred})
        sensitivity_data.append({"feature": feature, "points": points})
    
    return model, history.history, shap_values, lime_explanation, features, residuals, correlation_matrix, sensitivity_data, comparison_results
