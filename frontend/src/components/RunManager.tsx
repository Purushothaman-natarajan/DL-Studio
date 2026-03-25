import React, { useState } from 'react';
import { Copy, ExternalLink, History, Rocket, Search, Trash2, AlertTriangle } from 'lucide-react';
import { API_URL } from '../lib/api-utils';
import { cn } from '../lib/utils';

interface RunManagerProps {
  activeRunId: string | null;
  onLoadRun: (runId: string) => void | Promise<void>;
  onOpenHistory: () => void;
  onRunsChanged?: () => void;
}

export function RunManager({ activeRunId, onLoadRun, onOpenHistory, onRunsChanged }: RunManagerProps) {
  const [runIdInput, setRunIdInput] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');

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

  const handleDeleteRun = async () => {
    if (!activeRunId) return;
    setDeleting(true);
    try {
      await fetch(`${API_URL}/api/history/${activeRunId}`, { method: 'DELETE' });
      setDeleteMsg(`Deleted: ${activeRunId}`);
      setTimeout(() => setDeleteMsg(''), 3000);
      onRunsChanged?.();
    } catch (err) {
      setDeleteMsg('Delete failed');
      setTimeout(() => setDeleteMsg(''), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/history`, { method: 'DELETE' });
      const data = await res.json();
      setDeleteMsg(`Cleared ${data.deleted || 0} runs`);
      setShowDeleteAll(false);
      setTimeout(() => setDeleteMsg(''), 3000);
      onRunsChanged?.();
    } catch (err) {
      setDeleteMsg('Clear failed');
      setTimeout(() => setDeleteMsg(''), 3000);
    } finally {
      setDeleting(false);
    }
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

      {/* Delete Actions */}
      <div className="space-y-2">
        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Cleanup</div>
        <div className="flex gap-2">
          <button
            onClick={handleDeleteRun}
            disabled={!activeRunId || deleting}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Trash2 className="w-3 h-3" />
            Delete Active
          </button>
          <button
            onClick={() => setShowDeleteAll(true)}
            disabled={deleting}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 transition-all"
          >
            <Trash2 className="w-3 h-3" />
            Clear All
          </button>
        </div>
        {deleteMsg && (
          <p className={cn("text-[10px] font-bold", deleteMsg.includes('Deleted') || deleteMsg.includes('Cleared') ? 'text-emerald-600' : 'text-red-600')}>
            {deleteMsg}
          </p>
        )}
      </div>

      {/* Confirm Clear All */}
      {showDeleteAll && (
        <div className="p-3 rounded-xl border-2 border-red-300 bg-red-50 space-y-2">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold">Delete ALL runs? This cannot be undone.</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDeleteAll} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700">
              Yes, Delete All
            </button>
            <button onClick={() => setShowDeleteAll(false)} className="flex-1 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-600 text-xs font-bold hover:bg-zinc-50">
              Cancel
            </button>
          </div>
        </div>
      )}

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
