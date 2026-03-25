import React, { useState, useEffect } from 'react';
import { DataColumn } from '../types';
import { PlayCircle, Shuffle, Copy, Check, Target, Loader, BookOpen, BarChart3, TrendingDown, Award, Info, ArrowRight, Edit3, RefreshCw } from 'lucide-react';
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

type DataSource = 'test' | 'val' | 'train';

export function InferencePanel({ model, features, targets, runId, featureRanges = {}, trainingMetrics }: InferencePanelProps) {
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [prediction, setPrediction] = useState<number[] | null>(null);
  const [actualValue, setActualValue] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>('test');
  const [sampleIndex, setSampleIndex] = useState(0);
  const [showMetrics, setShowMetrics] = useState(true);

  useEffect(() => {
    if (features.length > 0) {
      const initial: Record<string, number> = {};
      features.forEach(f => {
        const range = featureRanges[f.name] || { min: 0, max: 100 };
        initial[f.name] = (range.min + range.max) / 2;
      });
      setInputs(initial);
    }
  }, [features, featureRanges]);

  const loadRandomDatapoint = async (source: DataSource = dataSource) => {
    if (!runId) return;
    setIsLoading(true);
    setPrediction(null);
    setActualValue(null);
    try {
      const response = await fetch(`${API_URL}/runs/${runId}/random-datapoint`);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          const datapoint = result.datapoint;
          const newInputs: Record<string, number> = {};
          features.forEach(f => {
            newInputs[f.name] = datapoint[f.name] ?? 0;
          });
          setInputs(newInputs);
          setSampleIndex(result.index || 0);
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

  const handleInputChange = (featureName: string, value: string) => {
    const num = parseFloat(value) || 0;
    setInputs(prev => ({ ...prev, [featureName]: num }));
    setPrediction(null);
  };

  const copyToClipboard = () => {
    const json = JSON.stringify(inputs, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMetricValue = (metric: 'r2' | 'mae' | 'mse', split: 'train' | 'val' | 'test') => {
    if (!trainingMetrics) return null;
    const key = `${metric}_${split}` as keyof typeof trainingMetrics;
    return trainingMetrics[key];
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
              <p><strong>1. Load Sample:</strong> Click "Load Sample" to get a random data point from test set</p>
              <p><strong>2. Adjust Values:</strong> Modify feature values in the number inputs below</p>
              <p><strong>3. Predict:</strong> Click "Run Prediction" to see what your model predicts</p>
              <p><strong>4. Experiment:</strong> Change values and predict again to understand how features affect output</p>
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
            <p className="text-xs text-zinc-500">Load samples, modify values, and predict outcomes</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowMetrics(!showMetrics)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all",
            showMetrics ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
          )}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          {showMetrics ? 'Hide' : 'Show'} Metrics
        </button>
      </div>

      {/* Training Metrics Display - All Splits */}
      {showMetrics && trainingMetrics && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-900">Model Performance Metrics (80/10/10 Split)</h4>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {/* Training Split */}
            <div className="p-4 rounded-xl border-2 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-blue-100">
                  <BarChart3 className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-xs font-black uppercase text-blue-600">
                  Training (80%)
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-700">R² Score:</span>
                  <span className="text-lg font-bold font-mono text-blue-700">
                    {(getMetricValue('r2', 'train') || 0) > 0 ? (getMetricValue('r2', 'train')! * 100).toFixed(1) + '%' : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-700">MAE:</span>
                  <span className="text-sm font-bold font-mono text-blue-700">
                    {getMetricValue('mae', 'train')?.toFixed(4) || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-700">MSE:</span>
                  <span className="text-sm font-bold font-mono text-blue-700">
                    {getMetricValue('mse', 'train')?.toFixed(4) || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Validation Split */}
            <div className="p-4 rounded-xl border-2 bg-emerald-50 border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-emerald-100">
                  <BarChart3 className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-xs font-black uppercase text-emerald-600">
                  Validation (10%)
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-emerald-700">R² Score:</span>
                  <span className="text-lg font-bold font-mono text-emerald-700">
                    {(getMetricValue('r2', 'val') || 0) > 0 ? (getMetricValue('r2', 'val')! * 100).toFixed(1) + '%' : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-emerald-700">MAE:</span>
                  <span className="text-sm font-bold font-mono text-emerald-700">
                    {getMetricValue('mae', 'val')?.toFixed(4) || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-emerald-700">MSE:</span>
                  <span className="text-sm font-bold font-mono text-emerald-700">
                    {getMetricValue('mse', 'val')?.toFixed(4) || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Test Split */}
            <div className="p-4 rounded-xl border-2 bg-rose-50 border-rose-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-rose-100">
                  <BarChart3 className="w-3 h-3 text-rose-600" />
                </div>
                <span className="text-xs font-black uppercase text-rose-600">
                  Test (10%)
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-rose-700">R² Score:</span>
                  <span className="text-lg font-bold font-mono text-rose-700">
                    {(getMetricValue('r2', 'test') || 0) > 0 ? (getMetricValue('r2', 'test')! * 100).toFixed(1) + '%' : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-rose-700">MAE:</span>
                  <span className="text-sm font-bold font-mono text-rose-700">
                    {getMetricValue('mae', 'test')?.toFixed(4) || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-rose-700">MSE:</span>
                  <span className="text-sm font-bold font-mono text-rose-700">
                    {getMetricValue('mse', 'test')?.toFixed(4) || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Features Panel - Now with Easy Number Inputs */}
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
              <span><strong>Tip:</strong> Enter values directly in the number boxes. Click "Run Prediction" to see the model's output!</span>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {features.map((f, idx) => {
              const range = featureRanges[f.name] || { min: 0, max: 100 };
              
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
                      min={range.min}
                      max={range.max}
                      value={inputs[f.name] ?? ''}
                      onChange={(e) => handleInputChange(f.name, e.target.value)}
                      placeholder={`${range.min.toFixed(1)} - ${range.max.toFixed(1)}`}
                      className="flex-1 px-4 py-3 border-2 border-zinc-200 rounded-xl text-sm font-mono font-bold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-center text-lg"
                    />
                    <div className="text-[9px] text-zinc-400 text-center w-16">
                      <div>min: {range.min.toFixed(1)}</div>
                      <div>max: {range.max.toFixed(1)}</div>
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
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5" />
                  Run Prediction
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            <button 
              onClick={() => loadRandomDatapoint()}
              className="px-6 py-4 bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-200 text-zinc-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              Load Sample
            </button>
          </div>
        </div>

        {/* Predictions Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase text-zinc-700 tracking-wider">Prediction Results</span>
            {prediction && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
                ✓ Prediction Ready
              </span>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-6 min-h-[450px] flex flex-col">
            {prediction && prediction.length > 0 ? (
              <div className="space-y-6 flex-1">
                {targets.map((t, i) => {
                  const val = prediction[i] ?? 0;
                  const range = { min: Math.min(...prediction) * 0.8, max: Math.max(...prediction) * 1.2 };
                  const percentage = range.max > range.min ? Math.min(Math.max((val - range.min) / (range.max - range.min), 0.1), 1) * 100 : 50;
                  
                  return (
                    <div key={t.name} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.name}</span>
                        <span className="text-[10px] text-zinc-500">Target Variable</span>
                      </div>
                      
                      <div className="text-5xl font-black font-mono text-white tabular-nums">
                        {val.toFixed(4)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="w-full h-4 bg-zinc-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                          <span>{range.min.toFixed(2)}</span>
                          <span>{range.max.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-4 border-t border-zinc-700 mt-auto space-y-3">
                  <div className="bg-zinc-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                      <TrendingDown className="w-4 h-4" />
                      <span className="font-bold">How to interpret:</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      The prediction shows what your model estimates for the target based on the input values you provided. 
                      Change inputs and predict again to see how each feature affects the prediction.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => loadRandomDatapoint()}
                      className="py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Load New Sample
                    </button>
                    <button 
                      onClick={handlePredict}
                      className="py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
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
                    Enter values in the inputs or load a sample, then click "Run Prediction" to see results
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
                    onClick={() => loadRandomDatapoint()}
                    className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Load Sample
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
