import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { XAIResult } from '../types';
import { Info, Sparkles, TrendingUp, BarChart3, LineChart as LineChartIcon, Grid3X3, Activity, FileText, Download, ExternalLink, Loader, HelpCircle, ChevronDown, Lightbulb, Printer, PrinterIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { API_URL } from '../lib/api-utils';

interface XAIExplanationProps {
  result: XAIResult | null;
  plotColor: string;
  onPlotColorChange: (color: string) => void;
}

type TabType = 'importance' | 'sensitivity' | 'correlation' | 'residuals' | 'reports';

export function XAIExplanation({ result, plotColor, onPlotColorChange }: XAIExplanationProps) {
  const [activeTab, setActiveTab] = useState<TabType>('importance');
  const [selectedSensitivityFeature, setSelectedSensitivityFeature] = useState<string>(
    result?.sensitivityData[0]?.feature || ''
  );
  const [loadingPlots, setLoadingPlots] = useState<Set<string>>(new Set());
  const [loadedPlots, setLoadedPlots] = useState<Set<string>>(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    result?.featureImportance?.map(f => f.feature) || []
  );
  const [showGuidance, setShowGuidance] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const uniqueFeatures = Array.from(new Set(result?.correlationMatrix?.map(c => c.x) || []));

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const filteredCorrelationMatrix = result?.correlationMatrix?.filter(
    c => selectedFeatures.includes(c.x) && selectedFeatures.includes(c.y)
  ) || [];

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
      alert(`Failed to download "${title}". This plot may not be available for this model type.`);
    }
  };

  const handleImageLoad = (plotId: string) => {
    setLoadedPlots(prev => new Set([...prev, plotId]));
    setLoadingPlots(prev => {
      const next = new Set(prev);
      next.delete(plotId);
      return next;
    });
  };

  const handleImageStart = (plotId: string) => {
    setLoadingPlots(prev => new Set([...prev, plotId]));
  };

  if (!result) return null;

  const sensitivityPoints = result.sensitivityData.find(d => d.feature === selectedSensitivityFeature)?.points || [];

  const tabs = [
    { id: 'importance', label: 'Importance', icon: BarChart3 },
    { id: 'sensitivity', label: 'Sensitivity', icon: LineChartIcon },
    { id: 'correlation', label: 'Correlation', icon: Grid3X3 },
    { id: 'residuals', label: 'Actual vs Predicted', icon: Activity },
    { id: 'reports', label: 'Visual Reports', icon: FileText },
  ];

  return (
    <div className="space-y-8 pt-12 border-t border-zinc-200 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Model Interpretability
          </h3>
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Analyze how features influence your neural network's decisions.
          </p>
        </div>

        <div className="flex items-center gap-4">
            <button
                onClick={exportAllReports}
                disabled={isExporting || !result?.run_id}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-800 disabled:opacity-50"
            >
                {isExporting ? (
                    <Loader className="w-4 h-4 animate-spin" />
                ) : (
                    <Download className="w-4 h-4" />
                )}
                Export All Reports
            </button>
            
            <div className="flex items-center gap-2 bg-white/50 border border-zinc-100 p-1 rounded-2xl shadow-sm">
                <div className="flex items-center gap-1.5 px-2">
                    {['#3f3f46', '#93c5fd', '#6ee7b7', '#f87171'].map(color => (
                        <button
                            key={color}
                            onClick={() => onPlotColorChange(color)}
                            className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all",
                                plotColor === color ? "border-zinc-900 scale-110" : "border-transparent opacity-80 hover:opacity-100"
                            )}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
                <div className="w-px h-4 bg-zinc-200" />
                <div className="flex items-center gap-1.5 px-2">
                    {['#71717a', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'].map(color => (
                        <button
                            key={color}
                            onClick={() => onPlotColorChange(color)}
                            className={cn(
                                "w-5 h-5 rounded-full border-2 transition-all",
                                plotColor === color ? "border-zinc-900 scale-110" : "border-transparent opacity-80 hover:opacity-100"
                            )}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>

            <div className="flex bg-zinc-100 p-1 rounded-xl self-start">
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
        </div>
      </div>

      <div className="min-h-[450px] animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'importance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <TrendingUp className="w-3 h-3" />
                  Relative Feature Importance
                </div>
                <div className="h-[400px] w-full border border-zinc-200 rounded-2xl bg-white p-6 shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.featureImportance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" fontSize={10} hide />
                      <YAxis 
                        dataKey="feature" 
                        type="category" 
                        fontSize={10} 
                        width={100}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#71717a' }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f9fafb' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-xl">
                                <p className="text-xs font-bold text-zinc-900 mb-1">{data.feature}</p>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-zinc-900" />
                                  <p className="text-[10px] text-zinc-500">
                                    Importance: <span className="font-bold text-zinc-900">{data.importance.toFixed(1)}%</span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="importance" 
                        radius={[0, 6, 6, 0]} 
                        barSize={24}
                      >
                        {result.featureImportance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#18181b' : '#3f3f46'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <Sparkles className="w-3 h-3" />
                  Top Influencers
                </div>
                <div className="space-y-3">
                  {result.featureImportance.slice(0, 4).map((fi, idx) => (
                    <div key={fi.feature} className="p-4 border border-zinc-200 rounded-xl bg-white shadow-sm hover:border-zinc-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-zinc-400">RANK #{idx + 1}</span>
                        <span className="text-[10px] font-mono font-bold text-zinc-900">{fi.importance.toFixed(1)}%</span>
                      </div>
                      <div className="text-sm font-bold text-zinc-900 truncate">{fi.feature}</div>
                      <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div 
                          className="bg-zinc-900 h-full transition-all duration-1000" 
                          style={{ width: `${fi.importance}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sensitivity' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <TrendingUp className="w-3 h-3" />
                Feature Sensitivity Curve
              </div>
              <select 
                value={selectedSensitivityFeature}
                onChange={(e) => setSelectedSensitivityFeature(e.target.value)}
                className="text-xs font-bold bg-white border border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                {result.sensitivityData.map(d => (
                  <option key={d.feature} value={d.feature}>{d.feature}</option>
                ))}
              </select>
            </div>
            <div className="h-[400px] w-full border border-zinc-200 rounded-2xl bg-white p-6 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensitivityPoints}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="x" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#71717a' }}
                    label={{ value: selectedSensitivityFeature, position: 'insideBottom', offset: -5, fontSize: 10, fill: '#a1a1aa', fontWeight: 'bold' }}
                  />
                  <YAxis 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#71717a' }}
                    label={{ value: 'Model Output', angle: -90, position: 'insideLeft', offset: -10, fontSize: 12, fill: '#a1a1aa', fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-xl">
                            <p className="text-[10px] text-zinc-500 mb-1">Feature Value</p>
                            <p className="text-xs font-bold text-zinc-900 mb-2">{payload[0].payload.x.toFixed(4)}</p>
                            <p className="text-[10px] text-zinc-500 mb-1">Prediction</p>
                            <p className="text-xs font-bold text-blue-600">{payload[0].value.toFixed(4)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    dot={false}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'correlation' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <TrendingUp className="w-3 h-3" />
                Feature Correlation Matrix
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase">Select Features:</span>
                <div className="flex flex-wrap gap-1 max-w-md">
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
                      {feature.length > 12 ? feature.substring(0, 12) + '...' : feature}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {filteredCorrelationMatrix.length > 1 ? (
              <div className="h-[500px] w-full border border-zinc-200 rounded-2xl bg-white p-6 shadow-sm overflow-auto">
                <div className="relative inline-block min-w-full">
                  <div 
                    className="grid gap-px bg-zinc-100 border border-zinc-200" 
                    style={{ 
                      gridTemplateColumns: `80px repeat(${selectedFeatures.length}, 1fr)`,
                    }}
                  >
                    <div className="bg-zinc-50 border-b border-r border-zinc-200" />
                    
                    {selectedFeatures.map(feature => (
                      <div key={feature} className="bg-zinc-50 p-2 text-[8px] font-bold text-zinc-500 truncate border-b border-zinc-200 text-center flex items-center justify-center">
                        <span className="rotate-[-45deg] whitespace-nowrap">{feature}</span>
                      </div>
                    ))}

                    {selectedFeatures.map((yFeature, rowIdx) => (
                      <React.Fragment key={yFeature}>
                        <div className="bg-zinc-50 p-2 text-[8px] font-bold text-zinc-500 truncate border-r border-zinc-200 flex items-center justify-end">
                          {yFeature}
                        </div>
                        
                        {filteredCorrelationMatrix.filter(c => c.y === yFeature).map((cell, colIdx) => (
                          <div 
                            key={`${rowIdx}-${colIdx}`}
                            className="aspect-square flex flex-col items-center justify-center text-[10px] font-mono transition-all hover:scale-110 hover:z-10 hover:shadow-lg cursor-help"
                            style={{ 
                              backgroundColor: cell.value > 0 
                                ? `rgba(59, 130, 246, ${cell.value})` 
                                : `rgba(239, 68, 68, ${Math.abs(cell.value)})`,
                              color: Math.abs(cell.value) > 0.4 ? 'white' : 'black'
                            }}
                            title={`${cell.x} vs ${cell.y}: ${cell.value.toFixed(3)}`}
                          >
                            <span className="font-bold">{cell.value.toFixed(2)}</span>
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span className="text-[10px] font-bold text-zinc-500">Positive Correlation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-[10px] font-bold text-zinc-500">Negative Correlation</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] w-full border border-zinc-200 rounded-2xl bg-zinc-50 flex items-center justify-center">
                <p className="text-sm text-zinc-400 font-medium">Select at least 2 features to view correlation matrix</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'residuals' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <TrendingUp className="w-3 h-3" />
              Actual vs Predicted Plot
            </div>
            <div className="h-[400px] w-full border border-zinc-200 rounded-2xl bg-white p-6 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="actual" 
                    name="Actual Value" 
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    label={{ value: 'Actual Target Values', position: 'insideBottom', offset: -15, fontSize: 12, fill: '#52525b', fontWeight: 'bold' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="predicted" 
                    name="Predicted Value" 
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    label={{ value: 'Predicted Target Values', angle: -90, position: 'insideLeft', offset: -10, fontSize: 12, fill: '#52525b', fontWeight: 'bold' }}
                  />
                  <ZAxis type="number" range={[50, 50]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-xl">
                            <div className="space-y-1">
                              <p className="text-[10px] text-zinc-500 uppercase">Comparison</p>
                              <div className="grid grid-cols-2 gap-x-4">
                                <span className="text-xs font-bold text-zinc-600">Actual:</span>
                                <span className="text-xs font-mono font-bold text-zinc-900">{data.actual.toFixed(4)}</span>
                                <span className="text-xs font-bold text-blue-600">Predicted:</span>
                                <span className="text-xs font-mono font-bold text-blue-600">{data.predicted.toFixed(4)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    name="Test Set Inference" 
                    data={result.residuals} 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                  />
                  {/* Exact match diagonal line proxy */}
                  <Line 
                    dataKey="actual" 
                    stroke="#18181b" 
                    strokeWidth={1} 
                    strokeDasharray="4 4" 
                    dot={false} 
                    activeDot={false}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-[10px] text-zinc-500 leading-relaxed">
              <span className="font-bold text-zinc-900">How to read:</span> A perfect model would place all points along a diagonal straight line. Points scattered far away from the imaginary 45-degree angle indicate prediction errors.
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <FileText className="w-3 h-3" />
                Automated Analytical Graphics
              </div>
              <div className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full">
                RUN_ID: {result.run_id}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 auto-rows-max">
              {[
                { id: 'learning_curve', title: 'Learning Convergence', desc: 'Training vs Validation loss over time.' },
                { id: 'correlation_matrix', title: 'Feature Correlation', desc: 'Heatmap of relationships between all numerical columns.' },
                { id: 'feature_distributions', title: 'Attribute Distributions', desc: 'Histograms and KDE plots for all input features.' },
                { id: 'shap_summary', title: 'Global Impact (SHAP)', desc: 'Weighted influence of each feature on model outcomes.' },
                { id: 'residuals', title: 'Residual Map', desc: 'Scatter plot of ground truth vs model predictions.' },
              ].map((report) => (
                <div key={report.id} className="group space-y-4 h-fit">
                   <div className="flex items-center justify-between px-1">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">{report.title}</h4>
                        <p className="text-[10px] text-zinc-500">{report.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleDownload(report.id, report.title)}
                            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-blue-600 transition-colors"
                            title="Download Plot"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <a 
                            href={`${API_URL}/runs/${result.run_id}/plots/${report.id}.png`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors"
                            title="Open in Full Resolution"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                      </div>
                   </div>
                   <div className="aspect-[16/10] bg-zinc-50 rounded-2xl border border-zinc-200 overflow-hidden shadow-sm group-hover:shadow-md transition-all group-hover:border-zinc-300 relative">
                      {loadingPlots.has(report.id) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50/80 backdrop-blur-sm z-10">
                          <Loader className="w-6 h-6 text-zinc-400 animate-spin mb-2" />
                          <p className="text-[10px] font-bold text-zinc-500">Loading plot...</p>
                        </div>
                      )}
                       <img 
                         src={`${API_URL}/runs/${result.run_id}/plots/${report.id}.png`} 
                         alt={report.title}
                         className="w-full h-full object-contain mix-blend-multiply transition-opacity duration-300"
                         onLoadStart={() => handleImageStart(report.id)}
                         onLoad={() => handleImageLoad(report.id)}
                         onError={(e) => {
                           const img = e.target as HTMLImageElement;
                           img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect fill="%23f4f4f5" width="600" height="400"/><text x="50%25" y="45%25" text-anchor="middle" dy=".3em" font-family="system-ui" font-size="14" fill="%2371717a" font-weight="bold">' + report.title + '</text><text x="50%25" y="55%25" text-anchor="middle" dy=".3em" font-family="system-ui" font-size="12" fill="%239ca3af">Not available for this model type</text></svg>';
                           setLoadingPlots(prev => {
                             const next = new Set(prev);
                             next.delete(report.id);
                             return next;
                           });
                         }}
                       />
                   </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
               <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Download className="w-5 h-5" />
               </div>
               <div className="space-y-1">
                  <h4 className="text-sm font-bold text-blue-900">Export All Diagnostics</h4>
                  <p className="text-xs text-blue-700/70 leading-relaxed">
                    All generated plots are locally saved in your workspace directory: <br/>
                    <code className="bg-blue-100/50 px-1.5 py-0.5 rounded text-[10px] font-bold">backend\workspace\runs\{result.run_id}\plots\</code>
                  </p>
               </div>
            </div>
          </div>
        )}

        {showGuidance && (
          <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 mt-6">
            <button 
              onClick={() => setShowGuidance(false)}
              className="flex items-center justify-between w-full text-left mb-3"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h4 className="text-sm font-bold text-amber-900">Quick Guide: Understanding Your Analysis</h4>
              </div>
              <ChevronDown className="w-4 h-4 text-amber-500 rotate-180" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-white/60 rounded-xl">
                <h5 className="text-[10px] font-black text-amber-700 uppercase mb-1">Feature Importance</h5>
                <p className="text-[10px] text-zinc-600 leading-relaxed">Shows which features have the most impact on predictions. Higher bars = more influence.</p>
              </div>
              <div className="p-3 bg-white/60 rounded-xl">
                <h5 className="text-[10px] font-black text-amber-700 uppercase mb-1">Sensitivity Analysis</h5>
                <p className="text-[10px] text-zinc-600 leading-relaxed">Shows how predictions change as each feature varies across its range.</p>
              </div>
              <div className="p-3 bg-white/60 rounded-xl">
                <h5 className="text-[10px] font-black text-amber-700 uppercase mb-1">Correlation Matrix</h5>
                <p className="text-[10px] text-zinc-600 leading-relaxed">Select specific features to explore relationships. Blue = positive, Red = negative correlation.</p>
              </div>
              <div className="p-3 bg-white/60 rounded-xl">
                <h5 className="text-[10px] font-black text-amber-700 uppercase mb-1">Residuals</h5>
                <p className="text-[10px] text-zinc-600 leading-relaxed">Points close to the diagonal line = accurate predictions. Outliers may need investigation.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
