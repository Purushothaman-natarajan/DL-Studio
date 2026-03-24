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
import { Brain, Database, Cpu, Activity, ChevronRight, Github, Settings, Eraser } from 'lucide-react';
import { cn } from './lib/utils';

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

    try {
      if (!rawFile) throw new Error("No data file found.");
      
      const result = await trainModelBackend(
        rawFile,
        features,
        targets,
        layers,
        trainingConfig
      );
      
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

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">DL Studio</h1>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Neural Network Lab</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
          <button 
            onClick={() => data.length > 0 && setStep('upload')}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
              step === 'upload' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <Database className="w-4 h-4" />
            Data
          </button>
          <ChevronRight className="w-4 h-4 text-zinc-300" />
          <button 
            onClick={() => data.length > 0 && setStep('clean')}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
              step === 'clean' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            )}
            disabled={data.length === 0}
          >
            <Eraser className="w-4 h-4" />
            Clean
          </button>
          <ChevronRight className="w-4 h-4 text-zinc-300" />
          <button 
            onClick={() => data.length > 0 && setStep('config')}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
              step === 'config' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            )}
            disabled={data.length === 0}
          >
            <Cpu className="w-4 h-4" />
            Model
          </button>
          <ChevronRight className="w-4 h-4 text-zinc-300" />
          <button 
            onClick={() => data.length > 0 && setStep('train')}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
              step === 'train' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            )}
            disabled={data.length === 0}
          >
            <Activity className="w-4 h-4" />
            Train
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">
            <Github className="w-5 h-5" />
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8">
        {step === 'upload' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Start with your data</h2>
              <p className="text-zinc-500">Upload an Excel or CSV file to begin building your deep learning model.</p>
            </div>
            <div className="card p-8">
              <DataUpload onDataLoaded={handleDataLoaded} />
            </div>
          </div>
        )}

        {step === 'clean' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Refine your data</h2>
              <p className="text-zinc-500">The local engine is analyzing your file for missing values and outliers.</p>
            </div>
            <div className="card p-8">
              <DataCleaning 
                missingInfo={missingInfo} 
                totalRows={data.length} 
                onClean={handleClean} 
                isCleaning={isCleaning}
              />
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

            <div className="lg:col-span-5 space-y-8">
              <div className="card p-6">
                <ModelBuilder 
                  layers={layers} 
                  onUpdateLayers={setLayers} 
                  trainingConfig={trainingConfig}
                  onUpdateConfig={setTrainingConfig}
                />
              </div>
              
              <button 
                onClick={() => setStep('train')}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 shadow-lg shadow-zinc-200"
              >
                Proceed to Training
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 'train' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Model Training</h2>
              <p className="text-zinc-500">Monitor loss and accuracy in real-time as your model learns.</p>
            </div>
            <div className="card p-8 space-y-12">
              <TrainingPanel 
                history={trainingHistory}
                isTraining={isTraining}
                onStart={startTraining}
                onStop={() => setIsTraining(false)}
                progress={progress}
              />
              
              <InferencePanel 
                model={trainedModel}
                features={columns.filter(c => c.role === 'feature')}
                targets={columns.filter(c => c.role === 'target')}
              />

              <ModelSummary model={trainedModel} />

              <ModelComparison metrics={xaiResult?.comparison || []} />

              <XAIExplanation result={xaiResult} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            Powered by <span className="font-semibold text-zinc-900">TensorFlow.js</span>
          </p>
          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-zinc-400">
            <span className="hover:text-zinc-900 cursor-pointer">Documentation</span>
            <span className="hover:text-zinc-900 cursor-pointer">Privacy</span>
            <span className="hover:text-zinc-900 cursor-pointer">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
