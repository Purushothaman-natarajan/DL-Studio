import React from 'react';
import * as tf from '@tensorflow/tfjs';
import { Cpu, Layers, Hash, Activity } from 'lucide-react';

interface ModelSummaryProps {
  model: tf.LayersModel | null;
}

export function ModelSummary({ model }: ModelSummaryProps) {
  if (!model) return null;

  const totalParams = model.countParams();
  const layers = model.layers;

  return (
    <div className="space-y-6 pt-12 border-t border-zinc-200 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Cpu className="w-6 h-6 text-blue-500" />
          Model Architecture Summary
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg border border-zinc-200">
            <Hash className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-bold text-zinc-900">{totalParams.toLocaleString()} Total Parameters</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg border border-zinc-200">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-bold text-zinc-900">{layers.length} Layers</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {layers.map((layer, idx) => (
          <div key={layer.name + idx} className="p-4 border border-zinc-200 rounded-xl bg-white shadow-sm hover:border-zinc-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Layer #{idx + 1}</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">{layer.getClassName()}</span>
            </div>
            <div className="text-sm font-bold text-zinc-900 mb-1 truncate">{layer.name}</div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-50">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 uppercase font-bold">Parameters</span>
                <span className="text-xs font-mono font-bold text-zinc-900">{layer.countParams().toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-zinc-400 uppercase font-bold">Trainable</span>
                <span className={`text-[10px] font-bold ${layer.trainable ? 'text-green-600' : 'text-amber-600'}`}>
                  {layer.trainable ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
        <Activity className="w-5 h-5 text-blue-500 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-blue-900">Architecture Insight</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            This model consists of {layers.length} layers with a total of {totalParams.toLocaleString()} parameters. 
            The complexity of your model determines its learning capacity. More parameters allow for learning more complex patterns but increase the risk of overfitting.
          </p>
        </div>
      </div>
    </div>
  );
}
