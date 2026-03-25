import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { ComparisonMetric } from '../types';
import { Trophy, TrendingUp, Target, Award, Medal, BarChart3, Star, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface BenchmarkResultsProps {
  metrics: ComparisonMetric[];
  selectedModel?: string;
}

const MODEL_COLORS: Record<string, string> = {
  'XGBoost': '#059669',
  'LightGBM': '#10b981',
  'CatBoost': '#34d399',
  'Random Forest': '#6ee7b7',
  'Gradient Boosting': '#a7f3d0',
  'AdaBoost': '#d1fae5',
  'Decision Tree': '#ecfdf5',
  'SVR': '#f59e0b',
  'KNN': '#fbbf24',
  'Ridge Regression': '#3b82f6',
  'Lasso Regression': '#60a5fa',
  'ElasticNet': '#93c5fd',
  'Linear Regression': '#bfdbfe',
  'ANN': '#8b5cf6',
  'MLP': '#a78bfa',
  'CNN': '#c4b5fd',
  'LSTM': '#ddddd',
  'GRU': '#e9d5ff',
  'Transformer': '#f5f3ff',
};

export function BenchmarkResults({ metrics, selectedModel }: BenchmarkResultsProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="p-20 text-center space-y-4 bg-zinc-50 rounded-[40px] border-2 border-dashed border-zinc-200">
        <BarChart3 className="w-12 h-12 text-zinc-300 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-zinc-400">Benchmark Results</h3>
          <p className="text-sm text-zinc-400">Run a training session to see benchmark comparisons.</p>
        </div>
      </div>
    );
  }

  const sortedByR2 = useMemo(() => [...metrics].sort((a, b) => b.r2 - a.r2), [metrics]);
  const sortedByMAE = useMemo(() => [...metrics].sort((a, b) => a.mae - b.mae), [metrics]);
  const sortedByMSE = useMemo(() => [...metrics].sort((a, b) => a.mse - b.mse), [metrics]);
  
  const winner = sortedByR2[0];
  const maxMAE = Math.max(...metrics.map(met => met.mae), 0.001);
  const maxMSE = Math.max(...metrics.map(met => met.mse), 0.001);
  const normalizedData = metrics.map(m => ({
    name: m.model,
    r2: parseFloat((m.r2 * 100).toFixed(2)),
    mae: parseFloat(m.mae.toFixed(4)),
    mse: parseFloat((m.mse * 1000).toFixed(4)),
    r2Norm: m.r2,
    maeNorm: 1 - (m.mae / maxMAE),
    mseNorm: 1 - (m.mse / maxMSE),
  }));

  const radarData = normalizedData.slice(0, 6).map(m => ({
    model: m.name.length > 10 ? m.name.substring(0, 10) + '...' : m.name,
    r2: Math.round(m.r2Norm * 100),
    mae: Math.round(m.maeNorm * 100),
    mse: Math.round(m.mseNorm * 100),
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-500" />
            Model Benchmark Results
          </h3>
          <p className="text-sm text-zinc-500">Comparing {metrics.length} regression architectures on your dataset</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-xl shadow-amber-200">
            <Trophy className="w-6 h-6 fill-current" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Best Model</div>
              <div className="text-lg font-black">{winner.model}</div>
            </div>
            <div className="border-l border-white/30 pl-4">
              <div className="text-2xl font-black">{(winner.r2 * 100).toFixed(1)}%</div>
              <div className="text-[10px] font-bold uppercase opacity-80">R² Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sortedByR2.slice(0, 3).map((m, idx) => (
          <div 
            key={m.model}
            className={cn(
              "relative p-8 rounded-3xl border-2 transition-all hover:scale-[1.02]",
              idx === 0 ? "border-amber-500 bg-gradient-to-br from-amber-50 to-white shadow-lg shadow-amber-200" : "border-zinc-100 bg-white"
            )}
          >
            <div className="absolute top-4 right-4">
              <Medal className={cn(
                "w-10 h-10",
                idx === 0 ? "text-amber-500" : idx === 1 ? "text-zinc-400" : "text-orange-400"
              )} />
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} Rank #{idx + 1}
                </div>
                <div className="text-xl font-black text-zinc-900">{m.model}</div>
              </div>

              <div className="py-3">
                <div className="text-4xl font-black text-zinc-900 tabular-nums">
                  {(m.r2 * 100).toFixed(2)}%
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                  R² Variance Explained
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-8 bg-white border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-zinc-700" />
              <h4 className="text-sm font-black uppercase tracking-widest text-zinc-700">R² Score Comparison</h4>
            </div>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={normalizedData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f1f4" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: '#f8f8fa' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'R² Score']}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Bar dataKey="r2" radius={[0, 4, 4, 0]} barSize={20}>
                  {normalizedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === selectedModel ? '#8b5cf6' : index === 0 ? '#059669' : '#e4e4e7'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-8 bg-white border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-zinc-700" />
              <h4 className="text-sm font-black uppercase tracking-widest text-zinc-700">Top 6 Radar View</h4>
            </div>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e4e4e7" />
                <PolarAngleAxis dataKey="model" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#a1a1aa', fontSize: 9 }} />
                <Radar name="R² Score" dataKey="r2" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                <Radar name="Inverse MAE" dataKey="mae" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden border border-zinc-100 shadow-sm bg-white rounded-2xl">
        <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-black uppercase tracking-widest text-zinc-600">Full Leaderboard</span>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50/50">
            <tr>
              <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter">#</th>
              <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter">Architecture</th>
              <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter text-right">R² Score</th>
              <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter text-right">MAE</th>
              <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter text-right">MSE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {sortedByR2.map((m, idx) => (
              <tr key={m.model} className="hover:bg-zinc-50 transition-colors group">
                <td className="p-4">
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
                    idx === 0 ? "bg-amber-100 text-amber-700" : 
                    idx === 1 ? "bg-zinc-200 text-zinc-600" :
                    idx === 2 ? "bg-orange-100 text-orange-700" : "bg-zinc-50 text-zinc-400"
                  )}>
                    {idx + 1}
                  </span>
                </td>
                <td className="p-4 font-bold text-zinc-900 flex items-center gap-3">
                  {m.model}
                  {m.model === selectedModel && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[9px] font-bold rounded-full">Selected</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <span className={cn(
                    "tabular-nums font-black",
                    idx === 0 ? "text-emerald-600" : "text-zinc-900"
                  )}>
                    {(m.r2 * 100).toFixed(2)}%
                  </span>
                </td>
                <td className="p-4 text-right tabular-nums font-medium text-zinc-500">
                  {m.mae.toFixed(5)}
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
  );
}
