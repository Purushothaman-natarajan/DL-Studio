import React, { useState, useRef, useCallback } from 'react';
import { Maximize2, Minimize2, Download, X, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface PlotWrapperProps {
  title: string;
  children: React.ReactNode;
  height?: string;
  className?: string;
  onDownload?: (format: 'png' | 'pdf') => void;
}

export function PlotWrapper({ title, children, height = 'h-[400px]', className, onDownload }: PlotWrapperProps) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async (format: 'png' | 'pdf') => {
    if (!containerRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(containerRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      if (format === 'pdf') {
        const jsPDF = (await import('jspdf')).default;
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 20));
        pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
      } else {
        const link = document.createElement('a');
        link.download = `${title.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      }
    } catch (err) {
      console.error('Export failed:', err);
      // Fallback: try direct element capture
      if (containerRef.current) {
        const link = document.createElement('a');
        link.download = `${title.replace(/\s+/g, '_')}.png`;
        // Try to find SVG elements and convert
        const svg = containerRef.current.querySelector('svg');
        if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const canvas = document.createElement('canvas');
          canvas.width = svg.clientWidth * 3;
          canvas.height = svg.clientHeight * 3;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              link.href = canvas.toDataURL('image/png');
              link.click();
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
          }
        }
      }
    }
  }, [title]);

  const expandedOverlay = expanded ? (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-zinc-900">{title}</h4>
          <div className="flex items-center gap-2">
            <button onClick={() => handleExport('png')} className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Download className="w-3 h-3" /> PNG
            </button>
            <button onClick={() => handleExport('pdf')} className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> PDF
            </button>
            <button onClick={() => setExpanded(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div ref={containerRef} className="min-h-[500px] flex items-center justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {expandedOverlay}
      <div className={cn("relative group", className)}>
        <div ref={!expanded ? containerRef : undefined} className={height}>
          {children}
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={() => setExpanded(true)}
            className="p-1.5 bg-white/90 backdrop-blur border border-zinc-200 rounded-lg hover:bg-white shadow-sm"
            title="Expand"
          >
            <Maximize2 className="w-3.5 h-3.5 text-zinc-600" />
          </button>
          <button
            onClick={() => handleExport('png')}
            className="p-1.5 bg-white/90 backdrop-blur border border-zinc-200 rounded-lg hover:bg-white shadow-sm"
            title="Download PNG"
          >
            <Download className="w-3.5 h-3.5 text-zinc-600" />
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="p-1.5 bg-white/90 backdrop-blur border border-zinc-200 rounded-lg hover:bg-white shadow-sm"
            title="Download PDF"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-600" />
          </button>
        </div>
      </div>
    </>
  );
}
