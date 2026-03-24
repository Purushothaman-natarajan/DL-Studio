import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ComparisonMetric {
  model: string;
  r2: number;
  mae: number;
  mse: number;
}

interface ModelComparisonProps {
  metrics: ComparisonMetric[];
}

export function ModelComparison({ metrics }: ModelComparisonProps) {
  if (!metrics || metrics.length === 0) return null;

  // Find the winner (highest R2)
  const winner = [...metrics].sort((a, b) => b.r2 - a.r2)[0];

  const chartData = metrics.map(m => ({
    name: m.model,
    r2: parseFloat(m.r2.toFixed(4)),
    mse: parseFloat(m.mse.toFixed(4))
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-zinc-900" />
            Model Benchmarking Analysis
          </h3>
          <p className="text-sm text-zinc-500 font-medium">Comparing Artificial Neural Network vs. Classical ML algorithms.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-emerald-700">
          <Trophy className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-tight">Best Model: {winner.model}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((m) => (
          <div 
            key={m.model}
            className={cn(
              "p-6 rounded-2xl border-2 transition-all",
              m.model === winner.model 
                ? "border-zinc-900 bg-zinc-900 text-white shadow-xl shadow-zinc-200" 
                : "border-zinc-100 bg-white"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={cn(
                "text-xs font-bold uppercase tracking-widest px-2 py-1 rounded",
                m.model === winner.model ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-500"
              )}>
                {m.model}
              </span>
              {m.model === winner.model && <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />}
            </div>
            
            <div className="space-y-4">
              <div>
                <div className={cn("text-3xl font-black mb-1", m.model === winner.model ? "text-white" : "text-zinc-900")}>
                  {(m.r2 * 100).toFixed(1)}%
                </div>
                <div className={cn("text-xs font-medium", m.model === winner.model ? "text-zinc-400" : "text-zinc-500 uppercase tracking-tighter")}>
                  R² Accuracy Score
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <div className="text-sm font-bold">{m.mae.toFixed(4)}</div>
                  <div className="text-[10px] uppercase opacity-50">MAE</div>
                </div>
                <div>
                  <div className="text-sm font-bold">{m.mse.toFixed(4)}</div>
                  <div className="text-[10px] uppercase opacity-50">MSE</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-8 bg-zinc-50/50">
        <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-8 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          R² Accuracy Comparison
        </h4>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 12 }}
                domain={[0, 1]}
              />
              <Tooltip 
                cursor={{ fill: '#f4f4f5' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="r2" radius={[6, 6, 0, 0]} barSize={60}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === winner.model ? '#18181b' : '#d4d4d8'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
