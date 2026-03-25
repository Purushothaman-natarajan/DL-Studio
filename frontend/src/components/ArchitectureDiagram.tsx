import React, { useState, useMemo } from 'react';
import { LayerConfig } from '../types';
import { Brain, Cpu, Database, GitBranch, Network, TrendingUp, Zap, Grid3x3, Layers, ArrowRight, RefreshCw, BarChart3, GitMerge, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
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

type ModelFamily = 'Deep Learning' | 'Linear' | 'Tree Ensemble' | 'Kernel' | 'Instance';

const FAMILY_COLORS: Record<ModelFamily, { bg: string; border: string; text: string; accent: string }> = {
  'Deep Learning': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', accent: 'bg-blue-500' },
  'Linear': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', accent: 'bg-indigo-500' },
  'Tree Ensemble': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', accent: 'bg-emerald-500' },
  'Kernel': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', accent: 'bg-purple-500' },
  'Instance': { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', accent: 'bg-rose-500' },
};

const MODEL_FAMILIES: Record<string, ModelFamily> = {
  ann: 'Deep Learning', mlp: 'Deep Learning', lstm: 'Deep Learning', gru: 'Deep Learning', transformer: 'Deep Learning',
  linear_regression: 'Linear', ridge: 'Linear', lasso: 'Linear', elastic_net: 'Linear',
  decision_tree: 'Tree Ensemble', random_forest: 'Tree Ensemble', adaboost: 'Tree Ensemble', gradient_boosting: 'Tree Ensemble',
  xgboost: 'Tree Ensemble', lightgbm: 'Tree Ensemble', catboost: 'Tree Ensemble',
  svr: 'Kernel', knn: 'Instance',
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
          <Layers className="w-6 h-6 text-zinc-300 mx-auto mb-1" />
          <p className="text-xs font-bold text-zinc-400">Select a model</p>
        </div>
      </div>
    );
  }

  const renderArchitecture = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
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

    const maxNeurons = Math.max(inputCount, ...(layers.map(l => l.units || 32)), outputCount);
    const scale = (neurons: number) => Math.max(0.4, Math.min(1, neurons / maxNeurons));

    const inputNodes = Math.min(inputCount, 8);
    const hiddenNodes = layers.length > 0 ? layers.map(l => Math.min(l.units || 32, 8)) : [Math.min(6, maxNeurons)];
    const outputNodes = Math.min(outputCount, 4);

    return (
      <div className="flex items-center justify-between gap-2 px-2 py-4 min-h-[180px]">
        {/* Input Layer */}
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[8px] font-black text-zinc-500 uppercase mb-1.5">Input</span>
          <span className="text-[7px] text-zinc-400 mb-1">{inputCount}</span>
          <div className="flex flex-col gap-0.5">
            {Array.from({ length: inputNodes }).map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-blue-400 border-2 border-blue-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              </div>
            ))}
            {inputCount > 8 && <span className="text-[6px] text-zinc-400 text-center">+{inputCount - 8}</span>}
          </div>
        </div>

        <ArrowRight className="w-3 h-3 text-zinc-300 shrink-0" />

        {/* Model Core */}
        <div className="flex-1 flex items-center justify-center">
          {isNeural && (
            <div className="flex items-center gap-1">
              {hiddenNodes.map((units, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex flex-col items-center">
                    <span className="text-[7px] text-zinc-400 uppercase">H{idx + 1}</span>
                    <div 
                      className="bg-blue-100 border border-blue-300 rounded-lg flex flex-col gap-0.5 p-1 items-center"
                      style={{ 
                        width: `${40 + scale(units) * 30}px`,
                        minHeight: `${30 + scale(units) * 40}px`
                      }}
                    >
                      {Array.from({ length: Math.min(units, 5) }).map((_, i) => (
                        <div key={i} className="w-3 h-3 rounded-full bg-blue-400" />
                      ))}
                      {units > 5 && <span className="text-[6px] text-blue-500">+{units - 5}</span>}
                      <span className="text-[7px] font-bold text-blue-600">{units}</span>
                    </div>
                    <span className="text-[6px] text-zinc-500 mt-0.5">{layers[idx]?.activation || 'relu'}</span>
                  </div>
                  {idx < hiddenNodes.length - 1 && <ArrowRight className="w-3 h-3 text-zinc-300 mx-0.5" />}
                </React.Fragment>
              ))}
            </div>
          )}

          {isSequential && (
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-3 flex flex-col items-center">
                <RefreshCw className="w-5 h-5 text-emerald-600 mb-1" />
                <span className="text-[8px] font-bold text-emerald-700">{selectedModel.toUpperCase()}</span>
                <span className="text-[6px] text-emerald-500">Memory Cell</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7px] text-zinc-400">h</span>
                <div className="w-8 h-10 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center">
                  <span className="text-[8px] font-bold text-emerald-600">State</span>
                </div>
              </div>
            </div>
          )}

          {isAttention && (
            <div className="flex items-center gap-2">
              <div className="bg-indigo-100 border border-indigo-300 rounded-xl p-2 flex flex-col items-center">
                <Layers className="w-5 h-5 text-indigo-600 mb-0.5" />
                <span className="text-[8px] font-bold text-indigo-700">Attention</span>
                <span className="text-[6px] text-indigo-500">Self-Attention</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map(h => (
                  <div key={h} className="w-6 h-6 bg-indigo-50 border border-indigo-200 rounded flex items-center justify-center text-[7px] font-bold text-indigo-600">
                    H{h}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLinear && (
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                {Array.from({ length: Math.min(inputCount, 4) }).map((_, i) => (
                  <div key={i} className="w-6 h-2 bg-indigo-100 rounded border border-indigo-200 flex items-center justify-center">
                    <span className="text-[6px] font-bold text-indigo-600">w{i + 1}</span>
                  </div>
                ))}
                {inputCount > 4 && <span className="text-[6px] text-zinc-400">...</span>}
              </div>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-center">
                <span className="text-lg font-black text-indigo-500">Σ</span>
              </div>
            </div>
          )}

          {isTree && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center">
                    <GitBranch className="w-4 h-4 text-emerald-500" />
                  </div>
                ))}
              </div>
              <ArrowRight className="w-3 h-3 text-zinc-300" />
              <div className="w-10 h-10 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-center">
                <span className="text-lg font-black text-rose-400">Σ</span>
              </div>
            </div>
          )}

          {isSVR && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-100 border border-purple-200 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-1 border border-purple-200 rounded-full" />
                <span className="text-[8px] font-bold text-purple-600">ε</span>
              </div>
              <span className="text-[8px] text-purple-500">Tube</span>
            </div>
          )}

          {isKNN && (
            <div className="flex items-center gap-2">
              <div className="relative w-12 h-12 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-rose-300 rounded-full" />
                <div className="absolute bottom-2 right-2 w-2.5 h-2.5 bg-rose-400 rounded-full" />
                <div className="absolute top-3 right-1 w-2.5 h-2.5 bg-blue-300 rounded-full" />
                <div className="absolute bottom-1 left-3 w-2.5 h-2.5 bg-rose-300 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-amber-400 border-2 border-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-[5px]">?</span>
                </div>
              </div>
              <span className="text-[8px] text-zinc-500">k neighbors</span>
            </div>
          )}
        </div>

        <ArrowRight className="w-3 h-3 text-zinc-300 shrink-0" />

        {/* Output Layer */}
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[8px] font-black text-zinc-500 uppercase mb-1.5">Output</span>
          <span className="text-[7px] text-zinc-400 mb-1">{outputCount}</span>
          <div className="flex flex-col gap-0.5">
            {Array.from({ length: outputNodes }).map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-rose-400 border-2 border-rose-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              </div>
            ))}
            {outputCount > 4 && <span className="text-[6px] text-zinc-400">+{outputCount - 4}</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-zinc-50/50 rounded-xl border border-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg text-white", familyColors?.accent || 'bg-zinc-900')}>
            {selectedModel && getModelIcon(selectedModel)}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase">{selectedModelLabel}</p>
            <p className="text-[8px] text-zinc-400">{family}</p>
          </div>
        </div>
        <button
          onClick={() => setShowComparison(!showComparison)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all",
            showComparison ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
          )}
        >
          {showComparison ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
          All
        </button>
      </div>

      {/* Model Grid */}
      {showComparison && (
        <div className="p-2 border-b border-zinc-100 bg-white">
          <div className="flex flex-wrap gap-1">
            {ALL_MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedModel(m.id);
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 200);
                }}
                className={cn(
                  "px-2 py-1 rounded-lg text-[9px] font-bold border transition-all",
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
      {renderArchitecture()}

      {/* Stats */}
      <div className="px-3 py-1.5 border-t border-zinc-100 flex items-center justify-between text-[8px]">
        <div className="flex gap-3">
          <span className="text-blue-600 font-bold">{inputCount} in</span>
          <span className="text-emerald-600 font-bold">{selectedModelLabel}</span>
          <span className="text-rose-600 font-bold">{outputCount} out</span>
        </div>
        {layers.length > 0 && (
          <span className="text-zinc-400">
            {layers.length} layers · {layers.reduce((s, l) => s + (l.units || 0), 0)} units
          </span>
        )}
      </div>
    </div>
  );
}

function getModelIcon(modelId: string) {
  switch (modelId) {
    case 'ann': case 'mlp': return <Brain className="w-3 h-3" />;
    case 'lstm': case 'gru': return <RefreshCw className="w-3 h-3" />;
    case 'transformer': return <Layers className="w-3 h-3" />;
    case 'xgboost': case 'lightgbm': case 'catboost': case 'gradient_boosting': return <GitBranch className="w-3 h-3" />;
    case 'random_forest': case 'decision_tree': case 'adaboost': return <GitMerge className="w-3 h-3" />;
    case 'svr': return <Cpu className="w-3 h-3" />;
    case 'knn': return <Network className="w-3 h-3" />;
    case 'linear_regression': case 'ridge': case 'lasso': case 'elastic_net': return <TrendingUp className="w-3 h-3" />;
    default: return <Zap className="w-3 h-3" />;
  }
}
