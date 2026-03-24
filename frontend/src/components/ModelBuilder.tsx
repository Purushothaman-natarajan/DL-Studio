import React from 'react';
import { LayerConfig, TrainingConfig } from '../types';
import { Plus, Trash2, Layers, ChevronRight, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface ModelBuilderProps {
  layers: LayerConfig[];
  onUpdateLayers: (layers: LayerConfig[]) => void;
  trainingConfig: TrainingConfig;
  onUpdateConfig: (config: TrainingConfig | ((prev: TrainingConfig) => TrainingConfig)) => void;
}

export function ModelBuilder({ layers, onUpdateLayers, trainingConfig, onUpdateConfig }: ModelBuilderProps) {
  const addLayer = () => {
    const newLayer: LayerConfig = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'dense',
      units: 32,
      activation: 'relu'
    };
    onUpdateLayers([...layers, newLayer]);
  };

  const removeLayer = (id: string) => {
    onUpdateLayers(layers.filter(l => l.id !== id));
  };

  const updateLayer = (id: string, updates: Partial<LayerConfig>) => {
    onUpdateLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Architecture
        </h3>
        <button onClick={addLayer} className="btn-secondary py-1.5 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Layer
        </button>
      </div>

      <div className="space-y-4 relative">
        {/* Input Representation */}
        <div className="flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center shrink-0 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-zinc-400 group-hover:scale-150 transition-transform" />
          </div>
          <div className="flex-1 p-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 group-hover:border-zinc-300 transition-colors">
            <span className="label-micro">Input Layer</span>
            <p className="text-sm text-zinc-600 font-medium">Features from dataset</p>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-300" />
        </div>

        {/* Connection Line */}
        <div className="absolute left-6 top-12 bottom-12 w-0.5 bg-zinc-100 -z-10" />

        {layers.map((layer, index) => (
          <div key={layer.id} className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center shrink-0 shadow-sm relative">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse-soft" />
              {/* Layer Number Badge */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-white border border-blue-100 rounded-full flex items-center justify-center text-[8px] font-bold text-blue-500 shadow-sm">
                {index + 1}
              </div>
            </div>
            
            <div className="flex-1 p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm hover:border-blue-200 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <span className="label-micro text-blue-500">
                  {layer.type} Layer
                </span>
                <button 
                  onClick={() => removeLayer(layer.id)}
                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label-micro">Units</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={layer.units}
                      onChange={(e) => updateLayer(layer.id, { units: parseInt(e.target.value) })}
                      className="input-field pr-8 font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">PX</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="label-micro">Activation</label>
                  <select
                    value={layer.activation}
                    onChange={(e) => updateLayer(layer.id, { activation: e.target.value as any })}
                    className="input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23a3a3a3%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                  >
                    <option value="relu">ReLU</option>
                    <option value="sigmoid">Sigmoid</option>
                    <option value="tanh">Tanh</option>
                    <option value="softmax">Softmax</option>
                  </select>
                </div>
              </div>
            </div>
            
            <ChevronRight className="w-5 h-5 text-zinc-300" />
          </div>
        ))}

        {/* Output Representation */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center shrink-0 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
          <div className="flex-1 p-4 rounded-2xl border border-zinc-900 bg-zinc-900 text-white shadow-xl">
            <span className="label-micro opacity-50">Output Layer</span>
            <p className="text-sm font-medium">Predictions</p>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-zinc-200 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Hyperparameters
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Optimizer</label>
            <select 
              value={trainingConfig.optimizer} 
              onChange={(e) => onUpdateConfig(prev => ({ ...prev, optimizer: e.target.value as any }))}
              className="w-full p-2 text-sm border border-zinc-200 rounded bg-zinc-50"
            >
              <option value="adam">Adam</option>
              <option value="sgd">SGD</option>
              <option value="rmsprop">RMSprop</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Loss Function</label>
            <select 
              value={trainingConfig.loss} 
              onChange={(e) => onUpdateConfig(prev => ({ ...prev, loss: e.target.value as any }))}
              className="w-full p-2 text-sm border border-zinc-200 rounded bg-zinc-50"
            >
              <option value="meanSquaredError">Mean Squared Error</option>
              <option value="categoricalCrossentropy">Categorical Crossentropy</option>
              <option value="binaryCrossentropy">Binary Crossentropy</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Epochs</label>
            <input 
              type="number" 
              value={trainingConfig.epochs} 
              onChange={(e) => onUpdateConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
              className="w-full p-2 text-sm border border-zinc-200 rounded bg-zinc-50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Batch Size</label>
            <input 
              type="number" 
              value={trainingConfig.batchSize} 
              onChange={(e) => onUpdateConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
              className="w-full p-2 text-sm border border-zinc-200 rounded bg-zinc-50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Validation Split</label>
            <input 
              type="number" 
              step="0.05"
              min="0.05"
              max="0.5"
              value={trainingConfig.validationSplit} 
              onChange={(e) => onUpdateConfig(prev => ({ ...prev, validationSplit: parseFloat(e.target.value) }))}
              className="w-full p-2 text-sm border border-zinc-200 rounded bg-zinc-50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Learning Rate</label>
            <input 
              type="number" 
              step="0.001"
              min="0.0001"
              max="0.1"
              value={trainingConfig.learningRate} 
              onChange={(e) => onUpdateConfig(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
              className="w-full p-2 text-sm border border-zinc-200 rounded bg-zinc-50"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100">
          <div className="space-y-0.5">
            <div className="text-xs font-bold">Early Stopping</div>
            <div className="text-[10px] text-zinc-500">Stop if loss stops improving</div>
          </div>
          <input 
            type="checkbox" 
            checked={trainingConfig.earlyStopping}
            onChange={(e) => onUpdateConfig(prev => ({ ...prev, earlyStopping: e.target.checked }))}
            className="w-4 h-4 accent-zinc-900"
          />
        </div>

        <div className="space-y-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold">Cloud Checkpoints</div>
              <div className="text-[10px] text-zinc-500">Save model to backend</div>
            </div>
            <input 
              type="checkbox" 
              checked={trainingConfig.saveBestOnly}
              onChange={(e) => onUpdateConfig(prev => ({ ...prev, saveBestOnly: e.target.checked }))}
              className="w-4 h-4 accent-zinc-900"
            />
          </div>
          {trainingConfig.saveBestOnly && (
            <div className="space-y-1 pt-2 border-t border-zinc-200">
              <label className="text-[10px] font-bold uppercase text-zinc-400">Save Best Only</label>
              <p className="text-[10px] text-zinc-500">Only the model with the lowest validation loss will be kept.</p>
            </div>
          )}
          {!trainingConfig.saveBestOnly && (
            <div className="space-y-1 pt-2 border-t border-zinc-200">
              <label className="text-[10px] font-bold uppercase text-zinc-400">Checkpoint Interval (Epochs)</label>
              <input 
                type="number" 
                min="1"
                value={trainingConfig.checkpointInterval} 
                onChange={(e) => onUpdateConfig(prev => ({ ...prev, checkpointInterval: parseInt(e.target.value) }))}
                className="w-full p-1.5 text-xs border border-zinc-200 rounded bg-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
