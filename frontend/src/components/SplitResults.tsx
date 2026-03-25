import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Table, TrendingUp, TrendingDown, Award, Target, BarChart3, Activity, Layers, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface ExtendedMetric {
  model: string;
  model_id?: string;
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

interface SplitResultsProps {
  metrics: ExtendedMetric[];
  selectedModel?: string;
  runId?: string | null;
}

type SortKey = 'r2_test' | 'r2_val' | 'r2_train' | 'mae_test' | 'mae_val' | 'mae_train' | 'mse_test' | 'mse_val' | 'mse_train';

const SPLIT_COLORS = {
  train: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', fill: '#3b82f6' },
  val: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', fill: '#10b981' },
  test: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', fill: '#ef4444' },
};

const MODEL_COLORS = [
  '#059669', '#10b981', '#34d399', '#6ee7b7', '#3b82f6',
  '#60a5fa', '#8b5cf6', '#a78bfa', '#f59e0b', '#fbbf24',
  '#ef4444', '#f97316', '#84cc16', '#14b8a6', '#ec4899',
];

function QualityBadge({ r2 }: { r2: number }) {
  if (r2 >= 0.95) return <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-emerald-100 text-emerald-700 uppercase">Excellent</span>;
  if (r2 >= 0.85) return <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-green-100 text-green-700 uppercase">Great</span>;
  if (r2 >= 0.70) return <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-blue-100 text-blue-700 uppercase">Good</span>;
  if (r2 >= 0.50) return <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-amber-100 text-amber-700 uppercase">Fair</span>;
  return <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-red-100 text-red-700 uppercase">Poor</span>;
}

function OverfitBadge({ trainR2, valR2 }: { trainR2: number; valR2: number }) {
  const gap = trainR2 - valR2;
  if (gap < 0.05) return <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-emerald-100 text-emerald-700">Well Fit</span>;
  if (gap < 0.15) return <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-amber-100 text-amber-700">Slight Overfit</span>;
  return <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-red-100 text-red-700 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />Overfitting</span>;
}

export function SplitResults({ metrics, selectedModel, runId }: SplitResultsProps) {
  const [sortKey, setSortKey] = useState<SortKey>('r2_test');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  if (!metrics || metrics.length === 0) {
    return (
      <div className="p-20 text-center space-y-4 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
        <Table className="w-12 h-12 text-zinc-300 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-zinc-400">Split Results</h3>
          <p className="text-sm text-zinc-400">Run training to see Train / Val / Test breakdown.</p>
        </div>
      </div>
    );
  }

  const hasSplitMetrics = metrics.some(m => m.r2_train !== undefined);

  const sorted = useMemo(() => {
    return [...metrics].sort((a, b) => {
      const av = (a as any)[sortKey] ?? 0;
      const bv = (b as any)[sortKey] ?? 0;
      return sortAsc ? av - bv : bv - av;
    });
  }, [metrics, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc ? <ArrowUp className="w-3 h-3 ml-0.5" /> : <ArrowDown className="w-3 h-3 ml-0.5" />;
  };

  // Find best per split
  const bestR2Train = hasSplitMetrics ? metrics.reduce((a, b) => (a.r2_train ?? 0) > (b.r2_train ?? 0) ? a : b) : null;
  const bestR2Val = hasSplitMetrics ? metrics.reduce((a, b) => (a.r2_val ?? 0) > (b.r2_val ?? 0) ? a : b) : null;
  const bestR2Test = hasSplitMetrics ? metrics.reduce((a, b) => (a.r2_test ?? 0) > (b.r2_test ?? 0) ? a : b) : null;
  const bestMAETrain = hasSplitMetrics ? metrics.reduce((a, b) => (a.mae_train ?? 1) < (b.mae_train ?? 1) ? a : b) : null;
  const bestMAEVal = hasSplitMetrics ? metrics.reduce((a, b) => (a.mae_val ?? 1) < (b.mae_val ?? 1) ? a : b) : null;
  const bestMAETest = hasSplitMetrics ? metrics.reduce((a, b) => (a.mae_test ?? 1) < (b.mae_test ?? 1) ? a : b) : null;
  const bestMSETrain = hasSplitMetrics ? metrics.reduce((a, b) => (a.mse_train ?? 1) < (b.mse_train ?? 1) ? a : b) : null;
  const bestMSEVal = hasSplitMetrics ? metrics.reduce((a, b) => (a.mse_val ?? 1) < (b.mse_val ?? 1) ? a : b) : null;
  const bestMSETest = hasSplitMetrics ? metrics.reduce((a, b) => (a.mse_test ?? 1) < (b.mse_test ?? 1) ? a : b) : null;

  // Radar data for top 5 models
  const top5 = sorted.slice(0, 5);
  const radarData = hasSplitMetrics ? ['R² (Train)', 'R² (Val)', 'R² (Test)', '1-MAE (Train)', '1-MAE (Val)', '1-MAE (Test)'].map(label => {
    const obj: any = { metric: label };
    top5.forEach(m => {
      const key = m.model;
      if (label.includes('R² (Train)')) obj[key] = (m.r2_train ?? 0) * 100;
      else if (label.includes('R² (Val)')) obj[key] = (m.r2_val ?? 0) * 100;
      else if (label.includes('R² (Test)')) obj[key] = (m.r2_test ?? 0) * 100;
      else if (label.includes('1-MAE (Train)')) obj[key] = Math.max(0, (1 - (m.mae_train ?? 1))) * 100;
      else if (label.includes('1-MAE (Val)')) obj[key] = Math.max(0, (1 - (m.mae_val ?? 1))) * 100;
      else obj[key] = Math.max(0, (1 - (m.mae_test ?? 1))) * 100;
    });
    return obj;
  }) : [];

  // Grouped bar chart data
  const groupedData = hasSplitMetrics ? metrics.map(m => ({
    name: m.model.length > 15 ? m.model.substring(0, 15) + '..' : m.model,
    fullName: m.model,
    'Train': (m.r2_train ?? 0) * 100,
    'Val': (m.r2_val ?? 0) * 100,
    'Test': (m.r2_test ?? 0) * 100,
  })) : [];

  const maeGroupedData = hasSplitMetrics ? metrics.map(m => ({
    name: m.model.length > 15 ? m.model.substring(0, 15) + '..' : m.model,
    fullName: m.model,
    'Train MAE': m.mae_train ?? 0,
    'Val MAE': m.mae_val ?? 0,
    'Test MAE': m.mae_test ?? 0,
  })) : [];

  const mseGroupedData = hasSplitMetrics ? metrics.map(m => ({
    name: m.model.length > 15 ? m.model.substring(0, 15) + '..' : m.model,
    fullName: m.model,
    'Train MSE': m.mse_train ?? 0,
    'Val MSE': m.mse_val ?? 0,
    'Test MSE': m.mse_test ?? 0,
  })) : [];

  const rmseGroupedData = hasSplitMetrics ? metrics.map(m => ({
    name: m.model.length > 15 ? m.model.substring(0, 15) + '..' : m.model,
    fullName: m.model,
    'Train RMSE': Math.sqrt(m.mse_train ?? 0),
    'Val RMSE': Math.sqrt(m.mse_val ?? 0),
    'Test RMSE': Math.sqrt(m.mse_test ?? 0),
  })) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Table className="w-7 h-7 text-indigo-500" />
            Split Results Summary
          </h3>
          <p className="text-sm text-zinc-500">
            {metrics.length} models · Train (80%) / Val (10%) / Test (10%)
            {runId && <span className="ml-2 font-mono text-zinc-400">Run: {runId}</span>}
          </p>
        </div>
      </div>

      {/* Best Per Split Summary Cards */}
      {hasSplitMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { split: 'Train', color: SPLIT_COLORS.train, bestR2: bestR2Train, bestMAE: bestMAETrain, bestMSE: bestMSETrain },
            { split: 'Validation', color: SPLIT_COLORS.val, bestR2: bestR2Val, bestMAE: bestMAEVal, bestMSE: bestMSEVal },
            { split: 'Test', color: SPLIT_COLORS.test, bestR2: bestR2Test, bestMAE: bestMAETest, bestMSE: bestMSETest },
          ].map(({ split, color, bestR2, bestMAE, bestMSE }) => (
            <div key={split} className={cn("p-5 rounded-2xl border-2", color.border, color.bg)}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-3 h-3 rounded-full", color.dot)} />
                <span className={cn("text-xs font-black uppercase tracking-widest", color.text)}>{split} Split</span>
              </div>
              {bestR2 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-bold">Best R²</span>
                    <span className="text-lg font-black font-mono text-zinc-900">{(((bestR2 as any)[`r2_${split === 'Train' ? 'train' : split === 'Validation' ? 'val' : 'test'}`]) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    <span className="font-bold text-zinc-700">{(bestR2 as ExtendedMetric).model}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/50">
                    <div>
                      <div className="text-xs font-bold font-mono text-zinc-700">{((bestMAE as any)[`mae_${split === 'Train' ? 'train' : split === 'Validation' ? 'val' : 'test'}`])?.toFixed(4) || '—'}</div>
                      <div className="text-[9px] text-zinc-400 uppercase">Best MAE</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono text-zinc-700">{((bestMSE as any)[`mse_${split === 'Train' ? 'train' : split === 'Validation' ? 'val' : 'test'}`])?.toFixed(6) || '—'}</div>
                      <div className="text-[9px] text-zinc-400 uppercase">Best MSE</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Charts Row 1: R², MAE, MSE, RMSE */}
      {hasSplitMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* R² Grouped Bar */}
          <div className="bg-white rounded-2xl border-2 border-zinc-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-600">R² Score (%) by Split</h4>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupedData} layout="vertical" margin={{ left: 90, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f1f4" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700 }} width={85} />
                  <Tooltip formatter={(v: number, n: string) => [`${v.toFixed(1)}%`, n]} labelFormatter={(l) => groupedData.find(d => d.name === l)?.fullName || l} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                  <Bar dataKey="Train" fill={SPLIT_COLORS.train.fill} radius={[0, 3, 3, 0]} barSize={7} />
                  <Bar dataKey="Val" fill={SPLIT_COLORS.val.fill} radius={[0, 3, 3, 0]} barSize={7} />
                  <Bar dataKey="Test" fill={SPLIT_COLORS.test.fill} radius={[0, 3, 3, 0]} barSize={7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MAE Grouped Bar */}
          <div className="bg-white rounded-2xl border-2 border-zinc-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-600">MAE by Split</h4>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maeGroupedData} layout="vertical" margin={{ left: 90, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f1f4" />
                  <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => v.toFixed(2)} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700 }} width={85} />
                  <Tooltip formatter={(v: number, n: string) => [v.toFixed(4), n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                  <Bar dataKey="Train MAE" fill={SPLIT_COLORS.train.fill} radius={[0, 3, 3, 0]} barSize={7} />
                  <Bar dataKey="Val MAE" fill={SPLIT_COLORS.val.fill} radius={[0, 3, 3, 0]} barSize={7} />
                  <Bar dataKey="Test MAE" fill={SPLIT_COLORS.test.fill} radius={[0, 3, 3, 0]} barSize={7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 2: MSE and RMSE */}
      {hasSplitMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MSE Grouped Bar */}
          <div className="bg-white rounded-2xl border-2 border-zinc-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-600">MSE by Split</h4>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mseGroupedData} layout="vertical" margin={{ left: 90, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f1f4" />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700 }} width={85} />
                  <Tooltip formatter={(v: number, n: string) => [v.toFixed(6), n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                  <Bar dataKey="Train MSE" fill={SPLIT_COLORS.train.fill} radius={[0, 3, 3, 0]} barSize={7} />
                  <Bar dataKey="Val MSE" fill={SPLIT_COLORS.val.fill} radius={[0, 3, 3, 0]} barSize={7} />
                  <Bar dataKey="Test MSE" fill={SPLIT_COLORS.test.fill} radius={[0, 3, 3, 0]} barSize={7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RMSE Grouped Bar */}
          <div className="bg-white rounded-2xl border-2 border-zinc-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-600">RMSE by Split</h4>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rmseGroupedData} layout="vertical" margin={{ left: 90, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f1f4" />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700 }} width={85} />
                  <Tooltip formatter={(v: number, n: string) => [v.toFixed(4), n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                  <Bar dataKey="Train RMSE" fill={SPLIT_COLORS.train.fill} radius={[0, 3, 3, 0]} barSize={7} />
                  <Bar dataKey="Val RMSE" fill={SPLIT_COLORS.val.fill} radius={[0, 3, 3, 0]} barSize={7} />
                  <Bar dataKey="Test RMSE" fill={SPLIT_COLORS.test.fill} radius={[0, 3, 3, 0]} barSize={7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Radar Chart - Top 5 Models */}
      {hasSplitMetrics && radarData.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-600">Top 5 Models — Radar Comparison</h4>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="#e5e5e5" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fontWeight: 700, fill: '#71717a' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                {top5.map((m, i) => (
                  <Radar key={m.model} name={m.model} dataKey={m.model} stroke={MODEL_COLORS[i]} fill={MODEL_COLORS[i]} fillOpacity={0.1} strokeWidth={2} />
                ))}
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip formatter={(v: number) => [v.toFixed(1), '']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Full Detailed Table */}
      <div className="bg-white rounded-2xl border-2 border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-600">
              Complete Results Table
            </span>
            <span className="text-[10px] text-zinc-400 font-bold">({metrics.length} models)</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-bold">
            Click any header to sort
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-zinc-50/80">
              <tr>
                <th className="p-3 font-bold text-zinc-500 uppercase tracking-tighter w-8">#</th>
                <th className="p-3 font-bold text-zinc-500 uppercase tracking-tighter">Model</th>
                <th className="p-3 font-bold text-zinc-500 uppercase tracking-tighter text-center">Quality</th>
                {hasSplitMetrics && (
                  <>
                    {/* R² columns */}
                    <th className="p-3 font-bold text-blue-600 uppercase tracking-tighter text-center cursor-pointer hover:bg-blue-50" onClick={() => handleSort('r2_train')}>
                      <div className="flex items-center justify-center">Train R² <SortIcon col="r2_train" /></div>
                    </th>
                    <th className="p-3 font-bold text-emerald-600 uppercase tracking-tighter text-center cursor-pointer hover:bg-emerald-50" onClick={() => handleSort('r2_val')}>
                      <div className="flex items-center justify-center">Val R² <SortIcon col="r2_val" /></div>
                    </th>
                    <th className="p-3 font-bold text-rose-600 uppercase tracking-tighter text-center cursor-pointer hover:bg-rose-50" onClick={() => handleSort('r2_test')}>
                      <div className="flex items-center justify-center">Test R² <SortIcon col="r2_test" /></div>
                    </th>
                    {/* MAE columns */}
                    <th className="p-3 font-bold text-blue-600 uppercase tracking-tighter text-center cursor-pointer hover:bg-blue-50" onClick={() => handleSort('mae_train')}>
                      <div className="flex items-center justify-center">Train MAE <SortIcon col="mae_train" /></div>
                    </th>
                    <th className="p-3 font-bold text-emerald-600 uppercase tracking-tighter text-center cursor-pointer hover:bg-emerald-50" onClick={() => handleSort('mae_val')}>
                      <div className="flex items-center justify-center">Val MAE <SortIcon col="mae_val" /></div>
                    </th>
                    <th className="p-3 font-bold text-rose-600 uppercase tracking-tighter text-center cursor-pointer hover:bg-rose-50" onClick={() => handleSort('mae_test')}>
                      <div className="flex items-center justify-center">Test MAE <SortIcon col="mae_test" /></div>
                    </th>
                    {/* MSE columns */}
                    <th className="p-3 font-bold text-blue-600 uppercase tracking-tighter text-center cursor-pointer hover:bg-blue-50" onClick={() => handleSort('mse_train')}>
                      <div className="flex items-center justify-center">Train MSE <SortIcon col="mse_train" /></div>
                    </th>
                    <th className="p-3 font-bold text-emerald-600 uppercase tracking-tighter text-center cursor-pointer hover:bg-emerald-50" onClick={() => handleSort('mse_val')}>
                      <div className="flex items-center justify-center">Val MSE <SortIcon col="mse_val" /></div>
                    </th>
                    <th className="p-3 font-bold text-rose-600 uppercase tracking-tighter text-center cursor-pointer hover:bg-rose-50" onClick={() => handleSort('mse_test')}>
                      <div className="flex items-center justify-center">Test MSE <SortIcon col="mse_test" /></div>
                    </th>
                    {/* RMSE columns */}
                    <th className="p-3 font-bold text-blue-600 uppercase tracking-tighter text-center">Train RMSE</th>
                    <th className="p-3 font-bold text-emerald-600 uppercase tracking-tighter text-center">Val RMSE</th>
                    <th className="p-3 font-bold text-rose-600 uppercase tracking-tighter text-center">Test RMSE</th>
                    {/* Fit Status */}
                    <th className="p-3 font-bold text-zinc-500 uppercase tracking-tighter text-center">Fit Status</th>
                  </>
                )}
                {!hasSplitMetrics && (
                  <>
                    <th className="p-3 font-bold text-zinc-500 uppercase tracking-tighter text-right">R²</th>
                    <th className="p-3 font-bold text-zinc-500 uppercase tracking-tighter text-right">MAE</th>
                    <th className="p-3 font-bold text-zinc-500 uppercase tracking-tighter text-right">MSE</th>
                    <th className="p-3 font-bold text-zinc-500 uppercase tracking-tighter text-right">RMSE</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {sorted.map((m, idx) => {
                const trainR2 = m.r2_train ?? m.r2;
                const valR2 = m.r2_val ?? m.r2;
                const testR2 = m.r2_test ?? m.r2;
                const isBest = m.model === bestR2Test?.model;
                const isSelected = m.model === selectedModel;

                return (
                  <tr
                    key={m.model}
                    className={cn(
                      "transition-colors",
                      isBest ? "bg-amber-50/50" : isSelected ? "bg-purple-50/30" : "hover:bg-zinc-50"
                    )}
                  >
                    <td className="p-3">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
                        idx === 0 ? "bg-amber-100 text-amber-700" :
                        idx === 1 ? "bg-zinc-200 text-zinc-600" :
                        idx === 2 ? "bg-orange-100 text-orange-700" : "bg-zinc-50 text-zinc-400"
                      )}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-zinc-900">
                      <div className="flex items-center gap-1.5">
                        {m.model}
                        {isSelected && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[8px] font-bold rounded-full">SEL</span>}
                        {isBest && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold rounded-full">BEST</span>}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <QualityBadge r2={testR2} />
                    </td>
                    {hasSplitMetrics && (
                      <>
                        <td className="p-3 text-center tabular-nums font-bold text-blue-700">{(trainR2 * 100).toFixed(1)}%</td>
                        <td className="p-3 text-center tabular-nums font-bold text-emerald-700">{(valR2 * 100).toFixed(1)}%</td>
                        <td className="p-3 text-center tabular-nums font-bold text-rose-700">{(testR2 * 100).toFixed(1)}%</td>
                        <td className="p-3 text-center tabular-nums font-medium text-blue-600">{(m.mae_train ?? 0).toFixed(4)}</td>
                        <td className="p-3 text-center tabular-nums font-medium text-emerald-600">{(m.mae_val ?? 0).toFixed(4)}</td>
                        <td className="p-3 text-center tabular-nums font-medium text-rose-600">{(m.mae_test ?? 0).toFixed(4)}</td>
                        <td className="p-3 text-center tabular-nums font-medium text-blue-500">{(m.mse_train ?? 0).toFixed(6)}</td>
                        <td className="p-3 text-center tabular-nums font-medium text-emerald-500">{(m.mse_val ?? 0).toFixed(6)}</td>
                        <td className="p-3 text-center tabular-nums font-medium text-rose-500">{(m.mse_test ?? 0).toFixed(6)}</td>
                        <td className="p-3 text-center tabular-nums font-medium text-blue-400">{Math.sqrt(m.mse_train ?? 0).toFixed(4)}</td>
                        <td className="p-3 text-center tabular-nums font-medium text-emerald-400">{Math.sqrt(m.mse_val ?? 0).toFixed(4)}</td>
                        <td className="p-3 text-center tabular-nums font-medium text-rose-400">{Math.sqrt(m.mse_test ?? 0).toFixed(4)}</td>
                        <td className="p-3 text-center">
                          <OverfitBadge trainR2={trainR2} valR2={valR2} />
                        </td>
                      </>
                    )}
                    {!hasSplitMetrics && (
                      <>
                        <td className="p-3 text-right tabular-nums font-black text-zinc-900">{(m.r2 * 100).toFixed(2)}%</td>
                        <td className="p-3 text-right tabular-nums text-zinc-500">{m.mae.toFixed(4)}</td>
                        <td className="p-3 text-right tabular-nums text-zinc-500">{m.mse.toFixed(4)}</td>
                        <td className="p-3 text-right tabular-nums text-zinc-500">{Math.sqrt(m.mse).toFixed(4)}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
