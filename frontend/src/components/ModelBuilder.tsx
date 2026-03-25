import React, { useState, useMemo } from 'react';
import { LayerConfig, TrainingConfig } from '../types';
import { Plus, Trash2, Layers, Settings, Info, Database, ToggleLeft, ToggleRight, BarChart3, Cpu, ArrowRight, CheckCircle, Star, BookOpen } from 'lucide-react';
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
  onParamChange?: (modelId: string, paramId: string, value: number | string) => void;
}

const DL_MODEL_IDS = ['ann', 'mlp', 'cnn', 'lstm', 'gru', 'transformer'];
const DL_SHOWS_LAYERS = ['ann', 'mlp'];

export function ModelBuilder({ layers, onUpdateLayers, trainingConfig, onUpdateConfig, features, targets, dataCount, benchmarkMode = true, onBenchmarkModeChange, onStartTraining, onParamChange }: ModelBuilderProps) {
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
      return `${inputCount} inputs → ${hiddenLayers.length} hidden (${totalNeurons} neurons) → ${outputCount} outputs`;
    }
    return `${inputCount} inputs → ${selectedModel.toUpperCase()} → ${outputCount} outputs`;
  }, [selectedModel, features.length, targets.length, layers]);

  const modelRecommendations = useMemo(() => {
    const recs = [];
    const n = dataCount;
    const f = features.length;
    
    if (n >= 1000) {
      recs.push({ model: 'xgboost', reason: 'Best for large datasets' });
      recs.push({ model: 'ann', reason: 'Deep learning ideal for big data' });
    }
    if (n >= 10000) {
      recs.push({ model: 'lightgbm', reason: 'Lightning fast on large data' });
    }
    if (n < 500 || f < 5) {
      recs.push({ model: 'linear_regression', reason: 'Simple data, interpretable' });
      recs.push({ model: 'decision_tree', reason: 'Small dataset, easy to visualize' });
    }
    if (n >= 200 && n < 50000) {
      recs.push({ model: 'random_forest', reason: 'Reliable baseline for medium data' });
    }
    recs.push({ model: 'ridge', reason: 'Works well with many features' });
    
    return recs.slice(0, 4);
  }, [dataCount, features.length]);

  return (
    <div className="space-y-4">
      {/* Dataset Context Bar */}
      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-black text-zinc-900">{dataCount.toLocaleString()} samples</div>
              <div className="text-[9px] text-zinc-500">{features.length} features · {targets.length} target{targets.length > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
            <span className="text-[10px] font-bold text-blue-600">{features.length} features</span>
          </div>
          <div className="px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg">
            <span className="text-[10px] font-bold text-rose-600">{targets.length} targets</span>
          </div>
        </div>
      </div>

      {/* Training Hub Guide */}
      <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-blue-900 mb-2">Training Hub Guide</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>1. Choose Model:</strong> Select a model from the left panel</p>
              <p><strong>2. Configure:</strong> Set hyperparameters for your model (optional)</p>
              <p><strong>3. Train:</strong> Watch live metrics for Train and Validation splits</p>
              <p><strong>4. Evaluate:</strong> After training, check Verification tab for Test metrics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Models (if model not selected) */}
      {!hasSelectedModel && modelRecommendations.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="text-xs font-black text-amber-800">Suggested Models</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {modelRecommendations.map(rec => (
              <button
                key={rec.model}
                onClick={() => handleModelSelect(rec.model)}
                className="p-2 bg-white border border-amber-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all text-left"
              >
                <div className="text-xs font-bold text-amber-900">{rec.model.replace('_', ' ').toUpperCase()}</div>
                <div className="text-[9px] text-amber-600 mt-0.5">{rec.reason}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        
        {/* LEFT: Model Selection (2/5) */}
        <div className="lg:col-span-2 space-y-3">
          
          {/* Model Selector */}
          <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
            <ModelSelector
              selectedModelId={selectedModel}
              onSelect={handleModelSelect}
              features={features.length}
              samples={dataCount}
              targets={targets.length}
              onParamChange={onParamChange}
            />
          </div>
        </div>

        {/* RIGHT: Layer Design + Architecture + Training (3/5) */}
        <div className="lg:col-span-3 space-y-3">
          
          {/* Layer Designer (for MLP/ANN) - ABOVE Architecture */}
          {showLayerBuilder && hasSelectedModel && (
            <div className="p-4 bg-white rounded-xl border-2 border-blue-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Layers className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black">Layer Designer</h3>
                    <p className="text-[9px] text-zinc-500">Customize hidden layers</p>
                  </div>
                </div>
                <button onClick={addLayer} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-700">
                  <Plus className="w-3 h-3" /> Add Layer
                </button>
              </div>

              <div className="space-y-2">
                {/* Input Layer */}
                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center text-[9px] font-black">
                    In
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-blue-700">Input Layer</span>
                    <span className="text-[9px] text-blue-500 ml-2">{features.length} features</span>
                  </div>
                </div>

                {/* Hidden Layers */}
                {layers.map((layer, index) => (
                  <div key={layer.id} className="flex items-center gap-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center text-[9px] font-black">
                      H{index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] font-black uppercase text-zinc-400 block">Neurons</label>
                        <input type="number" value={layer.units}
                          onChange={(e) => updateLayer(layer.id, { units: parseInt(e.target.value) || 1 })}
                          className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-bold outline-none focus:border-blue-400" />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-zinc-400 block">Activation</label>
                        <select value={layer.activation}
                          onChange={(e) => updateLayer(layer.id, { activation: e.target.value as any })}
                          className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-bold outline-none focus:border-blue-400">
                          <option value="relu">ReLU</option>
                          <option value="tanh">Tanh</option>
                          <option value="sigmoid">Sigmoid</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={() => removeLayer(layer.id)} className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {layers.length === 0 && (
                  <button onClick={addLayer} className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-lg text-xs text-zinc-400 hover:border-blue-300 hover:text-blue-500 transition-all">
                    + Add Hidden Layer
                  </button>
                )}

                {/* Output Layer */}
                <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-100 rounded-lg">
                  <div className="w-6 h-6 bg-rose-500 text-white rounded-lg flex items-center justify-center text-[9px] font-black">
                    Out
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-rose-700">Output Layer</span>
                    <span className="text-[9px] text-rose-500 ml-2">{targets.length} target{targets.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Architecture Visual */}
          {hasSelectedModel ? (
            <ArchitectureDiagram
              modelType={selectedModel}
              features={features}
              targets={targets}
              layers={layers}
            />
          ) : (
            <div className="h-48 flex items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50">
              <div className="text-center">
                <Layers className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-zinc-400">Select a model to see architecture</p>
              </div>
            </div>
          )}

          {/* Training Parameters - ONLY SHOW AFTER MODEL SELECTION */}
          {hasSelectedModel && (
            <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    isDLModel ? "bg-blue-100" : "bg-emerald-100"
                  )}>
                    <Settings className={cn("w-4 h-4", isDLModel ? "text-blue-600" : "text-emerald-600")} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black">Training Parameters</h4>
                    <p className="text-[9px] text-zinc-500">Configure {selectedModel.toUpperCase()} training</p>
                  </div>
                </div>
                {isDLModel && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 text-[9px] font-bold rounded-full">Deep Learning</span>
                )}
                {!isDLModel && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-[9px] font-bold rounded-full">
                    {DL_MODEL_IDS.includes(selectedModel) ? 'DL' : 'ML'}
                  </span>
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
                  <label className="text-[8px] font-black uppercase text-zinc-400 block mb-0.5">LR</label>
                  <input type="number" step="0.001" value={trainingConfig.learningRate}
                    onChange={(e) => onUpdateConfig(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <div className={cn(
                    "w-8 h-4 rounded-full border flex items-center transition-all cursor-pointer",
                    trainingConfig.earlyStopping ? "bg-blue-600 border-blue-600 justify-end" : "bg-zinc-100 border-zinc-200 justify-start"
                  )}>
                    <div className="w-3 h-3 rounded-full bg-white shadow-sm mx-0.5" />
                  </div>
                  <input type="checkbox" className="sr-only" checked={!!trainingConfig.earlyStopping}
                    onChange={(e) => onUpdateConfig(prev => ({ ...prev, earlyStopping: e.target.checked }))} />
                  <span className="text-[10px] font-bold text-zinc-700">Early Stopping</span>
                </label>
                
                <div className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2",
                  benchmarkMode ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                )}>
                  <BarChart3 className="w-3.5 h-3.5" />
                  {benchmarkMode ? 'Benchmark All' : 'Single Model'}
                  <button onClick={() => onBenchmarkModeChange?.(!benchmarkMode)} className="ml-0.5 p-0.5 hover:bg-emerald-200 rounded">
                    <ToggleRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compile & Train Button with Architecture Summary */}
      <div className="flex items-center justify-between gap-4 p-4 bg-zinc-900 rounded-2xl">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-blue-400" />
          {hasSelectedModel ? (
            <div className="flex items-center gap-3 text-white">
              <div className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-black",
                isDLModel ? "bg-blue-500" : "bg-emerald-500"
              )}>
                {selectedModel.toUpperCase()}
              </div>
              <span className="text-sm font-bold">{architectureSummary}</span>
            </div>
          ) : (
            <span className="text-sm text-zinc-400">Select a model to begin training</span>
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
          disabled={!hasSelectedModel}
          className={cn(
            "px-8 py-3 font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2",
            hasSelectedModel
              ? "bg-white text-zinc-900 hover:bg-zinc-100"
              : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
          )}
        >
          Compile & Train
          <Cpu className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
