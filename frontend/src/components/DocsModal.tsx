import React, { useState } from 'react';
import { BookOpen, X, ChevronRight, Layers, Database, Cpu, BarChart3, Brain, GitBranch, Zap, Shield, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DocSection = 'overview' | 'algorithms' | 'xai' | 'workflow' | 'split' | 'hyperparams' | 'best-practices';

const ALGORITHM_INFO = {
  boosting: {
    title: 'Boosting Ensemble Methods',
    icon: GitBranch,
    color: 'blue',
    description: 'Sequential learners that correct previous errors. Industry-standard for tabular data.',
    models: [
      { 
        name: 'XGBoost', 
        desc: 'Extreme Gradient Boosting with L1/L2 regularization. Best for structured data competitions. Handles missing values natively.',
        useCase: 'Large datasets, Kaggle competitions, production tabular data',
        tips: ['Start with depth=6, eta=0.3', 'Enable scale_pos_weight for imbalanced data', 'Use dart booster for better generalization']
      },
      { 
        name: 'LightGBM', 
        desc: 'Leaf-wise tree growth with histogram-based splitting. Fastest training on large datasets.',
        useCase: 'Very large datasets (>1M rows), real-time applications',
        tips: ['Use num_leaves to control complexity', 'Enable bagging for stability', 'Try categorical_feature for native handling']
      },
      { 
        name: 'CatBoost', 
        desc: 'Ordered boosting with symmetric trees. Native categorical support without encoding.',
        useCase: 'Datasets with many categorical features, reduced preprocessing needs',
        tips: ['Best for categoricals with high cardinality', 'Ordered boosting reduces overfitting', 'No need for one-hot encoding']
      },
      { 
        name: 'Gradient Boosting', 
        desc: 'Scikit-learn implementation. Slower but reliable for smaller datasets.',
        useCase: 'Smaller datasets, when needing sklearn ecosystem integration',
        tips: ['Subsample for regularization', 'Start with default parameters', 'Combine with Random Forest for diversity']
      }
    ]
  },
  trees: {
    title: 'Tree-Based Models',
    icon: Layers,
    color: 'emerald',
    description: 'Decision trees that split data based on feature thresholds. Easy to interpret.',
    models: [
      { 
        name: 'Decision Tree', 
        desc: 'Single tree using recursive binary splitting. Fastest training, prone to overfitting.',
        useCase: 'Quick baseline, feature importance exploration, as weak learner in ensembles',
        tips: ['Limit depth to prevent overfitting', 'Use min_samples_leaf for regularization', 'Check for systematic bias']
      },
      { 
        name: 'Random Forest', 
        desc: 'Ensemble of 100-500 decision trees with bootstrap sampling and feature randomness.',
        useCase: 'Robust baseline for most tabular problems, outlier detection',
        tips: ['100-300 trees usually sufficient', 'Feature importance is reliable', 'Handles missing values with surrogate splits']
      }
    ]
  },
  linear: {
    title: 'Linear Models',
    icon: BarChart3,
    color: 'indigo',
    description: 'Linear relationships between features and target. Fast, interpretable baselines.',
    models: [
      { 
        name: 'Linear Regression', 
        desc: 'Basic OLS fitting. Assumes linear relationship. Fastest training.',
        useCase: 'Small datasets, baseline comparison, when linearity assumption holds',
        tips: ['Check residual plots', 'Remove multicollinearity', 'Standardize features for interpretation']
      },
      { 
        name: 'Ridge Regression', 
        desc: 'L2 regularization shrinks coefficients toward zero. Handles multicollinearity.',
        useCase: 'Many correlated features, prevent overfitting with many predictors',
        tips: ['Alpha hyperparameter controls regularization strength', 'Coefficients remain non-zero', 'Scale features before fitting']
      },
      { 
        name: 'Lasso Regression', 
        desc: 'L1 regularization can zero out coefficients. Automatic feature selection.',
        useCase: 'High-dimensional data, feature selection, sparse solutions',
        tips: ['Use for interpretable sparse models', 'Tune alpha carefully', 'ElasticNet combines L1+L2 benefits']
      },
      { 
        name: 'ElasticNet', 
        desc: 'Combines L1 and L2 regularization. Balances feature selection and stability.',
        useCase: 'High correlation + high dimensionality, group feature selection',
        tips: ['l1_ratio controls L1/L2 mix', 'Good for genomics, text data', 'Prefer when Lasso/Ridge both help']
      }
    ]
  },
  dl: {
    title: 'Deep Learning Models',
    icon: Brain,
    color: 'purple',
    description: 'Neural networks for learning complex non-linear patterns. Needs more data.',
    models: [
      { 
        name: 'ANN / MLP', 
        desc: 'Fully connected feedforward network. Universal approximator for any continuous function.',
        useCase: 'Non-linear relationships, when other models underperform, feature combinations',
        tips: ['Start with 1-2 hidden layers', 'Units: between input and output count', 'Use ReLU activation', 'Add dropout for regularization']
      },
      { 
        name: 'CNN', 
        desc: '1-D Convolutional Neural Network. Learns local patterns from ordered feature data.', 
        useCase: 'Tabular data with sequential/local patterns, 1D signal processing', 
        tips: ['Good for ordered feature columns', 'Use pooling for downsampling', 'Kernel size controls receptive field'] 
      },
      { 
        name: 'LSTM',
        desc: 'Long Short-Term Memory. Gated memory cells capture long-range temporal dependencies.',
        useCase: 'Long sequences, time-series forecasting, sequential patterns',
        tips: ['Use for sequences > 50 timesteps', 'Bidirectional for non-casual tasks', 'Consider GRU for faster training']
      },
      { 
        name: 'GRU', 
        desc: 'Gated Recurrent Unit. Simplified LSTM with 2 gates instead of 3. Faster training.',
        useCase: 'Real-time sequences, when LSTM is too slow, similar accuracy',
        tips: ['Good for < 100 timestep sequences', 'Reset gate controls short-term memory', 'Often preferred for embedded/real-time']
      },
      { 
        name: 'Transformer', 
        desc: 'Self-attention mechanism. Parallel processing, captures global dependencies.',
        useCase: 'High-dimensional interactions, long sequences, state-of-art performance',
        tips: ['Needs more data than RNNs', 'Positional encoding required', 'Good for feature-rich data']
      }
    ]
  },
  other: {
    title: 'Other Models',
    icon: Cpu,
    color: 'amber',
    description: 'Specialized algorithms for specific use cases.',
    models: [
      { 
        name: 'SVR', 
        desc: 'Support Vector Regression. Kernel-based method finding epsilon-insensitive tube.',
        useCase: 'Small-medium datasets, non-linear with RBF kernel, outlier-robust',
        tips: ['Scale features is critical', 'C and epsilon need tuning', 'RBF kernel most common']
      },
      { 
        name: 'KNN', 
        desc: 'K-Nearest Neighbors. Lazy learning from k closest training samples.',
        useCase: 'Quick prototype, nonlinear data, when interpretability of distance matters',
        tips: ['Choose k by cross-validation', 'Scale features before fitting', 'Slow inference on large datasets']
      }
    ]
  }
};

const XAI_INFO = [
  {
    title: 'SHAP (SHapley Additive exPlanations)',
    desc: 'Game theory-based method calculating marginal contribution of each feature to predictions.',
    color: 'blue',
    benefits: ['Theoretically grounded', 'Local accuracy guaranteed', 'Global + Local views', 'Handles missingness'],
    when: 'When you need mathematically rigorous explanations, global feature importance, or comparing models'
  },
  {
    title: 'LIME (Local Interpretable Model-agnostic)',
    desc: 'Approximates model locally with interpretable model by perturbing input around point of interest.',
    color: 'emerald',
    benefits: ['Model-agnostic', 'Human-interpretable', 'Works on any model', 'Individual predictions'],
    when: 'When explaining single predictions, regulatory compliance, or model debugging'
  },
  {
    title: 'Sensitivity Analysis',
    desc: 'Examines how predictions change when varying individual features while holding others constant.',
    color: 'purple',
    benefits: ['Intuitive visualization', 'Detects non-linearity', 'No model assumption', 'Domain expert friendly'],
    when: 'Quick feature behavior understanding, identifying thresholds, interaction detection'
  },
  {
    title: 'Feature Importance',
    desc: 'Native importance scores from tree-based models (Gini/MDI, gain-based).',
    color: 'amber',
    benefits: ['Fast computation', 'No extra library', 'Tree-specific accuracy', 'Baseline comparison'],
    when: 'Quick feature ranking, feature selection, understanding model behavior'
  },
  {
    title: 'Correlation Matrix',
    desc: 'Pearson correlation coefficients between all numerical features.',
    color: 'rose',
    benefits: ['Multicollinearity detection', 'Feature engineering hints', 'Heatmap visualization', 'Quick insights'],
    when: 'Data exploration, feature selection, detecting redundant features'
  },
  {
    title: 'Residual Analysis',
    desc: 'Plots residuals (actual - predicted) to diagnose model fit and detect patterns.',
    color: 'indigo',
    benefits: ['Model diagnostic', 'Outlier detection', 'Homoscedasticity check', 'Improvement guidance'],
    when: 'Checking model assumptions, finding systematic errors, identifying outliers'
  }
];

export function DocsModal({ isOpen, onClose }: DocsModalProps) {
  const [activeSection, setActiveSection] = useState<DocSection>('overview');
  const [expandedAlgorithm, setExpandedAlgorithm] = useState<string | null>('boosting');

  if (!isOpen) return null;

  const sections = [
    { id: 'overview' as DocSection, label: 'Overview', icon: BookOpen },
    { id: 'workflow' as DocSection, label: 'Workflow', icon: Database },
    { id: 'split' as DocSection, label: 'Data Split', icon: BarChart3 },
    { id: 'hyperparams' as DocSection, label: 'Hyperparams', icon: Cpu },
    { id: 'algorithms' as DocSection, label: 'Algorithms', icon: Layers },
    { id: 'xai' as DocSection, label: 'XAI Techniques', icon: Brain },
    { id: 'best-practices' as DocSection, label: 'Best Practices', icon: Shield },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500 text-white',
    emerald: 'bg-emerald-500 text-white',
    indigo: 'bg-indigo-500 text-white',
    purple: 'bg-purple-500 text-white',
    amber: 'bg-amber-500 text-white',
    rose: 'bg-rose-500 text-white'
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-zinc-900 to-zinc-800 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black">DL-Studio Documentation</h2>
              <p className="text-xs text-zinc-400">Complete guide to algorithms, use cases, and best practices</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          
          {/* Sidebar */}
          <div className="w-56 border-r border-zinc-100 p-4 overflow-y-auto">
            <nav className="space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left",
                    activeSection === section.id 
                      ? "bg-zinc-900 text-white" 
                      : "text-zinc-600 hover:bg-zinc-100"
                  )}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <h3 className="font-bold text-blue-900 mb-2">What is DL-Studio?</h3>
                  <p className="text-sm text-blue-800">DL-Studio is a local-first, privacy-focused platform for building, training, and comparing machine learning and deep learning models. All data stays on your machine.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-zinc-200 rounded-xl">
                    <h4 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-500" /> Traditional ML
                    </h4>
                    <p className="text-xs text-zinc-600">XGBoost, LightGBM, CatBoost, Random Forest, Decision Tree, SVM, KNN, Linear Models</p>
                  </div>
                  <div className="p-4 border border-zinc-200 rounded-xl">
                    <h4 className="font-bold text-zinc-900 mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500" /> Deep Learning
                    </h4>
                    <p className="text-xs text-zinc-600">ANN/MLP, CNN, LSTM, GRU, Transformer with customizable architectures</p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <h4 className="font-bold text-zinc-900 mb-2">Key Features</h4>
                  <ul className="text-xs text-zinc-600 space-y-1">
                    <li>• Auto-benchmarking of 16+ models per training</li>
                    <li>• Built-in XAI (SHAP, LIME, Sensitivity Analysis)</li>
                    <li>• 80/10/10 train/val/test split with metrics per split</li>
                    <li>• Research Plots tab for publication-quality visualizations</li>
                    <li>• Configurable hyperparameters for all models</li>
                    <li>• Run Explorer for browsing and comparing past experiments</li>
                    <li>• Export reports and plots as high-quality PNG</li>
                  </ul>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Architecture', desc: 'Select & configure models' },
                    { label: 'Training Hub', desc: 'Monitor progress' },
                    { label: 'Verification', desc: 'Test predictions' },
                    { label: 'Benchmark', desc: 'Compare all models' },
                    { label: 'Intelligence', desc: 'XAI explanations' },
                    { label: 'Research Plots', desc: 'Paper-quality charts' },
                  ].map(tab => (
                    <div key={tab.label} className="p-3 bg-white border border-zinc-200 rounded-xl text-center">
                      <div className="font-bold text-zinc-900 text-sm">{tab.label}</div>
                      <div className="text-[10px] text-zinc-500">{tab.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'algorithms' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-5 h-5 text-zinc-500" />
                  <h3 className="font-bold text-lg">Algorithm Guide</h3>
                </div>

                {Object.entries(ALGORITHM_INFO).map(([key, category]) => (
                  <div key={key} className="border border-zinc-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedAlgorithm(expandedAlgorithm === key ? null : key)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 text-left transition-colors",
                        expandedAlgorithm === key ? "bg-zinc-50" : "hover:bg-zinc-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", colorMap[category.color])}>
                          <category.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-900">{category.title}</h4>
                          <p className="text-xs text-zinc-500">{category.description}</p>
                        </div>
                      </div>
                      <ChevronRight className={cn("w-5 h-5 text-zinc-400 transition-transform", expandedAlgorithm === key && "rotate-90")} />
                    </button>

                    {expandedAlgorithm === key && (
                      <div className="border-t border-zinc-100 p-4 space-y-4 bg-zinc-50/50">
                        {category.models.map((model, idx) => (
                          <div key={idx} className="p-4 bg-white border border-zinc-100 rounded-xl">
                            <h5 className="font-bold text-zinc-900 mb-2">{model.name}</h5>
                            <p className="text-xs text-zinc-600 mb-3">{model.desc}</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Best For</span>
                                <p className="text-xs text-zinc-700 mt-1">{model.useCase}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Tips</span>
                                <ul className="text-xs text-zinc-700 mt-1 space-y-0.5">
                                  {model.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'xai' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-zinc-500" />
                  <h3 className="font-bold text-lg">Explainable AI Techniques</h3>
                </div>

                {XAI_INFO.map((technique, idx) => (
                  <div key={idx} className="p-4 border border-zinc-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", colorMap[technique.color])}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900">{technique.title}</h4>
                        <p className="text-xs text-zinc-500">{technique.when}</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-700 mb-3">{technique.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {technique.benefits.map((benefit, i) => (
                        <span key={i} className="px-2 py-1 bg-zinc-100 rounded-lg text-[10px] font-bold text-zinc-600">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'workflow' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-zinc-500" />
                  <h3 className="font-bold text-lg">End-to-End Workflow</h3>
                </div>

                {[
                  { step: '1', title: 'Upload & Analyze', desc: 'Upload CSV/Excel. Mark columns as feature, target, or ignore. Auto-detects types.' },
                  { step: '2', title: 'Refine', desc: 'Handle missing values, outliers. Start conservative - iterate after checking metrics.' },
                  { step: '3', title: 'Select & Train', desc: 'Choose model in Architecture tab. Click ⚙️ to configure hyperparameters. Train with live monitoring.' },
                  { step: '4', title: 'Compare', desc: 'Auto-benchmarks all models on 80/10/10 split. Review R², MAE, MSE for each split.' },
                  { step: '5', title: 'Explain', desc: 'Generate SHAP/LIME explanations. Analyze residuals and correlations.' },
                  { step: '6', title: 'Research Plots', desc: 'Generate publication-quality charts for your paper or report.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 border border-zinc-200 rounded-xl">
                    <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">{item.title}</h4>
                      <p className="text-sm text-zinc-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'split' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-zinc-500" />
                  <h3 className="font-bold text-lg">80/10/10 Data Split Strategy</h3>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-sm text-blue-800">DL-Studio automatically splits your data into 80% training, 10% validation, and 10% test sets. This ensures robust model evaluation and prevents overfitting.</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-center">
                    <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-lg">80%</div>
                    <h4 className="font-bold text-zinc-900">Training</h4>
                    <p className="text-xs text-zinc-500 mt-1">Model learns patterns from this data</p>
                  </div>
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-center">
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-lg">10%</div>
                    <h4 className="font-bold text-zinc-900">Validation</h4>
                    <p className="text-xs text-zinc-500 mt-1">Hyperparameter tuning & early stopping</p>
                  </div>
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-center">
                    <div className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-lg">10%</div>
                    <h4 className="font-bold text-zinc-900">Test</h4>
                    <p className="text-xs text-zinc-500 mt-1">Final unbiased evaluation</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <h4 className="font-bold text-amber-900 mb-2">Benchmark Metrics by Split</h4>
                  <p className="text-xs text-amber-800">The Benchmark tab shows R², MAE, and MSE for all three splits. Compare train vs test metrics to detect:</p>
                  <ul className="text-xs text-amber-800 mt-2 space-y-1">
                    <li>• <strong>Overfitting:</strong> High train R², low test R²</li>
                    <li>• <strong>Underfitting:</strong> Low R² across all splits</li>
                    <li>• <strong>Good fit:</strong> Test R² within 5% of validation R²</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'hyperparams' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-5 h-5 text-zinc-500" />
                  <h3 className="font-bold text-lg">Configurable Hyperparameters</h3>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-sm text-blue-800">Click the ⚙️ icon next to any model in the Architecture tab to configure its hyperparameters.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'XGBoost / LightGBM', color: 'bg-blue-500', params: ['Trees: 50-500', 'Max Depth: 3-12', 'Learning Rate: 0.01-0.3', 'Subsample: 0.5-1.0'] },
                    { name: 'CatBoost', color: 'bg-emerald-500', params: ['Iterations: 50-500', 'Depth: 4-10', 'Learning Rate: 0.01-0.3'] },
                    { name: 'Random Forest', color: 'bg-emerald-600', params: ['Trees: 50-300', 'Max Depth: 5-30', 'Min Samples Split: 2-20'] },
                    { name: 'ANN / MLP', color: 'bg-purple-500', params: ['Hidden Layers: 1-5', 'Neurons: 8-512', 'Activation: ReLU/Tanh', 'Dropout: 0-0.5'] },
                    { name: 'CNN (1D)', color: 'bg-purple-600', params: ['Filters: 16-128', 'Kernel Size: 2-8', 'Conv Layers: 1-4', 'Pool Size: 2-4'] },
                    { name: 'LSTM / GRU', color: 'bg-purple-700', params: ['Units: 32-256', 'Layers: 1-3', 'Bidirectional (LSTM)'] },
                    { name: 'Transformer', color: 'bg-amber-500', params: ['Attention Heads: 1-8', 'Layers: 1-4', 'FFN Dimension: 64-512'] },
                    { name: 'SVR', color: 'bg-rose-500', params: ['Kernel: RBF/Linear/Poly', 'C: 0.1-10', 'Epsilon: 0.01-1'] },
                    { name: 'Linear Models', color: 'bg-indigo-500', params: ['Alpha (Ridge/Lasso): 0.001-10', 'L1 Ratio (ElasticNet): 0-1'] },
                  ].map((model, idx) => (
                    <div key={idx} className="p-4 border border-zinc-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn("w-3 h-3 rounded-full", model.color)} />
                        <h4 className="font-bold text-zinc-900">{model.name}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {model.params.map((param, i) => (
                          <span key={i} className="px-2 py-1 bg-zinc-100 rounded-lg text-[10px] font-medium text-zinc-600">{param}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'best-practices' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-zinc-500" />
                  <h3 className="font-bold text-lg">Best Practices</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <h4 className="font-bold text-emerald-900 mb-2">Do</h4>
                    <ul className="text-xs text-emerald-800 space-y-1">
                      <li>• Start simple: Linear/Tree baseline first</li>
                      <li>• Benchmark mode ON for model comparison</li>
                      <li>• Check test metrics in Benchmark tab</li>
                      <li>• Check residuals for patterns</li>
                      <li>• Use correlation matrix for feature selection</li>
                      <li>• Compare multiple runs</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                      <h4 className="font-bold text-red-900 mb-2">Don&apos;t</h4>
                      <ul className="text-xs text-red-800 space-y-1">
                        <li>• Deep learning with &lt;1K samples</li>
                        <li>• Ignore test metrics (trust val only)</li>
                        <li>• Trust single metric (R² only)</li>
                        <li>• Skip data exploration</li>
                        <li>• Overfit on first run</li>
                        <li>• Use test data for tuning</li>
                      </ul>
                  </div>
                </div>

                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <h4 className="font-bold text-amber-900 mb-2">When to Use Deep Learning</h4>
                    <p className="text-xs text-amber-800">Deep learning shines when: 1) Large datasets (&gt;50K samples), 2) Complex non-linear patterns, 3) Sequential/structured data (LSTM), 4) High-dimensional features (Transformer). For most tabular data, boosting methods (XGBoost/LightGBM) outperform neural networks.</p>
                  </div>

                <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                  <h4 className="font-bold text-purple-900 mb-2">Interpreting Split Metrics</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs text-purple-800">
                    <div>
                      <strong>Train R&#178; &gt;&gt; Test R&#178;:</strong> Overfitting - model memorized training data
                    </div>
                    <div>
                      <strong>All R&#178; values low:</strong> Underfitting - model too simple
                    </div>
                    <div>
                      <strong>Test &#8776; Val R&#178;:</strong> Good generalization
                    </div>
                    <div>
                      <strong>Test R&#178; &lt; Val by &gt;5%:</strong> Possible data shift or overfitting
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <h4 className="font-bold text-blue-900 mb-2">Dataset Size Guide</h4>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center p-2 bg-white rounded-lg">
                      <div className="font-bold text-zinc-900">&lt; 1K</div>
                      <div className="text-zinc-500">Linear, Tree, SVR</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <div className="font-bold text-zinc-900">1K - 100K</div>
                      <div className="text-zinc-500">XGBoost, RF, MLP</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <div className="font-bold text-zinc-900">&gt; 100K</div>
                      <div className="text-zinc-500">LightGBM, DL</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <p className="text-xs text-zinc-500">DL-Studio v2.0 - Local-First ML Platform</p>
          <div className="flex items-center gap-3">
            <a href="https://purushothaman-natarajan.github.io" target="_blank" rel="noreferrer" className="text-xs font-bold text-purple-600 hover:underline">
              My Profile →
            </a>
            <a href="./docs.html" target="_blank" className="text-xs font-bold text-blue-600 hover:underline">
              Open Full Documentation →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
