import React, { useState } from 'react';
import {
  Rocket,
  Download,
  ExternalLink,
  MonitorPlay,
  Copy,
  TerminalSquare,
  ShieldAlert,
} from 'lucide-react';

interface LaunchIndexProps {
  onStart: () => void;
}

const SETUP_COMMANDS = `git clone https://github.com/purushothaman-natarajan/DL-Studio.git
cd DL-Studio
run_studio.bat`;

export function LaunchIndex({ onStart }: LaunchIndexProps) {
  const [copyStatus, setCopyStatus] = useState('');

  const copySetupCommands = async () => {
    try {
      await navigator.clipboard.writeText(SETUP_COMMANDS);
      setCopyStatus('Copied setup commands.');
      setTimeout(() => setCopyStatus(''), 1800);
    } catch (error) {
      setCopyStatus('Copy failed. Select text manually.');
      setTimeout(() => setCopyStatus(''), 2200);
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
              Start directly in the app, or use one-click local setup for Windows without
              jumping into README pages.
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-700">Local One-Click Setup</h3>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-600">
              Windows
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            For Windows users, clone and run once. The script installs dependencies and launches backend + frontend.
          </p>
          <pre className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-100 overflow-x-auto">{SETUP_COMMANDS}</pre>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copySetupCommands}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-800 hover:bg-zinc-50"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Setup Commands
            </button>
            <a
              href="https://github.com/purushothaman-natarajan/DL-Studio/blob/main/run_studio.bat"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-800 hover:bg-zinc-50"
            >
              <TerminalSquare className="w-3.5 h-3.5" />
              Open run_studio.bat
            </a>
            <a
              href="https://github.com/purushothaman-natarajan/DL-Studio/blob/main/main.ps1"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-800 hover:bg-zinc-50"
            >
              <TerminalSquare className="w-3.5 h-3.5" />
              Open main.ps1
            </a>
          </div>
          <p className="min-h-5 text-[11px] font-semibold text-emerald-700">{copyStatus}</p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Browsers cannot execute local CMD/PowerShell commands directly for security reasons.
            Use copy + paste in terminal for one-click setup.
          </div>
        </article>

        <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4 lg:col-span-5">
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
          <p className="text-[11px] text-zinc-500">
            For local one-click startup on Windows, use <span className="font-bold">run_studio.bat</span> or <span className="font-bold">main.ps1</span>.
          </p>
        </article>
      </div>
    </section>
  );
}
