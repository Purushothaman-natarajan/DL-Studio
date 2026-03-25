import React, { useState, useMemo, useRef, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, ScatterChart, Scatter, AreaChart, Area,
  ComposedChart, Legend
} from 'recharts';
import { XAIResult } from '../types';
import { 
  Download, Target, Layers, Grid3X3, Activity, 
  TrendingUp, BarChart3, Image, FileImage,
  Table, Percent, Gauge, BookOpen, Info, 
  Loader, Maximize2, X, FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ResearchPlotsProps {
  result: XAIResult | null;
  targets: { name: string }[];
  onExport?: () => void;
  trainingMetrics?: {
    r2_train?: number;
    r2_val?: number;
    r2_test?: number;
    mae_train?: number;
    mae_val?: number;
    mae_test?: number;
  };
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
  ],
  advanced: [
    { id: 'parity_plot', label: 'Parity Plot', icon: Gauge, desc: 'Multi-target comparison' },
    { id: 'residual_qq', label: 'Q-Q Plot', icon: Percent, desc: 'Normality check' },
    { id: 'error_percentiles', label: 'Error Percentiles', icon: BarChart3, desc: 'Percentile distribution' },
  ],
};

function ExpandWrapper({ title, children, height = 'h-[420px]' }: { title: string; children: React.ReactNode; height?: string }) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async (format: 'png' | 'pdf') => {
    if (!ref.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(ref.current, { scale: 3, backgroundColor: '#ffffff', useCORS: true, logging: false });
      if (format === 'pdf') {
        const jsPDF = (await import('jspdf')).default;
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdfW = pdf.internal.pageSize.getWidth() - 20;
        const pdfH = (canvas.height * pdfW) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 10, pdfW, Math.min(pdfH, pdf.internal.pageSize.getHeight() - 20));
        pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
      } else {
        const link = document.createElement('a');
        link.download = `${title.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      }
    } catch (e) { console.error('Export failed:', e); }
  }, [title]);

  return (
    <>
      {expanded && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900">{title}</h4>
              <div className="flex items-center gap-2">
                <button onClick={() => handleExport('png')} className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1.5"><Download className="w-3 h-3" /> PNG</button>
                <button onClick={() => handleExport('pdf')} className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1.5"><FileText className="w-3 h-3" /> PDF</button>
                <button onClick={() => setExpanded(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4"><div ref={ref} style={{ minHeight: 550 }}>{children}</div></div>
          </div>
        </div>
      )}
      <div className="relative group">
        <div ref={!expanded ? ref : undefined} className={height}>{children}</div>
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button onClick={() => setExpanded(true)} className="p-1.5 bg-white/90 backdrop-blur border border-zinc-200 rounded-lg hover:bg-white shadow-sm" title="Expand"><Maximize2 className="w-3.5 h-3.5 text-zinc-600" /></button>
          <button onClick={() => handleExport('png')} className="p-1.5 bg-white/90 backdrop-blur border border-zinc-200 rounded-lg hover:bg-white shadow-sm" title="PNG"><Download className="w-3.5 h-3.5 text-zinc-600" /></button>
          <button onClick={() => handleExport('pdf')} className="p-1.5 bg-white/90 backdrop-blur border border-zinc-200 rounded-lg hover:bg-white shadow-sm" title="PDF"><FileText className="w-3.5 h-3.5 text-zinc-600" /></button>
        </div>
      </div>
    </>
  );
}

const tick = { fontSize: 10, fill: '#71717a', fontWeight: 600 as const };
const mTop = { top: 15, right: 20, bottom: 8, left: 8 };

export function ResearchPlots({ result, targets, onExport, trainingMetrics }: ResearchPlotsProps) {
  const [selectedCategory, setSelectedCategory] = useState<PlotCategory>('regression');
  const [selectedPlot, setSelectedPlot] = useState<string>('actual_vs_predicted');
  const [topN, setTopN] = useState(10);
  const [showGuidance, setShowGuidance] = useState(true);

  if (!result) return null;

  const residuals = result.residuals || [];
  const importance = result.featureImportance || [];
  const correlation = result.correlationMatrix || [];
  const actual = residuals.map(r => r.actual);
  const predicted = residuals.map(r => r.predicted);
  const errors = residuals.map(r => r.residual);

  const chartData = useMemo(() => residuals.map((r, i) => ({
    index: i, actual: r.actual, predicted: r.predicted, residual: r.residual, absError: Math.abs(r.residual),
  })), [residuals]);

  const sortedImportance = useMemo(() => [...importance].sort((a, b) => b.importance - a.importance).slice(0, topN), [importance, topN]);

  const correlationData = useMemo(() => {
    const uf = [...new Set(correlation.map(c => c.x))];
    return uf.slice(0, topN).map(f1 => {
      const row: any = { feature: f1 };
      uf.slice(0, topN).forEach(f2 => {
        const cell = correlation.find(c => c.x === f1 && c.y === f2);
        row[f2] = cell?.value || 0;
      });
      return row;
    });
  }, [correlation, topN]);

  const getCorrelationColor = (val: number) => {
    const abs = Math.abs(val);
    return val > 0 ? `rgba(59, 130, 246, ${abs})` : `rgba(239, 68, 68, ${abs})`;
  };

  const renderPlot = () => {
    switch (selectedPlot) {
      case 'actual_vs_predicted': {
        const allVals = [...actual, ...predicted];
        const avMin = Math.min(...allVals);
        const avMax = Math.max(...allVals);
        const r = avMax - avMin;
        const lo = avMin - r * 0.05;
        const hi = avMax + r * 0.05;
        return (
          <ExpandWrapper title="Actual vs Predicted">
            <ResponsiveContainer width="100%" height={420}>
              <ScatterChart margin={mTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="actual" tick={tick} name="Actual" />
                <YAxis type="number" dataKey="predicted" tick={tick} name="Predicted" />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload; if (!d) return null;
                  return <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-lg text-xs space-y-1">
                    <p className="text-zinc-400">#{d.index}</p>
                    <p className="font-bold text-emerald-600">Actual: {d.actual?.toFixed(4)}</p>
                    <p className="font-bold text-blue-600">Predicted: {d.predicted?.toFixed(4)}</p>
                  </div>;
                }} />
                <Scatter data={chartData} fill="#3b82f6" fillOpacity={0.5} name="Points" />
                <Scatter data={[{ actual: lo, predicted: lo }, { actual: hi, predicted: hi }]} fill="transparent" line={{ stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '6 3' }} name="y=x" isAnimationActive={false} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-zinc-400 mt-2">X = Actual · Y = Predicted · Red line = perfect</p>
          </ExpandWrapper>
        );
      }
      case 'residual_scatter': {
        const mp = Math.min(...predicted);
        const xp = Math.max(...predicted);
        return (
          <ExpandWrapper title="Residual Plot">
            <ResponsiveContainer width="100%" height={420}>
              <ScatterChart margin={mTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="predicted" tick={tick} name="Predicted" />
                <YAxis type="number" dataKey="residual" tick={tick} name="Residual" />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload; if (!d) return null;
                  return <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-lg text-xs space-y-1">
                    <p className="text-zinc-400">#{d.index}</p>
                    <p className="font-bold">Pred: {d.predicted?.toFixed(4)}</p>
                    <p className="font-bold text-red-500">Residual: {d.residual?.toFixed(4)}</p>
                  </div>;
                }} />
                <Scatter data={chartData} fill="#3b82f6" fillOpacity={0.5} name="Residuals" />
                <Scatter data={[{ predicted: mp, residual: 0 }, { predicted: xp, residual: 0 }]} fill="transparent" line={{ stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '6 3' }} name="Zero" isAnimationActive={false} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-zinc-400 mt-2">X = Predicted · Y = Residual (Actual − Pred) · Above = underpredict</p>
          </ExpandWrapper>
        );
      }
      case 'residual_histogram': {
        const me = Math.min(...errors);
        const xe = Math.max(...errors);
        const hr = xe - me;
        const bc = Math.max(10, Math.min(30, Math.floor(Math.sqrt(errors.length))));
        const bw = hr / bc;
        const hist = Array.from({ length: bc }, (_, i) => {
          const s = me + i * bw;
          const e = s + bw;
          return { range: `${s.toFixed(2)}`, count: errors.filter(v => v >= s && v < e).length };
        });
        return (
          <ExpandWrapper title="Error Distribution">
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={hist} margin={mTop}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={tick} interval={Math.max(0, Math.floor(bc / 8))} />
                <YAxis tick={tick} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-lg text-xs">
                    <p className="font-bold">Error: {d.range}</p><p className="text-zinc-500">Samples: {d.count}</p>
                  </div>;
                }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-zinc-400 mt-2">X = Error Range · Y = Sample Count</p>
          </ExpandWrapper>
        );
      }
      case 'error_vs_actual':
        return (
          <ExpandWrapper title="Error vs Actual">
            <ResponsiveContainer width="100%" height={420}>
              <ScatterChart margin={mTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="actual" tick={tick} name="Actual" />
                <YAxis type="number" dataKey="residual" tick={tick} name="Error" />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload; if (!d) return null;
                  return <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-lg text-xs space-y-1">
                    <p className="text-zinc-400">#{d.index}</p>
                    <p className="font-bold">Actual: {d.actual?.toFixed(4)}</p>
                    <p className="font-bold text-red-500">Error: {d.residual?.toFixed(4)}</p>
                  </div>;
                }} />
                <Scatter data={chartData} fill="#ef4444" fillOpacity={0.5} name="Error" />
                <Scatter data={[{ actual: Math.min(...actual), residual: 0 }, { actual: Math.max(...actual), residual: 0 }]} fill="transparent" line={{ stroke: '#18181b', strokeWidth: 2, strokeDasharray: '6 3' }} name="Zero" isAnimationActive={false} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-zinc-400 mt-2">X = Actual · Y = Error · Bias at certain ranges</p>
          </ExpandWrapper>
        );
      case 'cumulative_error': {
        const sa = [...errors.map(Math.abs)].sort((a, b) => a - b);
        const cdf = sa.map((e, i) => ({ absError: e, pct: ((i + 1) / sa.length) * 100 }));
        return (
          <ExpandWrapper title="Cumulative Error">
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart data={cdf} margin={mTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="absError" tick={tick} />
                <YAxis dataKey="pct" tick={tick} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-lg text-xs">
                    <p className="font-bold">|Error|: {d.absError?.toFixed(4)}</p>
                    <p className="text-zinc-500">{d.pct?.toFixed(1)}% of samples have error ≤ this</p>
                  </div>;
                }} />
                <Area type="monotone" dataKey="pct" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} name="CDF" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-zinc-400 mt-2">X = |Error| · Y = % of samples with error ≤ X</p>
          </ExpandWrapper>
        );
      }
      case 'importance_bar':
        return (
          <ExpandWrapper title="Feature Importance">
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={sortedImportance} layout="vertical" margin={{ left: 130, top: 10, right: 20, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={tick} />
                <YAxis dataKey="feature" type="category" tick={tick} width={125} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-lg text-xs">
                    <p className="font-bold">{d.feature}</p><p className="text-blue-600">{d.importance?.toFixed(2)}%</p>
                  </div>;
                }} />
                <Bar dataKey="importance" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Importance (%)" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-zinc-400 mt-2">X = Importance (%) · Y = Feature · Higher = more impact</p>
          </ExpandWrapper>
        );
      case 'importance_ranked':
        return (
          <div className="space-y-1 max-h-[420px] overflow-y-auto">
            {sortedImportance.map((f, i) => (
              <div key={f.feature} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-zinc-100">
                <span className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">{i + 1}</span>
                <span className="flex-1 text-xs font-bold text-zinc-700 truncate">{f.feature}</span>
                <div className="w-32 h-2 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${f.importance}%` }} /></div>
                <span className="text-xs font-mono font-bold text-blue-600 w-16 text-right">{f.importance.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        );
      case 'cumulative_importance': {
        const total = sortedImportance.reduce((s, f) => s + f.importance, 0);
        let cumSum = 0;
        const cumData = sortedImportance.map(f => { cumSum += f.importance; return { feature: f.feature, cumulative: (cumSum / total) * 100 }; });
        return (
          <ExpandWrapper title="Cumulative Importance">
            <ResponsiveContainer width="100%" height={420}>
              <AreaChart data={cumData} margin={mTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="feature" tick={{ ...tick, angle: -45, textAnchor: 'end' as const }} />
                <YAxis tick={tick} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Cumulative']} />
                <Area type="monotone" dataKey="cumulative" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Cumulative %" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-zinc-400 mt-2">X = Features (ranked) · Y = Cumulative %</p>
          </ExpandWrapper>
        );
      }
      case 'correlation_heatmap':
        return (
          <ExpandWrapper title="Correlation Heatmap" height="h-[450px]">
            <div className="overflow-auto max-h-[420px]">
              <div className="inline-block min-w-full">
                <div className="grid gap-px bg-zinc-200 border border-zinc-200 rounded-xl overflow-hidden" style={{ gridTemplateColumns: `100px repeat(${Math.min(topN, correlationData.length)}, 1fr)` }}>
                  <div className="bg-zinc-50 p-2" />
                  {correlationData[0] && Object.keys(correlationData[0]).filter(k => k !== 'feature').map(key => (
                    <div key={key} className="bg-zinc-50 p-2 text-[8px] font-bold text-zinc-600 text-center truncate">{key}</div>
                  ))}
                  {correlationData.map(row => (
                    <React.Fragment key={row.feature}>
                      <div className="bg-zinc-50 p-2 text-[8px] font-bold text-zinc-600 truncate">{row.feature}</div>
                      {Object.keys(row).filter(k => k !== 'feature').map(key => (
                        <div key={key} className="flex items-center justify-center p-1 text-[9px] font-mono font-bold" style={{ backgroundColor: getCorrelationColor(row[key]) }}>
                          <span className={Math.abs(row[key]) > 0.5 ? 'text-white' : 'text-zinc-800'}>{row[key].toFixed(2)}</span>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-center text-[10px] text-zinc-400 mt-2">Blue = positive · Red = negative · Diagonal = self</p>
          </ExpandWrapper>
        );
      case 'top_correlations': {
        const topCorrs = [...correlation].filter(c => c.x !== c.y).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, topN);
        return (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {topCorrs.map((c, i) => (
              <div key={`${c.x}-${c.y}`} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-zinc-100">
                <span className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">{i + 1}</span>
                <span className="flex-1 text-xs text-zinc-700">{c.x} <span className="text-zinc-400">vs</span> {c.y}</span>
                <span className={`text-xs font-bold ${c.value > 0 ? 'text-blue-600' : 'text-red-600'}`}>{c.value.toFixed(3)}</span>
              </div>
            ))}
          </div>
        );
      }
      case 'sensitivity_curves': {
        const sensData = result.sensitivityData || [];
        if (sensData.length === 0) return <div className="h-[420px] flex items-center justify-center text-zinc-400">No sensitivity data</div>;
        return (
          <ExpandWrapper title="Sensitivity Analysis">
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={sensData[0]?.points || []} margin={mTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" tick={tick} />
                <YAxis dataKey="y" tick={tick} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-lg text-xs">
                    <p className="text-zinc-500">{sensData[0]?.feature}: {d.x?.toFixed(4)}</p>
                    <p className="font-bold text-blue-600">Pred: {d.y?.toFixed(4)}</p>
                  </div>;
                }} />
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2.5} dot={false} name={sensData[0]?.feature || 'Feature'} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-zinc-400 mt-2">X = {sensData[0]?.feature} value · Y = Model prediction</p>
          </ExpandWrapper>
        );
      }
      case 'parity_plot':
        return (
          <ExpandWrapper title="Parity Plot">
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart data={chartData.slice(0, 30)} margin={mTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" tick={tick} />
                <YAxis tick={tick} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual" />
                <Bar dataKey="predicted" fill="#10b981" name="Predicted" />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-zinc-400 mt-2">X = Sample Index · Y = Value · Blue = Actual, Green = Predicted</p>
          </ExpandWrapper>
        );
      case 'residual_qq': {
        const sr = [...errors].sort((a, b) => a - b);
        const n = sr.length;
        const qq = sr.map((r, i) => ({ theoretical: (i + 0.5) / n, sample: r }));
        return (
          <ExpandWrapper title="Q-Q Plot">
            <ResponsiveContainer width="100%" height={420}>
              <ScatterChart margin={mTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="theoretical" tick={tick} />
                <YAxis dataKey="sample" tick={tick} />
                <Tooltip />
                <Scatter data={qq} fill="#3b82f6" fillOpacity={0.6} name="Samples" />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-zinc-400 mt-2">X = Theoretical Quantiles · Y = Residuals · On line = normal</p>
          </ExpandWrapper>
        );
      }
      case 'error_percentiles': {
        const ps = [5, 10, 25, 50, 75, 90, 95];
        const pes = [...errors.map(Math.abs)].sort((a, b) => a - b);
        const pd = ps.map(p => ({ percentile: `${p}th`, value: pes[Math.floor((p / 100) * pes.length)] || 0 }));
        return (
          <ExpandWrapper title="Error Percentiles">
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={pd} margin={mTop}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="percentile" tick={tick} />
                <YAxis tick={tick} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-lg text-xs">
                    <p className="font-bold">{d.percentile}</p><p className="text-blue-600">|Error|: {d.value?.toFixed(4)}</p>
                  </div>;
                }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Absolute Error" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-zinc-400 mt-2">X = Percentile · Y = Absolute Error</p>
          </ExpandWrapper>
        );
      }
      default:
        return (
          <div className="h-[400px] flex items-center justify-center bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200">
            <div className="text-center"><Image className="w-12 h-12 text-zinc-300 mx-auto mb-3" /><p className="text-sm font-bold text-zinc-400">Select a plot type</p></div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0"><BookOpen className="w-5 h-5 text-indigo-600" /></div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-indigo-900">Research Plots Guide</h3>
              <button onClick={() => setShowGuidance(!showGuidance)} className="text-xs text-indigo-600 hover:text-indigo-700 font-bold">{showGuidance ? 'Hide' : 'Show'} Guide</button>
            </div>
            {showGuidance && (
              <div className="text-xs text-indigo-700 space-y-1">
                <p><strong>1. Regression:</strong> Actual vs predicted, residuals, error distributions</p>
                <p><strong>2. Importance:</strong> Feature impact rankings and sensitivity curves</p>
                <p><strong>3. Correlation:</strong> Relationships between features and targets</p>
                <p><strong>4. Advanced:</strong> Q-Q plots, percentiles, parity plots</p>
                <p className="text-indigo-500 mt-1">Hover any chart for expand/download buttons</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><FileImage className="w-5 h-5 text-blue-500" /></div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Research Plots</h3>
            <p className="text-xs text-zinc-500">{residuals.length} samples · {importance.length} features</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {trainingMetrics && (
            <div className="flex items-center gap-1">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">Train: {((trainingMetrics.r2_train || 0) * 100).toFixed(1)}%</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">Val: {((trainingMetrics.r2_val || 0) * 100).toFixed(1)}%</span>
              <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded">Test: {((trainingMetrics.r2_test || 0) * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        {Object.keys(PLOT_TYPES).map(cat => (
          <button key={cat} onClick={() => { setSelectedCategory(cat as PlotCategory); setSelectedPlot(PLOT_TYPES[cat as PlotCategory][0].id); }}
            className={cn("px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all", selectedCategory === cat ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {PLOT_TYPES[selectedCategory].map(plot => {
          const Icon = plot.icon;
          return (
            <button key={plot.id} onClick={() => setSelectedPlot(plot.id)}
              className={cn("p-3 rounded-xl border text-left transition-all", selectedPlot === plot.id ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 hover:border-zinc-400")}>
              <Icon className="w-4 h-4 mb-1" />
              <p className="text-[10px] font-bold">{plot.label}</p>
              <p className="text-[8px] text-zinc-400 mt-0.5">{plot.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-zinc-900">{PLOT_TYPES[selectedCategory].find(p => p.id === selectedPlot)?.label}</h4>
        </div>
        {!result ? (
          <div className="h-[420px] flex items-center justify-center bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200">
            <Loader className="w-8 h-8 text-zinc-300 animate-spin" />
          </div>
        ) : renderPlot()}
      </div>
    </div>
  );
}
