import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrainingHistory } from '../types';
import { Activity, Play, StopCircle, TrendingDown, Target, Award, BarChart3, ToggleLeft, ToggleRight } from 'lucide-react';
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
}

export function TrainingPanel({ history, isTraining, onStart, onStop, progress, plotColor = '#171717', benchmarkMode = true, onBenchmarkModeChange }: TrainingPanelProps) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isTraining ? 'bg-blue-50 text-blue-500 animate-pulse' : 'bg-zinc-100 text-zinc-400'}`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Training Monitor</h3>
            <p className="text-xs text-zinc-500 font-medium">
              {isTraining ? 'Model is currently learning...' : history.length > 0 ? 'Training complete' : 'Ready to start'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2">
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
          <div className="flex gap-3">
            {!isTraining ? (
              <button onClick={onStart} className="btn-primary flex items-center gap-2 group">
                <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                {history.length > 0 ? 'Retrain Model' : 'Start Training'}
              </button>
            ) : (
              <button onClick={onStop} className="btn-secondary text-red-600 border-red-100 bg-red-50 hover:bg-red-100 flex items-center gap-2">
                <StopCircle className="w-4 h-4" />
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-4 border border-zinc-200 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity className="w-3 h-3 text-blue-500" />
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase">Progress</span>
          </div>
          <div className="text-2xl font-bold font-mono">{Math.round(progress)}%</div>
          <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="p-4 border border-zinc-200 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
              <TrendingDown className="w-3 h-3 text-amber-500" />
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase">Train Loss</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {latestMetrics?.loss?.toFixed(4) || '0.0000'}
          </div>
          <div className="text-[9px] text-zinc-400 mt-1 font-bold">BEST: {bestLoss?.toFixed(4) || '0.0000'}</div>
        </div>

        <div className="p-4 border border-zinc-200 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingDown className="w-3 h-3 text-emerald-500" />
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase">Val Loss</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {latestMetrics?.valLoss?.toFixed(4) || (hasValLoss ? '—' : 'N/A')}
          </div>
          <div className="text-[9px] text-zinc-400 mt-1 font-bold">BEST: {bestValLoss?.toFixed(4) || '—'}</div>
        </div>

        {hasAccuracy && (
          <div className="p-4 border border-zinc-200 rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center">
                <Target className="w-3 h-3 text-purple-500" />
              </div>
              <span className="text-[10px] font-black text-zinc-500 uppercase">Accuracy</span>
            </div>
            <div className="text-2xl font-bold font-mono text-purple-600">
              {latestMetrics?.accuracy ? (latestMetrics.accuracy * 100).toFixed(1) + '%' : '0.0%'}
            </div>
            <div className="text-[9px] text-zinc-400 mt-1 font-bold uppercase">Training</div>
          </div>
        )}

        {hasMae && (
          <div className="p-4 border border-zinc-200 rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
                <Award className="w-3 h-3 text-rose-500" />
              </div>
              <span className="text-[10px] font-black text-zinc-500 uppercase">MAE</span>
            </div>
            <div className="text-2xl font-bold font-mono text-rose-600">
              {latestMetrics?.mae?.toFixed(4) || '0.0000'}
            </div>
            <div className="text-[9px] text-zinc-400 mt-1 font-bold uppercase">Mean Abs Error</div>
          </div>
        )}

        {hasR2 && (
          <div className="p-4 border border-zinc-200 rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Award className="w-3 h-3 text-indigo-500" />
              </div>
              <span className="text-[10px] font-black text-zinc-500 uppercase">R² Score</span>
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-600">
              {latestMetrics?.r2?.toFixed(3) || '0.000'}
            </div>
            <div className="text-[9px] text-zinc-400 mt-1 font-bold uppercase">Variance Explained</div>
          </div>
        )}

        <div className="p-4 border border-zinc-200 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Activity className="w-3 h-3 text-zinc-500" />
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase">Epoch</span>
          </div>
          <div className="text-2xl font-bold font-mono">
            {latestMetrics?.epoch || 0}
          </div>
          <div className="text-[9px] text-zinc-400 mt-1 font-bold uppercase">of {history.length > 0 ? history.length : '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[300px] w-full border border-zinc-200 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase text-zinc-700">Loss Curves</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase">Train Loss</span>
              </div>
              {hasValLoss && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Val Loss</span>
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
                width={40}
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

        <div className="h-[300px] w-full border border-zinc-200 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase text-zinc-700">Metrics Over Epochs</span>
            <div className="flex items-center gap-3">
              {hasAccuracy && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Accuracy</span>
                </div>
              )}
              {hasR2 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">R²</span>
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
                width={40}
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

      <div className="p-4 border border-zinc-200 rounded-2xl bg-gradient-to-r from-zinc-50 to-white">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-500 uppercase">Data Split:</span>
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-black">Train 80%</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-black">Val 10%</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded font-black">Test 10%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-500 uppercase">Batch:</span>
              <span className="font-black text-zinc-900">32</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-500 uppercase">Early Stop:</span>
              <span className="font-black text-emerald-600">ON</span>
            </div>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">
            Epoch {latestMetrics?.epoch || 0} of {history.length || '...'}
          </div>
        </div>
        
        <div className="mt-3 flex gap-1">
          <div className="flex-1 h-2 bg-blue-500 rounded-l-full" style={{ width: '80%' }} />
          <div className="flex-1 h-2 bg-emerald-500" />
          <div className="flex-1 h-2 bg-rose-500 rounded-r-full" />
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] text-zinc-400 font-bold">
          <span>Training Set: Used for learning</span>
          <span>Validation: For hyperparameter tuning</span>
          <span>Test: Final evaluation (unseen)</span>
        </div>
      </div>
    </div>
  );
}
