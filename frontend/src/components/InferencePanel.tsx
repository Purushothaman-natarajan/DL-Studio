import React, { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { DataColumn } from '../types';
import { PlayCircle, Terminal } from 'lucide-react';

interface InferencePanelProps {
  model: any | null; 
  features: { name: string }[];
  targets: { name: string }[];
  runId?: string;
}

import { API_URL } from '../lib/api-utils';

export function InferencePanel({ model, features, targets, runId }: InferencePanelProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [prediction, setPrediction] = useState<number[] | null>(null);

  const handlePredict = async () => {
    if (runId) {
      try {
        const response = await fetch(`${API_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            run_id: runId,
            inputs: Object.keys(inputs).reduce((acc, k) => ({ ...acc, [k]: parseFloat(inputs[k]) }), {})
          })
        });
        if (response.ok) {
          const res = await response.json();
          setPrediction(res.prediction);
        }
      } catch (err) {
        console.error("Inference failed:", err);
      }
      return;
    }

    if (!model) return;
    // Legacy TFJS path if needed
    const inputValues = features.map(f => parseFloat(inputs[f.name]) || 0);
    const inputTensor = tf.tensor2d([inputValues]);
    const outputTensor = model.predict(inputTensor) as tf.Tensor;
    const result = await outputTensor.data();
    setPrediction(Array.from(result));
    inputTensor.dispose();
    outputTensor.dispose();
  };

  if (!model) return null;

  return (
    <div className="space-y-6 pt-6 border-t border-zinc-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          Test Model
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="label-micro">Input Features</div>
          <div className="space-y-6">
            {features.map(f => (
              <div key={f.name} className="space-y-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-all">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700">{f.name}</label>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {parseFloat(inputs[f.name]) || 0}
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="0.1"
                  value={inputs[f.name] || 0}
                  onChange={(e) => setInputs(prev => ({ ...prev, [f.name]: e.target.value }))}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                />
                <div className="flex justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                  <span>Min</span>
                  <span>Max</span>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={handlePredict}
            className="w-full btn-primary flex items-center justify-center gap-3 py-4 shadow-lg shadow-zinc-100 group"
          >
            <PlayCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Run Inference
          </button>
        </div>

        <div className="space-y-6">
          <div className="label-micro">Predictions</div>
          <div className="p-8 bg-zinc-900 rounded-3xl text-white min-h-[300px] flex flex-col justify-center items-center text-center shadow-2xl shadow-zinc-200 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
            
            {prediction ? (
              <div className="space-y-8 w-full relative z-10">
                {targets.map((t, i) => {
                  const val = prediction[i];
                  const percentage = Math.min(Math.max(val * 100, 0), 100);
                  
                  return (
                    <div key={t.name} className="space-y-4">
                      <div className="label-micro opacity-50 text-white">{t.name}</div>
                      <div className="text-5xl font-mono font-bold text-blue-400 tabular-nums">
                        {val.toFixed(4)}
                      </div>
                      
                      {/* Visual Gauge */}
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase tracking-widest">
                        <span>0.0</span>
                        <span>1.0</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-zinc-500 space-y-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                  <Terminal className="w-8 h-8 opacity-20" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white/80">Awaiting Input</p>
                  <p className="text-xs text-white/40 max-w-[200px] mx-auto">Adjust the feature sliders and run inference to see model results.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
