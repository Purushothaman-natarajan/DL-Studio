import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrainingHistory } from '../types';
import { Activity, Play, StopCircle, CheckCircle2 } from 'lucide-react';

interface TrainingPanelProps {
  history: TrainingHistory[];
  isTraining: boolean;
  onStart: () => void;
  onStop: () => void;
  progress: number;
}

export function TrainingPanel({ history, isTraining, onStart, onStop, progress }: TrainingPanelProps) {
  const bestLoss = history.length > 0 ? Math.min(...history.map(h => h.loss)) : null;
  const currentLoss = history.length > 0 ? history[history.length - 1].loss : null;

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 border border-zinc-200 rounded-2xl bg-white shadow-sm">
          <div className="label-micro mb-2">Progress</div>
          <div className="text-2xl font-bold font-mono">{Math.round(progress)}%</div>
          <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-zinc-900 h-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="p-5 border border-zinc-200 rounded-2xl bg-white shadow-sm">
          <div className="label-micro mb-2">Current Loss</div>
          <div className="text-2xl font-bold font-mono text-blue-600">
            {currentLoss?.toFixed(4) || '0.0000'}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 font-bold">BEST: {bestLoss?.toFixed(4) || '0.0000'}</div>
        </div>
        <div className="p-5 border border-zinc-200 rounded-2xl bg-white shadow-sm">
          <div className="label-micro mb-2">Accuracy</div>
          <div className="text-2xl font-bold font-mono text-green-600">
            {history.length > 0 && history[history.length - 1].accuracy 
              ? (history[history.length - 1].accuracy! * 100).toFixed(1) + '%' 
              : '0.0%'}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 font-bold uppercase tracking-widest">Training Metrics</div>
        </div>
        <div className="p-5 border border-zinc-200 rounded-2xl bg-white shadow-sm">
          <div className="label-micro mb-2">Epochs</div>
          <div className="text-2xl font-bold font-mono">
            {history.length > 0 ? history[history.length - 1].epoch : 0}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 font-bold uppercase tracking-widest">Total Cycles</div>
        </div>
      </div>

      <div className="h-[350px] w-full border border-zinc-200 rounded-2xl bg-white p-6 shadow-sm group">
        <div className="flex items-center justify-between mb-6">
          <div className="label-micro">Loss Curve</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-zinc-900" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Loss</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
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
              tickFormatter={(val) => val.toFixed(3)}
              tick={{ fill: '#a3a3a3', fontWeight: 'bold' }}
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
            />
            <Line 
              type="monotone" 
              dataKey="loss" 
              stroke="#171717" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
