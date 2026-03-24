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
            <h4 className="font-bold text-zinc-900">1. Local Home: Before You Click Start Building</h4>
            <p>Prepare your dataset intent first: define likely target columns, keep units consistent, and remove identifier-only fields if they do not add predictive value.</p>
            <p>From the Home screen, click <strong>Start Building</strong> to enter the full workflow. You can reopen this guide any time using the <strong>Docs</strong> button in the top bar.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">2. Upload and Column Roles</h4>
            <p>Upload CSV or Excel files. Mark each column as <strong>feature</strong>, <strong>target</strong>, or <strong>ignore</strong>. Good role assignment prevents misleading model quality scores.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">3. Data Refinement</h4>
            <p>Use the Refine stage for missing-value handling and outlier control. Start with conservative cleaning settings on your first run and iterate only after checking metrics.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">4. Model Selection Best Practices</h4>
            <p>Start with simpler baselines (Linear, Tree, Boosting) before deep models. Move to ANN/CNN/LSTM/GRU/Transformer when data structure justifies it (strong nonlinearity, ordering, or sequence behavior).</p>
            <p>For ANN, begin with 1 to 2 hidden layers and moderate units; increase complexity only if validation metrics improve consistently.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">5. Training and Live Monitoring</h4>
            <p>During training, monitor the live run logs and benchmark status. This helps detect data issues, convergence problems, or model errors early.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">6. Run Manager and Reproducibility</h4>
            <p>Each training creates a unique <code>run_id</code>. Use Run Manager and History to copy, load, and compare runs for repeatable experiments and what-if testing.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">7. Evaluation and Interpretation</h4>
            <p>Review R2, MAE, MSE, residual behavior, and explanation outputs (SHAP/LIME). Favor models that are stable across multiple runs, not just highest on one metric.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">8. Inference Play Around Mode</h4>
            <p>Load a run using its <code>run_id</code> and adjust inference sliders to test scenarios. Keep values within realistic data ranges for trustworthy predictions.</p>
          </section>
          <section>
            <h4 className="font-bold text-zinc-900">9. Local-First Data Safety</h4>
            <p>All files, model artifacts, and logs stay on your machine under the local <code>workspace</code> directory.</p>
          </section>
        </div>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      icon: ShieldCheck,
      body: (
        <div className="space-y-4 text-zinc-600">
          <p>DL-Studio is a Local-First, Privacy-Focused application. Your data, models, and training logs never leave your local machine.</p>
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
