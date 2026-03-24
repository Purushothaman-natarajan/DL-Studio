import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrainingHistory } from '../types';
import { Settings2, Table as TableIcon, BarChart3, Terminal, Activity, Zap, CheckCircle2, AlertCircle, Play, StopCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { API_URL } from '../lib/api-utils';

interface TrainingPanelProps {
  history: TrainingHistory[];
  isTraining: boolean;
  onStart: () => void;
  onStop: () => void;
  progress: number;
  plotColor?: string;
}

export function TrainingPanel({ history, isTraining, onStart, onStop, progress, plotColor = '#171717' }: TrainingPanelProps) {
  const [logs, setLogs] = React.useState<string[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isTraining) return;

    const eventSource = new EventSource(`${API_URL}/api/logs`);
    
    eventSource.onmessage = (event) => {
      setLogs(prev => [...prev.slice(-100), event.data]);
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [isTraining]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

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
              stroke={plotColor} 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: plotColor }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Terminal Log Viewer */}
      <div className="card bg-zinc-950 border-zinc-800 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Integrated Pipeline Hub Logs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", isTraining ? "bg-emerald-500 animate-pulse" : "bg-zinc-700")} />
            <span className="text-[8px] font-bold text-zinc-500 uppercase">{isTraining ? 'Live Stream' : 'Standby'}</span>
          </div>
        </div>
        <div 
          ref={scrollRef}
          className="p-4 h-[250px] overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 selection:bg-zinc-700 selection:text-white"
        >
          {logs.length === 0 ? (
            <div className="text-zinc-700 italic">Waiting for neural engine to initialize...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={cn(
                "border-l-2 pl-3 py-0.5",
                log.includes('ERROR') ? "border-red-500 text-red-400 bg-red-400/10" :
                log.includes('WARNING') ? "border-amber-500 text-amber-400" :
                log.includes('INFO') ? "border-blue-500 text-zinc-300" :
                "border-zinc-800 text-zinc-500"
              )}>
                <span className="opacity-40 mr-2">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
