# 🚀 DL-Studio | Unified AI Deep Learning Lab

**DL-Studio** is a robust, local-first Machine Learning platform engineered for high-precision regression analysis, automated data preprocessing, and competitive benchmarking. It bridges the gap between raw Excel data and production-ready Deep Learning models.

---

## 🌟 Key Capabilities

### 🧠 Multi-Model Benchmarking (14+ Models)
Real-time benchmarking across traditional ML and deep learning architectures:
- **Traditional ML**: Linear Regression, Ridge, Lasso, ElasticNet, Decision Tree, Random Forest, AdaBoost, Gradient Boosting, XGBoost, LightGBM, CatBoost, SVR, KNN
- **Deep Learning**: ANN (MLP), CNN (1D), LSTM, GRU, Transformer
- **Multi-Output**: Correct handling of datasets with multiple target variables

### 🧹 Advanced Data Preparation
Native tools for data quality assurance:
- **Missing Value Imputation**: Mean, Median, Zero, or Row-Dropping
- **Outlier Detection**: Z-score filtering (threshold=3) to remove statistical noise
- **Fuzzy Matching**: Automated correction of column name mismatches
- **Feature Scaling**: Mandatory standardization during training pipeline

### 🔍 Explainable AI & Visual Analytics
Full transparency for every prediction:
- **SHAP**: Global feature importance with clean bar charts
- **LIME**: Local surrogate explanations for individual predictions
- **Sensitivity Analysis**: Feature effect curves showing how each input affects output
- **Correlation Matrix**: Full feature-to-feature correlation heatmap
- **Real-time Logs**: Live streaming of backend training logs via SSE

### 📊 Split Results & Analytics
Comprehensive metrics across all data splits:
- **Train / Validation / Test** breakdowns with R², MAE, MSE, RMSE
- **Quality badges**: Excellent / Great / Good / Fair / Poor
- **Overfit detection**: Automatic gap analysis between train and validation
- **Radar comparison**: Top 5 models across all metrics

### 📈 Research Plots (16 Plot Types)
Publication-quality visualizations with expand/download:
- **Regression**: Actual vs Predicted, Residual Plot, Error Distribution, Error vs Actual, Cumulative Error (CDF)
- **Importance**: Feature Importance, Ranked Importance, Cumulative Impact, Sensitivity Analysis
- **Correlation**: Heatmap, Top Correlations
- **Advanced**: Parity Plot, Q-Q Plot, Error Percentiles
- **Export**: PNG and high-quality PDF download for every plot

### 🧪 Verification Hub
Test your trained model with real data:
- **Random Sampling**: Auto-loads random samples from dataset within actual feature ranges
- **Interactive Prediction**: Modify any feature value and see prediction in real-time
- **Randomize**: Get fresh random samples with one click

### 📋 Run Management
- **Run History**: Browse, load, and compare past training runs
- **Delete Runs**: Remove individual runs or clear all history
- **Manifest Export**: Full metadata audit for every session

---

## ⚡ One-Click Local Launch (Windows)

The simplest way to start the studio:

1.  Right-click **`main.ps1`** and select **Run with PowerShell**
2.  Alternatively, double-click **`run_studio.bat`**

The orchestrator automatically checks for Python/Node.js, creates `.venv`, installs all dependencies, and launches FastAPI (8000) + Vite (3000), then opens `http://localhost:3000`.

---

## 📁 Workspace Artifacts
Every training session is archived:
- **`workspace/runs/<run_id>/data/`**: Cleaned dataset backups
- **`workspace/runs/<run_id>/plots/`**: Diagnostic PNGs (Learning Curve, Correlation, SHAP, LIME, Feature Distributions)
- **`workspace/runs/<run_id>/models/`**: Saved `.h5` and `.pkl` binaries
- **`workspace/runs/<run_id>/manifest.json`**: Complete metadata audit
- **`workspace/runs/<run_id>/logs/run.log`**: Training console stream (also via `GET /api/history/<run_id>/logs`)

---

## 🎨 Studio Tabs

| Tab | Purpose |
|-----|---------|
| **Architecture** | Select model family, configure hyperparameters, preview neural network |
| **Training Hub** | Monitor training with live logs, loss curves, MAE over epochs, phase indicators |
| **Verification** | Test model with random samples from actual data ranges |
| **Split Results** | Full Train/Val/Test metrics table with R², MAE, MSE, RMSE per split |
| **Benchmark** | Side-by-side comparison of all 14+ trained models |
| **Intelligence** | SHAP, LIME, Sensitivity, Correlation analysis with expand/download |
| **Research Plots** | 16 publication-quality plots with PNG/PDF export |

---

## 📡 Live Demo

Published at [https://purushothaman-natarajan.github.io/DL-Studio/](https://purushothaman-natarajan.github.io/DL-Studio/)

---

## 🔧 Technology Stack
- **Frontend**: React, TypeScript, Vite, Recharts, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI, Uvicorn, TensorFlow/Keras, Scikit-Learn, XGBoost, LightGBM, CatBoost
- **XAI**: SHAP, LIME, Matplotlib, Seaborn
- **Data**: Pandas, NumPy, OpenPyXL
- **Export**: html2canvas, jsPDF

---

## 👨‍💻 Developed By

### **Purushothaman Natarajan**
*Machine Learning & Computer Vision Engineer | AI Systems Consultant*

- **LinkedIn**: [Purushothaman Natarajan](https://www.linkedin.com/in/purushothaman-natarajan/)
- **Email**: [purushothamanprt@gmail.com](mailto:purushothamanprt@gmail.com)
- **Portfolio**: [purushothaman-natarajan.github.io](https://purushothaman-natarajan.github.io)

🚀
