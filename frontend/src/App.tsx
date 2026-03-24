import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { DataUpload } from './components/DataUpload';
import { DataPreview } from './components/DataPreview';
import { ModelBuilder } from './components/ModelBuilder';
import { TrainingPanel } from './components/TrainingPanel';
import { InferencePanel } from './components/InferencePanel';
import { ModelSummary } from './components/ModelSummary';
import { XAIExplanation } from './components/XAIExplanation';
import { DataCleaning, CleaningConfig } from './components/DataCleaning';
import { ModelComparison } from './components/ModelComparison';
import { RunLogViewer } from './components/RunLogViewer';
import { RunManager } from './components/RunManager';
import { LaunchIndex } from './components/LaunchIndex';
import { FirstRunWizard } from './components/FirstRunWizard';
import { DataColumn, LayerConfig, TrainingConfig, TrainingHistory, XAIResult } from './types';
import { trainModel, calculateXAI } from './lib/tf-utils';
import { trainModelBackend, uploadEda, cleanData } from './lib/api-utils';
import { Brain, Database, Cpu, Activity, ChevronRight, Github, Settings, Eraser, History, BookOpen, Palette, ShieldCheck, FileText, Layers, Zap } from 'lucide-react';
import { cn } from './lib/utils';
import { LegalModal } from './components/LegalModal';
import { HistorySidebar } from './components/HistorySidebar';
import { API_URL } from './lib/api-utils';

export default function App() {
  const FIRST_RUN_WIZARD_KEY = 'dl_studio_first_run_wizard_v1';
  const [step, setStep] = useState<'index' | 'upload' | 'clean' | 'main'>('index');
  const [activeTab, setActiveTab] = useState<'design' | 'train' | 'test' | 'analysis'>('design');
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<DataColumn[]>([]);
  const [missingInfo, setMissingInfo] = useState<Record<string, number>>({});
  const [datasetRows, setDatasetRows] = useState(0);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleaningProfile, setCleaningProfile] = useState<CleaningConfig | null>(null);
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: '1', type: 'dense', units: 16, activation: 'relu' }
  ]);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trainedModel, setTrainedModel] = useState<any>(null); // Kept for legacy components if needed, or null
  const [xaiResult, setXaiResult] = useState<XAIResult | null>(null);
  const [limeResult, setLimeResult] = useState<any | null>(null);
  const [rawFile, setRawFile] = useState<File | Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showFirstRunWizard, setShowFirstRunWizard] = useState(false);
  const [activeLegal, setActiveLegal] = useState<'docs' | 'privacy' | 'terms' | null>(null);
  const [themeColor, setThemeColor] = useState<'zinc' | 'blue' | 'emerald' | 'crimson'>('zinc');
  const [plotColor, setPlotColor] = useState<string>('#171717');
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const liveLogSourceRef = useRef<EventSource | null>(null);

  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    epochs: 50,
    batchSize: 32,
    learningRate: 0.01,
    optimizer: 'adam',
    loss: 'meanSquaredError',
    earlyStopping: true,
    patience: 5,
    checkpointInterval: 1,
    saveBestOnly: true,
    validationSplit: 0.2,
    modelType: '',
  });

  useEffect(() => {
    try {
      const isCompleted = window.localStorage.getItem(FIRST_RUN_WIZARD_KEY) === '1';
      if (!isCompleted) {
        setShowFirstRunWizard(true);
      }
    } catch (error) {
      // Ignore storage errors and allow normal app usage.
    }
  }, []);

  useEffect(() => {
    return () => {
      if (liveLogSourceRef.current) {
        liveLogSourceRef.current.close();
        liveLogSourceRef.current = null;
      }
    };
  }, []);

  const appendLogLine = (line: string) => {
    setRunLogs(prev => {
      if (!line || prev[prev.length - 1] === line) return prev;
      const next = [...prev, line];
      return next.length > 600 ? next.slice(next.length - 600) : next;
    });
  };

  const extractRunId = (line: string): string | null => {
    const runMarker = line.match(/Run:\s*([0-9]{8}_[0-9]{6})/);
    if (runMarker?.[1]) return runMarker[1];
    const contextMarker = line.match(/ - ([0-9]{8}_[0-9]{6}) - /);
    return contextMarker?.[1] ?? null;
  };

  const stopLiveLogStream = () => {
    if (!liveLogSourceRef.current) return;
    liveLogSourceRef.current.close();
    liveLogSourceRef.current = null;
  };

  const startLiveLogStream = async () => {
    stopLiveLogStream();

    try {
      await fetch(`${API_URL}/api/logs/clear`, { method: 'POST' });
    } catch (err) {
      console.warn('Unable to clear stale logs before streaming:', err);
    }

    let streamRunId: string | null = null;
    const source = new EventSource(`${API_URL}/api/logs`);
    source.onmessage = (event) => {
      const line = typeof event.data === 'string' ? event.data.trim() : '';
      if (!line) return;

      const detectedRunId = extractRunId(line);
      if (detectedRunId && !streamRunId) {
        streamRunId = detectedRunId;
        setActiveRunId(detectedRunId);
      }

      if (streamRunId) {
        const belongsToActiveRun = line.includes(` - ${streamRunId} - `) || line.includes(`Run: ${streamRunId}`);
        if (!belongsToActiveRun) return;
      }

      appendLogLine(line);
    };
    source.onerror = () => {
      // EventSource auto-reconnects; keep silent unless we fully lose backend.
    };

    liveLogSourceRef.current = source;
  };

  const completeFirstRunWizard = (jumpToUpload: boolean) => {
    setShowFirstRunWizard(false);
    try {
      window.localStorage.setItem(FIRST_RUN_WIZARD_KEY, '1');
    } catch (error) {
      // Ignore storage errors and continue.
    }
    if (jumpToUpload) {
      setStep('upload');
    }
  };

  const handleDataLoaded = async (jsonData: any[], colNames: string[], file?: File) => {
    setData(jsonData);
    setDatasetRows(jsonData.length);
    setCleaningProfile(null);
    setColumns(colNames.map(name => ({
      name,
      type: 'numeric',
      role: isNaN(parseFloat(jsonData[0]?.[name])) ? 'ignore' : 'feature'
    })));
    
    // Store raw file or generate a blob from json to send to backend later
    if (file) {
        setRawFile(file);
        
        // Automated EDA for missing values
        const res = await uploadEda(file);
        if (res.missing) setMissingInfo(res.missing);
        if (typeof res.rows === 'number') setDatasetRows(res.rows);
    } else {
        const csvContent = [
            colNames.join(','),
            ...jsonData.map(row => colNames.map(c => row[c]).join(','))
        ].join('\n');
        setRawFile(new Blob([csvContent], { type: 'text/csv' }));
    }
    
    setStep('clean');
  };

  const handleClean = async (config: CleaningConfig) => {
    if (!rawFile) return;
    setIsCleaning(true);
    try {
      const result = await cleanData(rawFile, config);
      if (result.status === 'success') {
        setData(Array.isArray(result.data_preview) ? result.data_preview : []);
        setCleaningProfile(config);
        setMissingInfo(result.missing);
        if (typeof result.rows === 'number') {
          setDatasetRows(result.rows);
        }
        setStep('main');
        setActiveTab('design');
      }
    } catch (err) {
      console.error(err);
      alert("Cleaning failed.");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleColumnUpdate = (index: number, updates: Partial<DataColumn>) => {
    setColumns(prev => prev.map((col, i) => i === index ? { ...col, ...updates } : col));
  };

  const loadRunLogs = async (runId: string) => {
    setActiveRunId(runId);
    setRunLogs([]);
    try {
      const response = await fetch(`${API_URL}/api/history/${runId}/logs?limit=500`);
      if (!response.ok) {
        console.warn("Run log fetch failed", response.status);
        setRunLogs([]);
        return;
      }
      const payload = await response.json();
      setRunLogs(Array.isArray(payload.lines) ? payload.lines : []);
    } catch (err) {
      console.error("Failed to load run logs:", err);
      setRunLogs([]);
    }
  };

  const startTraining = async () => {
    const features = columns.filter(c => c.role === 'feature').map(c => c.name);
    const targets = columns.filter(c => c.role === 'target').map(c => c.name);

    if (features.length === 0 || targets.length === 0) {
      alert("Please select at least one feature and one target column.");
      return;
    }
    if (!trainingConfig.modelType) {
      alert("Please choose a model architecture before training.");
      setActiveTab('design');
      return;
    }
    if (!cleaningProfile) {
      alert("Please apply the data cleaning profile before training.");
      setStep('clean');
      return;
    }

    setActiveTab('train');
    setIsTraining(true);
    setTrainingHistory([]);
    setProgress(0);
    setTrainedModel(null);
    setXaiResult(null);
    setError(null);
    setRunLogs([]);
    setActiveRunId(null);
    await startLiveLogStream();

    try {
      if (!rawFile) throw new Error("No data file found.");
      
      const result = await trainModelBackend(
        rawFile,
        features,
        targets,
        layers,
        {
          ...trainingConfig,
          plotColor
        },
        cleaningProfile
      );

      if (result.status === 'error') {
        setError(result.message || "Training failed on server.");
        setIsTraining(false);
        return;
      }
      
      // Update history
      if (result.history) {
        const epochs = result.history.loss.length;
        const newHistory = [];
        for (let i = 0; i < epochs; i++) {
          newHistory.push({
            epoch: i + 1,
            loss: result.history.loss[i],
            accuracy: result.history.accuracy ? result.history.accuracy[i] : 0
          });
        }
        setTrainingHistory(newHistory);
      }
      
      // Set XAI
      if (result.xai) {
          // Format python backend XAI into frontend XAIResult structure roughly
          const featureImportance = result.xai.feature_names.map((name: string, i: number) => ({
             feature: name,
             importance: result.xai.importance[i],
             sensitivity: 0 
          }));
          
          setXaiResult({
              featureImportance: featureImportance.sort((a:any,b:any) => b.importance - a.importance),
              sensitivityData: result.xai.sensitivityData || [],
              correlationMatrix: result.xai.correlationMatrix || [],
              residuals: result.xai.residuals || [],
              comparison: result.xai.comparison || [],
              run_id: result.run_id
          });
          
          if (result.xai.lime) {
             setLimeResult(result.xai.lime);
          }
      }
      
      setTrainedModel({ isBackendModel: true }); // Dummy truthy object to pass to InferencePanel
      setProgress(100);
      if (result.run_id) {
        setActiveRunId(result.run_id);
        await loadRunLogs(result.run_id);
      }
    } catch (err) {
      console.error(err);
      alert("Training failed. Check console for details.");
    } finally {
      stopLiveLogStream();
      setIsTraining(false);
    }
  };

  const handleSelectRun = async (runId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/history/${runId}`);
      if (response.ok) {
        const manifest = await response.json();
        setXaiResult({
            featureImportance: (manifest.comparison?.[0]?.importance || []).map((imp: any, i: number) => ({
                feature: manifest.features[i] || `F${i}`,
                importance: imp
            })),
            sensitivityData: [], 
            correlationMatrix: [],
            residuals: [],
            comparison: manifest.comparison,
            run_id: manifest.run_id
        });
        
        // Update column context for InferencePanel from historical run
        const historicalColumns: DataColumn[] = [
            ...manifest.features.map((f: string) => ({ name: f, role: 'feature' as const, type: 'numeric' as const })),
            ...manifest.targets.map((t: string) => ({ name: t, role: 'target' as const, type: 'numeric' as const }))
        ];
        setColumns(historicalColumns);
        setTrainedModel({ isBackendModel: true, run_id: manifest.run_id });

        setStep('main');
        setActiveTab('test'); // Automatically go to Test tab when loading previous run
        setShowHistory(false);
        await loadRunLogs(manifest.run_id);
      }
    } catch (err) {
      console.error("Failed to load run:", err);
    }
  };

  const canGoToStep = (targetStep: 'upload' | 'clean' | 'main') => {
    if (targetStep === 'upload') return true;
    if (targetStep === 'clean') return !!rawFile;
    if (targetStep === 'main') return !!cleaningProfile;
    return false;
  };

  const navigateStep = (targetStep: 'upload' | 'clean' | 'main') => {
    if (!canGoToStep(targetStep)) return;
    setStep(targetStep);
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-700 flex flex-col",
      themeColor === 'zinc' ? "bg-zinc-50" : 
      themeColor === 'blue' ? "bg-blue-50/30" : 
      themeColor === 'emerald' ? "bg-emerald-50/30" : "bg-red-50/30"
    )}>
      {/* History Sidebar */}
      <HistorySidebar 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        onSelectRun={handleSelectRun}
      />

      {/* Legal Modals */}
      {activeLegal && (
        <LegalModal type={activeLegal} onClose={() => setActiveLegal(null)} />
      )}
      <FirstRunWizard
        isOpen={showFirstRunWizard}
        onClose={() => completeFirstRunWizard(false)}
        onStartBuilding={() => completeFirstRunWizard(true)}
      />

      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 h-20 bg-white/80 backdrop-blur-md border-b border-zinc-100 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors",
            themeColor === 'zinc' ? "bg-zinc-900" : 
            themeColor === 'blue' ? "bg-blue-600" : 
            themeColor === 'emerald' ? "bg-emerald-600" : "bg-red-600"
          )}>
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter">DL-STUDIO</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">v2.0 Regression Hub</p>
          </div>
        </div>

          {/* Global Theme Pickers (Zinc, Blue, etc) kept for UI theme only */}
          <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-full border border-zinc-100 mr-4">
            {(['zinc', 'blue', 'emerald', 'crimson'] as const).map(color => (
              <button
                key={color}
                onClick={() => setThemeColor(color)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all",
                  themeColor === color ? "border-zinc-900 scale-110" : "border-transparent opacity-50 hover:opacity-100",
                  color === 'zinc' ? "bg-zinc-500" : color === 'blue' ? "bg-blue-500" : color === 'emerald' ? "bg-emerald-500" : "bg-red-500"
                )}
              />
            ))}
          </div>
          
          <button 
            onClick={() => setShowHistory(true)}
            className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 transition-colors flex items-center gap-2 font-bold text-xs uppercase"
          >
            <History className="w-4 h-4" />
            History
          </button>
          
          <button 
            onClick={() => setActiveLegal('docs')}
            className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 transition-colors flex items-center gap-2 font-bold text-xs uppercase"
          >
            <BookOpen className="w-4 h-4" />
            Docs
          </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-32 space-y-8">
        {step !== 'index' && (
        <div className="flex items-center gap-4 mb-12">
          {['upload', 'clean', 'main'].map((s, idx) => (
            <React.Fragment key={s}>
              <button
                onClick={() => navigateStep(s as 'upload' | 'clean' | 'main')}
                disabled={!canGoToStep(s as 'upload' | 'clean' | 'main')}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                  step === s ? (
                      themeColor === 'zinc' ? "bg-zinc-900 text-white" :
                      themeColor === 'blue' ? "bg-blue-600 text-white" :
                      themeColor === 'emerald' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                  ) : "text-zinc-400 hover:text-zinc-700"
                )}
              >
                <div className="w-6 h-6 rounded-lg border border-current flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </div>
                <span className="text-xs font-black uppercase tracking-widest">
                  {s === 'upload' ? 'Dataset' : s === 'clean' ? 'Refine' : 'Studio'}
                </span>
              </button>
              {idx < 2 && <ChevronRight className="w-4 h-4 text-zinc-200" />}
            </React.Fragment>
          ))}
        </div>
        )}
        
        {/* Step Views */}
        {step === 'index' && (
          <LaunchIndex onStart={() => setStep('upload')} />
        )}

        {step === 'upload' && <DataUpload onDataLoaded={handleDataLoaded} />}
        
        {step === 'clean' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Refine your data</h2>
              <p className="text-zinc-500">Apply required prep and optional advanced cleaning before entering model studio.</p>
            </div>
            <div className="card p-8 space-y-8">
              {data.length > 0 && (
                <div>
                   <DataPreview 
                     data={data} 
                     totalRows={datasetRows}
                     columns={columns} 
                     onColumnUpdate={handleColumnUpdate} 
                   />
                </div>
              )}
              <div className="pt-8 border-t border-zinc-100">
                <DataCleaning 
                  missingInfo={missingInfo}
                  totalRows={datasetRows || data.length}
                  columns={columns}
                  onClean={handleClean}
                  isCleaning={isCleaning}
                />
              </div>
            </div>
          </div>
        )}

        {step === 'main' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tab Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 p-1.5 bg-zinc-100 w-fit rounded-2xl border border-zinc-200 shadow-inner">
                  {[
                      { id: 'design', label: 'Architecture', icon: Layers },
                      { id: 'train', label: 'Training Hub', icon: Activity },
                      { id: 'test', label: 'Verification', icon: ShieldCheck },
                      { id: 'analysis', label: 'Intelligence', icon: Zap }
                  ].map(tab => (
                      <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={cn(
                              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                              activeTab === tab.id ? (
                                  themeColor === 'zinc' ? "bg-white text-zinc-900 shadow-sm" :
                                  themeColor === 'blue' ? "bg-white text-blue-600 shadow-sm" :
                                  themeColor === 'emerald' ? "bg-white text-emerald-600 shadow-sm" : "bg-white text-red-600 shadow-sm"
                              ) : "text-zinc-400 hover:text-zinc-600"
                          )}
                      >
                          <tab.icon className="w-3.5 h-3.5" />
                          {tab.label}
                      </button>
                  ))}
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Active Run: <span className="text-zinc-900 font-mono">{activeRunId || 'Not Started'}</span>
              </div>
            </div>

            {activeTab === 'design' && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                    <ModelBuilder 
                        layers={layers} 
                        onUpdateLayers={setLayers} 
                        trainingConfig={trainingConfig}
                        onUpdateConfig={setTrainingConfig}
                        features={columns.filter(c => c.role === 'feature').map(c => c.name)}
                        targets={columns.filter(c => c.role === 'target').map(c => c.name)}
                        dataCount={datasetRows || data.length}
                    />
                    
                    <div className="flex justify-end pt-8">
                        <button 
                            onClick={startTraining}
                            className={cn(
                                "px-12 h-16 text-white font-black text-lg uppercase tracking-widest rounded-3xl transition-all shadow-xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95",
                                themeColor === 'zinc' ? "bg-zinc-900" : 
                                themeColor === 'blue' ? "bg-blue-600" : 
                                themeColor === 'emerald' ? "bg-emerald-600" : "bg-red-600"
                            )}
                        >
                            Compile & Train
                            <Cpu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'train' && (
                <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300 space-y-6">
                    <TrainingPanel 
                        history={trainingHistory} 
                        isTraining={isTraining} 
                        progress={progress}
                        onStart={startTraining}
                        onStop={() => setIsTraining(false)}
                        plotColor={plotColor}
                    />
                    <RunLogViewer logs={runLogs} runId={activeRunId} />
                </div>
            )}

            {activeTab === 'test' && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                            <InferencePanel 
                                model={trainedModel} 
                                features={columns.filter(c => c.role === 'feature').map(c => ({ name: c.name }))}
                                targets={columns.filter(c => c.role === 'target').map(c => ({ name: c.name }))}
                                runId={xaiResult?.run_id}
                            />
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                            <RunManager
                              activeRunId={activeRunId}
                              onLoadRun={handleSelectRun}
                              onOpenHistory={() => setShowHistory(true)}
                            />
                            <ModelComparison metrics={xaiResult?.comparison || []} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'analysis' && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    {!xaiResult ? (
                        <div className="p-20 text-center space-y-4 bg-zinc-50 rounded-[40px] border-2 border-dashed border-zinc-200">
                            <Zap className="w-12 h-12 text-zinc-300 mx-auto" />
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-zinc-400">Intelligence Standby</h3>
                                <p className="text-sm text-zinc-400">Analysis will be available once the training phase completes.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <XAIExplanation 
                                result={xaiResult} 
                                plotColor={plotColor} 
                                onPlotColorChange={setPlotColor}
                            />
                            <RunLogViewer logs={runLogs} runId={activeRunId} />
                        </>
                    )}
                </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400">
            <Brain className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
            Developed by Purushothaman Natarajan
          </p>
        </div>
        
        <div className="flex items-center gap-8">
          <button onClick={() => setActiveLegal('privacy')} className="text-xs font-black text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">Privacy Policy</button>
          <button onClick={() => setActiveLegal('terms')} className="text-xs font-black text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">Terms of Service</button>
          <a href="https://github.com/purushothaman-natarajan" target="_blank" className="text-zinc-400 hover:text-zinc-900 transition-colors">
            <Github className="w-6 h-6" />
          </a>
        </div>
      </footer>
    </div>
  );
}
