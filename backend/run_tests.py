import requests
import json
import os

API_URL = "http://localhost:8000"
DATA_FILE = r"C:\Users\purus\Downloads\Data points.xlsx"

def run_tests():
    print(f"Testing DL-Studio Pipeline using {DATA_FILE}")
    if not os.path.exists(DATA_FILE):
        print(f"ERROR: {DATA_FILE} not found!")
        return

    # 1. Test EDA Endpoint
    print("\n--- Testing /eda ---")
    with open(DATA_FILE, "rb") as f:
        resp = requests.post(f"{API_URL}/eda", files={"file": f})
    
    if resp.status_code == 200:
        eda_data = resp.json()
        print(f"EDA Success! Detected {len(eda_data['columns'])} columns.")
    else:
        print("EDA Failed:", resp.text)
        return

    # Assume target is the last column, everything else is features
    cols = eda_data['columns']
    targets = [cols[-1]]    # Last column 
    features = cols[:-1]    # Everything else

    # 2. Test Data Cleaning Endpoint
    print("\n--- Testing /clean ---")
    clean_payload = json.dumps({
        "strategy": "mean",
        "drop_outliers": True
    })
    with open(DATA_FILE, "rb") as f:
        resp = requests.post(f"{API_URL}/clean", files={"file": f}, data={"config": clean_payload})
    
    if resp.status_code == 200:
        clean_res = resp.json()
        print(f"Cleaning Success! New row count: {clean_res['rows']}")
        print(f"Cleaned file saved as: {clean_res['clean_filename']}")
    else:
        print("Cleaning Failed:", resp.text)
        return

    # 3. Test Training Endpoint (Includes Comparison results)
    print("\n--- Testing /train (ANN + RF + SVR + XGBoost) ---")
    training_config = {
        "epochs": 10,
        "batchSize": 32,
        "learningRate": 0.01,
        "optimizer": "adam",
        "loss": "mse",
        "earlyStopping": True,
        "patience": 5,
        "checkpointInterval": 1,
        "saveBestOnly": True,
        "validationSplit": 0.2
    }
    layers = [{"id": "1", "type": "dense", "units": 16, "activation": "relu"}]

    config_payload = json.dumps({
        "features": features,
        "targets": targets,
        "layers": layers,
        "trainingConfig": training_config
    })

    with open(DATA_FILE, "rb") as f:
        resp = requests.post(f"{API_URL}/train", files={"file": f}, data={"config": config_payload})

    if resp.status_code == 200:
        result = resp.json()
        xai = result.get('xai', {})
        print("\nTraining Success!")
        print("Status:", result['status'])
        
        # Verify Model Comparison
        comparison = xai.get('comparison', [])
        print(f"Benchmarked {len(comparison)} models:")
        for res in comparison:
            print(f" - {res['model']}: R2={res['r2']:.4f}, MAE={res['mae']:.4f}")

        print(f"Feature Importance Calculated for: {len(xai.get('importance', []))} features")
        print(f"Sensitivity Data Points Generated: {len(xai.get('sensitivityData', []))} features")
        print(f"Correlation Matrix Generated: {len(xai.get('correlationMatrix', []))} pairs")
        print(f"LIME Analysis Generated: {len(xai.get('lime', []))} terms")

        # 4. Verify Local Workspace Storage
        ws_root = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "workspace")
        raw_files = os.listdir(os.path.join(ws_root, "raw"))
        plot_files = os.listdir(os.path.join(ws_root, "plots"))
        model_files = os.listdir(os.path.join(ws_root, "models"))
        
        print("\n--- Verifying Workspace Storage ---")
        print(f"Raw Backup detected in raw/: {len(raw_files)} files")
        print(f"Exported Plots in plots/: {len(plot_files)} files (Residuals & Correlation)")
        print(f"Saved Models in models/: {len(model_files)} files (ANN, RF, SVR, XGB)")

    else:
        print("Training Failed:", resp.text)

if __name__ == "__main__":
    run_tests()
