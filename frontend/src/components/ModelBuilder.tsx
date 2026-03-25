import React, { useState, useMemo } from 'react';
import { LayerConfig, TrainingConfig } from '../types';
import { Plus, Trash2, Layers, Settings, Info, HelpCircle, Database, Zap, ChevronDown, ToggleLeft, ToggleRight, BarChart3, Cpu, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { ModelSelector } from './ModelSelector';

interface ModelBuilderProps {
  layers: LayerConfig[];
  onUpdateLayers: (layers: LayerConfig[]) => void;
  trainingConfig: TrainingConfig;
  onUpdateConfig: (config: TrainingConfig | ((prev: TrainingConfig) => TrainingConfig)) => void;
  features: string[];
  targets: string[];
  dataCount: number;
  benchmarkMode?: boolean;
  onBenchmarkModeChange?: (value: boolean) => void;
}

const DL_MODEL_IDS = ['ann', 'mlp', 'cnn', 'lstm', 'gru', 'transformer'];
const DL_SHOWS_LAYERS = ['ann', 'mlp'];

export function ModelBuilder({ layers, onUpdateLayers, trainingConfig, onUpdateConfig, features, targets, dataCount, benchmarkMode = true, onBenchmarkModeChange }: ModelBuilderProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const selectedModel = trainingConfig.modelType || '';
  const hasSelectedModel = selectedModel.length > 0;
  const isDLModel = DL_MODEL_IDS.includes(selectedModel);
  const showLayerBuilder = DL_SHOWS_LAYERS.includes(selectedModel);

  const addLayer = () => {
    const newLayer: LayerConfig = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'dense', units: 64, activation: 'relu'
    };
    onUpdateLayers([...layers, newLayer]);
  };

  const removeLayer = (id: string) => onUpdateLayers(layers.filter(l => l.id !== id));
  const updateLayer = (id: string, updates: Partial<LayerConfig>) =>
    onUpdateLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));

  const handleModelSelect = (id: string) => {
    onUpdateConfig(prev => ({ ...prev, modelType: id }));
  };

  const architectureSummary = useMemo(() => {
    if (!selectedModel) return null;
    
    const inputCount = features.length;
    const outputCount = targets.length;
    
    if (['ann', 'mlp'].includes(selectedModel)) {
      const hiddenLayers = layers.length > 0 ? layers : [{ units: 32 }];
      const totalNeurons = hiddenLayers.reduce((sum, l) => sum + (l.units || 32), 0);
      return {
        parts: [
          { label: `${inputCount} inputs`, color: 'blue' },
          { label: `${hiddenLayers.length} hidden`, color: 'emerald' },
          { label: `${totalNeurons} neurons`, color: 'indigo' },
          { label: `${outputCount} outputs`, color: 'rose' }
        ],
        text: `${inputCount} inputs → ${hiddenLayers.length} hidden layer${hiddenLayers.length > 1 ? 's' : ''} (${hiddenLayers.map(l => l.units || 32).join(' + ')} neurons) → ${outputCount} output${outputCount > 1 ? 's' : ''}`
      };
    }
    
    const modelLabels: Record<string, string> = {
      cnn: 'CNN (Conv1D)',
      lstm: 'LSTM',
      gru: 'GRU',
      transformer: 'Transformer',
      xgboost: 'XGBoost',
      lightgbm: 'LightGBM',
      catboost: 'CatBoost',
      gradient_boosting: 'Gradient Boost',
      random_forest: 'Random Forest',
      decision_tree: 'Decision Tree',
      svr: 'SVR',
      knn: 'KNN',
      linear_regression: 'Linear Reg',
      ridge: 'Ridge',
      lasso: 'Lasso',
      elastic_net: 'ElasticNet'
    };
    
    return {
      parts: [
        { label: `${inputCount} inputs`, color: 'blue' },
        { label: modelLabels[selectedModel] || selectedModel, color: 'emerald' },
        { label: `${outputCount} outputs`, color: 'rose' }
      ],
      text: `${inputCount} inputs → ${modelLabels[selectedModel] || selectedModel} → ${outputCount} output${outputCount > 1 ? 's' : ''}`
    };
  }, [selectedModel, features.length, targets.length, layers]);

  return (
    <div className="space-y-6">
      
      {/* Architecture Summary Banner */}
      {hasSelectedModel && architectureSummary && (
        <div className="p-4 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl text-white">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Architecture</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {architectureSummary.parts.map((part, idx) => (
              <React.Fragment key={idx}>
                <span className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold",
                  part.color === 'blue' && "bg-blue-500/30 text-blue-300",
                  part.color === 'emerald' && "bg-emerald-500/30 text-emerald-300",
                  part.color === 'indigo' && "bg-indigo-500/30 text-indigo-300",
                  part.color === 'rose' && "bg-rose-500/30 text-rose-300"
                )}>
                  {part.label}
                </span>
                {idx < architectureSummary.parts.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-zinc-500" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* LEFT: Model Selection + Layers */}
        <div className="space-y-4">
          
          {/* Dataset Context */}
          <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Database className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-900">Dataset</h4>
                  <p className="text-[9px] text-zinc-500">{dataCount.toLocaleString()} samples</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-lg font-black text-blue-600">{features.length}</div>
                  <div className="text-[8px] text-zinc-400 uppercase">Features</div>
                </div>
                <div className="text-center border-l border-zinc-200 pl-4">
                  <div className="text-lg font-black text-rose-500">{targets.length}</div>
                  <div className="text-[8px] text-zinc-400 uppercase">Targets</div>
                </div>
              </div>
            </div>
          </div>

          {/* Model Selector */}
          <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <ModelSelector
              selectedModelId={selectedModel}
              onSelect={handleModelSelect}
              features={features.length}
              samples={dataCount}
              targets={targets.length}
            />
          </div>

          {/* Layer Designer (for MLP/ANN) */}
          {showLayerBuilder && (
            <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-black">Layer Designer</h3>
                </div>
                <button onClick={addLayer} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-colors">
                  <Plus className="w-3 h-3" /> Add Layer
                </button>
              </div>

              <div className="space-y-2">
                {layers.map((layer, index) => (
                  <div key={layer.id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="w-7 h-7 bg-blue-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Neurons</label>
                        <input type="number" value={layer.units}
                          onChange={(e) => updateLayer(layer.id, { units: parseInt(e.target.value) || 1 })}
                          className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100" />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Activation</label>
                        <select value={layer.activation}
                          onChange={(e) => updateLayer(layer.id, { activation: e.target.value as any })}
                          className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100">
                          <option value="relu">ReLU</option>
                          <option value="tanh">Tanh</option>
                          <option value="sigmoid">Sigmoid</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={() => removeLayer(layer.id)} className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {layers.length === 0 && (
                  <div className="py-6 text-center text-[10px] text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl">
                    No hidden layers configured
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Non-MLP DL info */}
          {isDLModel && !showLayerBuilder && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-start gap-2 text-blue-700">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-[10px]">
                  <span className="font-bold">{selectedModel.toUpperCase()}</span> uses pre-configured architecture. Layer designer available for MLP/ANN only.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT: Architecture Visual + Training Settings */}
        <div className="space-y-4">
          
          {/* Architecture Visual */}
          {hasSelectedModel ? (
            <ArchitectureDiagram
              modelType={selectedModel}
              features={features}
              targets={targets}
              layers={layers}
            />
          ) : (
            <div className="h-64 flex items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50">
              <div className="text-center">
                <Layers className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-zinc-400">Select a model to view architecture</p>
              </div>
            </div>
          )}

          {/* Training Parameters */}
          <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-zinc-700" />
                <h4 className="text-sm font-black">Training Parameters</h4>
              </div>
              {isDLModel && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold rounded-full">DL Only</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase text-zinc-400 block mb-1">Optimizer</label>
                <select value={trainingConfig.optimizer}
                  onChange={(e) => onUpdateConfig(prev => ({ ...prev, optimizer: e.target.value as any }))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="adam">Adam</option>
                  <option value="sgd">SGD</option>
                  <option value="rmsprop">RMSprop</option>
                  <option value="adamw">AdamW</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-zinc-400 block mb-1">Epochs</label>
                <input type="number" value={trainingConfig.epochs}
                  onChange={(e) => onUpdateConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-zinc-200" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-zinc-400 block mb-1">Batch Size</label>
                <select value={trainingConfig.batchSize}
                  onChange={(e) => onUpdateConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                  {[16, 32, 64, 128, 256].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-zinc-400 block mb-1">Val Split</label>
                <select value={trainingConfig.validationSplit}
                  onChange={(e) => onUpdateConfig(prev => ({ ...prev, validationSplit: parseFloat(e.target.value) }))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                  <option value="0.1">10%</option>
                  <option value="0.2">20%</option>
                  <option value="0.3">30%</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={cn(
                  "w-10 h-5 rounded-full border-2 flex items-center transition-all px-0.5",
                  trainingConfig.earlyStopping ? "bg-blue-600 border-blue-600 justify-end" : "bg-zinc-100 border-zinc-200 justify-start"
                )}>
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                </div>
                <input type="checkbox" className="sr-only" checked={!!trainingConfig.earlyStopping}
                  onChange={(e) => onUpdateConfig(prev => ({ ...prev, earlyStopping: e.target.checked }))} />
                <span className="text-xs font-bold text-zinc-700">Early Stopping</span>
              </label>
              
              <div className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5",
                benchmarkMode ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
              )}>
                <BarChart3 className="w-3 h-3" />
                {benchmarkMode ? 'All Models' : 'Single'}
                <button
                  onClick={() => onBenchmarkModeChange?.(!benchmarkMode)}
                  className="ml-1 p-0.5 hover:bg-emerald-200 rounded transition-colors"
                >
                  <ToggleRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
