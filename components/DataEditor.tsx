import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Save, X, Edit2, Check } from 'lucide-react';
import { DataRow } from '../types';

interface DataEditorProps {
  data: DataRow[];
  columns: string[];
  onUpdateData: (newData: DataRow[]) => void;
}

const ROWS_PER_PAGE = 10;

const DataEditor: React.FC<DataEditorProps> = ({ data, columns, onUpdateData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Local state to manage edits before saving to parent
  const [localData, setLocalData] = useState<DataRow[]>(data);

  // Sync local data if parent data changes externally (though usually we are the driver)
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const filteredData = localData.filter(row => 
    columns.some(col => String(row[col]).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setEditingCell(null); // Cancel edit on page change
    }
  };

  const startEdit = (rowIndex: number, colKey: string, value: any) => {
    setEditingCell({ rowIndex, colKey });
    setEditValue(String(value));
  };

  const saveEdit = () => {
    if (!editingCell) return;

    const { rowIndex, colKey } = editingCell;
    const globalIndex = localData.indexOf(currentData[rowIndex]); // Find actual index in full dataset

    if (globalIndex === -1) return;

    const newData = [...localData];
    
    // Attempt type conversion to keep numbers as numbers
    let finalValue: string | number | boolean = editValue;
    const originalValue = newData[globalIndex][colKey];

    if (typeof originalValue === 'number' && !isNaN(Number(editValue))) {
      finalValue = Number(editValue);
    } else if (typeof originalValue === 'boolean') {
      finalValue = editValue.toLowerCase() === 'true';
    }

    newData[globalIndex] = {
      ...newData[globalIndex],
      [colKey]: finalValue
    };

    setLocalData(newData);
    onUpdateData(newData); // Propagate up immediately or could add a "Save All" button
    setEditingCell(null);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-full overflow-hidden shadow-xl">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800/50">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Edit2 size={18} className="text-blue-400" /> Data Editor
        </h3>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} className="text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-300 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 border-b border-slate-700 w-16 text-center">#</th>
              {columns.map((col) => (
                <th key={col} className="px-6 py-4 border-b border-slate-700 whitespace-nowrap min-w-[150px]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {currentData.map((row, rIndex) => (
              <tr key={rIndex} className="hover:bg-slate-700/30 transition-colors group">
                <td className="px-6 py-3 text-center text-slate-600 font-mono text-xs">
                  {startIndex + rIndex + 1}
                </td>
                {columns.map((col) => {
                  const isEditing = editingCell?.rowIndex === rIndex && editingCell?.colKey === col;
                  return (
                    <td 
                      key={`${rIndex}-${col}`} 
                      className="px-6 py-3 relative cursor-pointer"
                      onClick={() => !isEditing && startEdit(rIndex, col, row[col])}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1 absolute inset-0 px-2 bg-slate-800 z-20">
                          <input
                            autoFocus
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-slate-900 border border-blue-500 text-white text-sm rounded px-2 py-1 outline-none"
                            onBlur={saveEdit} 
                          />
                        </div>
                      ) : (
                         <span className={`${typeof row[col] === 'number' ? 'text-blue-300 font-mono' : 'text-slate-300'}`}>
                           {String(row[col])}
                         </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-500">
                  No data found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-700 bg-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
        <div className="text-slate-400">
          Showing <span className="font-medium text-slate-200">{startIndex + 1}</span> to <span className="font-medium text-slate-200">{Math.min(startIndex + ROWS_PER_PAGE, filteredData.length)}</span> of <span className="font-medium text-slate-200">{filteredData.length}</span> entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Logic to show pages around current page could go here for very large page counts
              // Simplified: show first 5 or logic to shift could be added.
              // For now, let's just show current page input style or simple numbers if few pages
              let p = i + 1;
              if (totalPages > 5) {
                  // Center the range around current page
                  if (currentPage > 3) p = currentPage - 3 + i;
                  if (p > totalPages) p = totalPages - (4 - i);
              }
              
              if (p < 1) p = i + 1; // Fallback

              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                    ${currentPage === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataEditor;