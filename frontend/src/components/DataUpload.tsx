import React, { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface DataUploadProps {
  onDataLoaded: (data: any[], columns: string[], file: File) => void;
}

export function DataUpload({ onDataLoaded }: DataUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setError("The file appears to be empty.");
          return;
        }

        const columns = Object.keys(jsonData[0] as object);
        onDataLoaded(jsonData, columns, file);
        setError(null);
      } catch (err) {
        setError("Failed to parse file. Please ensure it is a valid XLSX or CSV.");
      }
    };
    reader.readAsBinaryString(file);
  }, [onDataLoaded]);

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
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-12 transition-all flex flex-col items-center justify-center text-center",
          isDragging ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300"
        )}
      >
        <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
          <Upload className="w-6 h-6 text-zinc-600" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Upload Dataset</h3>
        <p className="text-zinc-500 text-sm mb-6 max-w-xs">
          Drag and drop your XLSX or CSV file here, or click to browse.
        </p>
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={onFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <button className="btn-secondary pointer-events-none">
          Select File
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100 flex items-start gap-3">
          <FileText className="w-5 h-5 text-zinc-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm">Supported Formats</h4>
            <p className="text-xs text-zinc-500">Excel (.xlsx, .xls) and CSV files are supported for tabular data analysis.</p>
          </div>
        </div>
        <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-zinc-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm">Data Requirements</h4>
            <p className="text-xs text-zinc-500">Ensure your data has headers in the first row and numerical values for training.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
