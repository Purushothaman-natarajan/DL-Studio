# 🚀 DL-Studio | Unified AI Deep Learning Lab

**DL-Studio** is a robust, local-first Machine Learning platform engineered for high-precision regression analysis, automated data preprocessing, and competitive benchmarking. It bridges the gap between raw Excel data and production-ready Deep Learning models.

---

## 🌟 Key Capabilities

### 🧠 Multi-Model Benchmarking
Benchmarking is done in real-time across four distinct regression architectures:
- **Artificial Neural Networks (ANN)**: Multi-layer TensorFlow dense models.
- **Random Forest Regressor**: Fast, interpretable ensemble learning.
- **Support Vector Regression (SVR)**: High-dimensional geometric mapping.
- **XGBoost & Gradient Boosting**: Ensemble dominance for tabular data.
- **Multi-Output Integration**: Correct handling of datasets with multiple target variables.

### 🧹 Advanced Data Preparation
Native tools for data quality assurance:
- **Missing Value Imputation**: Mean, Median, Zero, or Row-Dropping.
- **Outlier Detection**: Z-score filtering (threshold=3) to remove statistical noise.
- **Fuzzy Matching**: Automated correction of column name mismatches and trailing whitespace.

### 🔍 Explainable AI & Visual Analytics
Full transparency for every prediction:
- **Real-time Monitoring**: Live streaming of backend logs via Server-Sent Events (SSE).
- **Automated Graphics**: Generation of Learning Curves, Correlation Heatmaps, and SHAP Summary plots.
- **Explainable AI (XAI)**: SHAP and LIME integration for deep interpretability.

---

## ⚡ One-Click Local Launch (Windows)

The simplest way to start the studio is using the PowerShell orchestrator. This script automatically checks for Python/Node.js, recreates the `.venv`, installs backend Python packages, installs the frontend dependencies, and then launches both FastAPI (8000) and Vite (3000) before opening `http://localhost:3000`.

1.  Right-click **`main.ps1`** and select **Run with PowerShell**.
2.  Alternatively, double-click **`run_studio.bat`** for the same experience via a batch wrapper.

---

## 📁 Workspace Artifacts
Every training session is archived for future reporting and audit in the repository root:
- **`workspace/runs/<run_id>/data/`**: Cleaned dataset backups.
- **`workspace/runs/<run_id>/plots/`**: Exported diagnostic PNGs (Learning Curve, Correlation, SHAP).
- **`workspace/runs/<run_id>/models/`**: Saved `.h5` and `.pkl` binaries.
- **`workspace/runs/<run_id>/manifest.json`**: Complete metadata audit for the session.
- **`workspace/runs/<run_id>/logs/run.log`**: The same annotations that power the UI log terminal. Each training run writes its console stream here and the logs are also available via `GET /api/history/<run_id>/logs`.

---

## 📡 Live Demo & Deployment

The same experience is published at [https://purushothaman-natarajan.github.io/DL-Studio/](https://purushothaman-natarajan.github.io/DL-Studio/). That GitHub Pages build tracks this repository, so running the orchestrator (`main.ps1`/`run_studio.bat`) locally gives you the identical backend + frontend combo—and any updates here can be verified against the live deployment.

## 🔧 Technology Stack
- **Frontend**: React, Vite, Recharts, Lucide-React, Tailwind Design.
- **Backend**: FastAPI, TensorFlow, Scikit-Learn, XGBoost, Pandas, NumPy.
- **XAI Engine**: SHAP, LIME, Matplotlib, Seaborn.

---

## 👨‍💻 Developed By

### **Hi there! 👋 I'm Purushothaman Natarajan**
*Machine Learning & Computer Vision Engineer | AI Systems Consultant*

I specialize in bridging the gap between cutting-edge AI research and production-ready industrial systems. With over 5+ years of experience and a background in Mechanical Engineering, I build intelligent automation for global use cases—from real-time CV pipelines to high-scale GenAI agents.

### 🛠️ What I Do
- **Computer Vision & VLMs**: Building and fine-tuning Vision-Language Models and real-time inference engines for industrial automation.
- **GenAI & LLM Agents**: Designing RAG systems and autonomous agents that reduce manual effort by up to 90%.
- **Production ML**: Scaling CV and DocAI stacks across cloud and edge infrastructure.

### 📚 Connect With Me
I'm always open to discussing deep learning architectures, VLM optimization, or new project collaborations.

- **LinkedIn**: [Purushothaman Natarajan](https://www.linkedin.com/in/purushothaman-natarajan/)
- **Email**: [purushothamanprt@gmail.com](mailto:purushothamanprt@gmail.com)
- **Portfolio**: [View My Story & Portfolio](https://purushothaman-natarajan.github.io)

🚀 🚀 🚀
