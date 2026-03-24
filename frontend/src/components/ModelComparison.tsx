import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, TrendingUp, BarChart3, Medal, ArrowUpRight } from 'lucide-react';
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

  // Professional Sorting (R2 Descending)
  const sortedMetrics = [...metrics].sort((a, b) => b.r2 - a.r2);
  const winner = sortedMetrics[0];

  const chartData = sortedMetrics.map(m => ({
    name: m.model,
    r2: parseFloat(m.r2.toFixed(4)),
    mse: parseFloat(m.mse.toFixed(4))
  }));

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pt-8 border-t border-zinc-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-zinc-900" />
            Regression Benchmark Hub
          </h3>
          <p className="text-zinc-500 font-medium">Auto-Benchmarking 10+ Regression Architectures on your dataset.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-zinc-900 text-white px-6 py-4 rounded-2xl shadow-xl shadow-zinc-200 ring-4 ring-zinc-50">
          <Trophy className="w-6 h-6 text-amber-400 fill-amber-400" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Winning Architecture</div>
            <div className="text-lg font-black">{winner.model}</div>
          </div>
        </div>
      </div>

      {/* Top 3 Podiums */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortedMetrics.slice(0, 3).map((m, idx) => (
          <div 
            key={m.model}
            className={cn(
              "relative p-8 rounded-3xl border-2 transition-all hover:scale-[1.02]",
              idx === 0 ? "border-zinc-900 bg-white" : "border-zinc-100 bg-zinc-50"
            )}
          >
            <div className="absolute top-6 right-6">
               <Medal className={cn(
                 "w-10 h-10",
                 idx === 0 ? "text-amber-400" : idx === 1 ? "text-zinc-300" : "text-orange-300"
               )} />
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Rank #{idx + 1}</div>
                <div className="text-xl font-black text-zinc-900">{m.model}</div>
              </div>

              <div className="py-2">
                <div className="text-4xl font-black text-zinc-900 tabular-nums">
                  {(m.r2 * 100).toFixed(2)}%
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                   R² Variance Explained
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-200/50">
                <div>
                  <div className="text-sm font-black text-zinc-900">{m.mae.toFixed(4)}</div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">Mean Abs Err</div>
                </div>
                <div>
                  <div className="text-sm font-black text-zinc-900">{m.mse.toFixed(4)}</div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">Mean Sq Err</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard Chart & Full Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-8 bg-white border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Relative Performance</h4>
             <ArrowUpRight className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f1f4" />
                <XAxis type="number" domain={[0, 1]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8f8fa' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                />
                <Bar dataKey="r2" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#18181b' : '#e4e4e7'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-0 overflow-hidden border border-zinc-100 shadow-sm bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-100 italic">
              <tr>
                <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter">Architecture</th>
                <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter text-right">R² Accuracy</th>
                <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter text-right">MSE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {sortedMetrics.map((m, idx) => (
                <tr key={m.model} className="hover:bg-zinc-50 transition-colors group">
                  <td className="p-4 font-bold text-zinc-900 flex items-center gap-3">
                     <span className="w-6 text-zinc-300 text-xs font-black">{idx + 1}</span>
                     {m.model}
                  </td>
                  <td className="p-4 text-right tabular-nums font-black text-zinc-900">
                    {(m.r2 * 100).toFixed(2)}%
                  </td>
                  <td className="p-4 text-right tabular-nums font-medium text-zinc-500">
                    {m.mse.toFixed(5)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
