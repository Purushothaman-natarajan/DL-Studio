import React from 'react';
import { LayerConfig } from '../types';
import { Brain, Network, Zap, X } from 'lucide-react';

interface ArchitectureDiagramProps {
  modelType?: string;
  features: string[];
  targets: string[];
  layers: LayerConfig[];
}

const MODEL_LABELS: Record<string, string> = {
  ann: 'ANN',
  mlp: 'ANN',
  cnn: 'CNN',
  lstm: 'LSTM',
  gru: 'GRU',
  transformer: 'Transformer',
  linear_regression: 'Linear Regression',
  ridge: 'Ridge Regression',
  lasso: 'Lasso Regression',
  elastic_net: 'ElasticNet',
  decision_tree: 'Decision Tree',
  random_forest: 'Random Forest',
  adaboost: 'AdaBoost',
  gradient_boosting: 'Gradient Boosting',
  xgboost: 'XGBoost',
  lightgbm: 'LightGBM',
  catboost: 'CatBoost',
  svr: 'SVR',
  knn: 'KNN',
};

const DEEP_MODEL_STAGES: Record<string, string[]> = {
  ann: ['Input Features', 'Dense Hidden Layers', 'Regression Output'],
  mlp: ['Input Features', 'Dense Hidden Layers', 'Regression Output'],
  cnn: ['Input Features', 'Conv1D Filters', 'Flatten + Dense', 'Regression Output'],
  lstm: ['Sequence Window', 'LSTM Memory Cells', 'Dense Projection', 'Regression Output'],
  gru: ['Sequence Window', 'GRU Memory Cells', 'Dense Projection', 'Regression Output'],
  transformer: ['Feature Tokens', 'Self-Attention Blocks', 'Feed-Forward Layer', 'Regression Output'],
};

function getModelLabel(modelType?: string) {
  if (!modelType) return 'Unselected';
  return MODEL_LABELS[modelType] || modelType.toUpperCase();
}

function getModelStages(modelType?: string) {
  if (!modelType) return [];
  if (DEEP_MODEL_STAGES[modelType]) return DEEP_MODEL_STAGES[modelType];
  return ['Scaled Inputs', 'Selected Regressor', 'Predictions'];
}

function isANNModel(modelType?: string) {
  return modelType === 'ann' || modelType === 'mlp';
}

function isDeepModel(modelType?: string) {
  if (!modelType) return false;
  return ['ann', 'mlp', 'cnn', 'lstm', 'gru', 'transformer'].includes(modelType);
}

export function ArchitectureDiagram({ modelType, features, targets, layers }: ArchitectureDiagramProps) {
  const maxVisibleNodes = 10;
  const visibleFeatures = features.slice(0, maxVisibleNodes);
  const visibleTargets = targets.slice(0, maxVisibleNodes);

  const selectedModelLabel = getModelLabel(modelType);
  const stages = getModelStages(modelType);
  const deepModel = isDeepModel(modelType);

  if (!modelType) {
    return (
      <div className="w-full min-h-[500px] rounded-3xl border border-zinc-200 bg-zinc-50/50 p-8 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <Network className="w-3.5 h-3.5" />
            Awaiting Selection
          </div>
          <h4 className="text-2xl font-black text-zinc-900">Select a model to view its architecture</h4>
          <p className="text-sm text-zinc-500">The blueprint appears after you choose a model from the selector.</p>
        </div>
      </div>
    );
  }

  if (!isANNModel(modelType)) {
    return (
      <div className="w-full h-full min-h-[500px] flex flex-col bg-zinc-50/30 rounded-3xl border border-zinc-100 p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg text-white">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tighter">Live Architecture Blueprint</h4>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{selectedModelLabel}</p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest">
            {deepModel ? 'Deep Learning' : 'Traditional ML'}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4">
            {stages.map((stage, idx) => (
              <div key={`${stage}-${idx}`} className="flex items-center gap-3">
                <div className="flex-1 p-4 rounded-2xl border border-zinc-200 bg-white shadow-sm min-h-[78px] flex flex-col justify-center">
                  <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Stage {idx + 1}</div>
                  <div className="text-xs font-bold text-zinc-800">{stage}</div>
                </div>
                {idx < stages.length - 1 && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-zinc-300 hidden md:block">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-100/50 flex items-center justify-between">
          <div className="flex gap-4">
            <Stat label="Inputs" value={features.length} />
            <Stat label={deepModel ? 'Blocks' : 'Stages'} value={stages.length} />
            <Stat label="Outputs" value={targets.length} />
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black text-blue-500 uppercase tracking-widest bg-blue-50/50 px-2 py-1 rounded-full">
            <Zap className="w-2.5 h-2.5 fill-current" />
            Model Aware
          </div>
        </div>
      </div>
    );
  }

  // ANN/MLP detailed neural diagram
  const nodeGap = 35;

  const getHiddenLayerWidth = (units: number) => {
    if (units >= 128) return 60;
    if (units >= 64) return 50;
    return 40;
  };

  const getHiddenLayerHeight = (units: number) => {
    return Math.min(300, Math.max(80, units * 2));
  };

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col bg-zinc-50/30 rounded-3xl border border-zinc-100 p-8 overflow-hidden relative group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg text-white">
                <Brain className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tighter">Live Architecture Blueprint</h4>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{selectedModelLabel}</p>
            </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400">
            <div className="flex items-center gap-1.5 line-through decoration-zinc-300">
                <span className="w-2 h-2 rounded-full bg-blue-500/20" />
                Dense
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                Active Connection
            </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-between px-4 pb-12 relative overflow-x-auto no-scrollbar">
        {/* SVG for Connections */}
        <svg className="absolute inset-0 w-full h-full -z-0 pointer-events-none opacity-20">
            {/* We'll just draw some indicative fanning lines in CSS or simple SVG lines */}
        </svg>

        {/* 1. Input Layer */}
        <div className="flex flex-col items-center gap-2 z-10 w-32 shrink-0">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Input Layer</span>
          <div className="flex flex-col items-center" style={{ gap: `${nodeGap - 20}px` }}>
            {visibleFeatures.map((f, i) => (
              <div key={f} className="flex flex-row-reverse items-center gap-2 w-full group/node">
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center shrink-0 group-hover/node:scale-125 transition-transform">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 truncate text-right max-w-[80px] font-bold">{f}</span>
              </div>
            ))}
            {features.length > maxVisibleNodes && (
              <div className="text-[8px] font-black text-zinc-300">+{features.length - maxVisibleNodes} MORE</div>
            )}
          </div>
          <p className="mt-6 text-[9px] font-bold text-zinc-400 text-center uppercase">Physical Parameters</p>
        </div>

        <div className="flex items-center gap-4 py-8">
            <ChevronArrow />
        </div>

        {/* 2. Hidden Layers */}
        <div className="flex items-center gap-12 z-10">
          {layers.map((layer, idx) => (
            <React.Fragment key={layer.id}>
                <div className="flex flex-col items-center gap-4">
                    <span className="text-[10px] font-black text-zinc-500 uppercase">Hidden {idx + 1}</span>
                    <div
                        className="bg-blue-50/50 border-2 border-blue-200 rounded-2xl flex flex-col items-center justify-center relative shadow-sm hover:border-blue-400 hover:bg-blue-50 transition-all cursor-help"
                        style={{
                            width: `${getHiddenLayerWidth(layer.units || 1)}px`,
                            height: `${getHiddenLayerHeight(layer.units)}px`,
                            minWidth: '60px'
                        }}
                        title={`${layer.units || 0} Units (${layer.activation || 'relu'})`}
                    >
                        <div className="absolute inset-0 opacity-10 flex flex-wrap gap-1 p-2 justify-center content-center overflow-hidden">
                            {Array.from({length: 12}).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            ))}
                        </div>
                        <div className="z-10 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
                            <span className="text-[10px] font-black text-blue-600 leading-none">{layer.units || 0}</span>
                        </div>
                    </div>
                    <div className="space-y-0.5 text-center">
                        <p className="text-[9px] font-black text-zinc-900 uppercase">{layer.activation || 'relu'}</p>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase">Dense</p>
                    </div>
                </div>
                {idx < layers.length - 1 && (
                    <div className="flex flex-col items-center gap-2">
                         <ChevronArrow />
                         <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200" title="Dropout Interaction">
                            <X className="w-3 h-3 stroke-[3]" />
                         </div>
                    </div>
                )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-4 py-8">
            <ChevronArrow />
        </div>

        {/* 3. Output Layer */}
        <div className="flex flex-col items-center gap-2 z-10 w-32 shrink-0">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Output Layer</span>
          <div className="flex flex-col items-center" style={{ gap: `${nodeGap - 20}px` }}>
            {visibleTargets.map((t, i) => (
              <div key={t} className="flex items-center gap-2 w-full group/node">
                <div className="w-6 h-6 rounded-full bg-rose-400 border-2 border-white shadow-sm flex items-center justify-center shrink-0 group-hover/node:scale-125 transition-transform">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[80px] font-bold">{t}</span>
              </div>
            ))}
             {targets.length > maxVisibleNodes && (
              <div className="text-[8px] font-black text-zinc-300">+{targets.length - maxVisibleNodes} MORE</div>
            )}
          </div>
          <p className="mt-6 text-[9px] font-bold text-zinc-400 text-center uppercase">Predicted Props</p>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-zinc-100/50 flex items-center justify-between">
          <div className="flex gap-4">
              <div className="flex items-center gap-2">
                  <div className="text-[10px] font-black text-zinc-900">{features.length}</div>
                  <div className="text-[8px] font-bold text-zinc-400 uppercase">Inputs</div>
              </div>
              <div className="flex items-center gap-2">
                  <div className="text-[10px] font-black text-zinc-900">{layers.reduce((acc, l) => acc + (l.units || 0), 0)}</div>
                  <div className="text-[8px] font-bold text-zinc-400 uppercase">Neurons</div>
              </div>
              <div className="flex items-center gap-2">
                  <div className="text-[10px] font-black text-zinc-900">{targets.length}</div>
                  <div className="text-[8px] font-bold text-zinc-400 uppercase">Outputs</div>
              </div>
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black text-blue-500 uppercase tracking-widest bg-blue-50/50 px-2 py-1 rounded-full">
              <Zap className="w-2.5 h-2.5 fill-current" />
              Dynamic Model
          </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-[10px] font-black text-zinc-900">{value}</div>
      <div className="text-[8px] font-bold text-zinc-400 uppercase">{label}</div>
    </div>
  );
}

function ChevronArrow() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-zinc-200">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}
