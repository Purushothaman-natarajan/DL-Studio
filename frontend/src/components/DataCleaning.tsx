import React from 'react';
import { Eraser, Trash2, Filter, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface DataCleaningProps {
  missingInfo: Record<string, number>;
  totalRows: number;
  onClean: (config: CleaningConfig) => void;
  isCleaning: boolean;
}

export interface CleaningConfig {
  strategy: 'drop' | 'mean' | 'median' | 'zero';
  drop_outliers: boolean;
}

export function DataCleaning({ missingInfo, totalRows, onClean, isCleaning }: DataCleaningProps) {
  const [strategy, setStrategy] = React.useState<CleaningConfig['strategy']>('drop');
  const [dropOutliers, setDropOutliers] = React.useState(false);

  const hasMissing = Object.values(missingInfo).some(count => count > 0);
  const missingCount = Object.values(missingInfo).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Eraser className="w-5 h-5 text-zinc-600" />
            Data Preparation
          </h3>
          <p className="text-sm text-zinc-500">Handle missing values and outliers before training.</p>
        </div>
        {hasMissing && (
          <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100 uppercase tracking-tighter">
            {missingCount} Missing Values Found
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-bold text-zinc-700">Imputation Strategy</label>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'drop', label: 'Drop Rows', icon: Trash2, desc: 'Remove any row with missing values' },
              { id: 'mean', label: 'Mean Imputation', icon: Filter, desc: 'Fill with column average' },
              { id: 'median', label: 'Median Imputation', icon: Filter, desc: 'Fill with middle value' },
              { id: 'zero', label: 'Constant (Zero)', icon: Filter, desc: 'Fill with 0' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStrategy(opt.id as any)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
                  strategy === opt.id 
                    ? "border-zinc-900 bg-zinc-50 shadow-sm" 
                    : "border-zinc-100 hover:border-zinc-200"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  strategy === opt.id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
                )}>
                  <opt.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">{opt.label}</div>
                  <div className="text-xs text-zinc-500">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-zinc-700">Advanced Cleaning</label>
            <div 
              onClick={() => setDropOutliers(!dropOutliers)}
              className={cn(
                "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between",
                dropOutliers ? "border-zinc-900 bg-zinc-50" : "border-zinc-100 hover:border-zinc-200"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  dropOutliers ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
                )}>
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Remove Outliers</div>
                  <div className="text-xs text-zinc-500">Auto-detect using Z-score (threshold=3)</div>
                </div>
              </div>
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                dropOutliers ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-200"
              )}>
                {dropOutliers && <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-100">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Data Quality Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total Samples:</span>
                <span className="font-bold">{totalRows}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Missing Values:</span>
                <span className={cn("font-bold", hasMissing ? "text-amber-600" : "text-emerald-600")}>
                  {missingCount}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onClean({ strategy, drop_outliers: dropOutliers })}
            disabled={isCleaning}
            className="w-full btn-primary py-4 flex items-center justify-center gap-3 group"
          >
            {isCleaning ? "Processing..." : "Clean & Standardize Data"}
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
