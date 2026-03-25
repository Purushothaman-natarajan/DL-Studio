import React, { useEffect, useState, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, RotateCcw, Download, FileText, Printer, 
  BarChart3, LineChart, PieChart, Activity, Grid3X3, Layers,
  Palette, Maximize2, X, Loader2, ExternalLink, Calendar, Hash
} from 'lucide-react';
import { cn } from '../lib/utils';
import { API_URL } from '../lib/api-utils';
import { XAIResult } from '../types';

interface RunHistory {
  run_id: string;
  timestamp: string;
  features: string[];
  targets: string[];
  comparison?: { model: string; r2: number; mae: number; mse: number }[];
  model_type?: string;
  dataset_name?: string;
}

interface RunExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRunId?: string | null;
  onLoadRun: (runId: string) => void;
  onStartNewRun: () => void;
}

const PLOT_TYPES = [
  { id: 'learning_curve', label: 'Learning Curve', icon: LineChart, color: 'blue' },
  { id: 'feature_importance', label: 'Feature Importance', icon: BarChart3, color: 'emerald' },
  { id: 'correlation_matrix', label: 'Correlation Matrix', icon: Grid3X3, color: 'purple' },
  { id: 'feature_distributions', label: 'Distributions', icon: PieChart, color: 'amber' },
  { id: 'residuals', label: 'Residuals', icon: Activity, color: 'rose' },
  { id: 'shap_summary', label: 'SHAP Summary', icon: Layers, color: 'indigo' },
];

export function RunExplorer({ isOpen, onClose, currentRunId, onLoadRun, onStartNewRun }: RunExplorerProps) {
  const [runs, setRuns] = useState<RunHistory[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedPlotType, setSelectedPlotType] = useState<string>('learning_curve');
  const [selectedColor, setSelectedColor] = useState<string>('#171717');
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRuns();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedRunId && runs.length > 0) {
      const idx = runs.findIndex(r => r.run_id === selectedRunId);
      setCurrentIndex(idx >= 0 ? idx : 0);
    }
  }, [selectedRunId, runs]);

  const fetchRuns = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/history`);
      if (response.ok) {
        const data = await response.json();
        setRuns(data);
        if (data.length > 0 && !selectedRunId) {
          setSelectedRunId(data[0].run_id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch runs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateRun = (direction: 'prev' | 'next') => {
    if (runs.length === 0) return;
    let newIndex = currentIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : runs.length - 1;
    } else {
      newIndex = currentIndex < runs.length - 1 ? currentIndex + 1 : 0;
    }
    setCurrentIndex(newIndex);
    setSelectedRunId(runs[newIndex].run_id);
  };

  const handleLoad = () => {
    if (selectedRunId) {
      onLoadRun(selectedRunId);
    }
  };

  const exportToPDF = async () => {
    if (!selectedRunId) return;
    
    const printContent = printRef.current;
    if (!printContent) return;

    try {
      const response = await fetch(`${API_URL}/runs/${selectedRunId}/plots/${selectedPlotType}.png`);
      if (!response.ok) {
        alert('This plot is not available for the selected model type.');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedRunId}_${selectedPlotType}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. This plot may not be available for this model type.');
    }
  };

  const exportAllReports = async () => {
    if (!selectedRunId) return;
    
    const plots = ['learning_curve', 'correlation_matrix', 'feature_distributions', 'shap_summary', 'residuals'];
    
    for (const plot of plots) {
      try {
        const response = await fetch(`${API_URL}/runs/${selectedRunId}/plots/${plot}.png`);
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${selectedRunId}_${plot}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          await new Promise(r => setTimeout(r, 500));
        }
      } catch (error) {
        console.error(`Failed to export ${plot}:`, error);
      }
    }
  };

  const currentRun = runs[currentIndex];
  const PlotIcon = PLOT_TYPES.find(p => p.id === selectedPlotType)?.icon || BarChart3;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-900 text-white rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black">Run Explorer</h2>
              <p className="text-xs text-zinc-500">Browse, analyze, and export prior runs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onStartNewRun}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              New Run
            </button>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
              <X className="w-6 h-6 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Run Navigation */}
        <div className="p-4 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateRun('prev')}
                disabled={runs.length <= 1}
                className="p-2 hover:bg-zinc-200 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 px-4">
                {runs.map((run, idx) => (
                  <button
                    key={run.run_id}
                    onClick={() => { setSelectedRunId(run.run_id); setCurrentIndex(idx); }}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all",
                      idx === currentIndex ? "bg-zinc-900 scale-125" : "bg-zinc-300 hover:bg-zinc-400"
                    )}
                  />
                ))}
              </div>
              
              <button
                onClick={() => navigateRun('next')}
                disabled={runs.length <= 1}
                className="p-2 hover:bg-zinc-200 rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <span className="ml-4 text-sm font-bold text-zinc-500">
                {runs.length > 0 ? `${currentIndex + 1} of ${runs.length} runs` : 'No runs'}
              </span>
            </div>
            
            {currentRun && (
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-zinc-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(currentRun.timestamp).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1 text-zinc-400">
                  <Hash className="w-3 h-3" />
                  {currentRun.run_id}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - Run List */}
          <div className="w-72 border-r border-zinc-100 overflow-y-auto p-4 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">All Runs</div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : runs.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-sm">No runs available</div>
            ) : (
              runs.map((run, idx) => (
                <button
                  key={run.run_id}
                  onClick={() => { setSelectedRunId(run.run_id); setCurrentIndex(idx); }}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all",
                    idx === currentIndex 
                      ? "bg-zinc-900 text-white" 
                      : "hover:bg-zinc-100"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{run.features?.length || 0} Features</span>
                    {run.comparison?.[0] && (
                      <span className={cn(
                        "text-[10px] font-black",
                        idx === currentIndex ? "text-zinc-300" : "text-emerald-600"
                      )}>
                        {(run.comparison[0].r2 * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className={cn(
                    "text-[10px]",
                    idx === currentIndex ? "text-zinc-400" : "text-zinc-500"
                  )}>
                    {new Date(run.timestamp).toLocaleDateString()} {new Date(run.timestamp).toLocaleTimeString()}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Controls */}
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-zinc-400" />
                <span className="text-[10px] font-black uppercase text-zinc-500">Plot Type:</span>
                <div className="flex gap-1">
                  {PLOT_TYPES.map(pt => (
                    <button
                      key={pt.id}
                      onClick={() => setSelectedPlotType(pt.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5",
                        selectedPlotType === pt.id 
                          ? `bg-${pt.color}-500 text-white`
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      )}
                    >
                      <pt.icon className="w-3 h-3" />
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-zinc-500">Color:</span>
                {['#171717', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      selectedColor === color ? "border-zinc-900 scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Plot Area */}
            <div className="flex-1 overflow-auto p-6 bg-zinc-50">
              <div ref={printRef} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                {currentRun ? (
                  <>
                    <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-zinc-900 flex items-center gap-2">
                          <PlotIcon className="w-4 h-4" style={{ color: selectedColor }} />
                          {PLOT_TYPES.find(p => p.id === selectedPlotType)?.label}
                        </h3>
                        <p className="text-[10px] text-zinc-500">Run: {currentRun.run_id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`${API_URL}/runs/${currentRun.run_id}/plots/${selectedPlotType}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={exportToPDF}
                          className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-800"
                        >
                          <Download className="w-3 h-3" />
                          Export PNG
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <img
                        src={`${API_URL}/runs/${currentRun.run_id}/plots/${selectedPlotType}.png`}
                        alt={selectedPlotType}
                        className="w-full h-auto rounded-lg"
                        style={{ maxHeight: '500px', objectFit: 'contain' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const errorDiv = target.parentElement?.querySelector('.image-error') as HTMLElement;
                          if (errorDiv) errorDiv.style.display = 'flex';
                        }}
                      />
                      <div className="image-error hidden flex-col items-center justify-center py-12 text-zinc-400">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                          <BarChart3 className="w-8 h-8 text-zinc-300" />
                        </div>
                        <p className="text-sm font-bold text-zinc-500">Plot not available</p>
                        <p className="text-xs text-zinc-400 mt-1">This plot may not be available for this model type or run.</p>
                      </div>
                    </div>
                    {currentRun.comparison && currentRun.comparison.length > 0 && (
                      <div className="p-4 border-t border-zinc-100 bg-zinc-50">
                        <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-2">Model Comparison</h4>
                        <div className="grid grid-cols-4 gap-4">
                          {currentRun.comparison.map((m, idx) => (
                            <div key={m.model} className={cn(
                              "p-3 rounded-xl border text-center",
                              idx === 0 ? "border-emerald-300 bg-emerald-50" : "border-zinc-200"
                            )}>
                              <div className="text-[10px] font-bold text-zinc-500">{m.model}</div>
                              <div className={cn(
                                "text-lg font-black",
                                idx === 0 ? "text-emerald-600" : "text-zinc-900"
                              )}>
                                {(m.r2 * 100).toFixed(1)}%
                              </div>
                              <div className="text-[9px] text-zinc-400">R² Score</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-zinc-400">
                    <FileText className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-sm font-bold">Select a run to view plots</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-zinc-100 flex items-center justify-between">
              <button
                onClick={exportAllReports}
                disabled={!currentRun}
                className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-200 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                Export All Reports (PNG)
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={handleLoad}
                  disabled={!selectedRunId}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  Load This Run in Studio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// PDF Export Component
interface PDFExportButtonProps {
  runId: string;
  title?: string;
  plotType?: string;
}

export function PDFExportButton({ runId, title, plotType }: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const plots = plotType 
        ? [plotType] 
        : ['learning_curve', 'correlation_matrix', 'feature_distributions', 'shap_summary', 'residuals'];
      
      for (const plot of plots) {
        const response = await fetch(`${API_URL}/runs/${runId}/plots/${plot}.png`);
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${runId}_${plot}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          await new Promise(r => setTimeout(r, 300));
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 disabled:opacity-50"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Printer className="w-4 h-4" />
      )}
      {title || 'Export Reports'}
    </button>
  );
}
