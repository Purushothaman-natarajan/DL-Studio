import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

interface RunLogViewerProps {
  logs: string[];
  runId?: string | null;
}

export function RunLogViewer({ logs, runId }: RunLogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatBadge = () => (runId ? `Run Logs - ${runId}` : 'Run Logs');

  return (
    <div className="card rounded-3xl border border-zinc-100 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{formatBadge()}</span>
        </div>
        {logs.length > 0 && (
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {logs.length} lines
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        className="max-h-[320px] overflow-y-auto rounded-b-3xl px-6 py-4 font-mono text-[11px] leading-relaxed text-zinc-900 space-y-2 bg-zinc-50"
      >
        {logs.length === 0 ? (
          <div className="text-[10px] text-zinc-500 tracking-widest uppercase">
            Live logs will appear as soon as training starts.
          </div>
        ) : (
          logs.map((line, index) => {
            const isError = line.includes('ERROR');
            const isWarning = line.includes('WARNING');
            const isInfo = line.includes('INFO');
            return (
              <div
                key={`${index}-${line}`}
                className={cn(
                  'rounded-xl px-3 py-1 border-l-2 transition-all',
                  isError
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : isWarning
                      ? 'border-amber-500 bg-amber-50 text-amber-800'
                      : isInfo
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-zinc-200 bg-white text-zinc-700'
                )}
              >
                {line}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
