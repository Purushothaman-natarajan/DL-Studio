import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Eraser, Filter, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { DataColumn } from '../types';

interface DataCleaningProps {
  missingInfo: Record<string, number>;
  totalRows: number;
  columns: DataColumn[];
  onClean: (config: CleaningConfig) => void;
  isCleaning: boolean;
}

export interface CleaningConfig {
  strategy: 'drop' | 'mean' | 'median' | 'zero';
  drop_outliers: boolean;
  standardize_numeric: boolean;
}

export function DataCleaning({ missingInfo, totalRows, columns, onClean, isCleaning }: DataCleaningProps) {
  const [strategy, setStrategy] = React.useState<CleaningConfig['strategy']>('drop');
  const [dropOutliers, setDropOutliers] = React.useState(false);
  const [standardizeNumeric, setStandardizeNumeric] = React.useState(false);

  const hasMissing = Object.values(missingInfo).some(count => count > 0);
  const missingCount = Object.values(missingInfo).reduce((a, b) => a + b, 0);
  
  const featureCount = columns.filter(c => c.role === 'feature').length;
  const targetCount = columns.filter(c => c.role === 'target').length;
  
  const canProceed = useMemo(() => {
    return featureCount > 0 && targetCount > 0 && (!hasMissing || ['drop', 'mean', 'median', 'zero'].includes(strategy));
  }, [featureCount, targetCount, hasMissing, strategy]);
  
  const mandatoryChecks = useMemo(() => [
    {
      label: 'At least one feature selected',
      ok: featureCount > 0,
    },
    {
      label: 'At least one target selected',
      ok: targetCount > 0,
    },
    {
      label: hasMissing ? 'Missing values will be handled by selected strategy' : 'No missing values detected',
      ok: !hasMissing || ['drop', 'mean', 'median', 'zero'].includes(strategy),
    },
  ], [featureCount, targetCount, hasMissing, strategy]);

  const recommendations: string[] = useMemo(() => {
    const rec: string[] = [];
    if (totalRows < 300) {
    rec.push('Small dataset detected: start with linear/tree baselines before deep models.');
  }
  if (featureCount > 0 && totalRows > 0 && featureCount > totalRows / 3) {
    rec.push('High feature-to-row ratio: prefer regularized models (Ridge/ElasticNet) first.');
  }
  if (targetCount > 1) {
    rec.push('Multi-target setup detected: compare benchmark scores per run using Run Manager.');
  }
  if (hasMissing && strategy === 'drop') {
    rec.push('Drop Rows may reduce training size significantly; consider mean/median if row loss is high.');
  }
  if (!standardizeNumeric) {
    rec.push('Feature scaling still happens automatically during training (mandatory pipeline step).');
  }

  return rec;
  }, [totalRows, featureCount, targetCount, hasMissing, strategy]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Eraser className="w-5 h-5 text-zinc-600" />
            Refine your data
          </h3>
          <p className="text-sm text-zinc-500">Apply mandatory preparation and optional advanced cleaning before model training.</p>
        </div>
        <div className="bg-zinc-50 text-zinc-700 px-3 py-1 rounded-full text-xs font-bold border border-zinc-200 uppercase tracking-tighter">
          {totalRows.toLocaleString()} Samples
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Necessary Steps (Mandatory)</h4>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
            {mandatoryChecks.map(item => (
              <div key={item.label} className="flex items-start gap-2">
                <CheckCircle2 className={cn('w-4 h-4 mt-0.5 shrink-0', item.ok ? 'text-emerald-500' : 'text-zinc-300')} />
                <p className={cn('text-xs', item.ok ? 'text-zinc-700' : 'text-zinc-400')}>{item.label}</p>
              </div>
            ))}
            {hasMissing && (
              <div className="pt-2 border-t border-zinc-100 text-[11px] text-amber-700 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {missingCount.toLocaleString()} missing cells found across selected columns.
              </div>
            )}
          </div>

          <label className="block text-sm font-bold text-zinc-700">Missing Value Strategy</label>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'drop', label: 'Drop Rows', icon: Trash2, desc: 'Remove rows containing missing values' },
              { id: 'mean', label: 'Mean Imputation', icon: Filter, desc: 'Fill numeric gaps using column mean' },
              { id: 'median', label: 'Median Imputation', icon: Filter, desc: 'Fill numeric gaps using median' },
              { id: 'zero', label: 'Constant (Zero)', icon: Filter, desc: 'Fill missing values with 0' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStrategy(opt.id as CleaningConfig['strategy'])}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all',
                  strategy === opt.id
                    ? 'border-zinc-900 bg-zinc-50 shadow-sm'
                    : 'border-zinc-100 hover:border-zinc-200'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                  strategy === opt.id ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
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

        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Advanced Cleaning (Optional)</h4>

          <ToggleCard
            active={dropOutliers}
            onClick={() => setDropOutliers(!dropOutliers)}
            title="Remove Outliers"
            description="Detect outliers with Z-score threshold = 3 and remove those rows."
          />

          <ToggleCard
            active={standardizeNumeric}
            onClick={() => setStandardizeNumeric(!standardizeNumeric)}
            title="Standardize Numeric Columns"
            description="Optional UI-level standardization preview. Training still applies mandatory feature scaling."
          />

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Recommended Steps (Based on EDA)
            </div>
            {recommendations.length === 0 ? (
              <p className="text-xs text-zinc-600">Data looks healthy for first training pass. Continue with current settings.</p>
            ) : (
              <ul className="space-y-2 text-xs text-zinc-600 list-disc pl-4">
                {recommendations.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => onClean({ strategy, drop_outliers: dropOutliers, standardize_numeric: standardizeNumeric })}
            disabled={isCleaning || !canProceed}
            className="w-full btn-primary py-4 flex items-center justify-center gap-3 group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isCleaning ? 'Processing...' : 'Apply Cleaning Profile'}
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleCard({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between',
        active ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'
      )}
    >
      <div>
        <div className="font-bold text-sm">{title}</div>
        <div className="text-xs text-zinc-500">{description}</div>
      </div>
      <div className={cn(
        'w-6 h-6 rounded-full border-2 flex items-center justify-center',
        active ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-200'
      )}>
        {active && <CheckCircle2 className="w-4 h-4" />}
      </div>
    </div>
  );
}
