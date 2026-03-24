import React from 'react';
import { LayerConfig, TrainingConfig } from '../types';
import { Plus, Trash2, Layers, ChevronRight, Settings, Info, HelpCircle, Database, Layout, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { ArchitectureDiagram } from './ArchitectureDiagram';

interface ModelBuilderProps {
  layers: LayerConfig[];
  onUpdateLayers: (layers: LayerConfig[]) => void;
  trainingConfig: TrainingConfig;
  onUpdateConfig: (config: TrainingConfig | ((prev: TrainingConfig) => TrainingConfig)) => void;
  features: string[];
  targets: string[];
  dataCount: number;
}

export function ModelBuilder({ layers, onUpdateLayers, trainingConfig, onUpdateConfig, features, targets, dataCount }: ModelBuilderProps) {
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Settings Column */}
      <div className="lg:col-span-5 space-y-8">
        <div className="p-8 bg-white rounded-3xl border border-zinc-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-xl font-black flex items-center gap-2">
                        <Layout className="w-5 h-5 text-blue-500" />
                        Design Suite
                    </h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Assemble your neural network</p>
                </div>
                <button onClick={addLayer} className="btn-secondary py-2 px-4 flex items-center gap-2 text-xs font-bold">
                    <Plus className="w-4 h-4" />
                    New Layer
                </button>
            </div>

            <div className="space-y-4 relative">
                {layers.map((layer, index) => (
                <div key={layer.id} className="flex flex-col gap-4 p-5 rounded-2xl border border-zinc-100 bg-zinc-50/50 hover:bg-white hover:border-blue-100 hover:shadow-lg transition-all animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs font-black">
                                {index + 1}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                {layer.type} Layer
                            </span>
                        </div>
                        <button 
                            onClick={() => removeLayer(layer.id)}
                            className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-zinc-400">Neurons (Units)</label>
                            <input
                                type="number"
                                value={layer.units}
                                onChange={(e) => updateLayer(layer.id, { units: parseInt(e.target.value) || 1 })}
                                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-zinc-400">Activation</label>
                            <select
                                value={layer.activation}
                                onChange={(e) => updateLayer(layer.id, { activation: e.target.value as any })}
                                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            >
                                <option value="relu">ReLU</option>
                                <option value="sigmoid">Sigmoid</option>
                                <option value="tanh">Tanh</option>
                                <option value="softmax">Softmax</option>
                            </select>
                        </div>
                    </div>
                </div>
                ))}
            </div>

            <div className="pt-8 border-t border-zinc-100 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-zinc-900" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Training Logic (Compile)</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-zinc-400">Optimizer</label>
                        <select 
                            value={trainingConfig.optimizer} 
                            onChange={(e) => onUpdateConfig(prev => ({ ...prev, optimizer: e.target.value as any }))}
                            className="w-full bg-zinc-100 border-none rounded-xl px-4 py-2 text-xs font-bold"
                        >
                            <option value="adam">Adam (Default)</option>
                            <option value="sgd">SGD</option>
                            <option value="rmsprop">RMSprop</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-zinc-400">Epochs</label>
                        <input 
                            type="number" 
                            value={trainingConfig.epochs} 
                            onChange={(e) => onUpdateConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
                            className="w-full bg-zinc-100 border-none rounded-xl px-4 py-2 text-xs font-bold font-mono"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Help Panel */}
        <div className="p-6 bg-zinc-900 rounded-3xl text-white space-y-4">
            <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Architecture Tip</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
                For regression with your <span className="text-blue-400 font-bold">{features.length} features</span>, starting with <span className="text-white font-bold">ReLU</span> activation in hidden layers and linear units in the output is standard. Increase neurons for high complexity.
            </p>
        </div>
      </div>

      {/* Visual Workspace Column */}
      <div className="lg:col-span-7 space-y-6">
        {/* Dataset Insights */}
        <div className="p-6 bg-white rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-50 rounded-2xl text-zinc-900">
                    <Database className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-black uppercase tracking-tighter">Live Dataset Context</h4>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">{dataCount.toLocaleString()} Samples Detected</p>
                </div>
            </div>
            <div className="flex gap-8">
                <div className="text-right">
                    <div className="text-xs font-black">{features.length}</div>
                    <div className="text-[9px] font-bold text-zinc-400 uppercase">Features</div>
                </div>
                <div className="text-right border-l border-zinc-100 pl-8">
                    <div className="text-xs font-black text-rose-500">{targets.length}</div>
                    <div className="text-[9px] font-bold text-zinc-400 uppercase">Targets</div>
                </div>
            </div>
        </div>

        {/* The Diagram */}
        <ArchitectureDiagram 
            features={features} 
            targets={targets} 
            layers={layers} 
        />

        {/* Legend / Info */}
        <div className="grid grid-cols-2 gap-4">
            <div className="p-5 border border-zinc-100 rounded-2xl bg-zinc-50/50 space-y-2">
                <div className="flex items-center gap-2">
                    <Info className="w-3 h-3 text-zinc-400" />
                    <span className="text-[9px] font-black uppercase text-zinc-500">Input Processing</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium">Native numeric features are automatically scaled via <span className="font-bold text-zinc-900 underline decoration-zinc-200">StandardScaler</span> before entering the network.</p>
            </div>
            <div className="p-5 border border-zinc-100 rounded-2xl bg-zinc-50/50 space-y-2">
                <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-zinc-400" />
                    <span className="text-[9px] font-black uppercase text-zinc-500">Output Nature</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium">Multiple targets use a <span className="font-bold text-zinc-900">Parallel Output Head</span> to preserve multi-dimensional relationships.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
