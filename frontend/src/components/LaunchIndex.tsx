import React from 'react';
import { Rocket, MonitorPlay, ClipboardCheck, FileUp, ShieldCheck, BarChart3 } from 'lucide-react';

interface LaunchIndexProps {
  onStart: () => void;
}

export function LaunchIndex({ onStart }: LaunchIndexProps) {
  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-[2rem] border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-8 shadow-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black tracking-widest uppercase text-zinc-500">
              <MonitorPlay className="w-3.5 h-3.5" />
              Local Workspace
            </div>
            <h2 className="text-4xl font-black tracking-tight text-zinc-900">
              Open DL-Studio and start building in clicks
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              You are already in the local app. Continue directly to dataset upload and model building.
            </p>
          </div>
          <button
            onClick={onStart}
            className="inline-flex items-center justify-center gap-3 rounded-2xl bg-zinc-900 px-8 py-4 text-sm font-black uppercase tracking-wider text-white transition-transform hover:scale-[1.01] active:scale-[0.98]"
          >
            <Rocket className="w-4 h-4" />
            Start Building
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <ClipboardCheck className="w-3.5 h-3.5 text-blue-500" />
            Before Start
          </div>
          <h3 className="text-base font-black text-zinc-900">Home Screen Checklist</h3>
          <ul className="text-xs text-zinc-600 leading-relaxed space-y-2 list-disc pl-4">
            <li>Keep your target columns and unit scales ready before upload.</li>
            <li>Use numeric columns for first run, then iterate with feature refinement.</li>
            <li>Open Docs from top-right for full workflow and troubleshooting guide.</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <FileUp className="w-3.5 h-3.5 text-emerald-500" />
            Usage Flow
          </div>
          <h3 className="text-base font-black text-zinc-900">How to Use Local Home</h3>
          <ol className="text-xs text-zinc-600 leading-relaxed space-y-2 list-decimal pl-4">
            <li>Click <span className="font-bold">Start Building</span>.</li>
            <li>Upload CSV or Excel and assign feature/target roles.</li>
            <li>Refine data, choose model architecture, then train and test by run ID.</li>
          </ol>
        </article>

        <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <BarChart3 className="w-3.5 h-3.5 text-violet-500" />
            Best Practices
          </div>
          <h3 className="text-base font-black text-zinc-900">For Better Model Quality</h3>
          <ul className="text-xs text-zinc-600 leading-relaxed space-y-2 list-disc pl-4">
            <li>Start with linear or tree baselines, then compare ANN/CNN/LSTM only if needed.</li>
            <li>Watch live logs during training and keep run IDs for reproducibility.</li>
            <li>Validate with inference sliders and comparison metrics before export/use.</li>
          </ul>
        </article>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[11px] text-amber-800 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
        DL-Studio is local-first. Your files, model artifacts, and run logs stay on your machine under the workspace folder.
      </div>
    </section>
  );
}
