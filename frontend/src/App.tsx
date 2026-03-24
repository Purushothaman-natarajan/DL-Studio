import React, { useState, useCallback } from 'react';
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
import { DataColumn, LayerConfig, TrainingConfig, TrainingHistory, XAIResult } from './types';
import { trainModel, calculateXAI } from './lib/tf-utils';
import { trainModelBackend, uploadEda, cleanData } from './lib/api-utils';
import { Brain, Database, Cpu, Activity, ChevronRight, Github, Settings, Eraser, History, BookOpen, Palette, ShieldCheck, FileText } from 'lucide-react';
import { cn } from './lib/utils';
import { LegalModal } from './components/LegalModal';
import { HistorySidebar } from './components/HistorySidebar';
import { API_URL } from './lib/api-utils';

export default function App() {
  const [step, setStep] = useState<'upload' | 'clean' | 'config' | 'train'>('upload');
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<DataColumn[]>([]);
  const [missingInfo, setMissingInfo] = useState<Record<string, number>>({});
  const [isCleaning, setIsCleaning] = useState(false);
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
  const [activeLegal, setActiveLegal] = useState<'docs' | 'privacy' | 'terms' | null>(null);
  const [themeColor, setThemeColor] = useState<'zinc' | 'blue' | 'emerald' | 'crimson'>('zinc');

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
    validationSplit: 0.2
  });

  const handleDataLoaded = async (jsonData: any[], colNames: string[], file?: File) => {
    setData(jsonData);
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
        // Update local state with cleaned data
        setData(result.data_preview); // head(10) only but it's fine for preview
        setMissingInfo(result.missing);
        setStep('config');
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

  const startTraining = async () => {
    const features = columns.filter(c => c.role === 'feature').map(c => c.name);
    const targets = columns.filter(c => c.role === 'target').map(c => c.name);

    if (features.length === 0 || targets.length === 0) {
      alert("Please select at least one feature and one target column.");
      return;
    }

    setIsTraining(true);
    setTrainingHistory([]);
    setProgress(0);
    setTrainedModel(null);
    setXaiResult(null);
    setError(null);

    try {
      if (!rawFile) throw new Error("No data file found.");
      
      const result = await trainModelBackend(
        rawFile,
        features,
        targets,
        layers,
        trainingConfig
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
              comparison: result.xai.comparison || []
          });
          
          if (result.xai.lime) {
             setLimeResult(result.xai.lime);
          }
      }
      
      setTrainedModel({ isBackendModel: true }); // Dummy truthy object to pass to InferencePanel
      setProgress(100);
    } catch (err) {
      console.error(err);
      alert("Training failed. Check console for details.");
    } finally {
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
        setStep('train');
        setShowHistory(false);
      }
    } catch (err) {
      console.error("Failed to load run:", err);
    }
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

        <div className="flex items-center gap-4">
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
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-32 space-y-8">
        <div className="flex items-center gap-4 mb-12">
          {['upload', 'clean', 'config', 'train'].map((s, idx) => (
            <React.Fragment key={s}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-2xl transition-all",
                step === s ? (
                    themeColor === 'zinc' ? "bg-zinc-900 text-white" :
                    themeColor === 'blue' ? "bg-blue-600 text-white" :
                    themeColor === 'emerald' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                ) : "text-zinc-400"
              )}>
                <div className="w-6 h-6 rounded-lg border border-current flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </div>
                <span className="text-xs font-black uppercase tracking-widest">
                  {s === 'upload' ? 'Dataset' : s === 'clean' ? 'Refine' : s === 'config' ? 'Architecture' : 'Intelligence'}
                </span>
              </div>
              {idx < 3 && <ChevronRight className="w-4 h-4 text-zinc-200" />}
            </React.Fragment>
          ))}
        </div>
        
        {/* Step Views */}
        {step === 'upload' && <DataUpload onDataLoaded={handleDataLoaded} />}
        
        {step === 'clean' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Refine your data</h2>
              <p className="text-zinc-500">The local engine is analyzing your file for missing values and outliers.</p>
            </div>
            <div className="card p-8 space-y-8">
              <DataCleaning 
                missingInfo={missingInfo} 
                totalRows={data.length} 
                onClean={handleClean} 
                isCleaning={isCleaning}
              />
              {data.length > 0 && (
                <div className="pt-8 border-t border-zinc-100">
                   <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Current Data Preview</h4>
                   <DataPreview 
                     data={data} 
                     columns={columns} 
                     onColumnUpdate={handleColumnUpdate} 
                   />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-12 mb-4">
              <h2 className="text-3xl font-bold mb-2">Configure Architecture</h2>
              <p className="text-zinc-500">Define your data roles and neural network layers.</p>
            </div>
            
            <div className="lg:col-span-7 space-y-8">
              <div className="card p-6">
                <DataPreview 
                  data={data} 
                  columns={columns} 
                  onColumnUpdate={handleColumnUpdate} 
                />
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8 text-center">
              <ModelBuilder 
                layers={layers} 
                onUpdateLayers={setLayers} 
                trainingConfig={trainingConfig}
                onUpdateConfig={setTrainingConfig}
              />
              
              <button 
                onClick={startTraining}
                className={cn(
                    "w-full h-16 text-white font-black text-lg uppercase tracking-widest rounded-3xl transition-all shadow-xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 mt-8",
                    themeColor === 'zinc' ? "bg-zinc-900" : 
                    themeColor === 'blue' ? "bg-blue-600" : 
                    themeColor === 'emerald' ? "bg-emerald-600" : "bg-red-600"
                )}
              >
                Assemble Intelligence
                <Cpu className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {step === 'train' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Model Training</h2>
              <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                 <span>{data.length} Rows</span>
                 <div className="w-1 h-1 rounded-full bg-zinc-300" />
                 <span>{Object.values(missingInfo).reduce((a: any, b: any) => (Number(a) || 0) + (Number(b) || 0), 0)} Potential Missing Values</span>
              </div>
              <p className="text-zinc-500">Monitor loss and accuracy in real-time as your model learns.</p>
            </div>
            <div className="card p-8 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <TrainingPanel 
                  history={trainingHistory} 
                  isTraining={isTraining} 
                  progress={progress}
                  onStart={startTraining}
                  onStop={() => setIsTraining(false)} 
                />
                <InferencePanel 
                    model={trainedModel} 
                    features={columns.filter(c => c.role === 'feature').map(c => ({ name: c.name }))}
                    targets={columns.filter(c => c.role === 'target').map(c => ({ name: c.name }))}
                    runId={xaiResult?.run_id}
                />
              </div>
              
              <div className="pt-12 border-t border-zinc-100">
                <XAIExplanation result={xaiResult} />
              </div>

              <ModelComparison metrics={xaiResult?.comparison || []} />
            </div>
            
            <button 
              onClick={() => setStep('config')}
              className="mt-8 px-8 py-4 border-2 border-zinc-900 text-zinc-900 font-bold rounded-2xl hover:bg-zinc-900 hover:text-white transition-all flex items-center gap-2"
            >
              Back to Architecture
            </button>
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
