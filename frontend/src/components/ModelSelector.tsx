import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { 
  Brain, Cpu, TrendingUp, GitBranch, Zap, 
  Info, CheckCircle, ChevronDown, ChevronUp, Star, Clock, Database
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
}

const ALL_MODELS: ModelDef[] = [
  // Linear
  {
    id: 'linear_regression', name: 'Linear Regression', shortName: 'Linear', family: 'Linear',
    description: 'Fits a straight line by minimizing MSE. The gold standard baseline.',
    hint: '💡 Always run this first — if complex models barely beat it, your data might already be linear.',
    bestFor: 'Simple, interpretable trends with linearly separable data.',
    speed: 'Fast', complexity: 'Low',
    recommended: (f, n) => n < 500 || f < 5,
  },
  {
    id: 'ridge', name: 'Ridge Regression (L2)', shortName: 'Ridge', family: 'Linear',
    description: 'Linear regression + L2 penalty. Prevents overfitting when features are correlated.',
    hint: '💡 Use when you have many features that are correlated with each other (multicollinearity).',
    bestFor: 'Tabular data with correlated or redundant features.',
    speed: 'Fast', complexity: 'Low',
  },
  {
    id: 'lasso', name: 'Lasso Regression (L1)', shortName: 'Lasso', family: 'Linear',
    description: 'Linear regression + L1 penalty. Automatically zeroes out unimportant features.',
    hint: '💡 Best for automatic feature selection — it will set weak feature coefficients to exactly zero.',
    bestFor: 'High-dimensional data where only a few features matter.',
    speed: 'Fast', complexity: 'Low',
  },
  {
    id: 'elastic_net', name: 'ElasticNet (L1 + L2)', shortName: 'ElasticNet', family: 'Linear',
    description: 'Combines Lasso and Ridge regularization for the best of both worlds.',
    hint: '💡 When you are unsure between Ridge and Lasso, ElasticNet is a safe, balanced choice.',
    bestFor: 'Complex regression tasks where both feature selection and stability matter.',
    speed: 'Fast', complexity: 'Low',
  },
  // Tree
  {
    id: 'decision_tree', name: 'Decision Tree', shortName: 'D-Tree', family: 'Tree',
    description: 'Splits data into branches via feature thresholds. Fully interpretable.',
    hint: '⚠️ Prone to overfitting without depth limits. Great for understanding, not final production.',
    bestFor: 'Explainable rule-based regression on small datasets.',
    speed: 'Fast', complexity: 'Low',
  },
  {
    id: 'random_forest', name: 'Random Forest', shortName: 'RandForest', family: 'Tree',
    description: 'Ensemble of 100 decision trees. Robust, accurate, and resistant to noise.',
    hint: '💡 Excellent default model — requires minimal tuning and handles missing-ish data well.',
    bestFor: 'Most tabular regression tasks. A reliable, powerful baseline.',
    speed: 'Medium', complexity: 'Medium',
    recommended: (f, n) => n >= 200 && n < 50000,
  },
  {
    id: 'adaboost', name: 'AdaBoost', shortName: 'AdaBoost', family: 'Tree',
    description: 'Sequential ensemble that focuses each new tree on the hardest samples.',
    hint: '💡 Works well when you have noisy but small datasets. Sensitive to outliers.',
    bestFor: 'Medium-sized datasets with complex patterns.',
    speed: 'Medium', complexity: 'Medium',
  },
  // Boosting
  {
    id: 'gradient_boosting', name: 'Gradient Boosting', shortName: 'GBM', family: 'Boosting',
    description: 'Builds trees sequentially to minimize residuals. Strong and interpretable.',
    hint: '💡 Slower than XGBoost but more predictable. Good for datasets under 100K rows.',
    bestFor: 'Structured tabular regression where accuracy matters.',
    speed: 'Medium', complexity: 'Medium',
  },
  {
    id: 'xgboost', name: 'XGBoost', shortName: 'XGBoost', family: 'Boosting',
    description: 'Extreme Gradient Boosting with parallel tree construction and L1/L2 regularization.',
    hint: '🏆 State-of-the-art for tabular data. Winner of most Kaggle competitions on structured data.',
    bestFor: 'Any structured/tabular regression task. Best general-purpose model.',
    speed: 'Medium', complexity: 'High',
    recommended: (f, n) => n >= 500,
  },
  {
    id: 'lightgbm', name: 'LightGBM', shortName: 'LGBM', family: 'Boosting',
    description: 'Leaf-wise tree growth. 10x faster than XGBoost on large datasets.',
    hint: '💡 If XGBoost is too slow on your dataset, switch to LightGBM first.',
    bestFor: 'Large datasets (>100K rows) where training speed is critical.',
    speed: 'Fast', complexity: 'High',
    recommended: (f, n) => n >= 10000,
  },
  {
    id: 'catboost', name: 'CatBoost', shortName: 'CatBoost', family: 'Boosting',
    description: 'Gradient boosting with native categorical feature handling via ordered boosting.',
    hint: '💡 Best when your raw data has string/category columns — no encoding needed.',
    bestFor: 'Mixed-type datasets with categorical features.',
    speed: 'Medium', complexity: 'High',
  },
  // SVM / KNN
  {
    id: 'svr', name: 'Support Vector Regression', shortName: 'SVR', family: 'SVM',
    description: 'Finds a tube around the best-fit line, tolerating errors within a margin (epsilon).',
    hint: '⚠️ Requires scaled features and gets very slow beyond ~10K samples.',
    bestFor: 'Small to medium datasets with complex non-linear relationships.',
    speed: 'Slow', complexity: 'Medium',
    recommended: (f, n) => n < 5000,
  },
  {
    id: 'knn', name: 'K-Nearest Neighbors', shortName: 'KNN', family: 'Neighbors',
    description: 'Predicts by averaging the K closest training samples in feature space.',
    hint: '💡 No training time, but slow at inference. Excellent for detecting local patterns.',
    bestFor: 'Low-dimensional data where nearby samples share similar targets.',
    speed: 'Fast', complexity: 'Low',
    recommended: (f, n) => f <= 10 && n < 5000,
  },
  // Deep Learning
  {
    id: 'ann', name: 'ANN (Multi-Layer Perceptron)', shortName: 'ANN', family: 'Deep Learning',
    description: 'Standard deep neural network: Input → Dense hidden layers → Linear output.',
    hint: '💡 The standard deep learning baseline. Best when you have 1K+ samples and complex non-linearity.',
    bestFor: 'Large, complex tabular datasets with non-linear feature interactions.',
    speed: 'Medium', complexity: 'High',
    recommended: (f, n) => n >= 1000,
  },
  {
    id: 'cnn', name: 'CNN (1-D Convolutional)', shortName: '1D-CNN', family: 'Deep Learning',
    description: 'Applies convolutional filters to detect local feature patterns in ordered inputs.',
    hint: '💡 Use when features have a natural ordering (e.g., sensor arrays, spectral data, adjacent columns).',
    bestFor: 'Spectral, sensor, or spatially-ordered tabular features.',
    speed: 'Medium', complexity: 'High',
  },
  {
    id: 'lstm', name: 'LSTM', shortName: 'LSTM', family: 'Deep Learning',
    description: 'Gated recurrent network with long-term memory. The de-facto sequence model.',
    hint: '💡 Use for time-series regression — predictions based on historical sequences.',
    bestFor: 'Time-series forecasting (energy demand, stock prices, sensor streams).',
    speed: 'Slow', complexity: 'High',
  },
  {
    id: 'gru', name: 'GRU (Gated Recurrent Unit)', shortName: 'GRU', family: 'Deep Learning',
    description: 'Faster, lighter LSTM alternative. Similar accuracy with lower computational cost.',
    hint: '💡 If LSTM trains too slowly, switch to GRU — often just as accurate.',
    bestFor: 'Real-time sequential regression where speed matters.',
    speed: 'Medium', complexity: 'High',
  },
  {
    id: 'transformer', name: 'Transformer', shortName: 'Transformer', family: 'Deep Learning',
    description: 'Multi-head self-attention learns global pairwise feature interactions.',
    hint: '🔬 Cutting-edge architecture. Each feature attends to every other feature to form predictions.',
    bestFor: 'Complex, high-dimensional data where all features interact globally.',
    speed: 'Slow', complexity: 'High',
  },
];

const FAMILY_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  'Linear':       { color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100',   icon: TrendingUp, label: 'Linear Models' },
  'Tree':         { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: GitBranch, label: 'Tree Models' },
  'Boosting':     { color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100',  icon: Zap,        label: 'Boosting (Best for Tabular)' },
  'SVM':          { color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-100',icon: Cpu,        label: 'Support Vector' },
  'Neighbors':    { color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-100',   icon: Database,   label: 'Instance-Based' },
  'Deep Learning':{ color: 'text-zinc-900',    bg: 'bg-zinc-900 border-zinc-800',  icon: Brain,      label: 'Deep Learning (Neural Nets)' },
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
}

export function ModelSelector({ selectedModelId, onSelect, features, samples, targets }: ModelSelectorProps) {
  const [expandedFamily, setExpandedFamily] = useState<string | null>('Boosting');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const families = Array.from(new Set(ALL_MODELS.map(m => m.family)));
  const recommended = ALL_MODELS.filter(m => m.recommended?.(features, samples, targets));
  const selected = ALL_MODELS.find(m => m.id === selectedModelId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Choose Your Model</h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">Select the algorithm to train. All traditional models run as benchmarks automatically.</p>
        </div>
        {selected && (
          <div className="flex items-center gap-2 bg-zinc-900 text-white rounded-xl px-3 py-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-bold">{selected.shortName}</span>
          </div>
        )}
      </div>

      {/* Smart Recommendations */}
      {recommended.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Smart Recommendations for your data</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommended.map(m => (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                  selectedModelId === m.id
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-amber-700 border-amber-200 hover:bg-amber-100"
                )}
              >
                {m.shortName}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-amber-600">
            Based on: {samples.toLocaleString()} samples, {features} features, {targets} target{targets > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Model Families */}
      <div className="space-y-2">
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
                "rounded-2xl border overflow-hidden transition-all",
                hasSelected ? "border-zinc-900 shadow-md" : "border-zinc-100",
              )}
            >
              {/* Family Header */}
              <button
                onClick={() => setExpandedFamily(isExpanded ? null : family)}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-3.5 transition-all",
                  isDL ? "bg-zinc-900 text-white" : "bg-white hover:bg-zinc-50",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center",
                    isDL ? "bg-white/10" : cfg.bg
                  )}>
                    <FamilyIcon className={cn("w-3.5 h-3.5", isDL ? "text-white" : cfg.color)} />
                  </div>
                  <div className="text-left">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", isDL ? "text-zinc-300" : "text-zinc-900")}>
                      {cfg.label}
                    </span>
                    <span className={cn("ml-2 text-[9px]", isDL ? "text-zinc-500" : "text-zinc-400")}>
                      {familyModels.length} models
                    </span>
                  </div>
                </div>
                {isExpanded
                  ? <ChevronUp className={cn("w-4 h-4", isDL ? "text-zinc-400" : "text-zinc-400")} />
                  : <ChevronDown className={cn("w-4 h-4", isDL ? "text-zinc-400" : "text-zinc-400")} />
                }
              </button>

              {/* Model Cards */}
              {isExpanded && (
                <div className={cn("divide-y", isDL ? "divide-zinc-800 bg-zinc-950" : "divide-zinc-50 bg-white")}>
                  {familyModels.map(model => {
                    const isSelected = selectedModelId === model.id;
                    const isHovered = hoveredId === model.id;
                    const isRecommended = recommended.some(r => r.id === model.id);

                    return (
                      <button
                        key={model.id}
                        onClick={() => onSelect(model.id)}
                        onMouseEnter={() => setHoveredId(model.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={cn(
                          "w-full text-left px-5 py-4 transition-all group",
                          isSelected
                            ? isDL ? "bg-white/10" : "bg-zinc-50"
                            : isDL ? "hover:bg-white/5" : "hover:bg-zinc-50/80",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Selection indicator */}
                            <div className={cn(
                              "w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all",
                              isSelected
                                ? "border-blue-500 bg-blue-500"
                                : isDL ? "border-zinc-600" : "border-zinc-200 group-hover:border-zinc-400"
                            )}>
                              {isSelected && <div className="w-full h-full rounded-full bg-white scale-[0.4]" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  "text-xs font-bold",
                                  isSelected ? "text-blue-600" : isDL ? "text-white" : "text-zinc-900"
                                )}>
                                  {model.name}
                                </span>
                                {isRecommended && (
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full">
                                    ✦ Recommended
                                  </span>
                                )}
                              </div>
                              <p className={cn(
                                "text-[10px] leading-relaxed mt-0.5",
                                isDL ? "text-zinc-500" : "text-zinc-400"
                              )}>
                                {model.description}
                              </p>

                              {/* Hint — shown on hover or selection */}
                              {(isHovered || isSelected) && (
                                <div className={cn(
                                  "mt-2 p-2.5 rounded-xl text-[10px] leading-relaxed animate-in fade-in duration-200",
                                  isDL ? "bg-white/5 text-zinc-300" : "bg-blue-50 text-blue-700"
                                )}>
                                  <div className="flex items-start gap-1.5">
                                    <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                    <span>{model.hint}</span>
                                  </div>
                                  <p className={cn("mt-1.5 font-semibold", isDL ? "text-zinc-400" : "text-blue-600")}>
                                    Best for: {model.bestFor}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Meta badges */}
                          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                            <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", SPEED_BADGE[model.speed])}>
                              <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                              {model.speed}
                            </span>
                            <span className={cn(
                              "text-[9px] font-bold px-2 py-0.5 rounded-full",
                              model.complexity === 'Low' ? "bg-zinc-100 text-zinc-500"
                              : model.complexity === 'Medium' ? "bg-blue-50 text-blue-600"
                              : "bg-purple-50 text-purple-600"
                            )}>
                              {model.complexity}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <p className="text-[10px] text-zinc-400 text-center pt-2">
        All 13 traditional models always run as benchmarks. Your selection determines the primary DL model trained.
      </p>
    </div>
  );
}
