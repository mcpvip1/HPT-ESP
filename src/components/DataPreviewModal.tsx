import React, { useState, useMemo } from 'react';
import { X, Search, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { WorkbookData } from '../types';

interface DataPreviewModalProps {
  workbook: WorkbookData | null;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  workbook,
  isOpen,
  onClose,
  title,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const filteredRows = useMemo(() => {
    if (!workbook) return [];
    if (!searchTerm.trim()) return workbook.rows;

    const term = searchTerm.toLowerCase();
    return workbook.rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? '').toLowerCase().includes(term)
      )
    );
  }, [workbook, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  if (!isOpen || !workbook) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {workbook.name} · <span className="font-mono tabular-nums">{workbook.rows.length}</span> rows · <span className="font-mono tabular-nums">{workbook.headers.length}</span> columns
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between gap-4">
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
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="text-xs text-slate-400">
            Showing <span className="font-mono font-medium text-slate-200">{filteredRows.length}</span> filtered rows
          </div>
        </div>

        {/* Table Viewport */}
        <div className="flex-1 overflow-auto bg-slate-950/30">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-300 font-medium z-10">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-800 text-center w-12 font-mono text-slate-500">
                  #
                </th>
                {workbook.headers.map((header) => (
                  <th
                    key={header}
                    className="py-2.5 px-4 border-r border-slate-800 whitespace-nowrap text-slate-300 font-semibold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
              {currentPageRows.length > 0 ? (
                currentPageRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2 px-3 border-r border-slate-800/80 text-center text-slate-500 text-[11px] tabular-nums">
                      {(page - 1) * pageSize + rIdx + 1}
                    </td>
                    {workbook.headers.map((header) => (
                      <td
                        key={header}
                        className="py-2 px-4 border-r border-slate-800/80 whitespace-nowrap text-slate-200 text-xs"
                      >
                        {String(row[header] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={workbook.headers.length + 1}
                    className="py-12 text-center text-slate-500"
                  >
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <span className="font-mono text-slate-200 font-medium">{page}</span> of{' '}
            <span className="font-mono text-slate-200 font-medium">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
