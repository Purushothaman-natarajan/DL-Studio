import React from 'react';
import { Loader2, Brain, Database, Cpu, Activity, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface BackendProgressProps {
  isVisible: boolean;
  phase: 'preparing' | 'training' | 'xai' | 'finalizing';
  progress: number;
  message?: string;
}

const PHASE_INFO = {
  preparing: {
    icon: Database,
    label: 'Preparing Data',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Uploading and preprocessing your dataset...'
  },
  training: {
    icon: Brain,
    label: 'Training Model',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Running backpropagation on your neural network...'
  },
  xai: {
    icon: Sparkles,
    label: 'Generating Insights',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'Computing SHAP values and sensitivity analysis...'
  },
  finalizing: {
    icon: Cpu,
    label: 'Finalizing Results',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'Saving model artifacts and generating reports...'
  }
};

export function BackendProgress({ isVisible, phase, progress, message }: BackendProgressProps) {
  if (!isVisible) return null;

  const info = PHASE_INFO[phase];
  const Icon = info.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl shadow-zinc-400/20 p-8 w-full max-w-md mx-4 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center animate-pulse",
            info.bgColor
          )}>
            <Icon className={cn("w-10 h-10", info.color)} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-zinc-900">{info.label}</h3>
            <p className="text-sm text-zinc-500">{info.description}</p>
          </div>

          <div className="w-full space-y-3">
            <div className="flex justify-between text-[10px] font-bold text-zinc-500">
              <span className="uppercase tracking-widest">Progress</span>
              <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  phase === 'preparing' ? 'bg-blue-500' :
                  phase === 'training' ? 'bg-purple-500' :
                  phase === 'xai' ? 'bg-amber-500' : 'bg-emerald-500'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {message && (
            <div className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">
                {message}
              </p>
            </div>
          )}

          <div className="flex items-center gap-6 text-[10px] font-bold text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Prep</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", ['preparing'].includes(phase) ? 'bg-purple-300' : 'bg-purple-500')} />
              <span>Train</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", ['preparing', 'training'].includes(phase) ? 'bg-amber-300' : 'bg-amber-500')} />
              <span>XAI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", !['finalizing'].includes(phase) ? 'bg-emerald-300' : 'bg-emerald-500')} />
              <span>Done</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ message, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Loader2 className={cn("w-6 h-6 animate-spin text-zinc-400", sizeClasses[size])} />
      {message && (
        <p className="text-xs font-medium text-zinc-500">{message}</p>
      )}
    </div>
  );
}

interface RenderingOverlayProps {
  isVisible: boolean;
  title?: string;
  message?: string;
}

export function RenderingOverlay({ isVisible, title = 'Processing', message }: RenderingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-20">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-zinc-200 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-t-blue-500 rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-zinc-700">{title}</p>
          {message && <p className="text-[10px] text-zinc-500 mt-1">{message}</p>}
        </div>
      </div>
    </div>
  );
}
