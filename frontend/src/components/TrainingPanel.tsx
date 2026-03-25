import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrainingHistory } from '../types';
import { Activity, Play, StopCircle, TrendingDown, Target, Award, BarChart3, ToggleLeft, ToggleRight, BookOpen, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

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
  modelInfo 
}: TrainingPanelProps) {
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
              <p><strong>2. Configure:</strong> Click ⚙️ to set hyperparameters (optional)</p>
              <p><strong>3. Train:</strong> Click "Start Training" to begin learning</p>
              <p><strong>4. Monitor:</strong> Watch the curves and metrics below</p>
              <p><strong>5. Evaluate:</strong> Check Benchmark tab for comparison</p>
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
              {isTraining ? 'Model Training In Progress...' : 
               isComplete ? 'Training Complete!' : 
               history.length > 0 ? 'Training Ready to Start' : 'Ready to Train'}
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              {isTraining ? 'Learning patterns from your data...' : 
               isComplete ? (
                 isOverfitting ? 'Check validation metrics - possible overfitting' :
                 isGoodFit ? 'Model is learning well! Check Benchmark tab for comparison' :
                 'Review metrics and check Benchmark tab'
               ) : 
               history.length > 0 ? 'Click "Retrain" to start fresh or go to Benchmark tab' : 'Configure your model in Architecture tab'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Benchmark Toggle */}
          <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-bold text-zinc-600">Benchmark</span>
            </div>
            <button
              onClick={() => onBenchmarkModeChange?.(!benchmarkMode)}
              disabled={isTraining}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all",
                benchmarkMode 
                  ? "bg-emerald-100 text-emerald-700" 
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200",
                isTraining && "opacity-50 cursor-not-allowed"
              )}
            >
              {benchmarkMode ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  All Models
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  Single
                </>
              )}
            </button>
          </div>
          
          {/* Train Button */}
          <div className="flex gap-3">
            {!isTraining ? (
              <button onClick={onStart} className="btn-primary flex items-center gap-2 group px-6 py-3">
                <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                {history.length > 0 ? 'Retrain' : 'Start Training'}
              </button>
            ) : (
              <button onClick={onStop} className="btn-secondary text-red-600 border-red-100 bg-red-50 hover:bg-red-100 flex items-center gap-2 px-4 py-3">
                <StopCircle className="w-5 h-5" />
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress and Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
            Epoch {latestMetrics?.epoch || 0} / {history.length || '...'}
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
            {latestMetrics?.loss?.toFixed(4) || '0.0000'}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[9px] text-amber-500 font-bold">BEST:</span>
            <span className="text-[10px] font-mono font-bold text-amber-600">{bestLoss?.toFixed(4) || '0.0000'}</span>
          </div>
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
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[9px] text-emerald-500 font-bold">BEST:</span>
            <span className="text-[10px] font-mono font-bold text-emerald-600">{bestValLoss?.toFixed(4) || '—'}</span>
          </div>
        </div>

        {/* MAE */}
        <div className="p-4 border-2 border-rose-200 rounded-2xl bg-gradient-to-br from-rose-50 to-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
              <Award className="w-3 h-3 text-rose-600" />
            </div>
            <span className="text-[10px] font-black text-rose-600 uppercase">MAE</span>
          </div>
          <div className="text-3xl font-bold font-mono text-rose-700">
            {latestMetrics?.mae?.toFixed(4) || (hasMae ? '—' : 'N/A')}
          </div>
          <div className="text-[9px] text-rose-500 mt-1 font-bold uppercase">Mean Absolute Error</div>
        </div>

        {/* R² Score */}
        <div className="p-4 border-2 border-indigo-200 rounded-2xl bg-gradient-to-br from-indigo-50 to-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Target className="w-3 h-3 text-indigo-600" />
            </div>
            <span className="text-[10px] font-black text-indigo-600 uppercase">R² Score</span>
          </div>
          <div className="text-3xl font-bold font-mono text-indigo-700">
            {latestMetrics?.r2 ? latestMetrics.r2.toFixed(3) : (hasR2 ? '—' : 'N/A')}
          </div>
          <div className="text-[9px] text-indigo-500 mt-1 font-bold uppercase">Variance Explained</div>
        </div>

        {/* Epoch */}
        <div className="p-4 border-2 border-zinc-200 rounded-2xl bg-gradient-to-br from-zinc-50 to-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Activity className="w-3 h-3 text-zinc-500" />
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase">Epoch</span>
          </div>
          <div className="text-3xl font-bold font-mono">
            {latestMetrics?.epoch || 0}
          </div>
          <div className="text-[9px] text-zinc-400 mt-1 font-bold uppercase">Current / {history.length || '?'}</div>
        </div>
      </div>

      {/* Interpretation Guide */}
      {isComplete && (
        <div className={cn(
          "p-4 rounded-2xl border-2",
          isOverfitting ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
        )}>
          <div className="flex items-start gap-3">
            {isOverfitting ? (
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className={cn("font-bold text-sm", isOverfitting ? "text-amber-900" : "text-emerald-900")}>
                {isOverfitting ? "Potential Overfitting Detected" : "Good Model Performance"}
              </h4>
              <p className={cn("text-xs mt-1", isOverfitting ? "text-amber-700" : "text-emerald-700")}>
                {isOverfitting ? (
                  <>Train loss is much lower than validation loss. Consider: reducing model complexity, adding dropout, or using more data.</>
                ) : (
                  <>Train and validation losses are well-balanced. Your model generalizes well! Explore the Verification tab to test predictions.</>
                )}
              </p>
            </div>
          </div>
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
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #e5e5e5', 
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                  padding: '12px'
                }}
                labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#737373', marginBottom: '4px', textTransform: 'uppercase' }}
                itemStyle={{ fontWeight: 'bold', fontSize: '14px', color: '#171717' }}
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
                name="Train Loss"
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
                  name="Val Loss"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[320px] w-full border-2 border-zinc-200 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-black uppercase text-zinc-700">Metrics Over Epochs</span>
            <div className="flex items-center gap-4">
              {hasAccuracy && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Accuracy</span>
                </div>
              )}
              {hasR2 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">R²</span>
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
                domain={[0, 1]}
              />
              <Tooltip 
                cursor={{ stroke: '#f0f0f0', strokeWidth: 1 }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #e5e5e5', 
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                  padding: '12px'
                }}
                labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#737373', marginBottom: '4px', textTransform: 'uppercase' }}
                itemStyle={{ fontWeight: 'bold', fontSize: '14px', color: '#171717' }}
                formatter={(value: number) => [value.toFixed(4), '']}
              />
              {hasAccuracy && (
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#a855f7' }}
                  animationDuration={500}
                  name="Accuracy"
                />
              )}
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
                  name="R² Score"
                />
              )}
              {(!hasAccuracy && !hasR2) && (
                <Line
                  type="monotone"
                  dataKey="mae"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#f43f5e' }}
                  animationDuration={500}
                  name="MAE"
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
