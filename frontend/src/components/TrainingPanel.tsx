import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { TrainingHistory } from '../types';
import { Activity, Play, StopCircle, TrendingDown, Target, Award, BarChart3, ToggleLeft, ToggleRight, BookOpen, Info, CheckCircle, AlertCircle, Loader, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { RunLogViewer } from './RunLogViewer';

interface TrainingPanelProps {
  history: TrainingHistory[];
  isTraining: boolean;
  onStart: () => void;
  onStop: () => void;
  progress: number;
  plotColor?: string;
  benchmarkMode?: boolean;
  onBenchmarkModeChange?: (value: boolean) => void;
  trainingConfig?: any;
  modelInfo?: string;
  logs?: string[];
  runId?: string | null;
  trainingPhase?: 'preparing' | 'training' | 'xai' | 'finalizing';
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

export function TrainingPanel({ 
  history, 
  isTraining, 
  onStart, 
  onStop, 
  progress, 
  plotColor = '#171717', 
  benchmarkMode = true, 
  onBenchmarkModeChange,
  trainingConfig,
  modelInfo,
  logs = [],
  runId,
  trainingPhase = 'training',
  trainingMetrics
}: TrainingPanelProps) {
  const [showLogs, setShowLogs] = useState(false);
  const latestMetrics = useMemo(() => {
    if (history.length === 0) return null;
    return history[history.length - 1];
  }, [history]);

  const bestLoss = history.length > 0 ? Math.min(...history.map(h => h.loss)) : null;
  const bestValLoss = history.length > 0 ? Math.min(...history.filter(h => typeof h.valLoss === 'number').map(h => h.valLoss as number)) : null;
  const hasValLoss = history.some(h => typeof h.valLoss === 'number');
  const hasAccuracy = history.some(h => typeof h.accuracy === 'number');
  const hasMae = history.some(h => typeof h.mae === 'number');
  const hasR2 = history.some(h => typeof h.r2 === 'number');

  const isComplete = history.length > 0 && progress === 100 && !isTraining;
  const isGoodFit = bestLoss && bestValLoss && (bestLoss - bestValLoss) < 0.1;
  const isOverfitting = bestLoss && bestValLoss && bestLoss < bestValLoss * 0.8;

  const hasAllMetrics = trainingMetrics && Object.keys(trainingMetrics).length > 0;

  return (
    <div className="space-y-6">
      {/* Header with Guidance */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-blue-900 mb-1">Training Hub Guide</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>1. Choose Model:</strong> Select a model in the Architecture tab</p>
              <p><strong>2. Configure:</strong> Set hyperparameters for your model</p>
              <p><strong>3. Train:</strong> Watch live metrics for Train and Validation splits</p>
              <p><strong>4. Evaluate:</strong> After training, check Verification tab for Test metrics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-2xl border-2",
        isTraining ? "bg-blue-50 border-blue-200" : 
        isComplete ? (isGoodFit ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200") : 
        "bg-zinc-50 border-zinc-200"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isTraining ? "bg-blue-100 text-blue-600 animate-pulse" : 
            isComplete ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400"
          )}>
            {isTraining ? <Activity className="w-6 h-6" /> : 
             isComplete ? <CheckCircle className="w-6 h-6" /> : 
             <BarChart3 className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">
              {isTraining ? 'Training In Progress...' : 
               isComplete ? 'Training Complete!' : 
               history.length > 0 ? 'Training Ready' : 'Ready to Train'}
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              {isTraining ? 'Learning from Train/Val data...' : 
               isComplete ? (
                 isOverfitting ? 'Check metrics - possible overfitting detected' :
                 'Check Verification tab for Test metrics'
               ) : 
               history.length > 0 ? 'Click to retrain or view Benchmark' : 'Configure model in Architecture tab'}
            </p>
          </div>
        </div>
        
        {/* Phase Indicator */}
        {isTraining && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 text-[10px] font-bold">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px]",
                  ['preparing', 'training', 'xai', 'finalizing'].includes(trainingPhase) ? 'bg-blue-500' : 'bg-blue-300'
                )} />
                <span className="text-blue-600">Prep</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px]",
                  ['training', 'xai', 'finalizing'].includes(trainingPhase) ? 'bg-purple-500' : 'bg-purple-300'
                )} />
                <span className={cn("font-bold", ['training', 'xai', 'finalizing'].includes(trainingPhase) ? 'text-purple-600' : 'text-purple-400')}>Train</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px]",
                  ['xai', 'finalizing'].includes(trainingPhase) ? 'bg-amber-500' : 'bg-amber-300'
                )} />
                <span className={cn("font-bold", ['xai', 'finalizing'].includes(trainingPhase) ? 'text-amber-600' : 'text-amber-400')}>XAI</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px]",
                  trainingPhase === 'finalizing' ? 'bg-emerald-500' : 'bg-emerald-300'
                )} />
                <span className={cn("font-bold", trainingPhase === 'finalizing' ? 'text-emerald-600' : 'text-emerald-400')}>Done</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
              showLogs ? "bg-blue-600 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <FileText className="w-4 h-4" />
            {showLogs ? 'Hide Logs' : 'Show Logs'}
          </button>
          
          {/* Train Button */}
          <div className="flex gap-3">
            {!isTraining ? (
              <button onClick={onStart} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
                <Play className="w-5 h-5 fill-current" />
                {history.length > 0 ? 'Retrain' : 'Start Training'}
              </button>
            ) : (
              <button onClick={onStop} className="px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold flex items-center gap-2 hover:bg-red-100 transition-all">
                <StopCircle className="w-5 h-5" />
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Logs Panel */}
      {showLogs && (
        <div className="border-2 border-zinc-200 rounded-2xl overflow-hidden">
          <RunLogViewer logs={logs} runId={runId} isLive={isTraining} />
        </div>
      )}

      {/* Metrics Grid - Train & Val */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Progress */}
        <div className="p-4 border-2 border-blue-200 rounded-2xl bg-gradient-to-br from-blue-50 to-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
              <Activity className="w-3 h-3 text-blue-600" />
            </div>
            <span className="text-[10px] font-black text-blue-600 uppercase">Progress</span>
          </div>
          <div className="text-3xl font-bold font-mono text-blue-700">{Math.round(progress)}%</div>
          <div className="w-full bg-blue-100 h-2 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[9px] text-blue-500 mt-1 font-bold">
            Epoch {latestMetrics?.epoch || 0} / {trainingConfig?.epochs || '?'}
          </div>
        </div>

        {/* Train Loss */}
        <div className="p-4 border-2 border-amber-200 rounded-2xl bg-gradient-to-br from-amber-50 to-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingDown className="w-3 h-3 text-amber-600" />
            </div>
            <span className="text-[10px] font-black text-amber-600 uppercase">Train Loss</span>
          </div>
          <div className="text-3xl font-bold font-mono text-amber-700">
            {latestMetrics?.loss?.toFixed(4) || '—'}
          </div>
          <div className="text-[9px] text-amber-500 mt-1">Best: {bestLoss?.toFixed(4) || '—'}</div>
        </div>

        {/* Val Loss */}
        <div className="p-4 border-2 border-emerald-200 rounded-2xl bg-gradient-to-br from-emerald-50 to-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingDown className="w-3 h-3 text-emerald-600" />
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase">Val Loss</span>
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-700">
            {latestMetrics?.valLoss?.toFixed(4) || (hasValLoss ? '—' : 'N/A')}
          </div>
          <div className="text-[9px] text-emerald-500 mt-1">Best: {bestValLoss?.toFixed(4) || '—'}</div>
        </div>

        {/* Train MAE */}
        <div className="p-4 border-2 border-purple-200 rounded-2xl bg-gradient-to-br from-purple-50 to-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
              <Award className="w-3 h-3 text-purple-600" />
            </div>
            <span className="text-[10px] font-black text-purple-600 uppercase">Train MAE</span>
          </div>
          <div className="text-3xl font-bold font-mono text-purple-700">
            {trainingMetrics?.mae_train?.toFixed(4) || latestMetrics?.mae?.toFixed(4) || '—'}
          </div>
          {trainingMetrics?.mae_train && (
            <div className="text-[9px] text-purple-500 mt-1">Best: {trainingMetrics.mae_train.toFixed(4)}</div>
          )}
        </div>

        {/* Val MAE */}
        <div className="p-4 border-2 border-rose-200 rounded-2xl bg-gradient-to-br from-rose-50 to-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
              <Target className="w-3 h-3 text-rose-600" />
            </div>
            <span className="text-[10px] font-black text-rose-600 uppercase">Val MAE</span>
          </div>
          <div className="text-3xl font-bold font-mono text-rose-700">
            {trainingMetrics?.mae_val?.toFixed(4) || '—'}
          </div>
          {trainingMetrics?.mae_val && (
            <div className="text-[9px] text-rose-500 mt-1">Best: {trainingMetrics.mae_val.toFixed(4)}</div>
          )}
        </div>

        {/* Val R² */}
        <div className="p-4 border-2 border-indigo-200 rounded-2xl bg-gradient-to-br from-indigo-50 to-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
              <BarChart3 className="w-3 h-3 text-indigo-600" />
            </div>
            <span className="text-[10px] font-black text-indigo-600 uppercase">Val R²</span>
          </div>
          <div className="text-3xl font-bold font-mono text-indigo-700">
            {trainingMetrics?.r2_val ? (trainingMetrics.r2_val * 100).toFixed(1) + '%' : 
             latestMetrics?.r2 ? (latestMetrics.r2 * 100).toFixed(1) + '%' : '—'}
          </div>
          {trainingMetrics?.r2_val && (
            <div className="text-[9px] text-indigo-500 mt-1">Best: {(trainingMetrics.r2_val * 100).toFixed(1)}%</div>
          )}
        </div>
      </div>

      {/* Training Complete - Show All Splits */}
      {isComplete && hasAllMetrics && (
        <div className="p-5 border-2 border-emerald-200 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-emerald-900">Training Complete - All Split Metrics</h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {/* Train Metrics */}
            <div className="p-4 bg-white rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-xs font-black text-blue-700 uppercase">Training (80%)</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] text-zinc-500">R²:</span>
                  <span className="text-sm font-bold text-blue-700">{(trainingMetrics.r2_train! * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-zinc-500">MAE:</span>
                  <span className="text-sm font-bold font-mono text-blue-700">{trainingMetrics.mae_train?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-zinc-500">MSE:</span>
                  <span className="text-sm font-bold font-mono text-blue-700">{trainingMetrics.mse_train?.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* Val Metrics */}
            <div className="p-4 bg-white rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-xs font-black text-emerald-700 uppercase">Validation (10%)</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] text-zinc-500">R²:</span>
                  <span className="text-sm font-bold text-emerald-700">{(trainingMetrics.r2_val! * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-zinc-500">MAE:</span>
                  <span className="text-sm font-bold font-mono text-emerald-700">{trainingMetrics.mae_val?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-zinc-500">MSE:</span>
                  <span className="text-sm font-bold font-mono text-emerald-700">{trainingMetrics.mse_val?.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* Test Metrics */}
            <div className="p-4 bg-white rounded-xl border border-rose-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded bg-rose-500" />
                <span className="text-xs font-black text-rose-700 uppercase">Test (10%)</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] text-zinc-500">R²:</span>
                  <span className="text-sm font-bold text-rose-700">{(trainingMetrics.r2_test! * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-zinc-500">MAE:</span>
                  <span className="text-sm font-bold font-mono text-rose-700">{trainingMetrics.mae_test?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-zinc-500">MSE:</span>
                  <span className="text-sm font-bold font-mono text-rose-700">{trainingMetrics.mse_test?.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-emerald-700 mt-3">
            Test metrics are shown in Verification tab for detailed inference
          </p>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[320px] w-full border-2 border-zinc-200 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-black uppercase text-zinc-700">Loss Curves</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Train</span>
              </div>
              {hasValLoss && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Val</span>
                </div>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f5f5f5" />
              <XAxis 
                dataKey="epoch" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#a3a3a3', fontWeight: 'bold' }}
              />
              <YAxis 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => val.toFixed(2)}
                tick={{ fill: '#a3a3a3', fontWeight: 'bold' }}
                width={45}
              />
              <Tooltip 
                cursor={{ stroke: '#f0f0f0', strokeWidth: 1 }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', padding: '12px' }}
                formatter={(value: number) => [value.toFixed(4), '']}
              />
              <Line 
                type="monotone" 
                dataKey="loss" 
                stroke="#f59e0b" 
                strokeWidth={2.5} 
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#f59e0b' }}
                animationDuration={500}
              />
              {hasValLoss && (
                <Line
                  type="monotone"
                  dataKey="valLoss"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }}
                  animationDuration={500}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[320px] w-full border-2 border-zinc-200 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-black uppercase text-zinc-700">Metrics Over Epochs</span>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f5f5f5" />
              <XAxis 
                dataKey="epoch" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#a3a3a3', fontWeight: 'bold' }}
              />
              <YAxis 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => val.toFixed(2)}
                tick={{ fill: '#a3a3a3', fontWeight: 'bold' }}
                width={45}
              />
              <Tooltip 
                cursor={{ stroke: '#f0f0f0', strokeWidth: 1 }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', padding: '12px' }}
                formatter={(value: number) => [value.toFixed(4), '']}
              />
              {hasR2 && (
                <Line
                  type="monotone"
                  dataKey="r2"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#6366f1' }}
                  animationDuration={500}
                />
              )}
              {!hasR2 && hasMae && (
                <Line
                  type="monotone"
                  dataKey="mae"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#f43f5e' }}
                  animationDuration={500}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Split Info */}
      <div className="p-5 border-2 border-zinc-200 rounded-2xl bg-gradient-to-r from-zinc-50 to-white shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-black uppercase text-zinc-700">Data Split Strategy (80/10/10)</span>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-500">Batch:</span>
              <span className="font-black text-zinc-900">{trainingConfig?.batchSize || 32}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-500">Epochs:</span>
              <span className="font-black text-zinc-900">{trainingConfig?.epochs || 50}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-500">Early Stop:</span>
              <span className={cn(
                "font-black",
                trainingConfig?.earlyStopping !== false ? "text-emerald-600" : "text-zinc-400"
              )}>
                {trainingConfig?.earlyStopping !== false ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-1 mb-2">
          <div className="flex-1 h-3 bg-blue-500 rounded-l-lg relative group">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Training: 80%
            </div>
          </div>
          <div className="flex-1 h-3 bg-emerald-500" />
          <div className="flex-1 h-3 bg-rose-500 rounded-r-lg" />
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="font-bold text-blue-600">Training (80%)</span>
            </div>
            <p className="text-zinc-500">Used to learn patterns from data</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="font-bold text-emerald-600">Validation (10%)</span>
            </div>
            <p className="text-zinc-500">For tuning and early stopping</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded bg-rose-500" />
              <span className="font-bold text-rose-600">Test (10%)</span>
            </div>
            <p className="text-zinc-500">Final unbiased evaluation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
