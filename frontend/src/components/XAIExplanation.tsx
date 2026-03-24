import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { XAIResult } from '../types';
import { Info, Sparkles, TrendingUp, BarChart3, LineChart as LineChartIcon, Grid3X3, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface XAIExplanationProps {
  result: XAIResult | null;
}

type TabType = 'importance' | 'sensitivity' | 'correlation' | 'residuals';

export function XAIExplanation({ result }: XAIExplanationProps) {
  const [activeTab, setActiveTab] = useState<TabType>('importance');
  const [selectedSensitivityFeature, setSelectedSensitivityFeature] = useState<string>(
    result?.sensitivityData[0]?.feature || ''
  );

  React.useEffect(() => {
    if (result?.sensitivityData?.length) {
      setSelectedSensitivityFeature(result.sensitivityData[0].feature);
    }
  }, [result]);

  if (!result) return null;

  const sensitivityPoints = result.sensitivityData.find(d => d.feature === selectedSensitivityFeature)?.points || [];

  const tabs = [
    { id: 'importance', label: 'Importance', icon: BarChart3 },
    { id: 'sensitivity', label: 'Sensitivity', icon: LineChartIcon },
    { id: 'correlation', label: 'Correlation', icon: Grid3X3 },
    { id: 'residuals', label: 'Actual vs Predicted', icon: Activity },
  ];

  return (
    <div className="space-y-8 pt-12 border-t border-zinc-200 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Model Interpretability
          </h3>
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Analyze how features influence your neural network's decisions.
          </p>
        </div>

        <div className="flex bg-zinc-100 p-1 rounded-xl self-start">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-white text-zinc-900 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[450px] animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'importance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <TrendingUp className="w-3 h-3" />
                  Relative Feature Importance
                </div>
                <div className="h-[400px] w-full border border-zinc-200 rounded-2xl bg-white p-6 shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.featureImportance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" fontSize={10} hide />
                      <YAxis 
                        dataKey="feature" 
                        type="category" 
                        fontSize={10} 
                        width={100}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#71717a' }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f9fafb' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-xl">
                                <p className="text-xs font-bold text-zinc-900 mb-1">{data.feature}</p>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-zinc-900" />
                                  <p className="text-[10px] text-zinc-500">
                                    Importance: <span className="font-bold text-zinc-900">{data.importance.toFixed(1)}%</span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="importance" 
                        radius={[0, 6, 6, 0]} 
                        barSize={24}
                      >
                        {result.featureImportance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#18181b' : '#3f3f46'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <Sparkles className="w-3 h-3" />
                  Top Influencers
                </div>
                <div className="space-y-3">
                  {result.featureImportance.slice(0, 4).map((fi, idx) => (
                    <div key={fi.feature} className="p-4 border border-zinc-200 rounded-xl bg-white shadow-sm hover:border-zinc-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-zinc-400">RANK #{idx + 1}</span>
                        <span className="text-[10px] font-mono font-bold text-zinc-900">{fi.importance.toFixed(1)}%</span>
                      </div>
                      <div className="text-sm font-bold text-zinc-900 truncate">{fi.feature}</div>
                      <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div 
                          className="bg-zinc-900 h-full transition-all duration-1000" 
                          style={{ width: `${fi.importance}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sensitivity' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <TrendingUp className="w-3 h-3" />
                Feature Sensitivity Curve
              </div>
              <select 
                value={selectedSensitivityFeature}
                onChange={(e) => setSelectedSensitivityFeature(e.target.value)}
                className="text-xs font-bold bg-white border border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                {result.sensitivityData.map(d => (
                  <option key={d.feature} value={d.feature}>{d.feature}</option>
                ))}
              </select>
            </div>
            <div className="h-[400px] w-full border border-zinc-200 rounded-2xl bg-white p-6 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensitivityPoints}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="x" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#71717a' }}
                    label={{ value: selectedSensitivityFeature, position: 'insideBottom', offset: -5, fontSize: 10, fill: '#a1a1aa', fontWeight: 'bold' }}
                  />
                  <YAxis 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#71717a' }}
                    label={{ value: 'Model Output', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#a1a1aa', fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-xl">
                            <p className="text-[10px] text-zinc-500 mb-1">Feature Value</p>
                            <p className="text-xs font-bold text-zinc-900 mb-2">{payload[0].payload.x.toFixed(4)}</p>
                            <p className="text-[10px] text-zinc-500 mb-1">Prediction</p>
                            <p className="text-xs font-bold text-blue-600">{payload[0].value.toFixed(4)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    dot={false}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'correlation' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <TrendingUp className="w-3 h-3" />
              Feature Correlation Matrix
            </div>
            <div className="h-[500px] w-full border border-zinc-200 rounded-2xl bg-white p-6 shadow-sm overflow-auto">
              <div className="relative inline-block min-w-full">
                {/* Heatmap Grid with Labels */}
                <div 
                  className="grid gap-px bg-zinc-100 border border-zinc-200" 
                  style={{ 
                    gridTemplateColumns: `80px repeat(${Math.sqrt(result.correlationMatrix.length)}, 1fr)`,
                  }}
                >
                  {/* Top-left empty corner */}
                  <div className="bg-zinc-50 border-b border-r border-zinc-200" />
                  
                  {/* Column Headers (X-Axis) */}
                  {Array.from(new Set(result.correlationMatrix.map(c => c.x))).map(feature => (
                    <div key={feature} className="bg-zinc-50 p-2 text-[8px] font-bold text-zinc-500 truncate border-b border-zinc-200 text-center flex items-center justify-center">
                      <span className="rotate-[-45deg] whitespace-nowrap">{feature}</span>
                    </div>
                  ))}

                  {/* Rows */}
                  {Array.from(new Set(result.correlationMatrix.map(c => c.y))).map((yFeature, rowIdx) => (
                    <React.Fragment key={yFeature}>
                      {/* Row Header (Y-Axis) */}
                      <div className="bg-zinc-50 p-2 text-[8px] font-bold text-zinc-500 truncate border-r border-zinc-200 flex items-center justify-end">
                        {yFeature}
                      </div>
                      
                      {/* Data Cells */}
                      {result.correlationMatrix.filter(c => c.y === yFeature).map((cell, colIdx) => (
                        <div 
                          key={`${rowIdx}-${colIdx}`}
                          className="aspect-square flex flex-col items-center justify-center text-[10px] font-mono transition-all hover:scale-110 hover:z-10 hover:shadow-lg cursor-help"
                          style={{ 
                            backgroundColor: cell.value > 0 
                              ? `rgba(59, 130, 246, ${cell.value})` 
                              : `rgba(239, 68, 68, ${Math.abs(cell.value)})`,
                            color: Math.abs(cell.value) > 0.4 ? 'white' : 'black'
                          }}
                          title={`${cell.x} vs ${cell.y}: ${cell.value.toFixed(3)}`}
                        >
                          <span className="font-bold">{cell.value.toFixed(2)}</span>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span className="text-[10px] font-bold text-zinc-500">Positive Correlation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span className="text-[10px] font-bold text-zinc-500">Negative Correlation</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'residuals' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <TrendingUp className="w-3 h-3" />
              Actual vs Predicted Plot
            </div>
            <div className="h-[400px] w-full border border-zinc-200 rounded-2xl bg-white p-6 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="actual" 
                    name="Actual Value" 
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    label={{ value: 'Actual Target Values', position: 'insideBottom', offset: -15, fontSize: 12, fill: '#52525b', fontWeight: 'bold' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="predicted" 
                    name="Predicted Value" 
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    label={{ value: 'Predicted Target Values', angle: -90, position: 'insideLeft', offset: -10, fontSize: 12, fill: '#52525b', fontWeight: 'bold' }}
                  />
                  <ZAxis type="number" range={[50, 50]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-zinc-200 rounded-xl shadow-xl">
                            <div className="space-y-1">
                              <p className="text-[10px] text-zinc-500 uppercase">Comparison</p>
                              <div className="grid grid-cols-2 gap-x-4">
                                <span className="text-xs font-bold text-zinc-600">Actual:</span>
                                <span className="text-xs font-mono font-bold text-zinc-900">{data.actual.toFixed(4)}</span>
                                <span className="text-xs font-bold text-blue-600">Predicted:</span>
                                <span className="text-xs font-mono font-bold text-blue-600">{data.predicted.toFixed(4)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    name="Test Set Inference" 
                    data={result.residuals} 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                  />
                  {/* Exact match diagonal line proxy */}
                  <Line 
                    dataKey="actual" 
                    stroke="#18181b" 
                    strokeWidth={1} 
                    strokeDasharray="4 4" 
                    dot={false} 
                    activeDot={false}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-[10px] text-zinc-500 leading-relaxed">
              <span className="font-bold text-zinc-900">How to read:</span> A perfect model would place all points along a diagonal straight line. Points scattered far away from the imaginary 45-degree angle indicate prediction errors.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
