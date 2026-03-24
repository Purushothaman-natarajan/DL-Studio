import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { DataColumn } from '../types';
import { PlayCircle, Terminal, Shuffle, Copy, Check } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load random test datapoint on mount or when "Shuffle" is clicked
  const loadRandomDatapoint = async () => {
    if (!runId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/runs/${runId}/random-datapoint`);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          const datapoint = result.datapoint;
          const newInputs: Record<string, string> = {};
          features.forEach(f => {
            newInputs[f.name] = String(datapoint[f.name] ?? 0);
          });
          setInputs(newInputs);
          setPrediction(null); // Clear previous prediction
        } else {
          console.error("Failed to load datapoint:", result.message);
        }
      }
    } catch (err) {
      console.error("Failed to load random datapoint:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (runId) {
      loadRandomDatapoint();
    }
  }, [runId]);

  const handlePredict = async () => {
    if (runId) {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            run_id: runId,
            inputs: Object.keys(inputs).reduce((acc, k) => ({ ...acc, [k]: parseFloat(inputs[k]) || 0 }), {})
          })
        });
        if (response.ok) {
          const res = await response.json();
          if (res.status === 'success') {
            setPrediction(res.prediction);
          } else {
            console.error("Inference error:", res.message);
          }
        }
      } catch (err) {
        console.error("Inference failed:", err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!model) return;
    // Legacy TFJS path if needed
    setIsLoading(true);
    try {
      const inputValues = features.map(f => parseFloat(inputs[f.name]) || 0);
      const inputTensor = tf.tensor2d([inputValues]);
      const outputTensor = model.predict(inputTensor) as tf.Tensor;
      const result = await outputTensor.data();
      setPrediction(Array.from(result));
      inputTensor.dispose();
      outputTensor.dispose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (featureName: string, value: string) => {
    setInputs(prev => ({ ...prev, [featureName]: value }));
  };

  const copyToClipboard = () => {
    const json = JSON.stringify(inputs, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!model && !runId) return null;

  return (
    <div className="space-y-6 pt-6 border-t border-zinc-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          Test Model with Real Data
        </h3>
        <button 
          onClick={loadRandomDatapoint}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Load a random datapoint from test set"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Random Datapoint
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Input Features */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="label-micro">Input Features</label>
            <button 
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors"
              title="Copy inputs as JSON"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy JSON
                </>
              )}
            </button>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {features.map(f => (
              <div 
                key={f.name} 
                className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-zinc-300 transition-all hover:bg-zinc-100/50"
              >
                <label className="text-xs font-bold text-zinc-700 mb-3 block">{f.name}</label>
                <input
                  type="number"
                  step="0.001"
                  value={inputs[f.name] || ''}
                  onChange={(e) => handleInputChange(f.name, e.target.value)}
                  className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 bg-white hover:bg-white/80 transition-colors"
                  placeholder="Enter value..."
                />
                <div className="mt-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {inputs[f.name] && !isNaN(parseFloat(inputs[f.name])) && (
                    <span>Value: <span className="text-blue-600">{parseFloat(inputs[f.name]).toFixed(4)}</span></span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={handlePredict}
            disabled={isLoading || Object.keys(inputs).length === 0}
            className="w-full btn-primary flex items-center justify-center gap-3 py-4 shadow-lg shadow-zinc-100 group disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Run Inference
              </>
            )}
          </button>
        </div>

        {/* Predictions */}
        <div className="space-y-6">
          <div className="label-micro">Predictions</div>
          <div className="p-8 bg-zinc-900 rounded-3xl text-white min-h-[500px] flex flex-col justify-center items-center text-center shadow-2xl shadow-zinc-200 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
            
            {prediction && prediction.length > 0 ? (
              <div className="space-y-8 w-full relative z-10">
                {targets.map((t, i) => {
                  const val = prediction[i] ?? 0;
                  // Normalize to 0-100 range for visualization (assuming output 0-1)
                  const percentage = Math.min(Math.max(val * 100, 0), 100);
                  
                  return (
                    <div key={t.name} className="space-y-4">
                      <div className="label-micro opacity-50 text-white">{t.name}</div>
                      <div className="text-5xl font-mono font-bold text-blue-400 tabular-nums break-words">
                        {typeof val === 'number' ? val.toFixed(4) : 'N/A'}
                      </div>
                      
                      {/* Visual Gauge */}
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase tracking-widest">
                        <span>0.0000</span>
                        <span>1.0000</span>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-6 border-t border-white/10 mt-8">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Try adjusting inputs above to see predictions change</p>
                  <button 
                    onClick={loadRandomDatapoint}
                    disabled={isLoading}
                    className="w-full btn-secondary-sm disabled:opacity-50"
                  >
                    Load Another Random Sample
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 space-y-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                  <Terminal className="w-8 h-8 opacity-20" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white/80">Ready for Inference</p>
                  <p className="text-xs text-white/40 max-w-[280px] mx-auto leading-relaxed">
                    A random test datapoint has been loaded. Edit the feature values and click <span className="font-bold text-blue-400">"Run Inference"</span> to see predictions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
