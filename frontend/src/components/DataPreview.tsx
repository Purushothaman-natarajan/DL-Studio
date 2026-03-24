import React from 'react';
import { DataColumn } from '../types';
import { Settings2, Table as TableIcon, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';

interface DataPreviewProps {
  data: any[];
  columns: DataColumn[];
  totalRows?: number;
  onColumnUpdate: (index: number, updates: Partial<DataColumn>) => void;
}

export function DataPreview({ data, columns, totalRows, onColumnUpdate }: DataPreviewProps) {
  const previewData = data.slice(0, 5);
  const rowCount = totalRows ?? data.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TableIcon className="w-5 h-5" />
          Data Configuration
        </h3>
        <span className="text-xs font-mono text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
          {rowCount.toLocaleString()} ROWS x {columns.length} COLS
        </span>
      </div>

      {rowCount > previewData.length && (
        <p className="text-[11px] text-zinc-500 -mt-4">
          Showing {previewData.length} sample rows from {rowCount.toLocaleString()} total rows.
        </p>
      )}

      <div className="overflow-x-auto border border-zinc-200 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 border-bottom border-zinc-200">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="p-3 font-medium text-zinc-600 border-r border-zinc-200 last:border-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="truncate max-w-[120px]" title={col.name}>{col.name}</span>
                    </div>
                    <select
                      value={col.role}
                      onChange={(e) => onColumnUpdate(idx, { role: e.target.value as any })}
                      className={cn(
                        'w-full text-[10px] uppercase tracking-wider font-bold p-1 rounded border',
                        col.role === 'target' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        col.role === 'feature' ? 'bg-green-50 border-green-200 text-green-700' :
                        'bg-zinc-100 border-zinc-200 text-zinc-500'
                      )}
                    >
                      <option value="feature">Feature</option>
                      <option value="target">Target</option>
                      <option value="ignore">Ignore</option>
                    </select>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-zinc-100 last:border-0">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="p-3 text-zinc-600 border-r border-zinc-100 last:border-0 truncate max-w-[150px]">
                    {row[col.name]?.toString() || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-zinc-200 rounded-lg bg-white">
          <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider font-bold mb-2">
            <Settings2 className="w-3 h-3" />
            Features
          </div>
          <div className="text-2xl font-semibold">
            {columns.filter(c => c.role === 'feature').length}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Input variables for the model</p>
        </div>
        <div className="p-4 border border-zinc-200 rounded-lg bg-white">
          <div className="flex items-center gap-2 text-blue-500 text-xs uppercase tracking-wider font-bold mb-2">
            <BarChart3 className="w-3 h-3" />
            Targets
          </div>
          <div className="text-2xl font-semibold text-blue-600">
            {columns.filter(c => c.role === 'target').length}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Values the model will predict</p>
        </div>
        <div className="p-4 border border-zinc-200 rounded-lg bg-zinc-50 opacity-60">
          <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-bold mb-2">
            <Settings2 className="w-3 h-3" />
            Ignored
          </div>
          <div className="text-2xl font-semibold">
            {columns.filter(c => c.role === 'ignore').length}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Columns excluded from training</p>
        </div>
      </div>
    </div>
  );
}
