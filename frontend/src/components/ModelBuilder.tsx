import React, { useState, useMemo } from 'react';
import { LayerConfig, TrainingConfig } from '../types';
import { Plus, Trash2, Layers, Settings, Info, Database, ToggleLeft, ToggleRight, BarChart3, Cpu, ArrowRight, ChevronDown } from 'lucide-react';
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
  onStartTraining?: () => void;
}

const DL_MODEL_IDS = ['ann', 'mlp', 'lstm', 'gru', 'transformer'];
const DL_SHOWS_LAYERS = ['ann', 'mlp'];

export function ModelBuilder({ layers, onUpdateLayers, trainingConfig, onUpdateConfig, features, targets, dataCount, benchmarkMode = true, onBenchmarkModeChange, onStartTraining }: ModelBuilderProps) {
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

  const modelLabels: Record<string, string> = {
    ann: 'ANN', mlp: 'MLP', lstm: 'LSTM', gru: 'GRU', transformer: 'Transformer',
    xgboost: 'XGBoost', lightgbm: 'LightGBM', catboost: 'CatBoost',
    gradient_boosting: 'GradBoost', random_forest: 'RandomForest',
    decision_tree: 'DecisionTree', svr: 'SVR', knn: 'KNN',
    linear_regression: 'LinearReg', ridge: 'Ridge', lasso: 'Lasso', elastic_net: 'ElasticNet'
  };

  const architectureSummary = useMemo(() => {
    if (!selectedModel) return null;
    const inputCount = features.length;
    const outputCount = targets.length;
    
    if (['ann', 'mlp'].includes(selectedModel)) {
      const hiddenLayers = layers.length > 0 ? layers : [{ units: 32 }];
      const totalNeurons = hiddenLayers.reduce((sum, l) => sum + (l.units || 32), 0);
      return `${inputCount} inputs → ${hiddenLayers.length} hidden (${totalNeurons} neurons) → ${outputCount} outputs`;
    }
    return `${inputCount} inputs → ${modelLabels[selectedModel] || selectedModel} → ${outputCount} outputs`;
  }, [selectedModel, features.length, targets.length, layers]);

  return (
    <div className="space-y-4">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        
        {/* LEFT: Model Selection + Layers (2/5) */}
        <div className="lg:col-span-2 space-y-3">
          
          {/* Dataset Context */}
          <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-zinc-900">{dataCount.toLocaleString()} samples</h4>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-center">
                  <div className="text-sm font-black text-blue-600">{features.length}</div>
                  <div className="text-[7px] text-zinc-400 uppercase">In</div>
                </div>
                <div className="text-center border-l border-zinc-200 pl-3">
                  <div className="text-sm font-black text-rose-500">{targets.length}</div>
                  <div className="text-[7px] text-zinc-400 uppercase">Out</div>
                </div>
              </div>
            </div>
          </div>

          {/* Model Selector */}
          <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
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
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <h3 className="text-xs font-black">Layer Designer</h3>
                </div>
                <button onClick={addLayer} className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-700">
                  <Plus className="w-2.5 h-2.5" /> Add
                </button>
              </div>

              <div className="space-y-1.5">
                {layers.map((layer, index) => (
                  <div key={layer.id} className="flex items-center gap-2 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                    <div className="w-5 h-5 bg-blue-500 text-white rounded-lg flex items-center justify-center text-[9px] font-black">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[7px] font-black uppercase text-zinc-400 block">Neurons</label>
                        <input type="number" value={layer.units}
                          onChange={(e) => updateLayer(layer.id, { units: parseInt(e.target.value) || 1 })}
                          className="w-full bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-[10px] font-bold outline-none" />
                      </div>
                      <div>
                        <label className="text-[7px] font-black uppercase text-zinc-400 block">Act</label>
                        <select value={layer.activation}
                          onChange={(e) => updateLayer(layer.id, { activation: e.target.value as any })}
                          className="w-full bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-[10px] font-bold outline-none">
                          <option value="relu">ReLU</option>
                          <option value="tanh">Tanh</option>
                          <option value="sigmoid">Sigmoid</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={() => removeLayer(layer.id)} className="p-1 text-zinc-300 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {layers.length === 0 && (
                  <div className="py-3 text-center text-[9px] text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                    No layers — click Add
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DL info */}
          {isDLModel && !showLayerBuilder && (
            <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-[9px] text-blue-700">
                <span className="font-bold">{selectedModel.toUpperCase()}</span> uses pre-configured architecture
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Architecture + Training (3/5) */}
        <div className="lg:col-span-3 space-y-3">
          
          {/* Architecture Visual */}
          {hasSelectedModel ? (
            <ArchitectureDiagram
              modelType={selectedModel}
              features={features}
              targets={targets}
              layers={layers}
            />
          ) : (
            <div className="h-32 flex items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50">
              <div className="text-center">
                <Layers className="w-6 h-6 text-zinc-300 mx-auto mb-1" />
                <p className="text-xs font-bold text-zinc-400">Select a model</p>
              </div>
            </div>
          )}

          {/* Training Parameters */}
          <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-zinc-700" />
                <h4 className="text-xs font-black">Training Parameters</h4>
              </div>
              {isDLModel && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-bold rounded-full">DL</span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[8px] font-black uppercase text-zinc-400 block mb-0.5">Optimizer</label>
                <select value={trainingConfig.optimizer}
                  onChange={(e) => onUpdateConfig(prev => ({ ...prev, optimizer: e.target.value as any }))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none">
                  <option value="adam">Adam</option>
                  <option value="sgd">SGD</option>
                  <option value="rmsprop">RMSprop</option>
                  <option value="adamw">AdamW</option>
                </select>
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-zinc-400 block mb-0.5">Epochs</label>
                <input type="number" value={trainingConfig.epochs}
                  onChange={(e) => onUpdateConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none" />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-zinc-400 block mb-0.5">Batch</label>
                <select value={trainingConfig.batchSize}
                  onChange={(e) => onUpdateConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none">
                  {[16, 32, 64, 128, 256].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-zinc-400 block mb-0.5">Val</label>
                <select value={trainingConfig.validationSplit}
                  onChange={(e) => onUpdateConfig(prev => ({ ...prev, validationSplit: parseFloat(e.target.value) }))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none">
                  <option value="0.1">10%</option>
                  <option value="0.2">20%</option>
                  <option value="0.3">30%</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <div className={cn(
                  "w-8 h-4 rounded-full border flex items-center transition-all",
                  trainingConfig.earlyStopping ? "bg-blue-600 border-blue-600 justify-end" : "bg-zinc-100 border-zinc-200 justify-start"
                )}>
                  <div className="w-3 h-3 rounded-full bg-white shadow-sm mx-0.5" />
                </div>
                <input type="checkbox" className="sr-only" checked={!!trainingConfig.earlyStopping}
                  onChange={(e) => onUpdateConfig(prev => ({ ...prev, earlyStopping: e.target.checked }))} />
                <span className="text-[10px] font-bold text-zinc-700">Early Stop</span>
              </label>
              
              <div className={cn(
                "px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1",
                benchmarkMode ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
              )}>
                <BarChart3 className="w-3 h-3" />
                {benchmarkMode ? 'All Models' : 'Single'}
                <button onClick={() => onBenchmarkModeChange?.(!benchmarkMode)} className="ml-0.5 p-0.5 hover:bg-emerald-200 rounded">
                  <ToggleRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compile & Train Button with Architecture Summary */}
      <div className="flex items-center justify-between gap-4 p-4 bg-zinc-900 rounded-2xl">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-blue-400" />
          {hasSelectedModel ? (
            <div className="flex items-center gap-2 text-white">
              <span className="text-[10px] font-black uppercase text-zinc-400">Architecture:</span>
              <span className="text-sm font-bold">{architectureSummary}</span>
            </div>
          ) : (
            <span className="text-sm text-zinc-400">Select a model to train</span>
          )}
        </div>
        <button 
          onClick={() => {
            if (!hasSelectedModel) {
              alert('Please select a model first.');
              return;
            }
            onStartTraining?.();
          }}
          className="px-8 py-3 bg-white text-zinc-900 font-black text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-100 transition-all shadow-lg flex items-center gap-2"
        >
          Compile & Train
          <Cpu className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
