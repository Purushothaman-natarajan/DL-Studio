import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { 
  Brain, Cpu, TrendingUp, GitBranch, Zap, 
  Info, CheckCircle, ChevronDown, ChevronUp, Star, Clock, Database,
  Settings, Sliders
} from 'lucide-react';

interface ModelDef {
  id: string;
  name: string;
  shortName: string;
  family: 'Linear' | 'Tree' | 'Boosting' | 'SVM' | 'Neighbors' | 'Deep Learning';
  description: string;
  hint: string;
  bestFor: string;
  speed: 'Fast' | 'Medium' | 'Slow';
  complexity: 'Low' | 'Medium' | 'High';
  recommended?: (features: number, samples: number, targets: number) => boolean;
  params?: { id: string; name: string; type: 'range' | 'select'; min?: number; max?: number; step?: number; options?: { value: string; label: string }[]; default: number | string }[];
}

const ALL_MODELS: ModelDef[] = [
  // Deep Learning FIRST
  {
    id: 'ann', name: 'ANN (Multi-Layer Perceptron)', shortName: 'ANN', family: 'Deep Learning',
    description: 'Standard deep neural network with customizable architecture.',
    hint: '💡 Design your own architecture with configurable hidden layers and neurons.',
    bestFor: 'Large, complex tabular datasets with non-linear feature interactions.',
    speed: 'Medium', complexity: 'High',
    recommended: (f, n) => n >= 1000,
    params: [
      { id: 'hidden_layers', name: 'Hidden Layers', type: 'range', min: 1, max: 5, step: 1, default: 2 },
      { id: 'neurons', name: 'Neurons per Layer', type: 'range', min: 8, max: 512, step: 8, default: 64 },
      { id: 'activation', name: 'Activation', type: 'select', options: [{ value: 'relu', label: 'ReLU' }, { value: 'tanh', label: 'Tanh' }, { value: 'sigmoid', label: 'Sigmoid' }], default: 'relu' },
      { id: 'dropout', name: 'Dropout Rate', type: 'range', min: 0, max: 0.5, step: 0.05, default: 0.2 },
    ]
  },
  {
    id: 'mlp', name: 'MLP (Custom Architecture)', shortName: 'MLP', family: 'Deep Learning',
    description: 'Fully customizable multi-layer perceptron.',
    hint: '💡 Design your own architecture with custom layer configurations.',
    bestFor: 'When you need custom network topology for specialized patterns.',
    speed: 'Medium', complexity: 'High',
    params: [
      { id: 'layers_config', name: 'Layers Config', type: 'select', options: [{ value: '1', label: '64' }, { value: '2', label: '128-64' }, { value: '3', label: '256-128-64' }, { value: '4', label: '128-64-32-16' }], default: '2' },
      { id: 'activation', name: 'Activation', type: 'select', options: [{ value: 'relu', label: 'ReLU' }, { value: 'tanh', label: 'Tanh' }], default: 'relu' },
      { id: 'dropout', name: 'Dropout', type: 'range', min: 0, max: 0.5, step: 0.1, default: 0.1 },
    ]
  },
  {
    id: 'lstm', name: 'LSTM', shortName: 'LSTM', family: 'Deep Learning',
    description: 'Long Short-Term Memory network for sequential patterns.',
    hint: '💡 Use for time-series regression — predictions based on historical sequences.',
    bestFor: 'Time-series forecasting (energy demand, stock prices, sensor streams).',
    speed: 'Slow', complexity: 'High',
    params: [
      { id: 'units', name: 'LSTM Units', type: 'range', min: 32, max: 256, step: 32, default: 64 },
      { id: 'layers', name: 'LSTM Layers', type: 'range', min: 1, max: 3, step: 1, default: 1 },
      { id: 'bidirectional', name: 'Bidirectional', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }], default: 'false' },
    ]
  },
  {
    id: 'gru', name: 'GRU (Gated Recurrent Unit)', shortName: 'GRU', family: 'Deep Learning',
    description: 'Faster, lighter LSTM alternative.',
    hint: '💡 If LSTM is too slow, switch to GRU — often just as accurate.',
    bestFor: 'Real-time sequential regression where speed matters.',
    speed: 'Medium', complexity: 'High',
    params: [
      { id: 'units', name: 'GRU Units', type: 'range', min: 32, max: 256, step: 32, default: 64 },
      { id: 'layers', name: 'GRU Layers', type: 'range', min: 1, max: 3, step: 1, default: 1 },
    ]
  },
  {
    id: 'transformer', name: 'Transformer', shortName: 'Trans', family: 'Deep Learning',
    description: 'Multi-head self-attention for global feature interactions.',
    hint: '🔬 Each feature attends to every other feature to form predictions.',
    bestFor: 'Complex, high-dimensional data where all features interact globally.',
    speed: 'Slow', complexity: 'High',
    params: [
      { id: 'heads', name: 'Attention Heads', type: 'range', min: 1, max: 8, step: 1, default: 4 },
      { id: 'layers', name: 'Transformer Layers', type: 'range', min: 1, max: 4, step: 1, default: 2 },
      { id: 'ff_dim', name: 'FFN Dimension', type: 'range', min: 64, max: 512, step: 64, default: 128 },
    ]
  },
  // Boosting
  {
    id: 'xgboost', name: 'XGBoost', shortName: 'XGBoost', family: 'Boosting',
    description: 'Extreme Gradient Boosting with L1/L2 regularization.',
    hint: '🏆 Winner of most Kaggle competitions on structured data.',
    bestFor: 'Any structured/tabular regression task. Best general-purpose model.',
    speed: 'Medium', complexity: 'High',
    recommended: (f, n) => n >= 500,
    params: [
      { id: 'n_estimators', name: 'Trees', type: 'range', min: 50, max: 500, step: 50, default: 100 },
      { id: 'max_depth', name: 'Max Depth', type: 'range', min: 3, max: 12, step: 1, default: 6 },
      { id: 'learning_rate', name: 'Learning Rate', type: 'range', min: 0.01, max: 0.3, step: 0.01, default: 0.1 },
      { id: 'subsample', name: 'Subsample', type: 'range', min: 0.5, max: 1, step: 0.1, default: 0.8 },
      { id: 'colsample_bytree', name: 'Colsample', type: 'range', min: 0.5, max: 1, step: 0.1, default: 0.8 },
    ]
  },
  {
    id: 'lightgbm', name: 'LightGBM', shortName: 'LGBM', family: 'Boosting',
    description: 'Leaf-wise tree growth. 10x faster than XGBoost.',
    hint: '💡 If XGBoost is too slow, switch to LightGBM first.',
    bestFor: 'Large datasets (>100K rows) where training speed is critical.',
    speed: 'Fast', complexity: 'High',
    recommended: (f, n) => n >= 10000,
    params: [
      { id: 'n_estimators', name: 'Trees', type: 'range', min: 50, max: 500, step: 50, default: 100 },
      { id: 'num_leaves', name: 'Num Leaves', type: 'range', min: 15, max: 127, step: 8, default: 31 },
      { id: 'learning_rate', name: 'Learning Rate', type: 'range', min: 0.01, max: 0.3, step: 0.01, default: 0.1 },
      { id: 'min_child_samples', name: 'Min Samples', type: 'range', min: 5, max: 50, step: 5, default: 20 },
    ]
  },
  {
    id: 'catboost', name: 'CatBoost', shortName: 'CatBoost', family: 'Boosting',
    description: 'Native categorical feature handling via ordered boosting.',
    hint: '💡 Best when your raw data has string/category columns.',
    bestFor: 'Mixed-type datasets with categorical features.',
    speed: 'Medium', complexity: 'High',
    params: [
      { id: 'iterations', name: 'Iterations', type: 'range', min: 50, max: 500, step: 50, default: 100 },
      { id: 'depth', name: 'Depth', type: 'range', min: 4, max: 10, step: 1, default: 6 },
      { id: 'learning_rate', name: 'Learning Rate', type: 'range', min: 0.01, max: 0.3, step: 0.01, default: 0.1 },
    ]
  },
  {
    id: 'gradient_boosting', name: 'Gradient Boosting', shortName: 'GBM', family: 'Boosting',
    description: 'Sequential ensemble minimizing residuals.',
    hint: '💡 Slower than XGBoost but more predictable.',
    bestFor: 'Structured tabular regression where accuracy matters.',
    speed: 'Medium', complexity: 'Medium',
    params: [
      { id: 'n_estimators', name: 'Estimators', type: 'range', min: 50, max: 300, step: 50, default: 100 },
      { id: 'max_depth', name: 'Max Depth', type: 'range', min: 3, max: 10, step: 1, default: 5 },
      { id: 'learning_rate', name: 'Learning Rate', type: 'range', min: 0.01, max: 0.2, step: 0.01, default: 0.1 },
    ]
  },
  // Linear
  {
    id: 'linear_regression', name: 'Linear Regression', shortName: 'Linear', family: 'Linear',
    description: 'Fits a straight line by minimizing MSE.',
    hint: '💡 Always run this first — if complex models barely beat it, your data might already be linear.',
    bestFor: 'Simple, interpretable trends with linearly separable data.',
    speed: 'Fast', complexity: 'Low',
    recommended: (f, n) => n < 500 || f < 5,
  },
  {
    id: 'ridge', name: 'Ridge Regression (L2)', shortName: 'Ridge', family: 'Linear',
    description: 'Linear regression + L2 penalty.',
    hint: '💡 Use when you have many features that are correlated.',
    bestFor: 'Tabular data with correlated or redundant features.',
    speed: 'Fast', complexity: 'Low',
    params: [
      { id: 'alpha', name: 'Alpha (Regularization)', type: 'range', min: 0.001, max: 10, step: 0.1, default: 1.0 },
    ]
  },
  {
    id: 'lasso', name: 'Lasso Regression (L1)', shortName: 'Lasso', family: 'Linear',
    description: 'Linear regression + L1 penalty. Automatically zeroes out unimportant features.',
    hint: '💡 Best for automatic feature selection.',
    bestFor: 'High-dimensional data where only a few features matter.',
    speed: 'Fast', complexity: 'Low',
    params: [
      { id: 'alpha', name: 'Alpha (Regularization)', type: 'range', min: 0.001, max: 10, step: 0.1, default: 1.0 },
    ]
  },
  {
    id: 'elastic_net', name: 'ElasticNet (L1 + L2)', shortName: 'ElasticNet', family: 'Linear',
    description: 'Combines Lasso and Ridge regularization.',
    hint: '💡 When you are unsure between Ridge and Lasso, ElasticNet is a safe choice.',
    bestFor: 'Complex regression tasks where both feature selection and stability matter.',
    speed: 'Fast', complexity: 'Low',
    params: [
      { id: 'alpha', name: 'Alpha', type: 'range', min: 0.001, max: 10, step: 0.1, default: 1.0 },
      { id: 'l1_ratio', name: 'L1 Ratio', type: 'range', min: 0, max: 1, step: 0.1, default: 0.5 },
    ]
  },
  // Tree
  {
    id: 'random_forest', name: 'Random Forest', shortName: 'RF', family: 'Tree',
    description: 'Ensemble of 100 decision trees.',
    hint: '💡 Excellent default model — requires minimal tuning.',
    bestFor: 'Most tabular regression tasks. A reliable, powerful baseline.',
    speed: 'Medium', complexity: 'Medium',
    recommended: (f, n) => n >= 200 && n < 50000,
    params: [
      { id: 'n_estimators', name: 'Trees', type: 'range', min: 50, max: 300, step: 50, default: 100 },
      { id: 'max_depth', name: 'Max Depth', type: 'range', min: 5, max: 30, step: 5, default: 15 },
      { id: 'min_samples_split', name: 'Min Samples Split', type: 'range', min: 2, max: 20, step: 2, default: 5 },
    ]
  },
  {
    id: 'decision_tree', name: 'Decision Tree', shortName: 'DTree', family: 'Tree',
    description: 'Splits data into branches via feature thresholds.',
    hint: '⚠️ Prone to overfitting without depth limits.',
    bestFor: 'Explainable rule-based regression on small datasets.',
    speed: 'Fast', complexity: 'Low',
    params: [
      { id: 'max_depth', name: 'Max Depth', type: 'range', min: 3, max: 20, step: 1, default: 10 },
      { id: 'min_samples_split', name: 'Min Samples', type: 'range', min: 2, max: 20, step: 2, default: 5 },
    ]
  },
  {
    id: 'adaboost', name: 'AdaBoost', shortName: 'Ada', family: 'Tree',
    description: 'Sequential ensemble focusing on hardest samples.',
    hint: '💡 Works well when you have noisy but small datasets.',
    bestFor: 'Medium-sized datasets with complex patterns.',
    speed: 'Medium', complexity: 'Medium',
    params: [
      { id: 'n_estimators', name: 'Estimators', type: 'range', min: 25, max: 200, step: 25, default: 50 },
      { id: 'learning_rate', name: 'Learning Rate', type: 'range', min: 0.1, max: 2, step: 0.1, default: 1.0 },
    ]
  },
  // SVM / KNN
  {
    id: 'svr', name: 'Support Vector Regression', shortName: 'SVR', family: 'SVM',
    description: 'Finds a tube around the best-fit line.',
    hint: '⚠️ Requires scaled features and gets slow beyond ~10K samples.',
    bestFor: 'Small to medium datasets with complex non-linear relationships.',
    speed: 'Slow', complexity: 'Medium',
    recommended: (f, n) => n < 5000,
    params: [
      { id: 'kernel', name: 'Kernel', type: 'select', options: [{ value: 'rbf', label: 'RBF' }, { value: 'linear', label: 'Linear' }, { value: 'poly', label: 'Polynomial' }], default: 'rbf' },
      { id: 'C', name: 'C (Regularization)', type: 'range', min: 0.1, max: 10, step: 0.1, default: 1.0 },
      { id: 'epsilon', name: 'Epsilon', type: 'range', min: 0.01, max: 1, step: 0.01, default: 0.1 },
    ]
  },
  {
    id: 'knn', name: 'K-Nearest Neighbors', shortName: 'KNN', family: 'Neighbors',
    description: 'Predicts by averaging the K closest training samples.',
    hint: '💡 No training time, but slow at inference.',
    bestFor: 'Low-dimensional data where nearby samples share similar targets.',
    speed: 'Fast', complexity: 'Low',
    recommended: (f, n) => f <= 10 && n < 5000,
    params: [
      { id: 'n_neighbors', name: 'K Neighbors', type: 'range', min: 1, max: 20, step: 1, default: 5 },
      { id: 'weights', name: 'Weights', type: 'select', options: [{ value: 'uniform', label: 'Uniform' }, { value: 'distance', label: 'Distance' }], default: 'uniform' },
      { id: 'metric', name: 'Distance Metric', type: 'select', options: [{ value: 'euclidean', label: 'Euclidean' }, { value: 'manhattan', label: 'Manhattan' }, { value: 'minkowski', label: 'Minkowski' }], default: 'euclidean' },
    ]
  },
];

const FAMILY_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  'Deep Learning':{ color: 'text-white', bg: 'bg-zinc-900 border-zinc-800', icon: Brain,      label: 'Deep Learning' },
  'Boosting':     { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100', icon: Zap,        label: 'Boosting' },
  'Linear':       { color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100',   icon: TrendingUp, label: 'Linear Models' },
  'Tree':         { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: GitBranch, label: 'Tree Models' },
  'SVM':          { color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-100',icon: Cpu,        label: 'Support Vector' },
  'Neighbors':    { color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-100',   icon: Database,   label: 'Instance-Based' },
};

const SPEED_BADGE: Record<string, string> = {
  'Fast':   'bg-emerald-100 text-emerald-700',
  'Medium': 'bg-amber-100 text-amber-700',
  'Slow':   'bg-red-100 text-red-700',
};

interface ModelSelectorProps {
  selectedModelId: string;
  onSelect: (id: string) => void;
  features: number;
  samples: number;
  targets: number;
  onParamChange?: (modelId: string, paramId: string, value: number | string) => void;
}

export function ModelSelector({ selectedModelId, onSelect, features, samples, targets, onParamChange }: ModelSelectorProps) {
  const [expandedFamily, setExpandedFamily] = useState<string | null>('Deep Learning');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showParams, setShowParams] = useState<string | null>(null);

  const families = Array.from(new Set(ALL_MODELS.map(m => m.family)));
  const recommended = ALL_MODELS.filter(m => m.recommended?.(features, samples, targets));
  const selected = ALL_MODELS.find(m => m.id === selectedModelId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Choose Your Model</h3>
        {selected && (
          <div className="flex items-center gap-2 bg-zinc-900 text-white rounded-xl px-3 py-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-bold">{selected.shortName}</span>
          </div>
        )}
      </div>

      {recommended.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Recommended</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recommended.map(m => (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all",
                  selectedModelId === m.id
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-amber-700 border-amber-200 hover:bg-amber-100"
                )}
              >
                {m.shortName}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {families.map(family => {
          const familyModels = ALL_MODELS.filter(m => m.family === family);
          const cfg = FAMILY_CONFIG[family];
          const FamilyIcon = cfg.icon;
          const isExpanded = expandedFamily === family;
          const isDL = family === 'Deep Learning';
          const hasSelected = familyModels.some(m => m.id === selectedModelId);

          return (
            <div
              key={family}
              className={cn(
                "rounded-xl border overflow-hidden transition-all",
                hasSelected ? "border-zinc-900 shadow-md" : "border-zinc-100",
              )}
            >
              <button
                onClick={() => setExpandedFamily(isExpanded ? null : family)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 transition-all",
                  isDL ? "bg-zinc-900 text-white" : "bg-white hover:bg-zinc-50",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", isDL ? "bg-white/10" : cfg.bg)}>
                    <FamilyIcon className={cn("w-3 h-3", isDL ? "text-white" : cfg.color)} />
                  </div>
                  <div className="text-left">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", isDL ? "text-zinc-300" : "text-zinc-900")}>
                      {cfg.label}
                    </span>
                    <span className={cn("ml-2 text-[9px]", isDL ? "text-zinc-500" : "text-zinc-400")}>
                      {familyModels.length}
                    </span>
                  </div>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 text-zinc-400" />
                  : <ChevronDown className="w-4 h-4 text-zinc-400" />
                }
              </button>

              {isExpanded && (
                <div className={cn("divide-y", isDL ? "divide-zinc-800 bg-zinc-950" : "divide-zinc-50 bg-white")}>
                  {familyModels.map(model => {
                    const isSelected = selectedModelId === model.id;
                    const isHovered = hoveredId === model.id;
                    const isRecommended = recommended.some(r => r.id === model.id);
                    const hasParams = model.params && model.params.length > 0;
                    const isShowingParams = showParams === model.id;

                    return (
                      <div key={model.id}>
                        <button
                          onClick={() => onSelect(model.id)}
                          onMouseEnter={() => setHoveredId(model.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          className={cn(
                            "w-full text-left px-4 py-3 transition-all",
                            isSelected ? isDL ? "bg-white/10" : "bg-zinc-50" : isDL ? "hover:bg-white/5" : "hover:bg-zinc-50/80",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <div className={cn(
                                "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all",
                                isSelected ? "border-blue-500 bg-blue-500" : isDL ? "border-zinc-600" : "border-zinc-200"
                              )}>
                                {isSelected && <div className="w-full h-full rounded-full bg-white scale-[0.4]" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn("text-xs font-bold", isSelected ? "text-blue-500" : isDL ? "text-white" : "text-zinc-900")}>
                                    {model.name}
                                  </span>
                                  {isRecommended && (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold rounded-full">✦</span>
                                  )}
                                </div>
                                {(isHovered || isSelected) && (
                                  <p className={cn("text-[9px] leading-relaxed mt-1", isDL ? "text-zinc-500" : "text-zinc-400")}>
                                    {model.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-full", SPEED_BADGE[model.speed])}>
                                {model.speed}
                              </span>
                              {hasParams && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowParams(isShowingParams ? null : model.id);
                                  }}
                                  className={cn(
                                    "p-1 rounded-lg transition-all",
                                    isShowingParams ? "bg-blue-500 text-white" : isDL ? "text-zinc-400 hover:bg-white/10" : "text-zinc-400 hover:bg-zinc-100"
                                  )}
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </button>

                        {hasParams && isShowingParams && (
                          <div className={cn("p-4 border-t", isDL ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-100 bg-zinc-50/50")}>
                            <div className="flex items-center gap-2 mb-3">
                              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                              <span className="text-[10px] font-black uppercase text-zinc-500">Hyperparameters</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {model.params?.map(param => (
                                <div key={param.id}>
                                  <label className="text-[8px] font-black uppercase text-zinc-500 block mb-1">{param.name}</label>
                                  {param.type === 'range' ? (
                                    <div className="space-y-1">
                                      <input
                                        type="range"
                                        min={param.min}
                                        max={param.max}
                                        step={param.step}
                                        defaultValue={param.default as number}
                                        onChange={(e) => onParamChange?.(model.id, param.id, parseFloat(e.target.value))}
                                        className="w-full accent-blue-500 h-1.5"
                                      />
                                      <div className="flex justify-between text-[7px] text-zinc-400">
                                        <span>{param.min}</span>
                                        <span className="font-bold text-blue-600">{(param as any)._value || param.default}</span>
                                        <span>{param.max}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <select
                                      defaultValue={param.default as string}
                                      onChange={(e) => onParamChange?.(model.id, param.id, e.target.value)}
                                      className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-[10px] font-bold"
                                    >
                                      {param.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-zinc-400 text-center pt-1">
        Click ⚙️ to configure hyperparameters for any model
      </p>
    </div>
  );
}
