import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell, ScatterChart, Scatter, ZAxis, Legend
} from 'recharts';
import { XAIResult } from '../types';
import { 
  Sparkles, Download, Settings, Target, BarChart3, LineChart as LineChartIcon, 
  Grid3X3, Activity, FileText, Loader, ChevronDown, Lightbulb, 
  ArrowUpDown, Play, RotateCcw, Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { API_URL } from '../lib/api-utils';

interface XAIExplanationProps {
  result: XAIResult | null;
  plotColor: string;
  onPlotColorChange: (color: string) => void;
  targets?: { name: string }[];
}

type TabType = 'importance' | 'sensitivity' | 'correlation' | 'residuals' | 'reports' | 'xai-params';

export function XAIExplanation({ result, plotColor, onPlotColorChange, targets = [] }: XAIExplanationProps) {
  const [activeTab, setActiveTab] = useState<TabType>('importance');
  const [selectedSensitivityFeature, setSelectedSensitivityFeature] = useState<string>(
    result?.sensitivityData?.[0]?.feature || ''
  );
  const [selectedTarget, setSelectedTarget] = useState<string>(targets[0]?.name || '');
  const [loadingPlots, setLoadingPlots] = useState<Set<string>>(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    result?.featureImportance?.map(f => f.feature) || []
  );
  const [showGuidance, setShowGuidance] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [xaiParams, setXaiParams] = useState({
    shapSamples: 100,
    limePerturbations: 10,
    sensitivitySteps: 20,
    topFeatures: 10,
  });

  const uniqueFeatures = useMemo(() => {
    const features = result?.correlationMatrix?.map(c => c.x) || [];
    return Array.from(new Set(features));
  }, [result?.correlationMatrix]);

  const filteredCorrelationMatrix = useMemo(() => {
    if (selectedFeatures.length < 2) return [];
    return result?.correlationMatrix?.filter(
      c => selectedFeatures.includes(c.x) && selectedFeatures.includes(c.y)
    ) || [];
  }, [result?.correlationMatrix, selectedFeatures]);

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const selectAllFeatures = () => setSelectedFeatures([...uniqueFeatures]);
  const clearFeatures = () => setSelectedFeatures([]);

  const exportAllReports = async () => {
    if (!result?.run_id) return;
    setIsExporting(true);
    
    const plots = ['learning_curve', 'correlation_matrix', 'feature_distributions', 'shap_summary', 'residuals'];
    
    for (const plotId of plots) {
      try {
        const response = await fetch(`${API_URL}/runs/${result.run_id}/plots/${plotId}.png`);
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${result.run_id}_${plotId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          await new Promise(r => setTimeout(r, 400));
        }
      } catch (error) {
        console.error(`Failed to export ${plotId}:`, error);
      }
    }
    
    setIsExporting(false);
  };

  const handleDownload = async (plotId: string, title: string) => {
    try {
      const response = await fetch(`${API_URL}/runs/${result?.run_id}/plots/${plotId}.png`);
      if (!response.ok) {
        alert(`Plot "${title}" is not available for this model type.`);
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${result?.run_id}_${plotId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert(`Failed to download "${title}".`);
    }
  };

  const handleImageStart = (plotId: string) => {
    setLoadingPlots(prev => new Set([...prev, plotId]));
  };

  const checkPlotExists = async (plotId: string): Promise<boolean> => {
    if (!result?.run_id) return false;
    try {
      const response = await fetch(`${API_URL}/runs/${result.run_id}/plots/${plotId}.png`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleImageLoad = (plotId: string) => {
    setLoadingPlots(prev => {
      const next = new Set(prev);
      next.delete(plotId);
      return next;
    });
  };

  if (!result) return null;

  const sensitivityPoints = result.sensitivityData?.find(d => d.feature === selectedSensitivityFeature)?.points || [];
  const sortedImportance = [...(result.featureImportance || [])].sort((a, b) => b.importance - a.importance);
  const topFeatures = sortedImportance.slice(0, xaiParams.topFeatures);

  const tabs = [
    { id: 'importance', label: 'Importance', icon: BarChart3 },
    { id: 'sensitivity', label: 'Sensitivity', icon: LineChartIcon },
    { id: 'correlation', label: 'Correlation', icon: Grid3X3 },
    { id: 'residuals', label: 'Actual vs Pred', icon: Activity },
    { id: 'xai-params', label: 'XAI Controls', icon: Settings },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const renderCorrelationMatrix = () => {
    if (selectedFeatures.length < 2) {
      return (
        <div className="h-[400px] flex items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-200">
          <div className="text-center space-y-2">
            <Grid3X3 className="w-10 h-10 text-zinc-300 mx-auto" />
            <p className="text-sm font-bold text-zinc-500">Select at least 2 features</p>
            <p className="text-xs text-zinc-400">Click features below to build your correlation matrix</p>
            <button onClick={selectAllFeatures} className="mt-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold">
              Select All ({uniqueFeatures.length})
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase text-zinc-500">Features:</span>
            <div className="flex flex-wrap gap-1 max-w-xl">
              {uniqueFeatures.map(feature => (
                <button
                  key={feature}
                  onClick={() => toggleFeature(feature)}
                  className={`px-2 py-0.5 rounded-full text-[8px] font-bold transition-all ${
                    selectedFeatures.includes(feature)
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  {feature.length > 15 ? feature.substring(0, 15) + '...' : feature}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={selectAllFeatures} className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-[9px] font-bold hover:bg-zinc-200">
              All
            </button>
            <button onClick={clearFeatures} className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-[9px] font-bold hover:bg-zinc-200">
              Clear
            </button>
          </div>
        </div>
        
        <div className="overflow-auto max-h-[500px]">
          <div className="inline-block min-w-full">
            <div 
              className="grid gap-px bg-zinc-200 border border-zinc-200 rounded-xl overflow-hidden"
              style={{ 
                gridTemplateColumns: `100px repeat(${selectedFeatures.length}, minmax(60px, 1fr))`,
              }}
            >
              <div className="bg-zinc-50 p-2 border-b border-r border-zinc-200" />
              {selectedFeatures.map(feature => (
                <div key={feature} className="bg-zinc-50 p-2 text-[8px] font-bold text-zinc-600 truncate border-b border-zinc-200 text-center">
                  {feature}
                </div>
              ))}
              
              {selectedFeatures.map((yFeature, rowIdx) => (
                <React.Fragment key={yFeature}>
                  <div className="bg-zinc-50 p-2 text-[8px] font-bold text-zinc-600 truncate border-r border-zinc-200 flex items-center">
                    {yFeature}
                  </div>
                  {filteredCorrelationMatrix
                    .filter(c => c.y === yFeature && selectedFeatures.includes(c.x))
                    .sort((a, b) => selectedFeatures.indexOf(a.x) - selectedFeatures.indexOf(b.x))
                    .map((cell, colIdx) => (
                      <div 
                        key={`${rowIdx}-${colIdx}`}
                        className="flex flex-col items-center justify-center p-1 cursor-pointer hover:scale-110 transition-transform"
                        style={{ 
                          backgroundColor: getCorrelationColor(cell.value),
                        }}
                        title={`${cell.x} vs ${cell.y}: ${cell.value.toFixed(3)}`}
                      >
                        <span className={`text-[10px] font-mono font-bold ${Math.abs(cell.value) > 0.5 ? 'text-white' : 'text-zinc-800'}`}>
                          {cell.value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 py-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-600" />
            <span className="text-[10px] font-bold text-zinc-500">Strong Positive (+0.7 to +1.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-300" />
            <span className="text-[10px] font-bold text-zinc-500">Weak Positive (0 to +0.3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-300" />
            <span className="text-[10px] font-bold text-zinc-500">Weak Negative (0 to -0.3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-600" />
            <span className="text-[10px] font-bold text-zinc-500">Strong Negative (-0.7 to -1.0)</span>
          </div>
        </div>
      </div>
    );
  };

  const getCorrelationColor = (value: number) => {
    const abs = Math.abs(value);
    if (value > 0) {
      return `rgba(59, 130, 246, ${abs})`;
    } else {
      return `rgba(239, 68, 68, ${abs})`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Model Intelligence
          </h3>
          <p className="text-xs text-zinc-500">
            Explainable AI · Feature Analysis · Multi-target Support
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Target Selector */}
          {targets.length > 1 && (
            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5">
              <Target className="w-4 h-4 text-zinc-400" />
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="text-xs font-bold bg-transparent outline-none"
              >
                {targets.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Color Picker */}
          <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1">
            {['#3f3f46', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'].map(color => (
              <button
                key={color}
                onClick={() => onPlotColorChange(color)}
                className={cn(
                  "w-5 h-5 rounded-full border-2 transition-all",
                  plotColor === color ? "border-zinc-900 scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <button
            onClick={exportAllReports}
            disabled={isExporting || !result?.run_id}
            className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-800 disabled:opacity-50"
          >
            {isExporting ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white text-zinc-900 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-300">
        
        {/* IMPORTANCE TAB */}
        {activeTab === 'importance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900">Feature Importance Ranking</h4>
              <span className="text-[10px] text-zinc-500">Top {xaiParams.topFeatures} of {result.featureImportance?.length || 0} features</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Bar Chart */}
              <div className="lg:col-span-2 h-[400px] bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topFeatures} layout="vertical" margin={{ left: 100, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis 
                      dataKey="feature" 
                      type="category" 
                      tick={{ fontSize: 10 }}
                      width={100}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-lg">
                              <p className="text-xs font-bold text-zinc-900">{d.feature}</p>
                              <p className="text-[10px] text-zinc-500">Importance: <span className="font-bold">{d.importance.toFixed(2)}%</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="importance" radius={[0, 4, 4, 0]} fill={plotColor}>
                      {topFeatures.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? plotColor : `${plotColor}99`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Features List */}
              <div className="space-y-3">
                {topFeatures.map((fi, idx) => (
                  <div key={fi.feature} className="p-3 bg-white rounded-xl border border-zinc-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-zinc-400 uppercase">#{idx + 1}</span>
                      <span className="text-xs font-mono font-bold text-zinc-900">{fi.importance.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs font-bold text-zinc-800 truncate">{fi.feature}</p>
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500" 
                        style={{ width: `${fi.importance}%`, backgroundColor: plotColor }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SENSITIVITY TAB */}
        {activeTab === 'sensitivity' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900">Sensitivity Analysis</h4>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-zinc-500 uppercase">Feature:</span>
                <select 
                  value={selectedSensitivityFeature}
                  onChange={(e) => setSelectedSensitivityFeature(e.target.value)}
                  className="text-xs font-bold bg-white border border-zinc-200 rounded-lg px-3 py-1.5 outline-none"
                >
                  {result.sensitivityData?.map(d => (
                    <option key={d.feature} value={d.feature}>{d.feature}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="h-[400px] bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensitivityPoints}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="x" 
                    tick={{ fontSize: 10 }}
                    label={{ value: selectedSensitivityFeature, position: 'insideBottom', offset: -5, fontSize: 11, fill: '#71717a' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Prediction', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#71717a' }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-lg">
                            <p className="text-[10px] text-zinc-500">Feature Value</p>
                            <p className="text-xs font-bold">{d.x.toFixed(4)}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">Prediction</p>
                            <p className="text-xs font-bold text-blue-600">{d.y.toFixed(4)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="y" stroke={plotColor} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CORRELATION TAB */}
        {activeTab === 'correlation' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-zinc-900">Feature Correlation Matrix</h4>
            {renderCorrelationMatrix()}
          </div>
        )}

        {/* RESIDUALS TAB */}
        {activeTab === 'residuals' && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-zinc-900">Actual vs Predicted</h4>
            
            <div className="h-[400px] bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="actual" 
                    name="Actual" 
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Actual Values', position: 'insideBottom', offset: -25, fontSize: 12 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="predicted" 
                    name="Predicted" 
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Predicted Values', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-lg">
                            <p className="text-[10px] text-zinc-500">Actual:</p>
                            <p className="text-xs font-mono font-bold">{d.actual?.toFixed(4)}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">Predicted:</p>
                            <p className="text-xs font-mono font-bold text-blue-600">{d.predicted?.toFixed(4)}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">Error:</p>
                            <p className="text-xs font-mono font-bold text-red-600">{(d.actual - d.predicted)?.toFixed(4)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={result.residuals} fill={plotColor} fillOpacity={0.6} />
                  {/* Perfect prediction line */}
                  {result.residuals && result.residuals.length > 0 && (
                    <Line 
                      type="linear"
                      data={[
                        {x: Math.min(...result.residuals.map(r => r.actual)), y: Math.min(...result.residuals.map(r => r.actual))},
                        {x: Math.max(...result.residuals.map(r => r.actual)), y: Math.max(...result.residuals.map(r => r.actual))}
                      ]}
                      dataKey="y"
                      stroke="#18181b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* XAI PARAMETERS TAB */}
        {activeTab === 'xai-params' && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-zinc-900">XAI Configuration Controls</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-black text-zinc-500 uppercase">SHAP Samples</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={500}
                  step={50}
                  value={xaiParams.shapSamples}
                  onChange={(e) => setXaiParams(p => ({ ...p, shapSamples: parseInt(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[9px] text-zinc-400 mt-1">
                  <span>50</span>
                  <span className="font-bold text-blue-600">{xaiParams.shapSamples}</span>
                  <span>500</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowUpDown className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black text-zinc-500 uppercase">LIME Perturbations</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={xaiParams.limePerturbations}
                  onChange={(e) => setXaiParams(p => ({ ...p, limePerturbations: parseInt(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[9px] text-zinc-400 mt-1">
                  <span>5</span>
                  <span className="font-bold text-emerald-600">{xaiParams.limePerturbations}</span>
                  <span>50</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-black text-zinc-500 uppercase">Sensitivity Steps</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={xaiParams.sensitivitySteps}
                  onChange={(e) => setXaiParams(p => ({ ...p, sensitivitySteps: parseInt(e.target.value) }))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-[9px] text-zinc-400 mt-1">
                  <span>10</span>
                  <span className="font-bold text-purple-600">{xaiParams.sensitivitySteps}</span>
                  <span>50</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-zinc-500 uppercase">Top Features</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={xaiParams.topFeatures}
                  onChange={(e) => setXaiParams(p => ({ ...p, topFeatures: parseInt(e.target.value) }))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[9px] text-zinc-400 mt-1">
                  <span>5</span>
                  <span className="font-bold text-amber-600">{xaiParams.topFeatures}</span>
                  <span>30</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-900">Re-run XAI Analysis</span>
              </div>
              <p className="text-[10px] text-blue-700">
                Adjust parameters above and click to regenerate SHAP, LIME, and Sensitivity analyses with new settings.
              </p>
              <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700">
                <RotateCcw className="w-3 h-3" />
                Re-run Analysis
              </button>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900">Visual Reports</h4>
              <code className="text-[9px] bg-zinc-100 px-2 py-1 rounded font-mono">Run: {result.run_id}</code>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'learning_curve', title: 'Learning Curve', desc: 'Training vs validation loss', available: true },
                { id: 'correlation_matrix', title: 'Correlation Matrix', desc: 'Feature relationships heatmap', available: true },
                { id: 'feature_distributions', title: 'Feature Distributions', desc: 'Input feature histograms', available: true },
                { id: 'shap_summary', title: 'SHAP Summary', desc: 'Global feature importance', available: true },
                { id: 'residuals', title: 'Residual Plot', desc: 'Prediction error analysis', available: true },
              ].map((report) => (
                <div key={report.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="p-3 border-b border-zinc-100 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-zinc-900">{report.title}</h5>
                      <p className="text-[9px] text-zinc-500">{report.desc}</p>
                    </div>
                    <button 
                      onClick={() => handleDownload(report.id, report.title)}
                      className="p-1.5 hover:bg-zinc-100 rounded text-zinc-400 hover:text-blue-600"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="aspect-square bg-zinc-50 relative">
                    {loadingPlots.has(report.id) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50/90 z-10">
                        <Loader className="w-6 h-6 animate-spin text-zinc-400 mb-2" />
                        <span className="text-[10px] text-zinc-500">Loading...</span>
                      </div>
                    )}
                    <img 
                      src={`${API_URL}/runs/${result.run_id}/plots/${report.id}.png`}
                      alt={report.title}
                      className="w-full h-full object-contain p-2"
                      onLoadStart={() => handleImageStart(report.id)}
                      onLoad={() => handleImageLoad(report.id)}
                      onError={() => {
                        handleImageLoad(report.id);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Some plots may not be available depending on the model type. 
                SHAP plots require gradient-based models, and learning curves are only generated for neural networks.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
