import React, { useMemo, useState } from 'react';
import {
  Rocket,
  TerminalSquare,
  Copy,
  Check,
  Download,
  ExternalLink,
  MonitorPlay,
} from 'lucide-react';

interface LaunchIndexProps {
  onStart: () => void;
}

const LOCAL_SETUP_COMMAND = `git clone https://github.com/purushothaman-natarajan/DL-Studio.git
cd DL-Studio
run_studio.bat`;

export function LaunchIndex({ onStart }: LaunchIndexProps) {
  const [copied, setCopied] = useState(false);

  const canUseClipboard = useMemo(
    () => typeof navigator !== 'undefined' && !!navigator.clipboard,
    []
  );

  const copySetup = async () => {
    if (!canUseClipboard) return;
    try {
      await navigator.clipboard.writeText(LOCAL_SETUP_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('Clipboard copy failed:', error);
    }
  };

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
              No README hopping required. Use the action buttons below to launch the workspace, bootstrap locally,
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-zinc-700">
            <TerminalSquare className="w-4 h-4" />
            <h3 className="text-sm font-black uppercase tracking-wider">Local One-Click Setup</h3>
          </div>
          <p className="text-xs text-zinc-500">
            For Windows users, clone and run once. The script installs dependencies and launches backend + frontend.
          </p>
          <pre className="rounded-2xl bg-zinc-950 text-zinc-100 p-4 text-xs overflow-x-auto">
            <code>{LOCAL_SETUP_COMMAND}</code>
          </pre>
          <button
            onClick={copySetup}
            disabled={!canUseClipboard}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-700 disabled:opacity-40"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Setup Commands'}
          </button>
        </article>

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
