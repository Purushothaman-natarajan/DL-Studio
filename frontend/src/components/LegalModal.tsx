import React from 'react';
import { BookOpen, ShieldCheck, FileText, X } from 'lucide-react';

interface LegalModalProps {
  type: 'docs' | 'privacy' | 'terms';
  onClose: () => void;
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  const content = {
    docs: {
      title: 'Documentation',
      icon: BookOpen,
      body: (
        <div className="space-y-4 text-zinc-600">
          <section>
            <h4 className="font-bold text-zinc-900">1. Data Ingestion & Preparation</h4>
            <p>Upload your dataset in CSV or Excel format. DL-Studio automatically performs exploratory data analysis (EDA), identifying missing values, data types, and statistical outliers.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">2. Intelligent Refinement</h4>
            <p>Use the 'Refine' stage to handle missing data through automated imputation (Mean/Mode) and remove outliers based on Z-Score analysis. Your original data remains untouched; only a cleaned local copy is used for training.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">3. Neural Architecture Design</h4>
            <p>Design multi-layer Artificial Neural Networks (ANN) by adding Dense layers. Customize units, activation functions (ReLU, Sigmoid, Tanh), and training hyper-parameters like Epochs and Batch Size.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">4. Benchmarking & Analytics</h4>
            <p>Every training run benchmarks your custom ANN against 10+ classical ML algorithms (XGBoost, Gradient Boosting, SVR, etc.) with native support for <strong>multi-output regression</strong>. Visualize performance through real-time curves and XAI (Explainable AI) metrics like SHAP feature importance.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">5. Real-time Monitoring</h4>
            <p>Monitor the system pipeline exactly as it happens. The 'Intelligence' stage features a live terminal streaming backend logs via Server-Sent Events (SSE), providing total transparency into model convergence and benchmarking phases.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">6. Visual Diagnostics</h4>
            <p>Access high-resolution automated reports including Learning Curves, Feature Correlation Heatmaps, Attribute Distributions, and Residual Analysis directly in the UI or via your local <code>workspace</code>.</p>
          </section>
          <hr className="border-zinc-100" />
          <section className="pt-2">
            <h4 className="font-bold text-zinc-900">About the Developer</h4>
            <p className="text-xs">DL-Studio is meticulously crafted by <strong>Purushothaman Natarajan</strong>, a Computer Vision and AI Systems Engineer. This studio represents a "No-Telemetry" approach to modern ML—your data remains entirely local, private, and secure.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">5. Persistence & Inference</h4>
            <p>All training runs are assigned a unique <code>run_id</code> and stored in your local workspace. Retrieve any historical run to perform 'What-If' analysis and real-time predictions using the dedicated Inference Panel.</p>
          </section>
        </div>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      icon: ShieldCheck,
      body: (
        <div className="space-y-4 text-zinc-600">
          <p>DL-Studio is a **Local-First, Privacy-Focused** application. Your data, models, and training logs never leave your local machine.</p>
          <p>All processing occurs on your local hardware. No telemetry, usage statistics, or user data is transmitted to external servers or the developer.</p>
          <p>Data persistence is managed strictly within your designated <code>workspace</code> directory on your filesystem.</p>
        </div>
      )
    },
    terms: {
      title: 'Terms of Service',
      icon: FileText,
      body: (
        <div className="space-y-4 text-zinc-600">
          <p>DL-Studio is provided for educational, research, and industrial consultancy purposes. While we strive for accuracy, the developer (Purushothaman Natarajan) provides this software "as is" without any warranties.</p>
          <p>Users are responsible for verifying model outcomes before applying them to critical industrial or commercial decision-making processes.</p>
        </div>
      )
    }
  }[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white">
              <content.icon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black">{content.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {content.body}
        </div>
        <div className="p-6 bg-zinc-50 border-t border-zinc-100 text-center">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
