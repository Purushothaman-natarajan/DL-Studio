import React, { useState, useMemo } from 'react';
import { LayerConfig } from '../types';
import { Brain, Cpu, Database, GitBranch, Network, TrendingUp, Zap, Grid3X3, Layers, ArrowRight, RefreshCw, BarChart3, GitMerge, ToggleLeft, ToggleRight, Loader2, ChevronDown, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface ArchitectureDiagramProps {
  modelType?: string;
  features: string[];
  targets: string[];
  layers: LayerConfig[];
  onModelChange?: (model: string) => void;
}

const MODEL_LABELS: Record<string, string> = {
  ann: 'ANN', mlp: 'MLP', lstm: 'LSTM', gru: 'GRU', transformer: 'Transformer',
  linear_regression: 'Linear', ridge: 'Ridge', lasso: 'Lasso', elastic_net: 'ElasticNet',
  decision_tree: 'D-Tree', random_forest: 'Random', adaboost: 'AdaBoost',
  gradient_boosting: 'GradBoost', xgboost: 'XGBoost', lightgbm: 'LightGBM',
  catboost: 'CatBoost', svr: 'SVR', knn: 'KNN',
};

const MODEL_FAMILIES: Record<string, string> = {
  ann: 'Deep Learning', mlp: 'Deep Learning', lstm: 'Deep Learning', gru: 'Deep Learning', transformer: 'Deep Learning',
  linear_regression: 'Linear', ridge: 'Linear', lasso: 'Linear', elastic_net: 'Linear',
  decision_tree: 'Tree', random_forest: 'Tree', adaboost: 'Tree', gradient_boosting: 'Tree',
  xgboost: 'Boosting', lightgbm: 'Boosting', catboost: 'Boosting',
  svr: 'Kernel', knn: 'Instance',
};

const FAMILY_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  'Deep Learning': { bg: 'bg-blue-500', text: 'text-blue-600', accent: 'bg-blue-500' },
  'Linear': { bg: 'bg-indigo-500', text: 'text-indigo-600', accent: 'bg-indigo-500' },
  'Tree': { bg: 'bg-emerald-500', text: 'text-emerald-600', accent: 'bg-emerald-500' },
  'Boosting': { bg: 'bg-emerald-600', text: 'text-emerald-600', accent: 'bg-emerald-600' },
  'Kernel': { bg: 'bg-purple-500', text: 'text-purple-600', accent: 'bg-purple-500' },
  'Instance': { bg: 'bg-rose-500', text: 'text-rose-600', accent: 'bg-rose-500' },
};

const ALL_MODELS = [
  { id: 'ann', label: 'ANN', family: 'Deep Learning' },
  { id: 'mlp', label: 'MLP', family: 'Deep Learning' },
  { id: 'lstm', label: 'LSTM', family: 'Deep Learning' },
  { id: 'gru', label: 'GRU', family: 'Deep Learning' },
  { id: 'transformer', label: 'Trans', family: 'Deep Learning' },
  { id: 'xgboost', label: 'XGBoost', family: 'Boosting' },
  { id: 'lightgbm', label: 'LGBM', family: 'Boosting' },
  { id: 'catboost', label: 'CatBoost', family: 'Boosting' },
  { id: 'gradient_boosting', label: 'GBM', family: 'Boosting' },
  { id: 'linear_regression', label: 'Linear', family: 'Linear' },
  { id: 'ridge', label: 'Ridge', family: 'Linear' },
  { id: 'lasso', label: 'Lasso', family: 'Linear' },
  { id: 'elastic_net', label: 'Elastic', family: 'Linear' },
  { id: 'random_forest', label: 'RF', family: 'Tree' },
  { id: 'decision_tree', label: 'DTree', family: 'Tree' },
  { id: 'adaboost', label: 'Ada', family: 'Tree' },
  { id: 'svr', label: 'SVR', family: 'Kernel' },
  { id: 'knn', label: 'KNN', family: 'Instance' },
];

export function ArchitectureDiagram({ modelType, features, targets, layers }: ArchitectureDiagramProps) {
  const [showComparison, setShowComparison] = useState(false);
  const [selectedModel, setSelectedModel] = useState(modelType || '');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (modelType && modelType !== selectedModel) {
      setSelectedModel(modelType);
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [modelType]);

  const selectedModelLabel = selectedModel ? MODEL_LABELS[selectedModel] || selectedModel.toUpperCase() : '';
  const family = selectedModel ? MODEL_FAMILIES[selectedModel] : null;
  const familyColors = family ? FAMILY_COLORS[family] : null;

  const inputCount = features.length || 1;
  const outputCount = targets.length || 1;

  if (!selectedModel) {
    return (
      <div className="w-full h-48 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <Layers className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-zinc-400">Select a model</p>
        </div>
      </div>
    );
  }

  const renderArchitecture = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        </div>
      );
    }

    const isNeural = ['ann', 'mlp'].includes(selectedModel);
    const isSequential = ['lstm', 'gru'].includes(selectedModel);
    const isAttention = selectedModel === 'transformer';
    const isLinear = ['linear_regression', 'ridge', 'lasso', 'elastic_net'].includes(selectedModel);
    const isTree = ['decision_tree', 'random_forest', 'adaboost', 'gradient_boosting', 'xgboost', 'lightgbm', 'catboost'].includes(selectedModel);
    const isSVR = selectedModel === 'svr';
    const isKNN = selectedModel === 'knn';

    return (
      <div className="flex items-center justify-between gap-4 px-4 py-6 min-h-[280px]">
        {/* Input Layer */}
        <div className="flex flex-col items-center shrink-0">
          <div className="px-3 py-1.5 bg-blue-500 text-white rounded-lg mb-2">
            <span className="text-[9px] font-black uppercase">Input</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mb-2">{inputCount} features</span>
          <div className="flex flex-col gap-1">
            {Array.from({ length: Math.min(inputCount, 12) }).map((_, i) => (
              <div key={i} className="w-12 h-3 rounded-sm bg-blue-100 border border-blue-200 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
              </div>
            ))}
            {inputCount > 12 && (
              <div className="text-[8px] text-zinc-400 text-center">+{inputCount - 12} more</div>
            )}
          </div>
        </div>

        <ArrowRight className="w-6 h-6 text-zinc-300 shrink-0" />

        {/* Model Core */}
        <div className="flex-1 flex items-center justify-center">
          {isNeural && (
            <div className="flex items-center gap-3">
              {layers.length > 0 ? layers.map((layer, idx) => (
                <React.Fragment key={layer.id || idx}>
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-zinc-400 uppercase mb-1">Hidden {idx + 1}</span>
                    <div 
                      className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm"
                      style={{ minWidth: '80px', minHeight: `${60 + (layer.units || 32) * 2}px` }}
                    >
                      <div className="flex flex-wrap gap-1 justify-center max-w-[60px]">
                        {Array.from({ length: Math.min(layer.units || 32, 8) }).map((_, i) => (
                          <div key={i} className="w-4 h-4 rounded-full bg-blue-400 border border-blue-500" />
                        ))}
                        {(layer.units || 32) > 8 && (
                          <div className="w-full text-center text-[7px] font-bold text-blue-500">
                            +{Math.min(layer.units || 32, 32) - 8}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-black text-blue-600 mt-1">{layer.units || 32} units</span>
                      <span className="text-[7px] text-blue-400">{layer.activation || 'relu'}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-300" />
                </React.Fragment>
              )) : (
                <div className="flex flex-col items-center">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-blue-600">32 units</span>
                    <span className="text-[8px] text-blue-400">relu</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {isSequential && (
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5 flex flex-col items-center">
                <RefreshCw className="w-10 h-10 text-emerald-600 mb-2" />
                <span className="text-[10px] font-black text-emerald-700">{selectedModel.toUpperCase()}</span>
                <span className="text-[8px] text-emerald-500">Memory Cell</span>
                <div className="flex gap-1 mt-2">
                  {['f', 'i', 'o', 'g'].map(g => (
                    <div key={g} className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center text-[7px] font-black text-emerald-600">{g}</div>
                  ))}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-300" />
              <div className="bg-emerald-100 border border-emerald-200 rounded-lg p-3">
                <span className="text-[8px] text-emerald-600 block text-center">Hidden</span>
                <span className="text-lg font-black text-emerald-700">h</span>
              </div>
            </div>
          )}

          {isAttention && (
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4 flex flex-col items-center">
                <Layers className="w-10 h-10 text-indigo-600 mb-1" />
                <span className="text-[10px] font-black text-indigo-700">Attention</span>
                <span className="text-[8px] text-indigo-400">Self-Attention</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-300" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(h => (
                  <div key={h} className="w-10 h-10 bg-indigo-100 border border-indigo-200 rounded-lg flex items-center justify-center text-[9px] font-black text-indigo-600">
                    H{h}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLinear && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                {Array.from({ length: Math.min(inputCount, 5) }).map((_, i) => (
                  <div key={i} className="w-10 h-3 bg-indigo-100 rounded border border-indigo-200 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-indigo-600">w{i + 1}</span>
                  </div>
                ))}
                {inputCount > 5 && <span className="text-[7px] text-zinc-400 text-center">...</span>}
              </div>
              <div className="w-14 h-14 bg-indigo-100 border-2 border-indigo-300 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-black text-indigo-500">Σ</span>
              </div>
            </div>
          )}

          {isTree && (
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-12 h-12 bg-emerald-100 border-2 border-emerald-300 rounded-xl flex items-center justify-center">
                    <GitBranch className="w-6 h-6 text-emerald-500" />
                  </div>
                ))}
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-300" />
              <div className="w-12 h-12 bg-rose-100 border-2 border-rose-300 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-black text-rose-400">Σ</span>
              </div>
            </div>
          )}

          {isSVR && (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 border-2 border-purple-300 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-2 border-2 border-purple-200 rounded-full" />
                <span className="text-[10px] font-bold text-purple-600">ε</span>
              </div>
              <span className="text-[10px] text-purple-500">Insensitive Tube</span>
            </div>
          )}

          {isKNN && (
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 bg-rose-50 border-2 border-rose-200 rounded-xl">
                <div className="absolute top-2 left-2 w-3 h-3 bg-rose-300 rounded-full" />
                <div className="absolute top-4 right-3 w-3 h-3 bg-rose-400 rounded-full" />
                <div className="absolute bottom-3 left-4 w-3 h-3 bg-blue-300 rounded-full" />
                <div className="absolute bottom-2 right-2 w-3 h-3 bg-rose-300 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-amber-400 border-2 border-amber-600 rounded-full z-10 flex items-center justify-center">
                  <span className="text-[6px]">?</span>
                </div>
              </div>
              <span className="text-[10px] text-zinc-500">k neighbors</span>
            </div>
          )}
        </div>

        <ArrowRight className="w-6 h-6 text-zinc-300 shrink-0" />

        {/* Output Layer */}
        <div className="flex flex-col items-center shrink-0">
          <div className="px-3 py-1.5 bg-rose-500 text-white rounded-lg mb-2">
            <span className="text-[9px] font-black uppercase">Output</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mb-2">{outputCount} target{outputCount > 1 ? 's' : ''}</span>
          <div className="flex flex-col gap-1">
            {Array.from({ length: Math.min(outputCount, 4) }).map((_, i) => (
              <div key={i} className="w-12 h-3 rounded-sm bg-rose-100 border border-rose-200 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-zinc-50 rounded-xl border border-zinc-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg text-white", familyColors?.accent || 'bg-zinc-900')}>
            {selectedModel && getModelIcon(selectedModel)}
          </div>
          <div>
            <p className="text-sm font-black">{selectedModelLabel}</p>
            <p className="text-[9px] text-zinc-500">{family}</p>
          </div>
        </div>
        <button
          onClick={() => setShowComparison(!showComparison)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
            showComparison ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          )}
        >
          <Settings className="w-3 h-3" />
          {showComparison ? 'Hide All' : 'All Models'}
        </button>
      </div>

      {/* Model Grid */}
      {showComparison && (
        <div className="p-3 border-b border-zinc-200 bg-white">
          <div className="flex flex-wrap gap-1">
            {ALL_MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedModel(m.id);
                  onModelChange?.(m.id);
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 200);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all",
                  selectedModel === m.id
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Architecture */}
      <div className="min-h-[280px]">
        {renderArchitecture()}
      </div>

      {/* Stats Bar */}
      <div className="px-4 py-2.5 border-t border-zinc-200 bg-white rounded-b-xl flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-bold text-blue-600">{inputCount} inputs</span>
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold text-emerald-600">{selectedModelLabel}</span>
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="font-bold text-rose-600">{outputCount} outputs</span>
          </span>
        </div>
        {layers.length > 0 && (
          <span className="text-[9px] text-zinc-400">
            {layers.length} layers · {layers.reduce((s, l) => s + (l.units || 0), 0)} total units
          </span>
        )}
      </div>
    </div>
  );
}

function getModelIcon(modelId: string) {
  switch (modelId) {
    case 'ann': case 'mlp': return <Brain className="w-4 h-4" />;
    case 'lstm': case 'gru': return <RefreshCw className="w-4 h-4" />;
    case 'transformer': return <Layers className="w-4 h-4" />;
    case 'xgboost': case 'lightgbm': case 'catboost': case 'gradient_boosting': return <GitBranch className="w-4 h-4" />;
    case 'random_forest': case 'decision_tree': case 'adaboost': return <GitMerge className="w-4 h-4" />;
    case 'svr': return <Cpu className="w-4 h-4" />;
    case 'knn': return <Network className="w-4 h-4" />;
    case 'linear_regression': case 'ridge': case 'lasso': case 'elastic_net': return <TrendingUp className="w-4 h-4" />;
    default: return <Zap className="w-4 h-4" />;
  }
}
