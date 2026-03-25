import React, { useState, useEffect, useMemo } from 'react';
import { PlayCircle, Shuffle, Copy, Check, Target, Loader, BookOpen, Info, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { API_URL } from '../lib/api-utils';

interface InferencePanelProps {
  model: any | null;
  features: { name: string }[];
  targets: { name: string }[];
  runId?: string;
  featureRanges?: Record<string, { min: number; max: number }>;
  trainingMetrics?: {
    r2_train?: number;
    r2_val?: number;
    r2_test?: number;
    mae_train?: number;
    mae_val?: number;
    mae_test?: number;
    mse_train?: number;
    mse_val?: number;
    mse_test?: number;
  };
}

export function InferencePanel({ model, features, targets, runId, featureRanges = {} }: InferencePanelProps) {
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [prediction, setPrediction] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Default ranges if none provided
  const ranges = useMemo(() => {
    const r: Record<string, { min: number; max: number }> = {};
    features.forEach(f => {
      r[f.name] = featureRanges[f.name] || { min: 0, max: 1 };
    });
    return r;
  }, [features, featureRanges]);

  const randomize = () => {
    const vals: Record<string, number> = {};
    features.forEach(f => {
      const { min, max } = ranges[f.name];
      vals[f.name] = +(min + Math.random() * (max - min)).toFixed(4);
    });
    setInputs(vals);
    setPrediction(null);
  };

  useEffect(() => {
    if (features.length > 0) randomize();
  }, [features]);

  const handlePredict = async () => {
    if (!runId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: runId, inputs })
      });
      if (response.ok) {
        const res = await response.json();
        if (res.status === 'success') setPrediction(res.prediction);
      }
    } catch (err) {
      console.error("Inference failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (featureName: string, value: string) => {
    setInputs(prev => ({ ...prev, [featureName]: parseFloat(value) || 0 }));
    setPrediction(null);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(inputs, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!model && !runId) return null;

  return (
    <div className="space-y-6">
      {/* Header with Guide */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 border border-purple-100 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-purple-900 mb-1">Verification Hub Guide</h3>
            <div className="text-xs text-purple-700 space-y-0.5">
              <p><strong>1. Random Sample:</strong> A random sample is auto-loaded from the dataset</p>
              <p><strong>2. Adjust Values:</strong> Modify any feature value in the inputs below</p>
              <p><strong>3. Predict:</strong> Click "Run Prediction" to see the model's output</p>
              <p><strong>4. Re-randomize:</strong> Click "Randomize" to get a fresh random sample</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Test Your Model</h3>
            <p className="text-xs text-zinc-500">Random sample loaded — modify values and predict</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Features Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase text-zinc-700 tracking-wider">Input Features</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                {features.length} features
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>Values are randomly sampled within each feature's range. Edit any value and click <strong>Predict</strong>.</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {features.map((f, idx) => {
              const { min, max } = ranges[f.name];
              return (
                <div key={f.name} className="p-4 bg-white rounded-xl border-2 border-zinc-200 shadow-sm hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-zinc-700 flex items-center gap-2">
                      <span className="w-5 h-5 bg-zinc-100 rounded text-[10px] font-black text-zinc-500 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {f.name}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min={min}
                      max={max}
                      value={inputs[f.name] ?? ''}
                      onChange={(e) => handleInputChange(f.name, e.target.value)}
                      placeholder={`${min.toFixed(1)} - ${max.toFixed(1)}`}
                      className="flex-1 px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-mono font-bold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-center text-lg"
                    />
                    <div className="text-[9px] text-zinc-400 text-center w-16">
                      <div>min: {min.toFixed(2)}</div>
                      <div>max: {max.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handlePredict}
              disabled={isLoading || Object.keys(inputs).length === 0}
              className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
            >
              {isLoading ? (
                <><Loader className="w-5 h-5 animate-spin" /> Predicting...</>
              ) : (
                <><PlayCircle className="w-5 h-5" /> Run Prediction <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
            <button
              onClick={randomize}
              className="px-6 py-4 bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-200 text-zinc-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Shuffle className="w-4 h-4" />
              Randomize
            </button>
          </div>
        </div>

        {/* Predictions Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase text-zinc-700 tracking-wider">Prediction Results</span>
            {prediction && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">✓ Prediction Ready</span>
            )}
          </div>

          <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-6 min-h-[450px] flex flex-col">
            {prediction && prediction.length > 0 ? (
              <div className="space-y-6 flex-1">
                {targets.map((t, i) => {
                  const val = prediction[i] ?? 0;
                  const lo = Math.min(...prediction) * 0.8;
                  const hi = Math.max(...prediction) * 1.2;
                  const pct = hi > lo ? Math.min(Math.max((val - lo) / (hi - lo), 0.1), 1) * 100 : 50;
                  return (
                    <div key={t.name} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.name}</span>
                        <span className="text-[10px] text-zinc-500">Target Variable</span>
                      </div>
                      <div className="text-5xl font-black font-mono text-white tabular-nums">{val.toFixed(4)}</div>
                      <div className="space-y-2">
                        <div className="w-full h-4 bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                          <span>{lo.toFixed(2)}</span>
                          <span>{hi.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 border-t border-zinc-700 mt-auto space-y-3">
                  <div className="bg-zinc-800/50 rounded-xl p-3">
                    <p className="text-[10px] text-zinc-500">
                      The prediction shows what your model estimates for the targets based on the input values.
                      Change inputs or randomize to explore different scenarios.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={randomize} className="py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                      <Shuffle className="w-3 h-3" /> Randomize
                    </button>
                    <button onClick={handlePredict} className="py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors">
                      Predict Again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center">
                  <Target className="w-10 h-10 text-zinc-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-zinc-400">Ready to Predict</p>
                  <p className="text-xs text-zinc-500 max-w-[250px]">
                    A random sample is loaded. Click "Run Prediction" to see the model's output.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                  <button
                    onClick={handlePredict}
                    disabled={Object.keys(inputs).length === 0}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    Run Prediction
                  </button>
                  <button
                    onClick={randomize}
                    className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Shuffle className="w-3 h-3" /> Randomize
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
