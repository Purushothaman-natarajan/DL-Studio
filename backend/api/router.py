from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
import json
import numpy as np
import traceback

from services.data_manager import DataManager
from services.model_engine import ModelEngine
from services.dataset_analyzer import DatasetAnalyzer
from services.models.traditional.linear_models import LinearRegressionModel
from services.models.traditional import TRADITIONAL_MODELS
from services.models.deep_learning import DEEP_LEARNING_MODELS
from core.logger import logger

router = APIRouter()

@router.get("/models")
async def list_models():
    """Return all available model classes grouped by family."""
    traditional = [
        {"id": cls.MODEL_ID, "name": cls.DISPLAY_NAME, "description": cls.DESCRIPTION, "family": "Traditional ML"}
        for cls in TRADITIONAL_MODELS
    ]
    deep_learning = [
        {"id": cls.MODEL_ID, "name": cls.DISPLAY_NAME, "description": cls.DESCRIPTION, "family": "Deep Learning"}
        for cls in DEEP_LEARNING_MODELS
    ]
    return {"status": "success", "models": traditional + deep_learning}

@router.post("/train")
async def train(
    file: UploadFile = File(...),
    config: str = Form(...)
):
    try:
        # 1. Load Data
        df = await DataManager.load_file(file, file.filename)
        
        # 2. Parse Config
        config_data = json.loads(config)
        features = config_data.get('features', [])
        targets = config_data.get('targets', [])
        cleaning_config = config_data.get('cleaningConfig') or {}
        
        # Fuzzy match columns
        features = DataManager.fuzzy_match_columns(df, features)
        targets = DataManager.fuzzy_match_columns(df, targets)

        # Apply mandatory preparation profile selected in refine stage.
        if cleaning_config:
            # Training pipeline already standardizes features internally.
            # Skip optional UI-only standardization to avoid double scaling.
            clean_cfg = {
                "strategy": cleaning_config.get("strategy", "drop"),
                "drop_outliers": bool(cleaning_config.get("drop_outliers", False)),
            }
            df = DataManager.clean_data(df, clean_cfg)
        
        # 3. Training Pipeline
        engine = ModelEngine(df, features, targets)
        result = await run_in_threadpool(
            engine.run_training_pipeline,
            config_data.get('layers', []),
            config_data.get('trainingConfig', {})
        )
        
        # 4. Format XAI & Analytics
        xai_data = {
            "feature_names": result['features'],
            "importance": [float(n) for n in np.abs(result['shap_values']).mean(axis=0).flatten()[:len(features)]],
            "lime": result['lime'],
            "residuals": result['residuals'],
            "comparison": result['comparison'],
            "sensitivityData": result['sensitivity']
        }
        
        return {
            "status": "success",
            "run_id": result['run_id'],
            "history": result['history'],
            "xai": xai_data
        }

    except Exception as e:
        logger.error(f"Training failed: {e}")
        return JSONResponse(
            status_code=200, # Handled as internal status
            content={
                "status": "error",
                "message": f"Pipeline Failure: {str(e)}",
                "traceback": traceback.format_exc()
            }
        )

@router.post("/eda")
async def eda(file: UploadFile = File(...)):
    try:
        df = await DataManager.load_file(file, file.filename)
        stats = DataManager.get_eda_stats(df)
        return {"status": "success", **stats}
    except Exception as e:
        logger.error(f"EDA failed: {e}")
        return {"status": "error", "message": str(e)}

@router.post("/clean")
async def clean(
    file: UploadFile = File(...),
    config: str = Form(...)
):
    try:
        config_data = json.loads(config)
        df = await DataManager.load_file(file, file.filename)
        
        # Clean
        df_cleaned = DataManager.clean_data(df, config_data)
        
        # Results
        stats = DataManager.get_eda_stats(df_cleaned)
        return {
            "status": "success",
            "data_preview": df_cleaned.head(10).replace({np.nan: None}).to_dict(orient="records"),
            "summary": {
                "strategy": config_data.get("strategy", "drop"),
                "drop_outliers": bool(config_data.get("drop_outliers", False)),
                "standardize_numeric": bool(config_data.get("standardize_numeric", False)),
            },
            **stats
        }
    except Exception as e:
        logger.error(f"Cleaning failed: {e}")
        return {"status": "error", "message": str(e)}

@router.post("/predict")
async def predict(data: dict):
    """Perform real-time inference using a saved model from a specific run."""
    try:
        run_id = data.get('run_id')
        inputs = data.get('inputs', {})
        
        if not run_id:
            return {"status": "error", "message": "No run_id provided"}
            
        from core.config import RUNS_DIR
        import tensorflow as tf
        
        model_path = RUNS_DIR / run_id / "models" / "best_model.keras"
        if not model_path.exists():
            # Fall back to legacy .h5 path
            model_path = RUNS_DIR / run_id / "models" / "best_ann.h5"
        if not model_path.exists():
            return {"status": "error", "message": "Model not found for this run"}
            
        model = tf.keras.models.load_model(str(model_path))
        
        # We'd ideally need the scaler too, but for "What-If" plays, 
        # let's assume raw inputs for now or fix scaling in a real app.
        # For simplicity in this demo, we'll treat them as scaled or pre-processed.
        
        input_array = np.array([list(inputs.values())])
        prediction = model.predict(input_array)
        
        return {
            "status": "success",
            "prediction": prediction.tolist()[0]
        }
    except Exception as e:
        logger.error(f"Inference failed: {e}")
        return {"status": "error", "message": str(e)}

@router.get("/runs/{run_id}/random-datapoint")
async def get_random_datapoint(run_id: str):
    """Load a random sample from the test set for a specific run."""
    try:
        from core.config import RUNS_DIR
        import pickle
        
        run_dir = RUNS_DIR / run_id
        if not run_dir.exists():
            return {"status": "error", "message": f"Run {run_id} not found"}
        
        # Look for saved test data
        test_data_path = run_dir / "data" / "X_test.npy"
        feature_names_path = run_dir / "data" / "feature_names.pkl"
        
        if not test_data_path.exists() or not feature_names_path.exists():
            return {"status": "error", "message": "Test data not found for this run"}
        
        # Load feature names
        with open(feature_names_path, 'rb') as f:
            feature_names = pickle.load(f)
        
        # Load test data
        X_test = np.load(test_data_path)
        
        # Select random sample
        random_idx = np.random.randint(0, X_test.shape[0])
        random_sample = X_test[random_idx]
        
        # Format as dict
        datapoint = {
            feature_names[i]: float(random_sample[i])
            for i in range(len(feature_names))
        }
        
        return {
            "status": "success",
            "datapoint": datapoint,
            "index": int(random_idx)
        }
    except Exception as e:
        logger.error(f"Failed to load random datapoint: {e}")
        return {"status": "error", "message": str(e)}

@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """Provides detailed insights and a preview for an uploaded dataset."""
    try:
        df = await DataManager.load_file(file, file.filename)
        insights = DatasetAnalyzer.get_detailed_insights(df)
        return {"status": "success", **insights}
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        return {"status": "error", "message": str(e)}
