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
            <h4 className="font-bold text-zinc-900">1. Data Preparation</h4>
            <p>Upload CSV or Excel files. The engine automatically handles missing values using mean/mode imputation and detects outliers using Z-score analysis.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">2. Model Configuration</h4>
            <p>Configure your Neural Network by adding dense layers. Choose from activation functions like ReLU, Sigmoid, and Tanh.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">3. Benchmarking</h4>
            <p>Every training run automatically benchmarks your ANN against 10+ classical ML algorithms including XGBoost, Random Forest, and SVR.</p>
          </section>
        </div>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      icon: ShieldCheck,
      body: (
        <div className="space-y-4 text-zinc-600">
          <p>DL-Studio is a **Local-First** application. Your data never leaves your machine. All processing, training, and artifact storage happen within your local `workspace` directory.</p>
          <p>No telemetry or personal data is collected by the developer.</p>
        </div>
      )
    },
    terms: {
      title: 'Terms of Service',
      icon: FileText,
      body: (
        <div className="space-y-4 text-zinc-600">
          <p>DL-Studio is provided "as is" for consultancy and research purposes. The developer is not responsible for any decisions made based on the model outcomes.</p>
          <p>Usage is permitted for both personal and commercial industrial automation projects.</p>
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
