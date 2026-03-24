import React, { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileText, AlertCircle, BarChart, Database, Zap, ArrowRight, Table as TableIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { analyzeDataset } from '../lib/api-utils';

interface DataUploadProps {
  onDataLoaded: (data: any[], columns: string[], file: File) => void;
}

export function DataUpload({ onDataLoaded }: DataUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [insights, setInsights] = React.useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsAnalyzing(true);
    setSelectedFile(file);
    
    try {
      const result = await analyzeDataset(file);
      if (result.status === 'success') {
        setInsights(result);
      } else {
        setError(result.message || "Analysis failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to analyze dataset. Ensure backend is running.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleProceed = () => {
    if (insights && selectedFile) {
      const columns = insights.columns.map((c: any) => c.name);
      onDataLoaded(insights.preview, columns, selectedFile);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {!insights ? (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={cn(
              "relative border-2 border-dashed rounded-3xl p-20 transition-all flex flex-col items-center justify-center text-center bg-white shadow-sm",
              isDragging ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300",
              isAnalyzing && "opacity-50 pointer-events-none"
            )}
          >
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                 <p className="text-sm font-black uppercase tracking-widest text-zinc-900">Neural Engine Analyzing...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6 text-zinc-600">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black mb-2 tracking-tighter">DATASET INGESTION</h3>
                <p className="text-zinc-500 text-sm mb-8 max-w-sm">
                  The local engine supports XLSX, XLS, and CSV. Drag your payload here to initialize the intelligence stack.
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={onFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <button className="px-8 py-3 bg-zinc-900 text-white font-bold rounded-xl shadow-xl shadow-zinc-200 pointer-events-none uppercase text-xs tracking-widest">
                  Select Payload
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-zinc-100 flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-tight">Structured Vault</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">Your data and artifacts stay local in the workspace run folders, never sent to external services.</p>
              </div>
            </div>
            <div className="p-6 bg-white rounded-3xl border border-zinc-100 flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-tight">Auto-EDA Pulse</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">Instant statistical profiling and outlier detection happens the moment you drop the file.</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-3xl font-black tracking-tighter uppercase italic">{selectedFile?.name}</h2>
                 <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Dataset successfully vectorized</p>
              </div>
              <button 
                onClick={() => setInsights(null)}
                className="text-xs font-black text-zinc-400 hover:text-zinc-900 uppercase tracking-widest transition-colors"
              >
                Reset Upload
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Rows', value: insights.row_count, icon: TableIcon, color: 'text-zinc-900' },
                { label: 'Columns', value: insights.column_count, icon: Database, color: 'text-blue-600' },
                { label: 'Memory', value: insights.memory, icon: Zap, color: 'text-emerald-600' },
                { label: 'Integrity', value: `${((1 - (insights.columns.reduce((acc:any, c:any) => acc + c.nulls, 0) / (insights.row_count * insights.column_count))) * 100).toFixed(1)}%`, icon: BarChart, color: 'text-amber-600' }
              ].map((stat, i) => (
                <div key={i} className="card p-6 flex flex-col justify-between">
                   <div className="flex items-center justify-between mb-4">
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                   </div>
                   <div>
                      <div className="text-2xl font-black tabular-nums tracking-tighter">{stat.value}</div>
                      <div className="label-micro opacity-60">{stat.label}</div>
                   </div>
                </div>
              ))}
           </div>

           <div className="card">
              <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                 <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <TableIcon className="w-4 h-4" />
                    Neural Dataset Preview
                 </h3>
              </div>
              <div className="overflow-x-auto max-h-[400px]">
                 <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-white border-b border-zinc-200 z-10 shadow-sm">
                       <tr>
                          {insights.columns.slice(0, 10).map((col: any) => (
                            <th key={col.name} className="px-6 py-4 font-black uppercase tracking-tight text-zinc-400 border-r border-zinc-100 last:border-0 bg-white">
                               {col.name}
                               <div className="text-[8px] font-bold text-blue-500 mt-0.5">{col.type}</div>
                            </th>
                          ))}
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                       {insights.preview.map((row: any, i: number) => (
                         <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                            {insights.columns.slice(0, 10).map((col: any) => (
                              <td key={col.name} className="px-6 py-4 font-mono font-medium text-zinc-600 border-r border-zinc-50 last:border-0">
                                 {row[col.name]?.toString() || '-'}
                              </td>
                            ))}
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="flex justify-end p-2">
              <button 
                onClick={handleProceed}
                className="group px-12 py-5 bg-zinc-900 text-white font-black uppercase tracking-widest text-sm rounded-3xl shadow-2xl flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Proceed to Refinement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold">{error}</span>
        </div>
      )}
    </div>
  );
}
