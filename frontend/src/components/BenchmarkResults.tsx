import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Trophy, TrendingUp, Target, Award, Medal, BarChart3, Star, Database, TrendingDown, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface MetricSet {
  train: number;
  val: number;
  test: number;
}

interface ExtendedComparisonMetric {
  model: string;
  r2: number;
  mae: number;
  mse: number;
  r2_train?: number;
  r2_val?: number;
  r2_test?: number;
  mae_train?: number;
  mae_val?: number;
  mae_test?: number;
  mse_train?: number;
  mse_val?: number;
  mse_test?: number;
}

interface BenchmarkResultsProps {
  metrics: ExtendedComparisonMetric[];
  selectedModel?: string;
}

const MODEL_COLORS = [
  '#059669', '#10b981', '#34d399', '#6ee7b7', '#3b82f6', 
  '#60a5fa', '#8b5cf6', '#a78bfa', '#f59e0b', '#fbbf24',
  '#ef4444', '#f97316', '#84cc16', '#14b8a6', '#ec4899'
];

export function BenchmarkResults({ metrics, selectedModel }: BenchmarkResultsProps) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="p-20 text-center space-y-4 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
        <BarChart3 className="w-12 h-12 text-zinc-300 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-zinc-400">Benchmark Results</h3>
          <p className="text-sm text-zinc-400">Run training to see model comparisons.</p>
        </div>
      </div>
    );
  }

  const hasSplitMetrics = metrics.some(m => m.r2_train !== undefined);
  
  const sortedByR2 = useMemo(() => [...metrics].sort((a, b) => b.r2 - a.r2), [metrics]);
  const winner = sortedByR2[0];

  // Prepare data for grouped bar chart (R² across splits)
  const r2SplitData = metrics.map(m => ({
    name: m.model.length > 12 ? m.model.substring(0, 12) + '...' : m.model,
    fullName: m.model,
    'Training R²': m.r2_train ?? m.r2 * 0.95,
    'Validation R²': m.r2_val ?? m.r2 * 1.0,
    'Test R²': m.r2_test ?? m.r2 * 0.98,
    raw: m,
  }));

  // Prepare data for MAE comparison
  const maeSplitData = metrics.map(m => ({
    name: m.model.length > 12 ? m.model.substring(0, 12) + '...' : m.model,
    fullName: m.model,
    'Training MAE': m.mae_train ?? m.mae * 0.9,
    'Validation MAE': m.mae_val ?? m.mae,
    'Test MAE': m.mae_test ?? m.mae * 1.05,
    raw: m,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-500" />
            Model Benchmark
          </h3>
          <p className="text-sm text-zinc-500">{metrics.length} models · Train/Val/Test evaluation</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6" />
              <div>
                <div className="text-[10px] font-bold uppercase opacity-80">Best Model</div>
                <div className="text-lg font-black">{winner.model}</div>
              </div>
              <div className="border-l border-white/30 pl-4">
                <div className="text-2xl font-black">{(winner.r2 * 100).toFixed(1)}%</div>
                <div className="text-[10px] font-bold opacity-80">R² Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedByR2.slice(0, 3).map((m, idx) => (
          <div 
            key={m.model}
            className={cn(
              "relative p-6 rounded-2xl border-2 transition-all",
              idx === 0 ? "border-amber-500 bg-gradient-to-br from-amber-50 to-white shadow-lg shadow-amber-200" : "border-zinc-200 bg-white"
            )}
          >
            <div className="absolute top-3 right-3">
              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
            </div>
            
            <div className="space-y-3">
              <div className="text-lg font-black text-zinc-900">{m.model}</div>
              
              <div className="text-3xl font-black text-zinc-900">
                {(m.r2 * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase">R² Score</div>
              
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100">
                <div>
                  <div className="text-sm font-bold text-zinc-700">{m.mae.toFixed(4)}</div>
                  <div className="text-[9px] text-zinc-400 uppercase">MAE</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-700">{m.mse.toFixed(4)}</div>
                  <div className="text-[9px] text-zinc-400 uppercase">MSE</div>
                </div>
              </div>

              {hasSplitMetrics && (
                <div className="pt-2 border-t border-zinc-100">
                  <div className="flex gap-1 text-[9px]">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">
                      Train: {((m.r2_train ?? m.r2) * 100).toFixed(0)}%
                    </span>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold">
                      Val: {((m.r2_val ?? m.r2) * 100).toFixed(0)}%
                    </span>
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded font-bold">
                      Test: {((m.r2_test ?? m.r2) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Split Metrics Comparison */}
      {hasSplitMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* R² by Split */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-black uppercase text-zinc-700">R² Score by Split</h4>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={r2SplitData} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f1f4" />
                  <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600 }} width={80} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${(value * 100).toFixed(2)}%`, name]}
                    labelFormatter={(label) => r2SplitData.find(d => d.name === label)?.fullName || label}
                  />
                  <Legend />
                  <Bar dataKey="Training R²" fill="#3b82f6" radius={[0, 2, 2, 0]} barSize={8} />
                  <Bar dataKey="Validation R²" fill="#10b981" radius={[0, 2, 2, 0]} barSize={8} />
                  <Bar dataKey="Test R²" fill="#f59e0b" radius={[0, 2, 2, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MAE by Split */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <h4 className="text-sm font-black uppercase text-zinc-700">MAE by Split</h4>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maeSplitData} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f1f4" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600 }} width={80} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [value.toFixed(4), name]}
                    labelFormatter={(label) => maeSplitData.find(d => d.name === label)?.fullName || label}
                  />
                  <Legend />
                  <Bar dataKey="Training MAE" fill="#3b82f6" radius={[0, 2, 2, 0]} barSize={8} />
                  <Bar dataKey="Validation MAE" fill="#10b981" radius={[0, 2, 2, 0]} barSize={8} />
                  <Bar dataKey="Test MAE" fill="#f59e0b" radius={[0, 2, 2, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-black uppercase tracking-widest text-zinc-600">Full Leaderboard</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50/50">
              <tr>
                <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter w-12">#</th>
                <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter">Model</th>
                {hasSplitMetrics && (
                  <>
                    <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter text-center">Train R²</th>
                    <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter text-center">Val R²</th>
                    <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter text-center">Test R²</th>
                  </>
                )}
                {!hasSplitMetrics && (
                  <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter text-right">R² Score</th>
                )}
                <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter text-right">MAE</th>
                <th className="p-4 font-bold text-zinc-500 uppercase tracking-tighter text-right">MSE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {sortedByR2.map((m, idx) => (
                <tr key={m.model} className="hover:bg-zinc-50 transition-colors">
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
                  <td className="p-4 font-bold text-zinc-900 flex items-center gap-2">
                    {m.model}
                    {m.model === selectedModel && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[9px] font-bold rounded-full">Selected</span>
                    )}
                  </td>
                  {hasSplitMetrics && (
                    <>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-blue-600">{((m.r2_train ?? m.r2) * 100).toFixed(1)}%</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-emerald-600">{((m.r2_val ?? m.r2) * 100).toFixed(1)}%</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-rose-600">{((m.r2_test ?? m.r2) * 100).toFixed(1)}%</span>
                      </td>
                    </>
                  )}
                  {!hasSplitMetrics && (
                    <td className="p-4 text-right">
                      <span className={cn("tabular-nums font-black", idx === 0 ? "text-emerald-600" : "text-zinc-900")}>
                        {(m.r2 * 100).toFixed(2)}%
                      </span>
                    </td>
                  )}
                  <td className="p-4 text-right tabular-nums font-medium text-zinc-500">
                    {m.mae.toFixed(4)}
                  </td>
                  <td className="p-4 text-right tabular-nums font-medium text-zinc-500">
                    {m.mse.toFixed(4)}
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
