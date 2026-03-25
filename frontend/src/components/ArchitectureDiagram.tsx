import React, { useState } from 'react';
import { LayerConfig } from '../types';
import { Brain, Cpu, Database, GitBranch, Network, TrendingUp, Zap, X, Grid3x3, Layers, ArrowRight, RefreshCw, Info, BarChart3, GitMerge, ZapOff, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface ArchitectureDiagramProps {
  modelType?: string;
  features: string[];
  targets: string[];
  layers: LayerConfig[];
  onModelChange?: (model: string) => void;
}

const MODEL_LABELS: Record<string, string> = {
  ann: 'ANN',
  mlp: 'MLP',
  cnn: 'CNN',
  lstm: 'LSTM',
  gru: 'GRU',
  transformer: 'Transformer',
  linear_regression: 'Linear Reg',
  ridge: 'Ridge',
  lasso: 'Lasso',
  elastic_net: 'ElasticNet',
  decision_tree: 'Decision Tree',
  random_forest: 'Random Forest',
  adaboost: 'AdaBoost',
  gradient_boosting: 'Grad Boost',
  xgboost: 'XGBoost',
  lightgbm: 'LightGBM',
  catboost: 'CatBoost',
  svr: 'SVR',
  knn: 'KNN',
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
  ann: 'Deep Learning', mlp: 'Deep Learning', cnn: 'Deep Learning', lstm: 'Deep Learning', gru: 'Deep Learning', transformer: 'Deep Learning',
  linear_regression: 'Linear', ridge: 'Linear', lasso: 'Linear', elastic_net: 'Linear',
  decision_tree: 'Tree Ensemble', random_forest: 'Tree Ensemble', adaboost: 'Tree Ensemble', gradient_boosting: 'Tree Ensemble',
  xgboost: 'Tree Ensemble', lightgbm: 'Tree Ensemble', catboost: 'Tree Ensemble',
  svr: 'Kernel', knn: 'Instance',
};

const ALL_MODELS = [
  { id: 'linear_regression', label: 'Linear Reg', family: 'Linear' },
  { id: 'ridge', label: 'Ridge', family: 'Linear' },
  { id: 'lasso', label: 'Lasso', family: 'Linear' },
  { id: 'decision_tree', label: 'Decision Tree', family: 'Tree' },
  { id: 'random_forest', label: 'Random Forest', family: 'Tree' },
  { id: 'xgboost', label: 'XGBoost', family: 'Boosting' },
  { id: 'lightgbm', label: 'LightGBM', family: 'Boosting' },
  { id: 'catboost', label: 'CatBoost', family: 'Boosting' },
  { id: 'svr', label: 'SVR', family: 'Kernel' },
  { id: 'knn', label: 'KNN', family: 'Instance' },
  { id: 'ann', label: 'ANN', family: 'Deep Learning' },
  { id: 'mlp', label: 'MLP', family: 'Deep Learning' },
  { id: 'cnn', label: 'CNN', family: 'Deep Learning' },
  { id: 'lstm', label: 'LSTM', family: 'Deep Learning' },
  { id: 'gru', label: 'GRU', family: 'Deep Learning' },
  { id: 'transformer', label: 'Transformer', family: 'Deep Learning' },
];

export function ArchitectureDiagram({ modelType, features, targets, layers }: ArchitectureDiagramProps) {
  const [showComparison, setShowComparison] = useState(true);
  const [selectedModel, setSelectedModel] = useState(modelType || '');
  const maxVisibleNodes = 8;

  React.useEffect(() => {
    if (modelType && modelType !== selectedModel) {
      setSelectedModel(modelType);
    }
  }, [modelType]);

  const selectedModelLabel = selectedModel ? MODEL_LABELS[selectedModel] || selectedModel.toUpperCase() : 'Unselected';
  const family = selectedModel ? MODEL_FAMILIES[selectedModel] : null;
  const familyColors = family ? FAMILY_COLORS[family] : null;

  if (!selectedModel) {
    return (
      <div className="w-full min-h-[500px] rounded-3xl border border-zinc-200 bg-zinc-50/50 p-8 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <Network className="w-3.5 h-3.5" />
            Awaiting Selection
          </div>
          <h4 className="text-2xl font-black text-zinc-900">Select a model to view its architecture</h4>
          <p className="text-sm text-zinc-500">Choose from the model selector on the left panel.</p>
        </div>
      </div>
    );
  }

  const renderSingleArchitecture = () => {
    const modelId = selectedModel;
    const isNeural = ['ann', 'mlp'].includes(modelId);
    
    if (isNeural) {
      return renderNeuralArchitecture(modelId, layers);
    }
    
    switch (modelId) {
      case 'cnn': return renderCNNArchitecture();
      case 'lstm': return renderLSTMArchitecture();
      case 'gru': return renderGRUArchitecture();
      case 'transformer': return renderTransformerArchitecture();
      case 'xgboost': return renderXGBoostArchitecture();
      case 'lightgbm': return renderLightGBMArchitecture();
      case 'catboost': return renderCatBoostArchitecture();
      case 'random_forest': return renderRandomForestArchitecture();
      case 'decision_tree': return renderDecisionTreeArchitecture();
      case 'svr': return renderSVRArchitecture();
      case 'knn': return renderKNNArchitecture();
      case 'linear_regression': return renderLinearArchitecture('linear');
      case 'ridge': return renderLinearArchitecture('ridge');
      case 'lasso': return renderLinearArchitecture('lasso');
      case 'elastic_net': return renderLinearArchitecture('elastic');
      default: return renderGenericArchitecture();
    }
  };

  const renderComparisonGrid = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {ALL_MODELS.map(m => (
        <button
          key={m.id}
          onClick={() => setSelectedModel(m.id)}
          className={cn(
            "p-4 rounded-2xl border-2 transition-all text-left",
            selectedModel === m.id 
              ? "border-zinc-900 bg-zinc-50 shadow-lg" 
              : "border-zinc-100 bg-white hover:border-zinc-300 hover:bg-zinc-50"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {getModelIcon(m.id)}
            <span className="text-sm font-black text-zinc-900">{m.label}</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-medium">{getModelFamily(m.id)}</div>
        </button>
      ))}
    </div>
  );

  const renderModelIcon = () => {
    if (!selectedModel) return <Network className="w-4 h-4" />;
    return getModelIcon(selectedModel);
  };

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col bg-zinc-50/30 rounded-3xl border border-zinc-100 p-6">
      {/* Header with comparison toggle */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg text-white", familyColors?.accent || 'bg-zinc-900')}>
            {renderModelIcon()}
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tighter">Architecture Blueprint</h4>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{selectedModelLabel}</p>
              {family && (
                <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase", familyColors?.bg, familyColors?.text)}>
                  {family}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowComparison(!showComparison)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            showComparison 
              ? "bg-zinc-900 text-white" 
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          )}
        >
          {showComparison ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          {showComparison ? 'Compare Mode' : 'Single View'}
        </button>
      </div>

      {showComparison && (
        <div className="mb-4 p-4 bg-white rounded-2xl border border-zinc-200 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Model</span>
            <span className="text-[9px] text-zinc-400">Tap to select</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                  selectedModel === m.id
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main visualization */}
      <div className="flex-1 min-h-[300px] overflow-hidden">
        {renderSingleArchitecture()}
      </div>

      {/* Footer stats */}
      <div className="mt-4 pt-4 border-t border-zinc-100/50 flex items-center justify-between shrink-0">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-zinc-600">{features.length} Inputs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-[10px] font-bold text-zinc-600">{targets.length} Outputs</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[8px] font-black text-zinc-400 uppercase tracking-widest">
          {family} • {selectedModelLabel}
        </div>
      </div>
    </div>
  );
}

function getModelIcon(modelId: string) {
  switch (modelId) {
    case 'ann': case 'mlp': return <Brain className="w-4 h-4" />;
    case 'cnn': return <Grid3x3 className="w-4 h-4" />;
    case 'lstm': case 'gru': return <RefreshCw className="w-4 h-4" />;
    case 'transformer': return <Layers className="w-4 h-4" />;
    case 'xgboost': case 'lightgbm': case 'catboost': case 'gradient_boosting': return <GitBranch className="w-4 h-4" />;
    case 'random_forest': case 'decision_tree': return <GitMerge className="w-4 h-4" />;
    case 'svr': return <Cpu className="w-4 h-4" />;
    case 'knn': return <Network className="w-4 h-4" />;
    default: return <TrendingUp className="w-4 h-4" />;
  }
}

function getModelFamily(modelId: string): string {
  const families: Record<string, string> = {
    ann: 'Deep Learning', mlp: 'Deep Learning', cnn: 'Deep Learning', lstm: 'Deep Learning', gru: 'Deep Learning', transformer: 'Deep Learning',
    linear_regression: 'Linear', ridge: 'Linear', lasso: 'Linear', elastic_net: 'Linear',
    decision_tree: 'Tree', random_forest: 'Tree Ensemble',
    xgboost: 'Boosting', lightgbm: 'Boosting', catboost: 'Boosting',
    svr: 'Kernel', knn: 'Instance-Based',
  };
  return families[modelId] || 'Other';
}

// Neural Network Architecture (ANN/MLP style)
function renderNeuralArchitecture(modelId: string, layers: LayerConfig[]) {
  const renderedLayers = layers.length > 0 ? layers : [{ id: 'preview', type: 'dense', units: 32, activation: 'relu' }];
  const features = ['Feature A', 'Feature B', 'Feature C', 'Feature D', 'Feature E'];
  const targets = ['Target'];
  const nodeGap = 28;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-between px-4 overflow-x-auto">
        {/* Input Layer */}
        <div className="flex flex-col items-center z-10 w-28 shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Input</span>
          <div className="flex flex-col items-center gap-2">
            {features.map((f, i) => (
              <div key={f} className="flex items-center gap-2">
                <span className="text-[8px] font-mono text-zinc-400 truncate max-w-[60px]">{f}</span>
                <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        {/* Hidden Layers */}
        <div className="flex items-center gap-6 z-10 shrink-0">
          {renderedLayers.map((layer, idx) => (
            <div key={layer.id} className="flex flex-col items-center gap-2">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Hidden {idx + 1}</span>
              <div 
                className="bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center justify-center relative"
                style={{ width: '50px', height: '100px' }}
              >
                <div className="bg-white/80 px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
                  <span className="text-[10px] font-black text-blue-600">{layer.units}</span>
                </div>
              </div>
              <span className="text-[8px] font-bold text-zinc-600 uppercase">{layer.activation}</span>
            </div>
          ))}
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        {/* Output Layer */}
        <div className="flex flex-col items-center z-10 w-28 shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Output</span>
          <div className="flex flex-col items-center gap-2">
            {targets.map((t, i) => (
              <div key={t} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-400 border-2 border-white shadow-sm flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <span className="text-[8px] font-mono text-zinc-400">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-4 text-[9px] text-zinc-400 font-medium">
        <span>Total Neurons: {renderedLayers.reduce((acc, l) => acc + (l.units || 0), 0)}</span>
        <span>Layers: {renderedLayers.length + 2}</span>
        <span>Activation: {renderedLayers[0]?.activation || 'relu'}</span>
      </div>
    </div>
  );
}

// CNN Architecture
function renderCNNArchitecture() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-between px-4 overflow-x-auto">
        {/* Input */}
        <div className="flex flex-col items-center z-10 w-28 shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase mb-3">Input</span>
          <div className="w-16 h-16 bg-blue-50 border-2 border-blue-200 rounded-lg flex flex-wrap p-1 gap-0.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-3 h-3 bg-blue-200 rounded-sm" />
            ))}
          </div>
          <span className="text-[8px] text-zinc-400 mt-2">1D Sequence</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        {/* Conv1D */}
        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Conv1D</span>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-12 h-12 bg-purple-50 border-2 border-purple-200 rounded-lg flex flex-wrap p-1 gap-0.5">
                {Array.from({ length: 9 }).map((_, j) => (
                  <div key={j} className="w-2.5 h-2.5 bg-purple-300 rounded-sm" />
                ))}
              </div>
            ))}
          </div>
          <span className="text-[8px] font-bold text-purple-600 mt-2">3 Filters × 3</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        {/* Pooling */}
        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">MaxPool</span>
          <div className="w-12 h-12 bg-emerald-50 border-2 border-emerald-200 rounded-lg flex items-center justify-center mt-2">
            <Grid3x3 className="w-6 h-6 text-emerald-500" />
          </div>
          <span className="text-[8px] font-bold text-emerald-600 mt-2">2×1 Pool</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        {/* Flatten + Dense */}
        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Dense</span>
          <div className="flex flex-col gap-2 mt-2">
            <div className="w-16 h-8 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-center">
              <span className="text-[10px] font-black text-blue-600">64 units</span>
            </div>
            <div className="w-16 h-6 bg-rose-50 border-2 border-rose-200 rounded-lg flex items-center justify-center">
              <span className="text-[10px] font-black text-rose-600">Output</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-4 text-[9px] text-zinc-400 font-medium">
        <span>Conv1D → MaxPool → Flatten → Dense</span>
      </div>
    </div>
  );
}

// LSTM Architecture
function renderLSTMArchitecture() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-between px-4 overflow-x-auto">
        {/* Input */}
        <div className="flex flex-col items-center z-10 w-28 shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase mb-3">Sequence</span>
          <div className="flex flex-col gap-0.5">
            {['t-2', 't-1', 't', 't+1', 't+2'].map((t, i) => (
              <div key={t} className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-200 rounded-sm flex items-center justify-center">
                  <span className="text-[6px] font-bold text-blue-700">{t}</span>
                </div>
              </div>
            ))}
          </div>
          <span className="text-[8px] text-zinc-400 mt-2">Time Steps</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        {/* LSTM Cell */}
        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">LSTM Cell</span>
          <div className="w-24 h-20 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex flex-col items-center justify-center mt-2 relative">
            <RefreshCw className="w-8 h-8 text-emerald-500" />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-200 px-2 py-0.5 rounded text-[7px] font-black text-emerald-700">MEMORY</div>
          </div>
          <div className="flex gap-1 mt-2">
            {['f', 'i', 'o', 'g'].map(g => (
              <div key={g} className="w-4 h-4 bg-emerald-100 rounded-sm flex items-center justify-center text-[7px] font-black text-emerald-600">{g}</div>
            ))}
          </div>
          <span className="text-[8px] font-bold text-emerald-600">4 Gates</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        {/* Hidden State */}
        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Hidden</span>
          <div className="w-12 h-16 bg-emerald-50 border-2 border-emerald-200 rounded-lg flex items-center justify-center mt-2">
            <span className="text-[10px] font-black text-emerald-600">h</span>
          </div>
          <span className="text-[8px] font-bold text-emerald-600 mt-2">State</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        {/* Output */}
        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Output</span>
          <div className="w-12 h-8 bg-rose-50 border-2 border-rose-200 rounded-lg flex items-center justify-center mt-2">
            <span className="text-[10px] font-black text-rose-600">y</span>
          </div>
          <span className="text-[8px] font-bold text-rose-600 mt-2">Prediction</span>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-4 text-[9px] text-zinc-400 font-medium">
        <span>Gates: Forget • Input • Output • Cell Gate</span>
      </div>
    </div>
  );
}

// GRU Architecture
function renderGRUArchitecture() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-between px-4 overflow-x-auto">
        <div className="flex flex-col items-center z-10 w-28 shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase mb-3">Sequence</span>
          <div className="flex flex-col gap-0.5">
            {['t-1', 't', 't+1'].map(t => (
              <div key={t} className="w-4 h-4 bg-blue-200 rounded-sm flex items-center justify-center">
                <span className="text-[6px] font-bold text-blue-700">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">GRU Cell</span>
          <div className="w-20 h-16 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center justify-center mt-2 relative">
            <RefreshCw className="w-6 h-6 text-amber-500" />
            <span className="absolute -top-2 text-[7px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded">GRU</span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-[7px] font-bold text-amber-600">z (update)</span>
            <span className="text-[7px] font-bold text-amber-600">r (reset)</span>
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Hidden</span>
          <div className="w-10 h-12 bg-amber-50 border-2 border-amber-200 rounded-lg flex items-center justify-center">
            <span className="text-[10px] font-black text-amber-600">h</span>
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Output</span>
          <div className="w-10 h-8 bg-rose-50 border-2 border-rose-200 rounded-lg flex items-center justify-center">
            <span className="text-[10px] font-black text-rose-600">y</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-4 text-[9px] text-zinc-400 font-medium">
        <span>Lightweight: 2 Gates (Update, Reset) vs LSTM's 3</span>
      </div>
    </div>
  );
}

// Transformer Architecture
function renderTransformerArchitecture() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-between px-4 overflow-x-auto">
        <div className="flex flex-col items-center z-10 w-24 shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase mb-3">Input</span>
          <div className="flex flex-col gap-0.5">
            {['x₁', 'x₂', 'x₃', '...', 'xₙ'].map(x => (
              <div key={x} className="w-8 h-3 bg-blue-100 rounded-sm flex items-center justify-center">
                <span className="text-[7px] font-bold text-blue-700">{x}</span>
              </div>
            ))}
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Positional Encoding</span>
          <div className="w-10 h-16 bg-indigo-50 border-2 border-indigo-200 rounded-lg flex items-center justify-center mt-2">
            <span className="text-[10px] font-bold text-indigo-600">+PE</span>
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Multi-Head Attention</span>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3].map(h => (
              <div key={h} className="w-8 h-8 bg-purple-100 border border-purple-200 rounded-lg flex items-center justify-center">
                <span className="text-[8px] font-black text-purple-600">H{h}</span>
              </div>
            ))}
          </div>
          <span className="text-[8px] font-bold text-purple-600 mt-1">3 Heads</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">FFN</span>
          <div className="w-12 h-12 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-center mt-2">
            <Layers className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-[8px] font-bold text-blue-600 mt-1">Feed Forward</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Output</span>
          <div className="w-10 h-8 bg-rose-50 border-2 border-rose-200 rounded-lg flex items-center justify-center">
            <span className="text-[10px] font-black text-rose-600">y</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-4 text-[9px] text-zinc-400 font-medium">
        <span>Self-Attention • No Recurrence • Parallel Processing</span>
      </div>
    </div>
  );
}

// XGBoost Architecture
function renderXGBoostArchitecture() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-between px-4 overflow-x-auto">
        {/* Features */}
        <div className="flex flex-col items-center z-10 w-24 shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase mb-3">Features</span>
          <div className="flex flex-col gap-0.5">
            {['f₁', 'f₂', 'f₃', '...', 'fₙ'].map(f => (
              <div key={f} className="w-6 h-3 bg-blue-100 rounded-sm flex items-center justify-center">
                <span className="text-[7px] font-bold text-blue-700">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        {/* Histogram Binning */}
        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Histogram</span>
          <div className="w-14 h-14 bg-emerald-50 border-2 border-emerald-200 rounded-lg flex items-center justify-center mt-2">
            <BarChart3 className="w-6 h-6 text-emerald-500" />
          </div>
          <span className="text-[8px] font-bold text-emerald-600 mt-1">Bin Split</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        {/* Gradient Trees */}
        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Trees</span>
          <div className="flex gap-2 mt-2">
            {['T₁', 'T₂', 'Tₙ'].map((t, i) => (
              <div key={t} className="flex flex-col items-center">
                <div className="w-10 h-12 bg-emerald-50 border-2 border-emerald-200 rounded-lg flex items-center justify-center">
                  <GitBranch className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-[7px] font-bold text-emerald-600 mt-1">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        {/* Ensemble Sum */}
        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Σ Fₘ</span>
          <div className="w-14 h-14 bg-rose-50 border-2 border-rose-200 rounded-lg flex items-center justify-center mt-2">
            <span className="text-lg font-black text-rose-600">Σ</span>
          </div>
          <span className="text-[8px] font-bold text-rose-600 mt-1">Additive</span>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-4 text-[9px] text-zinc-400 font-medium">
        <span>Stagewise Boosting • Gradient Descent • Regularization</span>
      </div>
    </div>
  );
}

// LightGBM Architecture
function renderLightGBMArchitecture() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-between px-4 overflow-x-auto">
        <div className="flex flex-col items-center z-10 w-24 shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase mb-3">Features</span>
          <div className="flex flex-col gap-0.5">
            {['f₁', 'f₂', 'f₃'].map(f => (
              <div key={f} className="w-6 h-3 bg-emerald-100 rounded-sm flex items-center justify-center">
                <span className="text-[7px] font-bold text-emerald-700">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">GOSS</span>
          <div className="w-12 h-12 bg-emerald-50 border-2 border-emerald-200 rounded-lg flex items-center justify-center mt-2">
            <span className="text-[8px] font-black text-emerald-600">Grad</span>
          </div>
          <span className="text-[8px] font-bold text-emerald-600 mt-1">Sampling</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Leaf-Wise</span>
          <div className="w-14 h-14 bg-emerald-50 border-2 border-emerald-200 rounded-lg flex items-center justify-center mt-2">
            <GitBranch className="w-6 h-6 text-emerald-500" />
          </div>
          <span className="text-[8px] font-bold text-emerald-600 mt-1">Growth</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Output</span>
          <div className="w-12 h-12 bg-rose-50 border-2 border-rose-200 rounded-lg flex items-center justify-center">
            <span className="text-lg font-black text-rose-600">y</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-4 text-[9px] text-zinc-400 font-medium">
        <span>Leaf-Wise Growth • Gradient-based One-Side Sampling • Fastest</span>
      </div>
    </div>
  );
}

// CatBoost Architecture
function renderCatBoostArchitecture() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-between px-4 overflow-x-auto">
        <div className="flex flex-col items-center z-10 w-24 shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase mb-3">Mixed Data</span>
          <div className="flex flex-col gap-1">
            <div className="flex gap-0.5">
              <div className="w-5 h-3 bg-blue-100 rounded-sm" />
              <div className="w-5 h-3 bg-purple-100 rounded-sm" />
            </div>
            <span className="text-[7px] text-zinc-400">Num + Cat</span>
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Ordered</span>
          <div className="w-12 h-12 bg-indigo-50 border-2 border-indigo-200 rounded-lg flex items-center justify-center mt-2">
            <span className="text-[8px] font-black text-indigo-600">1,2,3</span>
          </div>
          <span className="text-[8px] font-bold text-indigo-600 mt-1">Encoding</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Symmetric</span>
          <div className="w-14 h-14 bg-emerald-50 border-2 border-emerald-200 rounded-lg flex items-center justify-center mt-2">
            <GitBranch className="w-6 h-6 text-emerald-500" />
          </div>
          <span className="text-[8px] font-bold text-emerald-600 mt-1">Trees</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Output</span>
          <div className="w-12 h-12 bg-rose-50 border-2 border-rose-200 rounded-lg flex items-center justify-center">
            <span className="text-lg font-black text-rose-600">y</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-4 text-[9px] text-zinc-400 font-medium">
        <span>Native Categorical Support • Ordered Boosting • Symmetric Trees</span>
      </div>
    </div>
  );
}

// Random Forest Architecture
function renderRandomForestArchitecture() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-between px-4 overflow-x-auto">
        <div className="flex flex-col items-center z-10 w-24 shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase mb-3">Data</span>
          <div className="w-12 h-12 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-[8px] text-zinc-400 mt-1">N Samples</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        {/* Bootstrap */}
        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Bootstrap</span>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 bg-indigo-50 border border-indigo-200 rounded flex items-center justify-center">
                <span className="text-[7px] font-bold text-indigo-600">{i}</span>
              </div>
            ))}
          </div>
          <span className="text-[8px] font-bold text-indigo-600 mt-1">Sampling</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        {/* Trees */}
        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Trees</span>
          <div className="flex gap-2 mt-2">
            {['T₁', 'T₂', 'T₃', '...'].map((t, i) => (
              <div key={t} className="w-10 h-12 bg-emerald-50 border-2 border-emerald-200 rounded-lg flex items-center justify-center">
                <GitMerge className="w-4 h-4 text-emerald-500" />
              </div>
            ))}
          </div>
          <span className="text-[8px] font-bold text-emerald-600 mt-1">100-500 Trees</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Voting</span>
          <div className="w-12 h-12 bg-rose-50 border-2 border-rose-200 rounded-lg flex items-center justify-center">
            <span className="text-lg font-black text-rose-600">Σ/n</span>
          </div>
          <span className="text-[8px] font-bold text-rose-600 mt-1">Average</span>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-4 text-[9px] text-zinc-400 font-medium">
        <span>Bagging • Bootstrap Sampling • Parallel Trees • Ensemble</span>
      </div>
    </div>
  );
}

// Decision Tree Architecture
function renderDecisionTreeArchitecture() {
  return (
    <div className="flex flex-col h-full items-center">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div className="w-16 h-10 bg-blue-50 border-2 border-blue-300 rounded-lg flex items-center justify-center">
            <span className="text-[10px] font-black text-blue-600">x₁ &lt; 5</span>
          </div>
          <div className="flex gap-12 mt-4">
            {/* Left branch */}
            <div className="flex flex-col items-center">
              <div className="w-px h-6 bg-zinc-300" />
              <div className="w-12 h-8 bg-emerald-50 border-2 border-emerald-300 rounded-lg flex items-center justify-center">
                <span className="text-[9px] font-black text-emerald-600">x₂ &lt; 3</span>
              </div>
              <div className="flex gap-8 mt-3">
                <div className="flex flex-col items-center">
                  <div className="w-px h-4 bg-zinc-300" />
                  <div className="w-10 h-8 bg-rose-100 border border-rose-300 rounded-lg flex items-center justify-center">
                    <span className="text-[9px] font-black text-rose-600">2.5</span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-px h-4 bg-zinc-300" />
                  <div className="w-10 h-8 bg-rose-100 border border-rose-300 rounded-lg flex items-center justify-center">
                    <span className="text-[9px] font-black text-rose-600">4.1</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Right branch */}
            <div className="flex flex-col items-center">
              <div className="w-px h-6 bg-zinc-300" />
              <div className="w-12 h-8 bg-amber-50 border-2 border-amber-300 rounded-lg flex items-center justify-center">
                <span className="text-[9px] font-black text-amber-600">leaf</span>
              </div>
              <div className="flex gap-8 mt-3">
                <div className="flex flex-col items-center">
                  <div className="w-px h-4 bg-zinc-300" />
                  <div className="w-10 h-8 bg-rose-100 border border-rose-300 rounded-lg flex items-center justify-center">
                    <span className="text-[9px] font-black text-rose-600">6.8</span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-px h-4 bg-zinc-300" />
                  <div className="w-10 h-8 bg-rose-100 border border-rose-300 rounded-lg flex items-center justify-center">
                    <span className="text-[9px] font-black text-rose-600">7.2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-[9px] text-zinc-400 font-medium">
        <span>Recursive Partitioning • Gini/Entropy Split • Interpretable</span>
      </div>
    </div>
  );
}

// SVR Architecture
function renderSVRArchitecture() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-between px-4 overflow-x-auto">
        <div className="flex flex-col items-center z-10 w-24 shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase mb-3">Input</span>
          <div className="flex flex-col gap-0.5">
            {['x₁', 'x₂', '...', 'xₙ'].map(x => (
              <div key={x} className="w-6 h-3 bg-blue-100 rounded-sm flex items-center justify-center">
                <span className="text-[7px] font-bold text-blue-700">{x}</span>
              </div>
            ))}
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Kernel</span>
          <div className="w-14 h-14 bg-purple-50 border-2 border-purple-200 rounded-lg flex items-center justify-center mt-2 relative">
            <span className="text-[10px] font-black text-purple-600">RBF</span>
            <span className="absolute -top-2 text-[7px] font-black text-purple-500 bg-purple-100 px-1.5 py-0.5 rounded">K</span>
          </div>
          <span className="text-[8px] font-bold text-purple-600 mt-1">φ(x)</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">ε-Tube</span>
          <div className="w-16 h-16 border-2 border-purple-200 rounded-full flex items-center justify-center mt-2 relative">
            <div className="absolute inset-2 border-2 border-purple-100 rounded-full" />
            <span className="text-[10px] font-black text-purple-600">ε</span>
          </div>
          <span className="text-[8px] font-bold text-purple-600 mt-1">Insensitive</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Output</span>
          <div className="w-12 h-8 bg-rose-50 border-2 border-rose-200 rounded-lg flex items-center justify-center">
            <span className="text-[10px] font-black text-rose-600">y</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-4 text-[9px] text-zinc-400 font-medium">
        <span>Kernel Trick • Support Vectors • Epsilon-Insensitive Loss</span>
      </div>
    </div>
  );
}

// KNN Architecture
function renderKNNArchitecture() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-between px-4 overflow-x-auto">
        <div className="flex flex-col items-center z-10 w-24 shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase mb-3">Query</span>
          <div className="w-10 h-10 bg-amber-200 border-2 border-amber-400 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-black text-amber-800">?</span>
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Neighbors</span>
          <div className="relative w-24 h-24 border-2 border-rose-200 rounded-xl bg-rose-50/50 flex items-center justify-center mt-2">
            <div className="absolute top-1 left-2 w-4 h-4 bg-rose-300 rounded-full" />
            <div className="absolute top-3 right-3 w-4 h-4 bg-rose-400/70 rounded-full" />
            <div className="absolute bottom-2 left-4 w-4 h-4 bg-rose-300/80 rounded-full" />
            <div className="absolute bottom-4 right-4 w-4 h-4 bg-blue-300/60 rounded-full" />
            <div className="absolute top-6 left-8 w-4 h-4 bg-rose-400/50 rounded-full" />
            <div className="w-6 h-6 bg-amber-400 border-2 border-amber-600 rounded-full z-10 flex items-center justify-center">
              <span className="text-[8px] font-black text-amber-800">?</span>
            </div>
          </div>
          <span className="text-[8px] font-bold text-rose-600 mt-1">k=5 nearest</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Average</span>
          <div className="w-12 h-12 bg-rose-50 border-2 border-rose-200 rounded-lg flex items-center justify-center mt-2">
            <span className="text-lg font-black text-rose-600">Σ/k</span>
          </div>
          <span className="text-[8px] font-bold text-rose-600 mt-1">Voting</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Output</span>
          <div className="w-12 h-8 bg-emerald-50 border-2 border-emerald-200 rounded-lg flex items-center justify-center">
            <span className="text-[10px] font-black text-emerald-600">y</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-4 text-[9px] text-zinc-400 font-medium">
        <span>Lazy Learning • Distance Metric • k Neighbors Voting</span>
      </div>
    </div>
  );
}

// Linear Regression Architecture
function renderLinearArchitecture(variant: string) {
  const colors: Record<string, { accent: string; label: string }> = {
    linear: { accent: 'blue', label: 'OLS' },
    ridge: { accent: 'indigo', label: 'L2' },
    lasso: { accent: 'amber', label: 'L1' },
    elastic: { accent: 'purple', label: 'L1+L2' },
  };
  const c = colors[variant] || colors.linear;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-between px-4 overflow-x-auto">
        <div className="flex flex-col items-center z-10 w-24 shrink-0">
          <span className="text-[10px] font-black text-zinc-500 uppercase mb-3">Input</span>
          <div className="flex flex-col gap-0.5">
            {['x₁', 'x₂', 'x₃', '...', 'xₙ'].map(x => (
              <div key={x} className="w-6 h-3 bg-blue-100 rounded-sm flex items-center justify-center">
                <span className="text-[7px] font-bold text-blue-700">{x}</span>
              </div>
            ))}
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Weights</span>
          <div className="flex gap-1 mt-2">
            {['w₁', 'w₂', '...', 'wₙ'].map(w => (
              <div key={w} className="w-6 h-6 bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
                <span className="text-[7px] font-black text-blue-600">{w}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-3 h-3 text-blue-500" />
            <span className="text-[8px] font-bold text-blue-600">×</span>
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Sum + b</span>
          <div className="w-12 h-12 bg-indigo-50 border-2 border-indigo-200 rounded-lg flex items-center justify-center mt-2">
            <span className="text-lg font-black text-indigo-600">Σ</span>
          </div>
          <span className="text-[8px] font-bold text-indigo-600 mt-1">+ bias</span>
        </div>

        <ArrowRight className="w-5 h-5 text-zinc-300 shrink-0 mx-2" />

        <div className="flex flex-col items-center z-10 shrink-0">
          <span className="text-[9px] font-black text-zinc-500 uppercase">Output</span>
          <div className="w-12 h-8 bg-rose-50 border-2 border-rose-200 rounded-lg flex items-center justify-center">
            <span className="text-[10px] font-black text-rose-600">y</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-4 text-[9px] text-zinc-400 font-medium">
        <span>y = Σ(wᵢxᵢ) + b</span>
        <span className="px-2 py-0.5 bg-blue-50 rounded text-blue-600 font-bold">{c.label} Regularization</span>
      </div>
    </div>
  );
}

// Generic fallback architecture
function renderGenericArchitecture() {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-center">
            <Database className="w-6 h-6 text-blue-500" />
          </div>
          <span className="text-[10px] font-bold text-zinc-500 mt-2">Input</span>
        </div>
        <ArrowRight className="w-8 h-8 text-zinc-300" />
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-zinc-100 border-2 border-zinc-200 rounded-lg flex items-center justify-center">
            <Cpu className="w-8 h-8 text-zinc-400" />
          </div>
          <span className="text-[10px] font-bold text-zinc-500 mt-2">Model Core</span>
        </div>
        <ArrowRight className="w-8 h-8 text-zinc-300" />
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-50 border-2 border-rose-200 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-rose-500" />
          </div>
          <span className="text-[10px] font-bold text-zinc-500 mt-2">Output</span>
        </div>
      </div>
    </div>
  );
}

function ChevronArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-zinc-200">
      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
