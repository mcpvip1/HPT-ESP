import React, { useState, useMemo } from 'react';
import { X, Search, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { Language, WorkbookData } from '../types';
import { translations } from '../translations';

interface DataPreviewModalProps {
  workbook: WorkbookData | null;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSelectSheet?: (sheetName: string) => void;
  language?: Language;
}

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  workbook,
  isOpen,
  onClose,
  title,
  onSelectSheet,
  language = 'en',
}) => {
  const t = translations[language];
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
    <div className="bulk-backdrop flex items-center justify-center p-3 sm:p-6">
      <div className="bulk-modal !max-w-6xl !w-full max-h-[90vh] flex flex-col overflow-hidden !p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-alt)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-xs">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {workbook.name} · {t.dpSheet} <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{currentSheetName}</strong> ·{' '}
                <span className="font-mono tabular-nums text-[var(--text-primary)] font-semibold">{currentSheetData.rows.length.toLocaleString()}</span> {t.dpRows} ·{' '}
                <span className="font-mono tabular-nums text-[var(--text-primary)] font-semibold">{currentSheetData.headers.length}</span> {t.dpColumns}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface-soft)] transition-colors cursor-pointer"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sheet Tabs Bar (if multi-sheet) */}
        {workbook.sheetNames && workbook.sheetNames.length > 1 && (
          <div className="px-6 py-2 bg-[var(--bg-surface-soft)] border-b border-[var(--border)] flex items-center gap-2 overflow-x-auto scrollbar-thin">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider shrink-0 mr-1 font-mono">
              {t.dpSelectSheet}
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
                      : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border border-[var(--border)]'
                  }`}
                >
                  <span>{sName}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      isSelected
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[var(--bg-surface-alt)] text-[var(--text-muted)] border border-[var(--border-light)]'
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
        <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder={t.searchDataCells}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-emerald-500 transition-all shadow-xs"
            />
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono">
            {t.dpShowing.replace('{n}', String(filteredRows.length))}
          </div>
        </div>

        {/* Table Viewport */}
        <div className="flex-1 overflow-auto bg-[var(--bg-surface)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[var(--bg-surface-alt)] backdrop-blur-sm border-b border-[var(--border)] text-[var(--text-primary)] font-bold z-10 select-none shadow-xs font-ui">
              <tr>
                <th className="py-2.5 px-3 border-r border-[var(--border)] text-center w-12 font-mono text-[var(--text-muted)]">
                  #
                </th>
                {currentSheetData.headers.map((header) => (
                  <th
                    key={header}
                    className="py-2.5 px-4 border-r border-[var(--border)] whitespace-nowrap text-[var(--text-primary)] font-bold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)] font-mono text-[var(--text-secondary)]">
              {currentPageRows.length > 0 ? (
                currentPageRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-[var(--bg-surface-soft)] transition-colors"
                  >
                    <td className="py-2 px-3 border-r border-[var(--border-light)] text-center text-[var(--text-muted)] text-[11px] tabular-nums bg-[var(--bg-surface-alt)]">
                      {(page - 1) * pageSize + rIdx + 1}
                    </td>
                    {currentSheetData.headers.map((header) => (
                      <td
                        key={header}
                        className="py-2 px-4 border-r border-[var(--border-light)] whitespace-nowrap text-[var(--text-primary)] text-xs"
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
                    className="py-12 text-center text-[var(--text-muted)]"
                  >
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--bg-surface-alt)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <div>
            Page <span className="font-mono text-[var(--text-primary)] font-bold">{page}</span> of{' '}
            <span className="font-mono text-[var(--text-primary)] font-bold">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
