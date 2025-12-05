import React, { useState, useEffect, useMemo } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label 
} from 'recharts';
import { Brain, AlertTriangle, RefreshCw, BarChart2, Info, ArrowRight, Table } from 'lucide-react';
import { Dataset, OutlierDataPoint, DataRow } from '../types';
import { detectOutliers } from '../utils/stats';
import { analyzeOutliersWithGemini } from '../services/geminiService';
import DataEditor from './DataEditor';

interface AnalysisDashboardProps {
  dataset: Dataset;
  onReset: () => void;
  onUpdateDataset: (updatedDataset: Dataset) => void;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ dataset, onReset, onUpdateDataset }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'data'>('analysis');

  const numericColumns = useMemo(() => {
    if (dataset.data.length === 0) return [];
    // Heuristic: check first valid row for numeric type
    const firstRow = dataset.data.find(r => r !== undefined && r !== null);
    if (!firstRow) return [];
    return dataset.columns.filter(key => typeof firstRow[key] === 'number');
  }, [dataset]);

  const [xKey, setXKey] = useState<string>(numericColumns[0] || '');
  const [yKey, setYKey] = useState<string>(numericColumns[1] || numericColumns[0] || '');
  const [threshold, setThreshold] = useState(2.5);
  
  const [analysisResult, setAnalysisResult] = useState<{
    processedData: OutlierDataPoint[];
    outlierIndices: number[];
  } | null>(null);

  const [aiInsight, setAiInsight] = useState<{
    summary: string;
    outlierAnalysis: string;
    actionableInsights: string[];
  } | null>(null);
  
  const [aiLoading, setAiLoading] = useState(false);

  // Update selected keys if columns change (e.g. data edit changed type or new load)
  useEffect(() => {
      if (numericColumns.length > 0) {
          if (!numericColumns.includes(xKey)) setXKey(numericColumns[0]);
          if (!numericColumns.includes(yKey)) setYKey(numericColumns[1] || numericColumns[0]);
      }
  }, [numericColumns]);

  // Run local statistical analysis when keys or threshold change
  useEffect(() => {
    if (xKey && yKey && dataset.data.length > 0) {
      const result = detectOutliers(dataset.data, xKey, yKey, threshold);
      setAnalysisResult(result);
      // Reset AI insights when data view changes to avoid stale analysis
      setAiInsight(null); 
    }
  }, [dataset, xKey, yKey, threshold]);

  const handleGeminiAnalysis = async () => {
    if (!analysisResult) return;
    setAiLoading(true);
    const result = await analyzeOutliersWithGemini(
      dataset.data,
      dataset.columns,
      analysisResult.outlierIndices,
      xKey,
      yKey
    );
    setAiInsight(result);
    setAiLoading(false);
  };

  const handleDataUpdate = (newData: DataRow[]) => {
      onUpdateDataset({
          ...dataset,
          data: newData
      });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-xl text-xs z-50">
          <p className="font-semibold text-slate-200 mb-1">
            {xKey}: {data[xKey]}
          </p>
          <p className="font-semibold text-slate-200 mb-2">
            {yKey}: {data[yKey]}
          </p>
          {data.isOutlier && (
            <div className="text-red-400 font-bold flex items-center gap-1">
              <AlertTriangle size={12} /> Outlier Detected
            </div>
          )}
          <div className="mt-2 text-slate-500">
             Raw values available in table
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 h-full min-h-[calc(100vh-140px)] flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-1">
            <button
                onClick={() => setActiveTab('analysis')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
                    ${activeTab === 'analysis' 
                        ? 'border-blue-500 text-blue-400 bg-slate-800/50' 
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
            >
                <BarChart2 size={16} /> Analysis & Insights
            </button>
            <button
                onClick={() => setActiveTab('data')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
                    ${activeTab === 'data' 
                        ? 'border-blue-500 text-blue-400 bg-slate-800/50' 
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
            >
                <Table size={16} /> Data Editor
            </button>
        </div>

      {activeTab === 'analysis' ? (
        <>
            {numericColumns.length < 2 ? (
                <div className="text-center p-12">
                    <h2 className="text-xl text-slate-400">Not enough numeric data found for scatter analysis.</h2>
                    <p className="text-slate-500 mt-2">Try editing the data in the "Data Editor" tab or check your CSV format.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                    {/* Left Panel: Controls & Chart */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Controls */}
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex gap-4 items-center">
                            <div className="flex flex-col">
                            <label className="text-xs text-slate-400 font-medium mb-1">X Axis</label>
                            <select 
                                value={xKey} 
                                onChange={(e) => setXKey(e.target.value)}
                                className="bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                            </div>
                            <div className="flex flex-col">
                            <label className="text-xs text-slate-400 font-medium mb-1">Y Axis</label>
                            <select 
                                value={yKey} 
                                onChange={(e) => setYKey(e.target.value)}
                                className="bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                            </div>
                            <div className="flex flex-col w-32">
                            <label className="text-xs text-slate-400 font-medium mb-1">Sensitivity ({threshold})</label>
                            <input 
                                type="range" 
                                min="1.5" 
                                max="4.0" 
                                step="0.1" 
                                value={threshold}
                                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                                className="accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-2"
                            />
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">
                            {analysisResult?.outlierIndices.length || 0}
                            </div>
                            <div className="text-xs text-red-400 font-medium flex items-center gap-1 justify-end">
                            <AlertTriangle size={12} /> Outliers Found
                            </div>
                        </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 h-[500px] relative">
                        <h3 className="text-sm font-medium text-slate-400 absolute top-4 left-4 z-10 flex items-center gap-2">
                            <BarChart2 size={16} /> Data Distribution & Outliers
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 40, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis 
                                type="number" 
                                dataKey={xKey} 
                                name={xKey} 
                                stroke="#94a3b8" 
                                tick={{fill: '#94a3b8', fontSize: 12}}
                                label={{ value: xKey, position: 'insideBottomRight', offset: -5, fill: '#64748b' }} 
                            />
                            <YAxis 
                                type="number" 
                                dataKey={yKey} 
                                name={yKey} 
                                stroke="#94a3b8" 
                                tick={{fill: '#94a3b8', fontSize: 12}}
                                label={{ value: yKey, angle: -90, position: 'insideLeft', fill: '#64748b' }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Data Points" data={analysisResult?.processedData || []} fill="#3b82f6">
                                {analysisResult?.processedData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.isOutlier ? '#ef4444' : '#3b82f6'} 
                                    stroke={entry.isOutlier ? '#b91c1c' : 'none'}
                                    strokeWidth={2}
                                    r={entry.isOutlier ? 6 : 4}
                                    opacity={entry.isOutlier ? 1 : 0.6}
                                />
                                ))}
                            </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right Panel: AI Insights */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-full overflow-hidden">
                        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                            <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Brain className="text-purple-400" /> AI Analyst
                            </h2>
                            </div>
                            <p className="text-sm text-slate-400">
                            Generate explanations for detected outliers and get actionable business insights.
                            </p>
                        </div>
                        
                        <div className="flex-1 p-6 overflow-y-auto bg-slate-900/50">
                            {!aiInsight ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                                <Brain size={32} className="text-purple-400" />
                                </div>
                                <h3 className="text-white font-medium mb-2">Ready to Analyze</h3>
                                <p className="text-slate-400 text-sm mb-6">
                                Click the button below to send the detected outlier data to Gemini for reasoning.
                                </p>
                                <button
                                onClick={handleGeminiAnalysis}
                                disabled={aiLoading}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                {aiLoading ? (
                                    <>
                                    <RefreshCw className="animate-spin" size={18} /> Analyzing Data...
                                    </>
                                ) : (
                                    <>
                                    Generate Insights <ArrowRight size={18} />
                                    </>
                                )}
                                </button>
                            </div>
                            ) : (
                            <div className="space-y-6 animate-fade-in">
                                <div className="space-y-2">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Summary</h3>
                                <p className="text-slate-300 text-sm leading-relaxed">{aiInsight.summary}</p>
                                </div>
                                
                                <div className="space-y-2">
                                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                                    <AlertTriangle size={14} /> Outlier Analysis
                                </h3>
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                                    <p className="text-slate-300 text-sm leading-relaxed">{aiInsight.outlierAnalysis}</p>
                                </div>
                                </div>

                                <div className="space-y-3">
                                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Recommendations</h3>
                                <ul className="space-y-3">
                                    {aiInsight.actionableInsights.map((insight, idx) => (
                                    <li key={idx} className="flex gap-3 text-sm text-slate-300 bg-slate-800 p-3 rounded border border-slate-700">
                                        <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                                        {idx + 1}
                                        </span>
                                        {insight}
                                    </li>
                                    ))}
                                </ul>
                                </div>
                                
                                <button 
                                onClick={() => setAiInsight(null)} 
                                className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 mt-4 border-t border-slate-800 pt-4"
                                >
                                Clear Analysis
                                </button>
                            </div>
                            )}
                        </div>
                        </div>
                    </div>
                </div>
            )}
        </>
      ) : (
          <div className="flex-1 overflow-hidden h-full">
              <DataEditor 
                  data={dataset.data} 
                  columns={dataset.columns} 
                  onUpdateData={handleDataUpdate} 
              />
          </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;