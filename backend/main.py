from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json
import io
import os
import datetime
import numpy as np
from model_utils import build_and_train

app = FastAPI()

# Setup Workspace Directories
WORKSPACE_DIR = os.path.join(os.path.dirname(__file__), "workspace")
RAW_DIR = os.path.join(WORKSPACE_DIR, "raw")
CLEANED_DIR = os.path.join(WORKSPACE_DIR, "cleaned")
MODELS_DIR = os.path.join(WORKSPACE_DIR, "models")
LOGS_DIR = os.path.join(WORKSPACE_DIR, "logs")
PLOTS_DIR = os.path.join(WORKSPACE_DIR, "plots")

for d in [RAW_DIR, CLEANED_DIR, MODELS_DIR, LOGS_DIR, PLOTS_DIR]:
    os.makedirs(d, exist_ok=True)


# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/train")
async def train_endpoint(
    file: UploadFile = File(...),
    config: str = Form(...)
):
    # Parse config
    config_data = json.loads(config)
    features = config_data['features']
    targets = config_data['targets']
    layers = config_data['layers']
    training_params = config_data['trainingConfig']
    
    # Load Data
    contents = await file.read()
    
    # Save raw upload for audit trail
    run_id = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    raw_path = os.path.join(RAW_DIR, f"{run_id}_{file.filename}")
    with open(raw_path, "wb") as f:
        f.write(contents)
        
    if file.filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))
        
    # Train
    model, history, shap_vals, lime_explanation, feature_names, residuals, correlation_matrix, sensitivity_data, comparison_results = build_and_train(
        df, features, targets, layers, training_params, checkpoint_dir=MODELS_DIR
    )
    
    # Dump metrics to logs/
    log_file = os.path.join(LOGS_DIR, f"run_{run_id}.json")
    with open(log_file, "w") as f:
        json.dump({
            "filename": file.filename,
            "features": features, 
            "targets": targets, 
            "training_params": training_params,
            "training_history_loss": history.get('loss', []),
            "training_history_val_loss": history.get('val_loss', [])
        }, f)
        
    # Format response
    return {
        "status": "success",
        "history": history,
        "xai": {
            "feature_names": feature_names,
            "importance": [float(n) for n in np.abs(shap_vals).mean(axis=0).flatten()[:len(features)]],
            "lime": lime_explanation,
            "residuals": residuals,
            "correlationMatrix": correlation_matrix,
            "sensitivityData": sensitivity_data,
            "comparison": comparison_results
        }
    }

@app.post("/eda")
async def eda_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    if file.filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))
        
    # Save the uploaded file immediately to raw
    raw_path = os.path.join(RAW_DIR, file.filename)
    with open(raw_path, "wb") as f:
        f.write(contents)
        
    # Replace NaNs with None for JSON serialization
    df_desc = df.describe().replace({np.nan: None})
    
    return {
        "status": "success",
        "columns": df.columns.tolist(),
        "stats": df_desc.to_dict(),
        "missing": df.isnull().sum().to_dict(),
        "rows": len(df)
    }

@app.post("/clean")
async def clean_endpoint(
    file: UploadFile = File(...),
    config: str = Form(...)
):
    config_data = json.loads(config)
    
    contents = await file.read()
    if file.filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))
        
    strategy = config_data.get('strategy', 'drop')
    
    # 1. Imputation or Dropping
    if strategy == 'mean':
        df = df.fillna(df.mean(numeric_only=True))
    elif strategy == 'median':
        df = df.fillna(df.median(numeric_only=True))
    elif strategy == 'zero':
        df = df.fillna(0)
    else:
        df = df.dropna()
        
    # 2. Outliers (Simple Z-score fallback)
    if config_data.get('drop_outliers', False):
        from scipy import stats
        num_cols = df.select_dtypes(include=[np.number]).columns
        z_scores = np.abs(stats.zscore(df[num_cols].fillna(0)))
        df = df[(z_scores < 3).all(axis=1)]
        
    # Save the cleaned dataset!
    run_id = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    save_name = f"cleaned_{run_id}_{file.filename}"
    save_path = os.path.join(CLEANED_DIR, save_name)
    
    if file.filename.endswith('.csv'):
        df.to_csv(save_path, index=False)
    else:
        df.to_excel(save_path, index=False)

    df_desc = df.describe().replace({np.nan: None})
    return {
        "status": "success",
        "columns": df.columns.tolist(),
        "data_preview": df.head(10).replace({np.nan: None}).to_dict(orient="records"),
        "stats": df_desc.to_dict(),
        "missing": df.isnull().sum().to_dict(),
        "rows": len(df),
        "clean_filename": save_name
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
