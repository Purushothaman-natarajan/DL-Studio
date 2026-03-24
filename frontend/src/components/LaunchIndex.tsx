import React from 'react';
import {
  Rocket,
  Download,
  ExternalLink,
  MonitorPlay,
} from 'lucide-react';

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
              Build From UI
            </div>
            <h2 className="text-4xl font-black tracking-tight text-zinc-900">
              Open DL-Studio and start building in clicks
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              No README hopping required. Use the action buttons below to launch the workspace
              or jump to source in one step.
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

      <div className="grid grid-cols-1 gap-6">
        <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-zinc-700">Quick Links</h3>
          <p className="text-xs text-zinc-500">
            Open deployment and source quickly if you want to share, fork, or download the full repository.
          </p>
          <div className="space-y-3">
            <a
              href="https://purushothaman-natarajan.github.io/DL-Studio/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-800 hover:bg-zinc-50"
            >
              Live Deployment
              <ExternalLink className="w-4 h-4 text-zinc-500" />
            </a>
            <a
              href="https://github.com/purushothaman-natarajan/DL-Studio"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-800 hover:bg-zinc-50"
            >
              GitHub Repository
              <ExternalLink className="w-4 h-4 text-zinc-500" />
            </a>
            <a
              href="https://github.com/purushothaman-natarajan/DL-Studio/archive/refs/heads/main.zip"
              className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-800 hover:bg-zinc-50"
            >
              Download ZIP
              <Download className="w-4 h-4 text-zinc-500" />
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
