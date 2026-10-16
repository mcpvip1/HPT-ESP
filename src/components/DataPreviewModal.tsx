import React, { useState, useMemo } from 'react';
import { X, Search, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { WorkbookData } from '../types';

interface DataPreviewModalProps {
  workbook: WorkbookData | null;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSelectSheet?: (sheetName: string) => void;
}

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  workbook,
  isOpen,
  onClose,
  title,
  onSelectSheet,
}) => {
  const [activeSheetState, setActiveSheetState] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Sync or default active sheet
  const currentSheetName = activeSheetState || workbook?.activeSheet || workbook?.sheetNames?.[0] || '';

  const currentSheetData = useMemo(() => {
    if (!workbook) return { headers: [], rows: [] };
    if (workbook.sheets && currentSheetName && workbook.sheets[currentSheetName]) {
      return workbook.sheets[currentSheetName];
    }
    return { headers: workbook.headers, rows: workbook.rows };
  }, [workbook, currentSheetName]);

  const handleSheetChange = (newSheet: string) => {
    setActiveSheetState(newSheet);
    setPage(1);
    onSelectSheet?.(newSheet);
  };

  const filteredRows = useMemo(() => {
    if (!currentSheetData.rows) return [];
    if (!searchTerm.trim()) return currentSheetData.rows;

    const term = searchTerm.toLowerCase();
    return currentSheetData.rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? '').toLowerCase().includes(term)
      )
    );
  }, [currentSheetData.rows, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  if (!isOpen || !workbook) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {workbook.name} · Sheet: <strong className="text-emerald-700 font-bold">{currentSheetName}</strong> ·{' '}
                <span className="font-mono tabular-nums text-slate-700 font-semibold">{currentSheetData.rows.length.toLocaleString()}</span> rows ·{' '}
                <span className="font-mono tabular-nums text-slate-700 font-semibold">{currentSheetData.headers.length}</span> columns
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Tabs Bar (if multi-sheet) */}
        {workbook.sheetNames && workbook.sheetNames.length > 1 && (
          <div className="px-6 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-thin">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Select Sheet:
            </span>
            {workbook.sheetNames.map((sName) => {
              const isSelected = sName === currentSheetName;
              const sInfo = workbook.sheets?.[sName];
              const rowCount = sInfo ? sInfo.rows.length : (sName === workbook.activeSheet ? workbook.rows.length : 0);
              const colCount = sInfo ? sInfo.headers.length : (sName === workbook.activeSheet ? workbook.headers.length : 0);
              return (
                <button
                  key={sName}
                  type="button"
                  onClick={() => handleSheetChange(sName)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-600/30'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{sName}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      isSelected
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {rowCount.toLocaleString()}r · {colCount}c
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search data cells..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-xs"
            />
          </div>
          <div className="text-xs text-slate-500">
            Showing <span className="font-mono font-bold text-slate-800">{filteredRows.length}</span> filtered rows
          </div>
        </div>

        {/* Table Viewport */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-sm border-b border-slate-200 text-slate-700 font-bold z-10 select-none shadow-xs">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-12 font-mono text-slate-500">
                  #
                </th>
                {currentSheetData.headers.map((header) => (
                  <th
                    key={header}
                    className="py-2.5 px-4 border-r border-slate-200 whitespace-nowrap text-slate-700 font-bold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {currentPageRows.length > 0 ? (
                currentPageRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-2 px-3 border-r border-slate-100 text-center text-slate-400 text-[11px] tabular-nums bg-slate-50/50">
                      {(page - 1) * pageSize + rIdx + 1}
                    </td>
                    {currentSheetData.headers.map((header) => (
                      <td
                        key={header}
                        className="py-2 px-4 border-r border-slate-100 whitespace-nowrap text-slate-800 text-xs"
                      >
                        {String(row[header] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={currentSheetData.headers.length + 1}
                    className="py-12 text-center text-slate-400"
                  >
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Page <span className="font-mono text-slate-900 font-bold">{page}</span> of{' '}
            <span className="font-mono text-slate-900 font-bold">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
