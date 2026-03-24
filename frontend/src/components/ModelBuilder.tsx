import React, { useState } from 'react';
import { LayerConfig, TrainingConfig } from '../types';
import { Plus, Trash2, Layers, Settings, Info, HelpCircle, Database, Zap, ChevronDown } from 'lucide-react';
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
}

const DL_MODEL_IDS = ['ann', 'mlp', 'cnn', 'lstm', 'gru', 'transformer'];
const DL_SHOWS_LAYERS = ['ann', 'mlp']; // ANN/MLP uses the layer builder UI

export function ModelBuilder({ layers, onUpdateLayers, trainingConfig, onUpdateConfig, features, targets, dataCount }: ModelBuilderProps) {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Left Column: Model Selector + Settings */}
      <div className="lg:col-span-5 space-y-6">

        {/* Dataset Context Card */}
        <div className="p-5 bg-white rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-50 rounded-xl"><Database className="w-4 h-4 text-zinc-700" /></div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tighter">Live Dataset Context</h4>
                <p className="text-[9px] font-bold text-zinc-400 uppercase">{dataCount.toLocaleString()} Samples</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <div className="text-sm font-black text-blue-600">{features.length}</div>
                <div className="text-[9px] font-bold text-zinc-400 uppercase">Features</div>
              </div>
              <div className="text-right border-l border-zinc-100 pl-6">
                <div className="text-sm font-black text-rose-500">{targets.length}</div>
                <div className="text-[9px] font-bold text-zinc-400 uppercase">Targets</div>
              </div>
            </div>
          </div>
        </div>

        {/* Model Selector */}
        <div className="p-6 bg-white rounded-3xl border border-zinc-100 shadow-sm">
          <ModelSelector
            selectedModelId={selectedModel}
            onSelect={handleModelSelect}
            features={features.length}
            samples={dataCount}
            targets={targets.length}
          />
        </div>

        {/* MLP Layer Builder (only shown for MLP) */}
        {showLayerBuilder && (
          <div className="p-6 bg-white rounded-3xl border border-zinc-100 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  Layer Designer
                </h3>
                <p className="text-[10px] font-bold text-zinc-400">Customize MLP hidden layers</p>
              </div>
              <button onClick={addLayer} className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs font-bold">
                <Plus className="w-3.5 h-3.5" /> Add Layer
              </button>
            </div>

            <div className="space-y-3">
              {layers.map((layer, index) => (
                <div key={layer.id} className="flex flex-col gap-3 p-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 hover:border-blue-100 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black">{index + 1}</div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Hidden Layer {index + 1}</span>
                    </div>
                    <button onClick={() => removeLayer(layer.id)} className="p-1 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-zinc-400">Neurons</label>
                      <input type="number" value={layer.units}
                        onChange={(e) => updateLayer(layer.id, { units: parseInt(e.target.value) || 1 })}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-zinc-400">Activation</label>
                      <select value={layer.activation}
                        onChange={(e) => updateLayer(layer.id, { activation: e.target.value as any })}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
                        <option value="relu">ReLU</option>
                        <option value="tanh">Tanh</option>
                        <option value="sigmoid">Sigmoid</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {layers.length === 0 && (
                <div className="py-8 text-center text-[10px] text-zinc-300 border-2 border-dashed border-zinc-100 rounded-2xl">
                  No hidden layers — click Add Layer to build your network
                </div>
              )}
            </div>
          </div>
        )}

        {/* Non-MLP DL hint */}
        {isDLModel && !showLayerBuilder && (
          <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl animate-in fade-in duration-300">
            <div className="flex items-start gap-2 text-zinc-500">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                <span className="font-bold text-zinc-900">{selectedModel.toUpperCase()}</span> uses a pre-configured architecture optimized for its use case. 
                The layer designer is only available for MLP. Training parameters below still apply.
              </p>
            </div>
          </div>
        )}

        {/* Training Config */}
        <div className="p-6 bg-white rounded-3xl border border-zinc-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-zinc-900" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Training Parameters</h4>
            {isDLModel && <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">DL Only</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-400">Optimizer</label>
              <select value={trainingConfig.optimizer}
                onChange={(e) => onUpdateConfig(prev => ({ ...prev, optimizer: e.target.value as any }))}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-zinc-200">
                <option value="adam">Adam (Recommended)</option>
                <option value="sgd">SGD (Momentum)</option>
                <option value="rmsprop">RMSprop</option>
                <option value="adamw">AdamW</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-400">Epochs</label>
              <input type="number" value={trainingConfig.epochs}
                onChange={(e) => onUpdateConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-400">Batch Size</label>
              <select value={trainingConfig.batchSize}
                onChange={(e) => onUpdateConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                {[16, 32, 64, 128, 256].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-400">Val Split</label>
              <select value={trainingConfig.validationSplit}
                onChange={(e) => onUpdateConfig(prev => ({ ...prev, validationSplit: parseFloat(e.target.value) }))}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-xs font-bold outline-none">
                <option value="0.1">10%</option>
                <option value="0.2">20% (Default)</option>
                <option value="0.3">30%</option>
              </select>
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <ChevronDown className={cn("w-3 h-3 transition-transform", showAdvanced && "rotate-180")} />
            Advanced Options
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-zinc-50 animate-in fade-in duration-200">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={cn("w-9 h-5 rounded-full border-2 flex items-center transition-all px-0.5",
                  trainingConfig.earlyStopping ? "bg-blue-600 border-blue-600 justify-end" : "bg-zinc-100 border-zinc-200 justify-start"
                )}>
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-700">Early Stopping</span>
                  <p className="text-[9px] text-zinc-400">Stops training if val_loss doesn't improve for {trainingConfig.patience ?? 10} epochs</p>
                </div>
                <input type="checkbox" className="sr-only" checked={!!trainingConfig.earlyStopping}
                  onChange={(e) => onUpdateConfig(prev => ({ ...prev, earlyStopping: e.target.checked }))} />
              </label>
            </div>
          )}
        </div>

        {/* Quick Help */}
        <div className="p-5 bg-zinc-900 rounded-3xl text-white space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Architecture Tip</h4>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {isDLModel
              ? `For your ${features.length}-feature dataset, ${dataCount < 1000 ? 'consider a traditional model first — deep learning typically needs 1K+ samples.' : 'a deep model can learn complex patterns. Start simple and add depth incrementally.'}`
              : `Your ${features.length} features and ${dataCount.toLocaleString()} samples are ideal for traditional ML. Run the benchmark to compare all models automatically.`
            }
          </p>
        </div>
      </div>

      {/* Right Column: Visual Diagram */}
      <div className="lg:col-span-7 space-y-6">
        {hasSelectedModel ? (
          <ArchitectureDiagram
            modelType={selectedModel}
            features={features}
            targets={targets}
            layers={layers}
          />
        ) : (
          <div className="w-full min-h-[500px] flex items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-10">
            <div className="max-w-md text-center space-y-3">
              <div className="text-sm font-black uppercase tracking-widest text-zinc-400">Architecture Blueprint</div>
              <h4 className="text-2xl font-black text-zinc-900">Choose a model to generate the diagram</h4>
              <p className="text-sm text-zinc-500">
                Select any model on the left panel. The architecture view updates instantly based on your choice.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 border border-zinc-100 rounded-2xl bg-zinc-50/50 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-3 h-3 text-zinc-400" />
              <span className="text-[9px] font-black uppercase text-zinc-500">Input Processing</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">All features are automatically scaled via <span className="font-bold text-zinc-900">StandardScaler</span> before entering any model.</p>
          </div>
          <div className="p-5 border border-zinc-100 rounded-2xl bg-zinc-50/50 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-zinc-400" />
              <span className="text-[9px] font-black uppercase text-zinc-500">Benchmark Mode</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">
              Every training run benchmarks <span className="font-bold text-zinc-900">all traditional models</span>;
              your selected architecture is treated as the primary deep model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
