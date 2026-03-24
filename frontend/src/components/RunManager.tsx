import React, { useState } from 'react';
import { Copy, ExternalLink, History, Rocket, Search } from 'lucide-react';
import { API_URL } from '../lib/api-utils';

interface RunManagerProps {
  activeRunId: string | null;
  onLoadRun: (runId: string) => void | Promise<void>;
  onOpenHistory: () => void;
}

export function RunManager({ activeRunId, onLoadRun, onOpenHistory }: RunManagerProps) {
  const [runIdInput, setRunIdInput] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  const copyRunId = async () => {
    if (!activeRunId) return;
    try {
      await navigator.clipboard.writeText(activeRunId);
      setCopyStatus('Copied');
      setTimeout(() => setCopyStatus(''), 1500);
    } catch (error) {
      setCopyStatus('Copy failed');
      setTimeout(() => setCopyStatus(''), 1800);
    }
  };

  const handleLoad = () => {
    const value = runIdInput.trim();
    if (!value) return;
    onLoadRun(value);
  };

  return (
    <div className="p-6 bg-white rounded-3xl border border-zinc-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-blue-500" />
          <h4 className="text-[10px] font-black uppercase tracking-widest">Run Manager</h4>
        </div>
        <button
          onClick={onOpenHistory}
          className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-200"
        >
          <History className="w-3 h-3" />
          History
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Active Run ID</div>
        <div className="flex items-center justify-between gap-2">
          <code className="text-xs font-bold text-zinc-800 bg-white border border-zinc-200 rounded-lg px-2 py-1 overflow-hidden text-ellipsis">
            {activeRunId || 'Not available yet'}
          </code>
          <button
            onClick={copyRunId}
            disabled={!activeRunId}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Copy className="w-3 h-3" />
            Copy
          </button>
        </div>
        <p className="mt-1 min-h-4 text-[10px] font-bold text-emerald-700">{copyStatus}</p>
      </div>

      <div className="space-y-2">
        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Load Any Run ID</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={runIdInput}
            onChange={(e) => setRunIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            placeholder="e.g. 20260324_193446"
            className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs font-mono"
          />
          <button
            onClick={handleLoad}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-zinc-900 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white"
          >
            <Search className="w-3 h-3" />
            Load
          </button>
        </div>
      </div>

      {activeRunId && (
        <a
          href={`${API_URL}/runs/${activeRunId}/manifest.json`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-50"
        >
          Open Run Manifest
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      <p className="text-[11px] text-zinc-500">
        Pick a run ID, load it, then use sliders in the test panel to play around with real-time predictions.
      </p>
    </div>
  );
}
