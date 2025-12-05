import React, { useState } from 'react';
import Papa from 'papaparse';
import { Database, Upload, FileText, CheckCircle, AlertCircle, Server, HardDrive } from 'lucide-react';
import { Dataset, DataRow, DataSourceType } from '../types';

interface DataSourceProps {
  onDataLoaded: (dataset: Dataset) => void;
}

const SAMPLE_DB_DATA: DataRow[] = Array.from({ length: 100 }, (_, i) => {
  // Simulate a Sales vs Ad Spend dataset with some outliers
  const adSpend = Math.floor(Math.random() * 5000) + 500;
  let revenue = adSpend * (2.5 + Math.random()) + (Math.random() * 1000);
  
  // Inject Outliers
  if (i === 15) revenue = revenue * 3; // Huge return (Viral campaign?)
  if (i === 42) revenue = revenue * 0.2; // Terrible return (Bad targeting?)
  if (i === 88) { revenue = 50000; } // Data error?

  return {
    id: i + 1,
    campaign_name: `Campaign ${i + 1}`,
    ad_spend: adSpend,
    revenue: parseFloat(revenue.toFixed(2)),
    clicks: Math.floor(adSpend / (Math.random() * 2 + 0.5)),
    impressions: Math.floor(adSpend * 100)
  };
});

const DataSource: React.FC<DataSourceProps> = ({ onDataLoaded }) => {
  const [activeTab, setActiveTab] = useState<DataSourceType>(DataSourceType.CSV);
  const [dbMode, setDbMode] = useState<'connect' | 'upload'>('connect');
  const [isDragOver, setIsDragOver] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (activeTab === DataSourceType.CSV) {
        processCsvFile(file);
      } else {
        processDbFile(file);
      }
    }
  };

  const processCsvFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const columns = Object.keys(results.data[0] as object);
          onDataLoaded({
            name: file.name,
            columns,
            data: results.data as DataRow[]
          });
        }
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
      }
    });
  };

  const processDbFile = (file: File) => {
    setDbLoading(true);
    setDbError(null);

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') {
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (Array.isArray(json) && json.length > 0) {
             const columns = Object.keys(json[0]);
             onDataLoaded({
               name: file.name,
               columns,
               data: json as DataRow[]
             });
          } else {
            setDbError("Invalid JSON structure. Expected an array of objects.");
          }
        } catch (err) {
          setDbError("Failed to parse JSON file.");
        } finally {
          setDbLoading(false);
        }
      };
      reader.readAsText(file);
    } else {
      // Simulate processing for binary DB files
      setTimeout(() => {
        if (['db', 'sqlite', 'sql', 'sqlite3'].includes(extension || '')) {
          onDataLoaded({
            name: `${file.name} (Simulated Import)`,
            columns: Object.keys(SAMPLE_DB_DATA[0]),
            data: SAMPLE_DB_DATA
          });
        } else {
          setDbError("Unsupported file format. Please upload .json, .sql, or .db files.");
        }
        setDbLoading(false);
      }, 1500);
    }
  };

  const handleDbConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setDbLoading(true);
    setDbError(null);

    // Simulate Network Request
    setTimeout(() => {
      setDbLoading(false);
      const success = true; 
      if (success) {
        onDataLoaded({
          name: 'PostgreSQL: public.campaign_metrics',
          columns: Object.keys(SAMPLE_DB_DATA[0]),
          data: SAMPLE_DB_DATA
        });
      } else {
        setDbError("Connection timed out. Please check your credentials.");
      }
    }, 1500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
      <div className="flex border-b border-slate-700">
        <button
          className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2
            ${activeTab === DataSourceType.CSV ? 'bg-slate-700 text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => setActiveTab(DataSourceType.CSV)}
        >
          <Upload size={18} /> Upload CSV
        </button>
        <button
          className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2
            ${activeTab === DataSourceType.DATABASE ? 'bg-slate-700 text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => setActiveTab(DataSourceType.DATABASE)}
        >
          <Database size={18} /> Database Source
        </button>
      </div>

      <div className="p-8 min-h-[400px] flex flex-col">
        {activeTab === DataSourceType.CSV ? (
          <div className="flex-1 flex flex-col justify-center">
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200
                ${isDragOver ? 'border-blue-400 bg-slate-700/50' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) processCsvFile(file);
              }}
            >
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                onChange={handleFileUpload}
              />
              <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4">
                  <FileText size={32} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Drop your CSV here</h3>
                <p className="text-slate-400 mb-6">or click to browse files</p>
                <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">
                  Select CSV File
                </span>
              </label>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-center mb-6 bg-slate-900/50 p-1 rounded-lg self-center">
               <button
                 onClick={() => setDbMode('connect')}
                 className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                   dbMode === 'connect' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                 }`}
               >
                 Remote Connection
               </button>
               <button
                 onClick={() => setDbMode('upload')}
                 className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                   dbMode === 'upload' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                 }`}
               >
                 Upload DB File
               </button>
            </div>

            {dbMode === 'connect' ? (
              <form onSubmit={handleDbConnect} className="space-y-4">
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <Server className="text-purple-400 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="text-purple-300 font-medium text-sm">Simulator Mode</h4>
                      <p className="text-purple-200/60 text-xs mt-1">
                        Enter any credentials to simulate a secure database connection.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Host</label>
                    <input type="text" defaultValue="localhost" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Port</label>
                    <input type="text" defaultValue="5432" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Database Name</label>
                  <input type="text" defaultValue="analytics_db" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
                    <input type="text" defaultValue="admin" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                    <input type="password" defaultValue="••••••••" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                </div>
                
                {dbError && (
                  <div className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {dbError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={dbLoading}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {dbLoading ? 'Connecting...' : (
                    <>
                      <CheckCircle size={18} /> Connect & Load Data
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="flex-1 flex flex-col justify-center">
                 <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 h-full flex flex-col justify-center
                    ${isDragOver ? 'border-purple-400 bg-slate-700/50' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) processDbFile(file);
                  }}
                >
                  {dbLoading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-purple-300">Processing Database File...</p>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept=".db,.sqlite,.sqlite3,.sql,.json"
                        className="hidden"
                        id="db-upload"
                        onChange={handleFileUpload}
                      />
                      <label htmlFor="db-upload" className="cursor-pointer flex flex-col items-center">
                        <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-4">
                          <HardDrive size={32} />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Upload DB Export</h3>
                        <p className="text-slate-400 mb-6 text-sm max-w-xs mx-auto">
                          Supports .db, .sqlite, .sql (simulated) or .json (parsed)
                        </p>
                        <span className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors">
                          Select Database File
                        </span>
                      </label>
                      {dbError && (
                        <div className="mt-4 text-red-400 text-sm flex items-center gap-2 justify-center bg-red-900/20 py-2 px-4 rounded">
                          <AlertCircle size={16} /> {dbError}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSource;