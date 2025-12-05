import React, { useState } from 'react';
import { Activity, Database, LogOut } from 'lucide-react';
import DataSource from './components/DataSource';
import AnalysisDashboard from './components/AnalysisDashboard';
import { Dataset } from './types';

const App: React.FC = () => {
  const [dataset, setDataset] = useState<Dataset | null>(null);

  const handleDataLoaded = (data: Dataset) => {
    setDataset(data);
  };

  const handleUpdateDataset = (updatedDataset: Dataset) => {
    setDataset(updatedDataset);
  };

  const handleReset = () => {
    setDataset(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-purple-500/30">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg text-white">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                OutlierAI
              </h1>
            </div>
          </div>
          
          {dataset && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400 hidden sm:inline-block">
                dataset: <span className="text-white font-medium">{dataset.name}</span>
              </span>
              <button 
                onClick={handleReset}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition-colors flex items-center gap-2"
              >
                <LogOut size={14} /> <span className="hidden sm:inline">Change Source</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!dataset ? (
          <div className="animate-fade-in-up">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
                Data Analysis, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Reimagined</span>
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Upload your CSV or connect your database. Our intelligent algorithms detect statistical outliers, and our AI explains the "why" behind the anomalies.
              </p>
            </div>
            <DataSource onDataLoaded={handleDataLoaded} />
          </div>
        ) : (
          <AnalysisDashboard 
            dataset={dataset} 
            onReset={handleReset} 
            onUpdateDataset={handleUpdateDataset} 
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-auto py-8 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            Powered by Google Gemini 2.5 Flash • Built with React & Tailwind
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;