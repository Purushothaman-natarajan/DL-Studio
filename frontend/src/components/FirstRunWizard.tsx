import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Database, Layers, PlayCircle, Sparkles, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface FirstRunWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBuilding: () => void;
}

interface WizardStep {
  title: string;
  subtitle: string;
  points: string[];
  icon: React.ElementType;
}

const STEPS: WizardStep[] = [
  {
    title: 'Welcome to DL-Studio',
    subtitle: 'This quick guide helps you run your first project with fewer mistakes.',
    points: [
      'Everything runs locally on your machine.',
      'Use Start Building to move into dataset upload.',
      'You can reopen docs from the top-right Docs button anytime.',
    ],
    icon: Sparkles,
  },
  {
    title: 'Prepare and Upload Data',
    subtitle: 'Correct column roles and clean inputs are key for quality metrics.',
    points: [
      'Upload CSV or Excel and assign feature and target roles carefully.',
      'Use Refine stage for missing values and outliers before training.',
      'Start with a simple model baseline before deep models.',
    ],
    icon: Database,
  },
  {
    title: 'Train, Monitor, and Reuse Runs',
    subtitle: 'Use run IDs and live logs to iterate with confidence.',
    points: [
      'Watch live training logs to catch issues early.',
      'Use Run Manager to copy and reload any run_id.',
      'Test scenarios with the inference panel after each run.',
    ],
    icon: Layers,
  },
];

export function FirstRunWizard({ isOpen, onClose, onStartBuilding }: FirstRunWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const isLastStep = stepIndex === STEPS.length - 1;
  const step = useMemo(() => STEPS[stepIndex], [stepIndex]);
  const StepIcon = step.icon;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <StepIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">First Run Wizard</p>
              <p className="text-xs font-bold text-zinc-700">Step {stepIndex + 1} of {STEPS.length}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400"
            aria-label="Close wizard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{step.title}</h3>
            <p className="text-sm text-zinc-500">{step.subtitle}</p>
          </div>

          <div className="space-y-3">
            {step.points.map(point => (
              <div key={point} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm text-zinc-600 leading-relaxed">{point}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn('h-1.5 rounded-full flex-1 transition-all', i <= stepIndex ? 'bg-zinc-900' : 'bg-zinc-200')}
              />
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 bg-white text-[10px] font-black uppercase tracking-widest text-zinc-700"
            >
              Skip
            </button>
            {stepIndex > 0 && (
              <button
                onClick={() => setStepIndex(prev => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl border border-zinc-200 bg-white text-[10px] font-black uppercase tracking-widest text-zinc-700"
              >
                Back
              </button>
            )}
          </div>

          {isLastStep ? (
            <button
              onClick={onStartBuilding}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Start Building
            </button>
          ) : (
            <button
              onClick={() => setStepIndex(prev => Math.min(STEPS.length - 1, prev + 1))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest"
            >
              Next
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
