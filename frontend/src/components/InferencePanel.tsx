import React, { useState, useEffect } from 'react';
import { DataColumn } from '../types';
import { PlayCircle, Terminal, Shuffle, Copy, Check, Target, ArrowRight, Sliders, Info, Loader } from 'lucide-react';
import { cn } from '../lib/utils';
import { API_URL } from '../lib/api-utils';

interface InferencePanelProps {
  model: any | null; 
  features: { name: string }[];
  targets: { name: string }[];
  runId?: string;
  featureRanges?: Record<string, { min: number; max: number }>;
}

export function InferencePanel({ model, features, targets, runId, featureRanges = {} }: InferencePanelProps) {
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [prediction, setPrediction] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useSliders, setUseSliders] = useState(true);
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

  // Initialize values when features load
  useEffect(() => {
    if (features.length > 0) {
      const initial: Record<string, number> = {};
      const sliderInit: Record<string, number> = {};
      features.forEach(f => {
        const range = featureRanges[f.name] || { min: 0, max: 100 };
        const mid = (range.min + range.max) / 2;
        initial[f.name] = mid;
        sliderInit[f.name] = mid;
      });
      setInputs(initial);
      setSliderValues(sliderInit);
    }
  }, [features, featureRanges]);

  const loadRandomDatapoint = async () => {
    if (!runId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/runs/${runId}/random-datapoint`);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          const datapoint = result.datapoint;
          const newInputs: Record<string, number> = {};
          const newSlider: Record<string, number> = {};
          features.forEach(f => {
            const val = datapoint[f.name] ?? 0;
            newInputs[f.name] = val;
            newSlider[f.name] = val;
          });
          setInputs(newInputs);
          setSliderValues(newSlider);
          setPrediction(null);
        }
      }
    } catch (err) {
      console.error("Failed to load datapoint:", err);
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
    setIsLoading(true);
    try {
      if (runId) {
        const response = await fetch(`${API_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            run_id: runId,
            inputs: inputs
          })
        });
        if (response.ok) {
          const res = await response.json();
          if (res.status === 'success') {
            setPrediction(res.prediction);
          }
        }
      }
    } catch (err) {
      console.error("Inference failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSliderChange = (featureName: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [featureName]: value }));
    setInputs(prev => ({ ...prev, [featureName]: value }));
  };

  const handleInputChange = (featureName: string, value: string) => {
    const num = parseFloat(value) || 0;
    setInputs(prev => ({ ...prev, [featureName]: num }));
    setSliderValues(prev => ({ ...prev, [featureName]: num }));
  };

  const copyToClipboard = () => {
    const json = JSON.stringify(inputs, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!model && !runId) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Terminal className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Test Your Model</h3>
            <p className="text-xs text-zinc-500">Adjust sliders or enter values, then predict</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseSliders(!useSliders)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              useSliders ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600"
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            {useSliders ? 'Sliders' : 'Numbers'}
          </button>
          <button 
            onClick={loadRandomDatapoint}
            disabled={isLoading}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-zinc-800 disabled:opacity-50"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Load Sample
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Features Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-zinc-500 tracking-widest">Input Features</span>
            <button 
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200"
            >
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
          </div>
          
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {features.map(f => {
              const range = featureRanges[f.name] || { min: 0, max: 100 };
              const value = useSliders ? sliderValues[f.name] : inputs[f.name];
              
              return (
                <div key={f.name} className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-zinc-700">{f.name}</label>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {typeof value === 'number' ? value.toFixed(2) : '0.00'}
                    </span>
                  </div>
                  
                  {useSliders ? (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={range.min}
                        max={range.max}
                        step={(range.max - range.min) / 100}
                        value={value}
                        onChange={(e) => handleSliderChange(f.name, parseFloat(e.target.value))}
                        className="w-full accent-blue-500 h-2"
                      />
                      <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                        <span>{range.min.toFixed(1)}</span>
                        <span>{range.max.toFixed(1)}</span>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => handleInputChange(f.name, e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    />
                  )}
                </div>
              );
            })}
          </div>
          
          <button 
            onClick={handlePredict}
            disabled={isLoading || Object.keys(inputs).length === 0}
            className="w-full py-4 bg-zinc-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Predicting...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                Run Prediction
              </>
            )}
          </button>
        </div>

        {/* Predictions Panel */}
        <div className="space-y-4">
          <span className="text-xs font-black uppercase text-zinc-500 tracking-widest">Predictions</span>
          
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 min-h-[400px] flex flex-col">
            {prediction && prediction.length > 0 ? (
              <div className="space-y-6 flex-1">
                {targets.map((t, i) => {
                  const val = prediction[i] ?? 0;
                  const range = { min: 0, max: Math.max(...prediction) * 1.2 };
                  const percentage = range.max > 0 ? Math.min(Math.max(val / range.max, 0), 1) * 100 : 50;
                  
                  return (
                    <div key={t.name} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.name}</span>
                        <span className="text-xs text-zinc-500">Target Variable</span>
                      </div>
                      
                      <div className="text-4xl font-black font-mono text-white tabular-nums">
                        {val.toFixed(4)}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                          <span>{range.min.toFixed(2)}</span>
                          <span>{range.max.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-4 border-t border-zinc-700 mt-auto">
                  <p className="text-[10px] text-zinc-500 text-center mb-3">
                    Adjust sliders and predict again to experiment
                  </p>
                  <button 
                    onClick={loadRandomDatapoint}
                    className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Load Another Sample
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
                  <Target className="w-8 h-8 text-zinc-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-zinc-400">Ready to Predict</p>
                  <p className="text-xs text-zinc-500 max-w-[200px]">
                    Click "Run Prediction" to see results based on current inputs
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
