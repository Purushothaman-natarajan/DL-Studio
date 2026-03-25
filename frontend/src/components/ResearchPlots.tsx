import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, ScatterChart, Scatter, AreaChart, Area,
  ComposedChart, Legend
} from 'recharts';
import { XAIResult } from '../types';
import { 
  Download, Settings, Target, Layers, Grid3X3, Activity, 
  TrendingUp, BarChart3, PieChart as PieChartIcon,
  ArrowUpDown, ChevronDown, ChevronUp, RefreshCw, Image, FileImage,
  Table, Percent, Gauge
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ResearchPlotsProps {
  result: XAIResult | null;
  targets: { name: string }[];
  onExport?: () => void;
}

type PlotCategory = 'regression' | 'importance' | 'correlation' | 'advanced';

const PLOT_TYPES = {
  regression: [
    { id: 'actual_vs_predicted', label: 'Actual vs Predicted', icon: ScatterChart, desc: 'Scatter with perfect line' },
    { id: 'residual_scatter', label: 'Residual Plot', icon: Activity, desc: 'Residuals vs predicted' },
    { id: 'residual_histogram', label: 'Error Distribution', icon: BarChart3, desc: 'Histogram of errors' },
    { id: 'error_vs_actual', label: 'Error vs Actual', icon: TrendingUp, desc: 'Error magnitude' },
    { id: 'cumulative_error', label: 'Cumulative Error', icon: Percent, desc: 'Cumulative distribution' },
  ],
  importance: [
    { id: 'importance_bar', label: 'Feature Importance', icon: BarChart3, desc: 'Horizontal bar chart' },
    { id: 'importance_ranked', label: 'Ranked Importance', icon: Table, desc: 'Features ranked by impact' },
    { id: 'cumulative_importance', label: 'Cumulative Impact', icon: Layers, desc: 'Cumulative contribution' },
    { id: 'sensitivity_curves', label: 'Sensitivity Analysis', icon: Activity, desc: 'Feature effect curves' },
  ],
  correlation: [
    { id: 'correlation_heatmap', label: 'Correlation Heatmap', icon: Grid3X3, desc: 'Full correlation matrix' },
    { id: 'top_correlations', label: 'Top Correlations', icon: Target, desc: 'Highest correlations' },
    { id: 'feature_pairs', label: 'Feature Pairs', icon: ScatterChart, desc: 'Scatter of correlated pairs' },
  ],
  advanced: [
    { id: 'parity_plot', label: 'Parity Plot', icon: Gauge, desc: 'Multi-target comparison' },
    { id: 'residual_qq', label: 'Q-Q Plot', icon: Percent, desc: 'Normality check' },
    { id: 'error_percentiles', label: 'Error Percentiles', icon: BarChart3, desc: 'Percentile distribution' },
  ],
};

export function ResearchPlots({ result, targets, onExport }: ResearchPlotsProps) {
  const [selectedTarget, setSelectedTarget] = useState(targets[0]?.name || '');
  const [selectedCategory, setSelectedCategory] = useState<PlotCategory>('regression');
  const [selectedPlot, setSelectedPlot] = useState<string>('actual_vs_predicted');
  const [topN, setTopN] = useState(10);

  if (!result) return null;

  const residuals = result.residuals || [];
  const importance = result.featureImportance || [];
  const correlation = result.correlationMatrix || [];
  
  const actual = residuals.map(r => r.actual);
  const predicted = residuals.map(r => r.predicted);
  const errors = residuals.map(r => r.residual);
  
  const chartData = useMemo(() => residuals.map((r, i) => ({
    index: i,
    actual: r.actual,
    predicted: r.predicted,
    residual: r.residual,
    absError: Math.abs(r.residual),
  })), [residuals]);

  const sortedImportance = useMemo(() => [...importance].sort((a, b) => b.importance - a.importance).slice(0, topN), [importance, topN]);
  
  const correlationData = useMemo(() => {
    const uniqueFeatures = [...new Set(correlation.map(c => c.x))];
    return uniqueFeatures.slice(0, topN).map(f1 => {
      const row: any = { feature: f1 };
      uniqueFeatures.slice(0, topN).forEach(f2 => {
        const cell = correlation.find(c => c.x === f1 && c.y === f2);
        row[f2] = cell?.value || 0;
      });
      return row;
    });
  }, [correlation, topN]);

  const getCorrelationColor = (val: number) => {
    const abs = Math.abs(val);
    if (val > 0) return `rgba(59, 130, 246, ${abs})`;
    return `rgba(239, 68, 68, ${abs})`;
  };

  const renderPlot = () => {
    const plots = PLOT_TYPES[selectedCategory];
    const plotDef = plots.find(p => p.id === selectedPlot);
    
    switch (selectedPlot) {
      case 'actual_vs_predicted':
        const minVal = Math.min(...actual, ...predicted);
        const maxVal = Math.max(...actual, ...predicted);
        return (
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="actual" name="Actual" tick={{ fontSize: 10 }} />
                <YAxis dataKey="predicted" name="Predicted" tick={{ fontSize: 10 }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-lg">
                          <p className="text-[10px] text-zinc-500">Sample #{d.index}</p>
                          <p className="text-xs font-bold">Actual: {d.actual?.toFixed(4)}</p>
                          <p className="text-xs font-bold text-blue-600">Predicted: {d.predicted?.toFixed(4)}</p>
                          <p className="text-[10px] text-red-500">Error: {d.residual?.toFixed(4)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={chartData} fill="#3b82f6" fillOpacity={0.6} />
                <Line type="linear" data={[{x: minVal, y: minVal}, {x: maxVal, y: maxVal}]} dataKey="y" stroke="#18181b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );

      case 'residual_scatter':
        return (
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="predicted" name="Predicted" tick={{ fontSize: 10 }} />
                <YAxis dataKey="residual" name="Residual" tick={{ fontSize: 10 }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-lg">
                          <p className="text-[10px] text-zinc-500">Sample #{d.index}</p>
                          <p className="text-xs font-bold">Predicted: {d.predicted?.toFixed(4)}</p>
                          <p className="text-xs font-bold" style={{ color: d.residual > 0 ? '#3b82f6' : '#ef4444' }}>
                            Residual: {d.residual?.toFixed(4)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={chartData} fill="#3b82f6" fillOpacity={0.6} />
                <Line type="linear" data={[{x: Math.min(...predicted), y: 0}, {x: Math.max(...predicted), y: 0}]} dataKey="y" stroke="#18181b" strokeWidth={1} strokeDasharray="3 3" dot={false} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );

      case 'residual_histogram':
        const binSize = 20;
        const minErr = Math.min(...errors);
        const maxErr = Math.max(...errors);
        const bins = Math.ceil((maxErr - minErr) / binSize);
        const histogram = Array.from({ length: bins }, (_, i) => {
          const start = minErr + i * binSize;
          const end = start + binSize;
          const count = errors.filter(e => e >= start && e < end).length;
          return { range: `${start.toFixed(1)}`, count, start };
        });
        return (
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogram}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'importance_bar':
        return (
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedImportance} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="importance" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'importance_ranked':
        return (
          <div className="space-y-1 max-h-[450px] overflow-y-auto">
            {sortedImportance.map((f, i) => (
              <div key={f.feature} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-zinc-100">
                <span className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">{i + 1}</span>
                <span className="flex-1 text-xs font-bold text-zinc-700 truncate">{f.feature}</span>
                <div className="w-32 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${f.importance}%` }} />
                </div>
                <span className="text-xs font-mono font-bold text-blue-600 w-16 text-right">{f.importance.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        );

      case 'cumulative_importance':
        const total = sortedImportance.reduce((s, f) => s + f.importance, 0);
        let cumSum = 0;
        const cumData = sortedImportance.map(f => {
          cumSum += f.importance;
          return { feature: f.feature, cumulative: (cumSum / total) * 100 };
        });
        return (
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="feature" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Cumulative']} />
                <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'correlation_heatmap':
        return (
          <div className="overflow-auto max-h-[450px]">
            <div className="inline-block min-w-full">
              <div 
                className="grid gap-px bg-zinc-200 border border-zinc-200 rounded-xl overflow-hidden"
                style={{ gridTemplateColumns: `100px repeat(${Math.min(topN, correlationData.length)}, 1fr)` }}
              >
                <div className="bg-zinc-50 p-2" />
                {correlationData[0] && Object.keys(correlationData[0]).filter(k => k !== 'feature').map(key => (
                  <div key={key} className="bg-zinc-50 p-2 text-[7px] font-bold text-zinc-600 text-center truncate">
                    {key}
                  </div>
                ))}
                {correlationData.map(row => (
                  <React.Fragment key={row.feature}>
                    <div className="bg-zinc-50 p-2 text-[7px] font-bold text-zinc-600 truncate">{row.feature}</div>
                    {Object.keys(row).filter(k => k !== 'feature').map(key => (
                      <div 
                        key={key}
                        className="flex items-center justify-center p-1 text-[8px] font-mono"
                        style={{ backgroundColor: getCorrelationColor(row[key]) }}
                      >
                        <span className={Math.abs(row[key]) > 0.5 ? 'text-white font-bold' : 'text-zinc-800'}>
                          {row[key].toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        );

      case 'error_vs_actual':
        return (
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="actual" name="Actual" tick={{ fontSize: 10 }} />
                <YAxis dataKey="absError" name="|Error|" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Scatter data={chartData} fill="#ef4444" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );

      case 'cumulative_error':
        const sortedErrors = [...errors].sort((a, b) => a - b);
        const cumErr = sortedErrors.map((e, i) => ({ error: e, percentile: ((i + 1) / errors.length) * 100 }));
        return (
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumErr}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="percentile" tick={{ fontSize: 10 }} label={{ value: 'Percentile', position: 'insideBottom' }} />
                <YAxis dataKey="error" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="error" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'sensitivity_curves':
        const sensData = result.sensitivityData || [];
        if (sensData.length === 0) return <div className="h-[450px] flex items-center justify-center text-zinc-400">No sensitivity data available</div>;
        return (
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensData[0]?.points || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'parity_plot':
        return (
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.slice(0, 30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual" />
                <Bar dataKey="predicted" fill="#10b981" name="Predicted" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'residual_qq':
        const sortedRes = [...errors].sort((a, b) => a - b);
        const n = sortedRes.length;
        const qqData = sortedRes.map((r, i) => ({
          theoretical: (i + 0.5) / n,
          sample: r,
        }));
        return (
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="theoretical" name="Theoretical" tick={{ fontSize: 10 }} />
                <YAxis dataKey="sample" name="Sample" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Scatter data={qqData} fill="#3b82f6" fillOpacity={0.6} />
                <Line type="linear" data={[{x: 0, y: 0}, {x: 1, y: sortedRes[n-1] - sortedRes[0]}]} dataKey="y" stroke="#ef4444" strokeWidth={2} dot={false} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );

      case 'error_percentiles':
        const percentiles = [5, 10, 25, 50, 75, 90, 95];
        const sortedAbsErrors = [...errors.map(Math.abs)].sort((a, b) => a - b);
        const pctData = percentiles.map(p => ({
          percentile: p,
          value: sortedAbsErrors[Math.floor((p / 100) * sortedAbsErrors.length)] || 0,
        }));
        return (
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pctData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="percentile" tick={{ fontSize: 10 }} label={{ value: 'Percentile', position: 'insideBottom' }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'top_correlations':
        const topCorrs = [...correlation]
          .filter(c => c.x !== c.y)
          .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
          .slice(0, topN);
        return (
          <div className="space-y-2 max-h-[450px] overflow-y-auto">
            {topCorrs.map((c, i) => (
              <div key={`${c.x}-${c.y}`} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-zinc-100">
                <span className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">{i + 1}</span>
                <span className="flex-1 text-xs text-zinc-700">{c.x} <span className="text-zinc-400">vs</span> {c.y}</span>
                <span className={`text-xs font-bold ${c.value > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {c.value.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="h-[400px] flex items-center justify-center bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200">
            <div className="text-center">
              <Image className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-400">Select a plot type</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <FileImage className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Research Plots</h3>
            <p className="text-xs text-zinc-500">{residuals.length} samples · {importance.length} features</p>
          </div>
        </div>
        <button onClick={onExport} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        {Object.keys(PLOT_TYPES).map(cat => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat as PlotCategory); setSelectedPlot(PLOT_TYPES[cat as PlotCategory][0].id); }}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all",
              selectedCategory === cat ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Plot Selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {PLOT_TYPES[selectedCategory].map(plot => {
          const Icon = plot.icon;
          return (
            <button
              key={plot.id}
              onClick={() => setSelectedPlot(plot.id)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all",
                selectedPlot === plot.id ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 hover:border-zinc-400"
              )}
            >
              <Icon className="w-4 h-4 mb-1" />
              <p className="text-[10px] font-bold">{plot.label}</p>
              <p className="text-[8px] text-zinc-400 mt-0.5">{plot.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Plot Area */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-zinc-900">
            {PLOT_TYPES[selectedCategory].find(p => p.id === selectedPlot)?.label}
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-500">Top N:</span>
            <select
              value={topN}
              onChange={(e) => setTopN(parseInt(e.target.value))}
              className="text-xs bg-zinc-100 border-0 rounded px-2 py-1 font-bold"
            >
              {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        {renderPlot()}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-[9px] font-black uppercase text-blue-600 mb-1">Samples</p>
          <p className="text-xl font-black text-blue-900">{residuals.length}</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Mean Error</p>
          <p className="text-xl font-black text-emerald-900">
            {(errors.reduce((s, e) => s + e, 0) / errors.length || 0).toFixed(4)}
          </p>
        </div>
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-[9px] font-black uppercase text-amber-600 mb-1">Mean Abs Error</p>
          <p className="text-xl font-black text-amber-900">
            {(errors.map(Math.abs).reduce((s, e) => s + e, 0) / errors.length || 0).toFixed(4)}
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-[9px] font-black uppercase text-purple-600 mb-1">Std Error</p>
          <p className="text-xl font-black text-purple-900">
            {Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length || 0).toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  );
}
