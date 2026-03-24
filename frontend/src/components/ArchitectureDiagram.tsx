import React from 'react';
import { LayerConfig } from '../types';
import { Brain, Cpu, Database, GitBranch, Network, TrendingUp, Zap, X } from 'lucide-react';

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

type ModelFamily = 'Deep Learning' | 'Linear' | 'Tree Ensemble' | 'Kernel' | 'Instance';
type AccentTone = 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'zinc';

interface ModelBlueprint {
  family: ModelFamily;
  summary: string;
  stages: string[];
  cues: string[];
}

const ACCENT_STYLES: Record<AccentTone, { card: string; chip: string; op: string }> = {
  blue: { card: 'border-blue-100 bg-blue-50/40', chip: 'border-blue-200 bg-blue-50 text-blue-700', op: 'text-blue-600' },
  emerald: { card: 'border-emerald-100 bg-emerald-50/40', chip: 'border-emerald-200 bg-emerald-50 text-emerald-700', op: 'text-emerald-600' },
  amber: { card: 'border-amber-100 bg-amber-50/40', chip: 'border-amber-200 bg-amber-50 text-amber-700', op: 'text-amber-600' },
  purple: { card: 'border-purple-100 bg-purple-50/40', chip: 'border-purple-200 bg-purple-50 text-purple-700', op: 'text-purple-600' },
  rose: { card: 'border-rose-100 bg-rose-50/40', chip: 'border-rose-200 bg-rose-50 text-rose-700', op: 'text-rose-600' },
  zinc: { card: 'border-zinc-200 bg-zinc-50', chip: 'border-zinc-200 bg-zinc-100 text-zinc-700', op: 'text-zinc-600' },
};

const FAMILY_BADGE_CLASS: Record<ModelFamily, string> = {
  'Deep Learning': 'bg-blue-50 text-blue-700',
  Linear: 'bg-indigo-50 text-indigo-700',
  'Tree Ensemble': 'bg-emerald-50 text-emerald-700',
  Kernel: 'bg-purple-50 text-purple-700',
  Instance: 'bg-rose-50 text-rose-700',
};

const MODEL_BLUEPRINTS: Record<string, ModelBlueprint> = {
  cnn: {
    family: 'Deep Learning',
    summary: 'Learns local feature neighborhoods with shared convolution filters.',
    stages: ['Ordered Feature Input', 'Conv1D Feature Extraction', 'Pooling Compression', 'Dense Projection', 'Regression Output'],
    cues: [
      'Works best when feature columns have natural order.',
      'Weight sharing reduces parameter count vs dense-only stacks.',
      'Pooling improves robustness to local noise.',
    ],
  },
  lstm: {
    family: 'Deep Learning',
    summary: 'Captures long-range temporal dependencies with gated memory cells.',
    stages: ['Windowed Sequences', 'LSTM Gate Stack', 'Temporal Embedding', 'Dense Decoder', 'Forecast Output'],
    cues: [
      'Strong for long-horizon time-series forecasting.',
      'Forget/input/output gates control retained memory.',
      'Sequence length and hidden units are major quality levers.',
    ],
  },
  gru: {
    family: 'Deep Learning',
    summary: 'Lightweight recurrent architecture for faster sequence modeling.',
    stages: ['Windowed Sequences', 'GRU Encoder', 'State Compression', 'Dense Decoder', 'Forecast Output'],
    cues: [
      'Usually trains faster than LSTM with similar accuracy.',
      'Suitable for real-time retraining scenarios.',
      'Use when you need sequence modeling under tighter latency.',
    ],
  },
  transformer: {
    family: 'Deep Learning',
    summary: 'Uses self-attention to learn global feature interactions.',
    stages: ['Feature Tokens + Positional Signal', 'Multi-Head Attention', 'Residual + LayerNorm', 'Feed-Forward Block', 'Regression Head'],
    cues: [
      'Excellent for high-dimensional interactions.',
      'Attention gives global context across all features.',
      'Typically benefits from larger data and regularization.',
    ],
  },
  linear_regression: {
    family: 'Linear',
    summary: 'Least-squares baseline that maps features directly to targets.',
    stages: ['Feature Matrix', 'Coefficient Solver', 'Linear Combination', 'Continuous Prediction'],
    cues: [
      'Use as the baseline for every dataset.',
      'Highly interpretable via learned coefficients.',
      'Best when relationship is close to linear.',
    ],
  },
  ridge: {
    family: 'Linear',
    summary: 'Linear regression with L2 regularization for stable coefficients.',
    stages: ['Scaled Features', 'Ridge Objective', 'Regularized Solver', 'Continuous Prediction'],
    cues: [
      'Handles multicollinearity better than plain linear regression.',
      'Shrinks coefficients without forcing many zeros.',
      'Useful for correlated feature sets.',
    ],
  },
  lasso: {
    family: 'Linear',
    summary: 'Linear regression with L1 penalty for sparse feature selection.',
    stages: ['Scaled Features', 'L1-Regularized Objective', 'Sparse Coefficient Learning', 'Continuous Prediction'],
    cues: [
      'Automatically zeros weak features.',
      'Great for high-dimensional feature spaces.',
      'Can be unstable with highly correlated strong predictors.',
    ],
  },
  elastic_net: {
    family: 'Linear',
    summary: 'Hybrid L1/L2 regularization balancing sparsity and stability.',
    stages: ['Scaled Features', 'ElasticNet Objective', 'Mixed Regularized Solver', 'Continuous Prediction'],
    cues: [
      'Safe compromise between Ridge and Lasso.',
      'Keeps correlated groups better than pure L1.',
      'Tune alpha and l1_ratio together.',
    ],
  },
  decision_tree: {
    family: 'Tree Ensemble',
    summary: 'Single interpretable tree built via recursive threshold splits.',
    stages: ['Split Candidate Scan', 'Recursive Branch Growth', 'Leaf Value Assignment', 'Path-Based Prediction'],
    cues: [
      'Very interpretable but can overfit without limits.',
      'Captures non-linear thresholds naturally.',
      'Good for model understanding and diagnostics.',
    ],
  },
  random_forest: {
    family: 'Tree Ensemble',
    summary: 'Bagged tree ensemble improving variance and generalization.',
    stages: ['Bootstrap Sampling', 'Parallel Tree Growth', 'Ensemble Averaging', 'Robust Prediction'],
    cues: [
      'Strong low-tuning baseline for tabular data.',
      'Resistant to noise and overfitting.',
      'Provides feature importance quickly.',
    ],
  },
  adaboost: {
    family: 'Tree Ensemble',
    summary: 'Sequential weak learners that focus on hard samples.',
    stages: ['Weighted Samples', 'Weak Learner Fit', 'Sample Reweighting', 'Weighted Ensemble Output'],
    cues: [
      'Useful on medium-size noisy datasets.',
      'Sensitive to outliers due to reweighting.',
      'Shallow trees keep model lightweight.',
    ],
  },
  gradient_boosting: {
    family: 'Tree Ensemble',
    summary: 'Stage-wise boosting that fits residual errors progressively.',
    stages: ['Initial Baseline', 'Residual Tree Fit', 'Shrinkage Update', 'Additive Ensemble Output'],
    cues: [
      'High-quality tabular regressor with tuning.',
      'Learning rate and depth control bias/variance.',
      'Usually slower than XGBoost/LightGBM.',
    ],
  },
  xgboost: {
    family: 'Tree Ensemble',
    summary: 'Regularized second-order gradient boosting for tabular performance.',
    stages: ['Histogram Binning', 'Gradient/Hessian Tree Build', 'Regularized Boost Update', 'Additive Ensemble Output'],
    cues: [
      'Common top performer for structured data.',
      'Balances speed, regularization, and accuracy.',
      'Tune depth, eta, and subsampling first.',
    ],
  },
  lightgbm: {
    family: 'Tree Ensemble',
    summary: 'Histogram boosting with fast leaf-wise split growth.',
    stages: ['Histogram Binning', 'Leaf-Wise Expansion', 'Sampling Optimizations', 'Additive Ensemble Output'],
    cues: [
      'Excellent speed on large datasets.',
      'Can overfit if leaf growth is unconstrained.',
      'Great fallback when XGBoost is slow.',
    ],
  },
  catboost: {
    family: 'Tree Ensemble',
    summary: 'Ordered boosting with native categorical feature support.',
    stages: ['Ordered Category Encoding', 'Symmetric Tree Builder', 'Ordered Boosting Update', 'Additive Ensemble Output'],
    cues: [
      'Very effective with categorical-heavy data.',
      'Ordered boosting reduces leakage risk.',
      'Often needs less preprocessing.',
    ],
  },
  svr: {
    family: 'Kernel',
    summary: 'Kernel regression inside an epsilon-insensitive margin tube.',
    stages: ['Feature Scaling', 'Kernel Mapping', 'Margin-Constrained Fit', 'Support Vector Prediction'],
    cues: [
      'Powerful on smaller nonlinear datasets.',
      'Training cost grows quickly with data size.',
      'Kernel/C/epsilon settings are critical.',
    ],
  },
  knn: {
    family: 'Instance',
    summary: 'Lazy learner predicting from nearest neighbors in feature space.',
    stages: ['Feature Scaling', 'Distance Search', 'k-Neighbor Aggregation', 'Local Prediction'],
    cues: [
      'Simple and effective in low dimensions.',
      'No training phase, heavier inference cost.',
      'Performance depends on k and metric choice.',
    ],
  },
};

const DEFAULT_BLUEPRINT: ModelBlueprint = {
  family: 'Linear',
  summary: 'General regression pipeline from processed features to target predictions.',
  stages: ['Input Features', 'Model Core', 'Prediction Output'],
  cues: [
    'Select a specific model to get architecture-specific stages.',
    'This blueprint updates instantly when model changes.',
    'Use it to validate feature-to-output flow before training.',
  ],
};

const STAGE_ACCENTS: AccentTone[] = ['blue', 'emerald', 'amber', 'purple', 'rose'];

function describeStageOperation(stage: string) {
  const lowered = stage.toLowerCase();
  if (lowered.includes('input') || lowered.includes('feature') || lowered.includes('sequence')) return 'op: data ingest';
  if (lowered.includes('conv') || lowered.includes('attention') || lowered.includes('encoder')) return 'op: representation learning';
  if (lowered.includes('pool') || lowered.includes('norm') || lowered.includes('compression')) return 'op: stabilization';
  if (lowered.includes('solver') || lowered.includes('objective') || lowered.includes('fit')) return 'op: parameter optimization';
  if (lowered.includes('output') || lowered.includes('prediction') || lowered.includes('head')) return 'op: regression output';
  return 'op: transformation';
}

function getModelLabel(modelType?: string) {
  if (!modelType) return 'Unselected';
  return MODEL_LABELS[modelType] || modelType.toUpperCase();
}

function isANNModel(modelType?: string) {
  return modelType === 'ann' || modelType === 'mlp';
}

function getBlueprint(modelType: string | undefined, featureCount: number, targetCount: number): ModelBlueprint {
  const base = (modelType && MODEL_BLUEPRINTS[modelType]) || DEFAULT_BLUEPRINT;
  const featureText = `${featureCount} ${featureCount === 1 ? 'feature' : 'features'}`;
  const targetText = `${targetCount} ${targetCount === 1 ? 'target' : 'targets'}`;
  const firstStage = 0;
  const lastStage = base.stages.length - 1;

  const stages = base.stages.map((stage, index) => {
    if (index === firstStage) return `${stage} (${featureText})`;
    if (index === lastStage) return `${stage} (${targetText})`;
    return stage;
  });

  return { ...base, stages };
}

function getFamilyIcon(family: ModelFamily) {
  switch (family) {
    case 'Deep Learning':
      return Brain;
    case 'Linear':
      return TrendingUp;
    case 'Tree Ensemble':
      return GitBranch;
    case 'Kernel':
      return Cpu;
    case 'Instance':
      return Database;
    default:
      return Network;
  }
}

export function ArchitectureDiagram({ modelType, features, targets, layers }: ArchitectureDiagramProps) {
  const maxVisibleNodes = 10;
  const visibleFeatures = features.slice(0, maxVisibleNodes);
  const visibleTargets = targets.slice(0, maxVisibleNodes);

  const selectedModelLabel = getModelLabel(modelType);

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
    const blueprint = getBlueprint(modelType, features.length, targets.length);
    const FamilyIcon = getFamilyIcon(blueprint.family);

    return (
      <div className="w-full h-full min-h-[500px] flex flex-col bg-zinc-50/30 rounded-3xl border border-zinc-100 p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg text-white">
              <FamilyIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tighter">Live Architecture Blueprint</h4>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{selectedModelLabel}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${FAMILY_BADGE_CLASS[blueprint.family]}`}>
            {blueprint.family}
          </div>
        </div>

        <p className="text-xs text-zinc-500 mb-6">{blueprint.summary}</p>

        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-5">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 overflow-x-auto">
            <div className="min-w-max flex items-stretch gap-3">
              {blueprint.stages.map((stage, idx) => (
                <React.Fragment key={`${stage}-${idx}`}>
                  <ArchitectureStageCard
                    stage={stage}
                    index={idx}
                    accent={STAGE_ACCENTS[idx % STAGE_ACCENTS.length]}
                    operation={describeStageOperation(stage)}
                  />
                  {idx < blueprint.stages.length - 1 && (
                    <div className="flex items-center justify-center text-zinc-300 px-0.5">
                      <ChevronArrow />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
            <h5 className="text-[11px] font-black uppercase tracking-widest text-zinc-700">Architecture Notes</h5>
            {blueprint.cues.map((cue, idx) => (
              <div key={cue} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-md bg-zinc-100 text-zinc-600 text-[9px] font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-600">{cue}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-100/50 flex items-center justify-between">
          <div className="flex gap-4">
            <Stat label="Inputs" value={features.length} />
            <Stat label={blueprint.family === 'Deep Learning' ? 'Blocks' : 'Stages'} value={blueprint.stages.length} />
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
  const renderedLayers: LayerConfig[] =
    layers.length > 0
      ? layers
      : [{ id: 'preview-hidden-layer', type: 'dense', units: 32, activation: 'relu' }];
  const nodeGap = 35;

  const getHiddenLayerWidth = (units?: number) => {
    const safeUnits = units ?? 1;
    if (safeUnits >= 128) return 60;
    if (safeUnits >= 64) return 50;
    return 40;
  };

  const getHiddenLayerHeight = (units?: number) => {
    const safeUnits = units ?? 1;
    return Math.min(300, Math.max(80, safeUnits * 2));
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

      {layers.length === 0 && (
        <div className="mb-4 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          No custom hidden layers configured yet; showing a default preview layer.
        </div>
      )}

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
          {renderedLayers.map((layer, idx) => (
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
                {idx < renderedLayers.length - 1 && (
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
                  <div className="text-[10px] font-black text-zinc-900">{renderedLayers.reduce((acc, l) => acc + (l.units || 0), 0)}</div>
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

function ArchitectureStageCard({
  stage,
  index,
  accent,
  operation,
}: {
  stage: string;
  index: number;
  accent: AccentTone;
  operation: string;
}) {
  const style = ACCENT_STYLES[accent];

  return (
    <div className={`w-[230px] rounded-2xl border p-4 flex flex-col gap-3 ${style.card}`}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Stage {index + 1}</span>
        <span className={`text-[9px] font-black uppercase tracking-wider border px-2 py-0.5 rounded-full ${style.chip}`}>{accent}</span>
      </div>
      <h5 className="text-sm font-black text-zinc-900">{stage}</h5>
      <p className={`text-[10px] font-black uppercase tracking-wide ${style.op}`}>{operation}</p>
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
