import React from 'react';
import { LayerConfig } from '../types';
import { Brain, Cpu, Zap, X } from 'lucide-react';

interface ArchitectureDiagramProps {
  features: string[];
  targets: string[];
  layers: LayerConfig[];
}

export function ArchitectureDiagram({ features, targets, layers }: ArchitectureDiagramProps) {
  // Max nodes to show for input/output to avoid clutter
  const maxVisibleNodes = 10;
  
  const visibleFeatures = features.slice(0, maxVisibleNodes);
  const visibleTargets = targets.slice(0, maxVisibleNodes);

  const nodeRadius = 15;
  const layerWidth = 120;
  const height = 450;
  const nodeGap = 35;

  const getHiddenLayerWidth = (units: number) => {
      if (units >= 128) return 60;
      if (units >= 64) return 50;
      return 40;
  };

  const getHiddenLayerHeight = (units: number) => {
      // Minimum height for small units, scaling up to max height
      return Math.min(300, Math.max(80, units * 2));
  };

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col bg-zinc-50/30 rounded-3xl border border-zinc-100 p-8 overflow-hidden relative group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg text-white">
                <Brain className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-tighter">Live Architecture Blueprint</h4>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400">
            <div className="flex items-center gap-1.5 line-through decoration-zinc-300">
                <span className="w-2 h-2 rounded-full bg-blue-500/20" />
                Dense
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                Active Connection
            </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-between px-4 pb-12 relative overflow-x-auto no-scrollbar">
        {/* SVG for Connections */}
        <svg className="absolute inset-0 w-full h-full -z-0 pointer-events-none opacity-20">
            {/* We'll just draw some indicative fanning lines in CSS or simple SVG lines */}
        </svg>

        {/* 1. Input Layer */}
        <div className="flex flex-col items-center gap-2 z-10 w-32 shrink-0">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Input Layer</span>
          <div className="flex flex-col items-center" style={{ gap: `${nodeGap - 20}px` }}>
            {visibleFeatures.map((f, i) => (
              <div key={f} className="flex flex-row-reverse items-center gap-2 w-full group/node">
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center shrink-0 group-hover/node:scale-125 transition-transform">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 truncate text-right max-w-[80px] font-bold">{f}</span>
              </div>
            ))}
            {features.length > maxVisibleNodes && (
              <div className="text-[8px] font-black text-zinc-300">+{features.length - maxVisibleNodes} MORE</div>
            )}
          </div>
          <p className="mt-6 text-[9px] font-bold text-zinc-400 text-center uppercase">Physical Parameters</p>
        </div>

        <div className="flex items-center gap-4 py-8">
            <ChevronArrow />
        </div>

        {/* 2. Hidden Layers */}
        <div className="flex items-center gap-12 z-10">
          {layers.map((layer, idx) => (
            <React.Fragment key={layer.id}>
                <div className="flex flex-col items-center gap-4">
                    <span className="text-[10px] font-black text-zinc-500 uppercase">Hidden {idx + 1}</span>
                    <div 
                        className="bg-blue-50/50 border-2 border-blue-200 rounded-2xl flex flex-col items-center justify-center relative shadow-sm hover:border-blue-400 hover:bg-blue-50 transition-all cursor-help"
                        style={{ 
                            width: `${getHiddenLayerWidth(layer.units)}px`, 
                            height: `${getHiddenLayerHeight(layer.units)}px`,
                            minWidth: '60px'
                        }}
                        title={`${layer.units} Units (${layer.activation})`}
                    >
                        <div className="absolute inset-0 opacity-10 flex flex-wrap gap-1 p-2 justify-center content-center overflow-hidden">
                            {Array.from({length: 12}).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            ))}
                        </div>
                        <div className="z-10 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
                            <span className="text-[10px] font-blk text-blue-600 leading-none">{layer.units}</span>
                        </div>
                    </div>
                    <div className="space-y-0.5 text-center">
                        <p className="text-[9px] font-black text-zinc-900 uppercase">{layer.activation}</p>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase">Dense</p>
                    </div>
                </div>
                {idx < layers.length - 1 && (
                    <div className="flex flex-col items-center gap-2">
                         <ChevronArrow />
                         <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200" title="Dropout Interaction">
                            <X className="w-3 h-3 stroke-[3]" />
                         </div>
                    </div>
                )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-4 py-8">
            <ChevronArrow />
        </div>

        {/* 3. Output Layer */}
        <div className="flex flex-col items-center gap-2 z-10 w-32 shrink-0">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Output Layer</span>
          <div className="flex flex-col items-center" style={{ gap: `${nodeGap - 20}px` }}>
            {visibleTargets.map((t, i) => (
              <div key={t} className="flex items-center gap-2 w-full group/node">
                <div className="w-6 h-6 rounded-full bg-rose-400 border-2 border-white shadow-sm flex items-center justify-center shrink-0 group-hover/node:scale-125 transition-transform">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[80px] font-bold">{t}</span>
              </div>
            ))}
             {targets.length > maxVisibleNodes && (
              <div className="text-[8px] font-black text-zinc-300">+{targets.length - maxVisibleNodes} MORE</div>
            )}
          </div>
          <p className="mt-6 text-[9px] font-bold text-zinc-400 text-center uppercase">Predicted Props</p>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-zinc-100/50 flex items-center justify-between">
          <div className="flex gap-4">
              <div className="flex items-center gap-2">
                  <div className="text-[10px] font-black text-zinc-900">{features.length}</div>
                  <div className="text-[8px] font-bold text-zinc-400 uppercase">Inputs</div>
              </div>
              <div className="flex items-center gap-2">
                  <div className="text-[10px] font-black text-zinc-900">{layers.reduce((acc, l) => acc + l.units, 0)}</div>
                  <div className="text-[8px] font-bold text-zinc-400 uppercase">Neurons</div>
              </div>
              <div className="flex items-center gap-2">
                  <div className="text-[10px] font-black text-zinc-900">{targets.length}</div>
                  <div className="text-[8px] font-bold text-zinc-400 uppercase">Outputs</div>
              </div>
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black text-blue-500 uppercase tracking-widest bg-blue-50/50 px-2 py-1 rounded-full">
              <Zap className="w-2.5 h-2.5 fill-current" />
              Dynamic Model
          </div>
      </div>
    </div>
  );
}

function ChevronArrow() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-zinc-200">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}
