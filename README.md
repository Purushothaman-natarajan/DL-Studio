# 🚀 DL-Studio | Unified AI Deep Learning Lab

**DL-Studio** is a robust, local-first Machine Learning platform engineered for high-precision regression analysis, automated data preprocessing, and competitive benchmarking. It bridges the gap between raw Excel data and production-ready Deep Learning models.

---

## 🌟 Key Capabilities

### 🧠 Multi-Model Benchmarking
Benchmarking is done in real-time across four distinct regression architectures:
- **Artificial Neural Networks (ANN)**: Multi-layer TensorFlow dense models.
- **Random Forest Regressor**: Fast, interpretable ensemble learning.
- **Support Vector Regression (SVR)**: High-dimensional geometric mapping.
- **XGBoost**: Extreme Gradient Boosting for tabular dataset dominance.

### 🧹 Advanced Data Preparation
Native tools for data quality assurance:
- **Missing Value Imputation**: Mean, Median, Zero, or Row-Dropping.
- **Outlier Detection**: Z-score filtering (threshold=3) to remove statistical noise.
- **Fuzzy Matching**: Automated correction of column name mismatches and trailing whitespace.

### 🔍 Explainable AI (XAI)
Full transparency for every prediction:
- **SHAP (SHapley Additive exPlanations)**: Unified feature importance.
- **LIME (Local Interpretable Model-agnostic Explanations)**: Instance-specific logic.
- **Matplotlib Exports**: High-resolution PNG correlation matrices and residual charts.

---

## ⚡ One-Click Local Launch (Windows)

The simplest way to start the studio is using the PowerShell orchestrator. This script will automatically check for Python/Node.js, create a virtual environment, and install all ML dependencies locally.

1.  Right-click **`main.ps1`** and select **Run with PowerShell**.
2.  Alternatively, double-click **`run_studio.bat`**.

---

## 📁 Workspace Artifacts
Every training session is archived for future reporting and audit:
- **`backend/workspace/raw/`**: Automatic backup of original datasets.
- **`backend/workspace/plots/`**: Exported Residual and Correlation maps.
- **`backend/workspace/models/`**: Saved `.h5` and `.pkl` binaries.
- **`backend/workspace/logs/`**: Detailed training JSON payloads.

---

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
- **Portfolio**: [View My Story & Portfolio](https://purushothaman.ai)

🚀 🚀 🚀
