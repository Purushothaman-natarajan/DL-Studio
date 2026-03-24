import React, { useEffect, useState } from 'react';
import { History, Calendar, Target, ChevronRight, X, Trash2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { API_URL } from '../lib/api-utils';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRun: (runId: string) => void;
}

export function HistorySidebar({ isOpen, onClose, onSelectRun }: HistorySidebarProps) {
  const [runs, setRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/history`);
      if (response.ok) {
        const data = await response.json();
        setRuns(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "fixed inset-y-0 right-0 w-96 bg-white border-l border-zinc-100 z-[110] transform transition-transform duration-500 shadow-2xl",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-zinc-900 text-white rounded-xl">
               <History className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-xl font-black">Run History</h2>
               <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Persistence Vault</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-4">
              <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-zinc-400">Retrieving Archive...</p>
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-12">
               <Clock className="w-12 h-12 text-zinc-100 mx-auto mb-4" />
               <p className="text-zinc-400 font-bold uppercase tracking-tighter">No historical runs documented yet</p>
            </div>
          ) : (
            runs.map((run) => (
              <button 
                key={run.run_id}
                onClick={() => onSelectRun(run.run_id)}
                className="w-full text-left p-4 rounded-3xl border border-zinc-100 hover:border-zinc-900 transition-all group hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(run.timestamp).toLocaleDateString()}
                   </div>
                   <div className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-black uppercase text-zinc-500">
                      ID: {run.run_id.split('_').pop()}
                   </div>
                </div>
                
                <h3 className="font-black text-zinc-900 mb-4 group-hover:text-zinc-600 transition-colors">
                   {run.features.length} Features vs {run.targets[0]}
                </h3>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                   <div className="flex items-center gap-4">
                      {run.comparison && run.comparison[0] && (
                        <div>
                           <div className="text-sm font-black text-emerald-600">
                              {(run.comparison[0].r2 * 100).toFixed(1)}%
                           </div>
                           <div className="text-[10px] font-bold text-zinc-400 uppercase">R² Score</div>
                        </div>
                      )}
                   </div>
                   <ChevronRight className="w-5 h-5 text-zinc-200 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-8 border-t border-zinc-100 bg-zinc-50">
           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center mb-4">Storage Analytics</p>
           <div className="flex justify-between items-center px-4">
              <div className="text-center">
                 <div className="text-lg font-black">{runs.length}</div>
                 <div className="text-[10px] uppercase font-bold text-zinc-400">Total Runs</div>
              </div>
              <div className="w-px h-8 bg-zinc-200" />
              <div className="text-center">
                 <div className="text-lg font-black">
                   {runs.length > 0 ? (runs.reduce((acc, curr) => acc + (curr.comparison?.[0]?.r2 || 0), 0) / runs.length * 100).toFixed(1) : 0}%
                 </div>
                 <div className="text-[10px] uppercase font-bold text-zinc-400">Avg Acc</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
