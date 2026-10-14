import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Percent,
  FileSpreadsheet,
  X,
  Filter,
  SlidersHorizontal,
  Table as TableIcon,
} from 'lucide-react';
import {
  MatchedRow,
  MatchingStats,
  WorkbookData,
  ResultColor,
  Language,
  ColumnConfigItem,
} from '../types';
import { translations } from '../translations';
import { exportStyledExcel, exportCsv } from '../utils/excel';
import { RowDetailModal } from './RowDetailModal';
import { ColumnCustomizationModal } from './ColumnCustomizationModal';

interface ResultsDashboardProps {
  results: MatchedRow[];
  stats: MatchingStats;
  comparisonWb: WorkbookData | null;
  language: Language;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type FilterType = 'all' | 'green' | 'yellow' | 'red' | 'unmatched';

// Helper to highlight matching text in real-time
function highlightText(content: any, query: string): React.ReactNode {
  const str = String(content ?? '');
  if (!query || !query.trim()) return str;

  const q = query.trim().toLowerCase();
  const lowerStr = str.toLowerCase();
  const index = lowerStr.indexOf(q);

  if (index === -1) return str;

  const before = str.slice(0, index);
  const match = str.slice(index, index + q.length);
  const after = str.slice(index + q.length);

  return (
    <span>
      {before}
      <mark className="bg-amber-400 text-slate-950 font-bold px-0.5 rounded-[2px]">
        {match}
      </mark>
      {highlightText(after, query)}
    </span>
  );
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results,
  stats,
  comparisonWb,
  language,
  onShowToast,
}) => {
  const t = translations[language];

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<string>('rowIndex');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRow, setSelectedRow] = useState<MatchedRow | null>(null);

  const compHeaders = comparisonWb?.headers || [];

  // Extract any reference headers from merged/matched results
  const refHeaders = useMemo(() => {
    const keys = new Set<string>();
    for (const r of results) {
      if (r.matchedMainRow) {
        for (const k of Object.keys(r.matchedMainRow)) {
          if (!compHeaders.includes(k)) {
            keys.add(`[Ref] ${k}`);
          }
        }
      }
    }
    return Array.from(keys);
  }, [results, compHeaders]);

  // Build the complete list of candidate columns (system, comparison data, and reference)
  const allCandidateColumns: ColumnConfigItem[] = useMemo(() => {
    const items: ColumnConfigItem[] = [
      { id: 'rowIndex', label: 'Row #', category: 'system', showInTable: true, showInExport: true },
      { id: 'decisionStatus', label: 'Decision Status', category: 'system', showInTable: true, showInExport: true },
      { id: 'matchStatus', label: t.matchedStatus || 'Match Status', category: 'system', showInTable: true, showInExport: true },
      { id: 'decisionReason', label: t.reason || 'Evaluation Reason', category: 'system', showInTable: true, showInExport: true },
    ];

    compHeaders.forEach((h) => {
      items.push({
        id: h,
        label: h,
        category: 'data',
        showInTable: true,
        showInExport: true,
      });
    });

    refHeaders.forEach((ref) => {
      items.push({
        id: ref,
        label: ref,
        category: 'reference',
        showInTable: true,
        showInExport: true,
      });
    });

    return items;
  }, [compHeaders, refHeaders, t.matchedStatus, t.reason]);

  // Modal & Column Customization State
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [syncExportWithTable, setSyncExportWithTable] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('excelmatch_sync_export_table');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Persistent column visibility settings in localStorage
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfigItem[]>(() => {
    try {
      const saved = localStorage.getItem('excelmatch_column_settings');
      if (saved) {
        const parsed: Record<string, { table: boolean; export: boolean }> = JSON.parse(saved);
        return allCandidateColumns.map((c) => ({
          ...c,
          showInTable: parsed[c.id]?.table ?? c.showInTable,
          showInExport: parsed[c.id]?.export ?? c.showInExport,
        }));
      }
    } catch (e) {
      console.warn('Failed to load column settings', e);
    }
    return allCandidateColumns;
  });

  // Keep columnConfigs up to date when columns change in incoming datasets
  useEffect(() => {
    try {
      const saved = localStorage.getItem('excelmatch_column_settings');
      const parsed: Record<string, { table: boolean; export: boolean }> = saved ? JSON.parse(saved) : {};
      setColumnConfigs(
        allCandidateColumns.map((c) => ({
          ...c,
          showInTable: parsed[c.id]?.table ?? c.showInTable,
          showInExport: parsed[c.id]?.export ?? c.showInExport,
        }))
      );
    } catch {
      setColumnConfigs(allCandidateColumns);
    }
  }, [allCandidateColumns]);

  const handleUpdateColumnConfigs = (newConfigs: ColumnConfigItem[]) => {
    setColumnConfigs(newConfigs);
    try {
      const saveObj: Record<string, { table: boolean; export: boolean }> = {};
      newConfigs.forEach((c) => {
        saveObj[c.id] = { table: c.showInTable, export: c.showInExport };
      });
      localStorage.setItem('excelmatch_column_settings', JSON.stringify(saveObj));
    } catch (e) {
      console.warn('Failed to save column settings', e);
    }
  };

  const handleResetDefaultColumns = () => {
    const defaults = allCandidateColumns.map((c) => ({
      ...c,
      showInTable: true,
      showInExport: true,
    }));
    handleUpdateColumnConfigs(defaults);
    onShowToast('All columns restored to default (visible in Table & Export)', 'info');
  };

  const handleToggleSyncExport = (sync: boolean) => {
    setSyncExportWithTable(sync);
    try {
      localStorage.setItem('excelmatch_sync_export_table', JSON.stringify(sync));
    } catch {}
    if (sync) {
      const updated = columnConfigs.map((c) => ({
        ...c,
        showInExport: c.showInTable,
      }));
      handleUpdateColumnConfigs(updated);
    }
  };

  // Lookup for fast visibility check
  const tableVisibilityMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const c of columnConfigs) {
      map[c.id] = c.showInTable;
    }
    return map;
  }, [columnConfigs]);

  const isTableColVisible = (id: string) => tableVisibilityMap[id] !== false;

  const exportColIds = useMemo(() => {
    return columnConfigs.filter((c) => c.showInExport).map((c) => c.id);
  }, [columnConfigs]);

  const tableVisibleCount = columnConfigs.filter((c) => c.showInTable).length;
  const exportVisibleCount = columnConfigs.filter((c) => c.showInExport).length;

  // Real-Time Filter & Search Logic
  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return results.filter((item) => {
      // 1. Status Filter Tab
      if (activeFilter === 'green' && item.decisionColor !== 'green') return false;
      if (activeFilter === 'yellow' && item.decisionColor !== 'yellow') return false;
      if (activeFilter === 'red' && item.decisionColor !== 'red') return false;
      if (activeFilter === 'unmatched' && item.isMatched) return false;

      // 2. Real-Time Content Search Field
      if (query) {
        if (searchColumn === 'all') {
          // Search across all comparison fields, reference fields, key, and evaluation reason
          const inKey = item.matchKey.toLowerCase().includes(query);
          const inReason = item.decisionReason.toLowerCase().includes(query);
          const inOutcome = (item.decisionColor === 'green' ? 'passed accept' : item.decisionColor === 'yellow' ? 'review postpone' : item.decisionColor === 'red' ? 'rejected fail' : '').includes(query);
          const inMatchStatus = (item.isMatched ? 'matched' : 'unmatched new').includes(query);
          const inRowIdx = String(item.rowIndex).includes(query);
          const inUnmatched = item.unmatchedInfo
            ? (item.unmatchedInfo.primaryIdentifier + ' ' + item.unmatchedInfo.reason + ' ' + item.unmatchedInfo.unmatchedKeyDisplay).toLowerCase().includes(query)
            : false;
          const inComp = Object.values(item.comparisonRow).some((v) =>
            String(v ?? '').toLowerCase().includes(query)
          );
          const inRef = item.matchedMainRow
            ? Object.values(item.matchedMainRow).some((v) =>
                String(v ?? '').toLowerCase().includes(query)
              )
            : false;

          return inKey || inReason || inOutcome || inMatchStatus || inRowIdx || inUnmatched || inComp || inRef;
        } else if (searchColumn === 'reason') {
          return item.decisionReason.toLowerCase().includes(query);
        } else if (searchColumn === 'unmatched') {
          return (item.unmatchedInfo?.primaryIdentifier + ' ' + item.unmatchedInfo?.reason + ' ' + item.unmatchedInfo?.unmatchedKeyDisplay).toLowerCase().includes(query);
        } else if (searchColumn === 'matchKey') {
          return item.matchKey.toLowerCase().includes(query);
        } else if (searchColumn === 'outcome') {
          const outcomeStr = item.decisionColor === 'green' ? 'passed accept' : item.decisionColor === 'yellow' ? 'review postpone' : 'rejected fail';
          return outcomeStr.includes(query);
        } else if (searchColumn.startsWith('[Ref] ')) {
          const rawKey = searchColumn.replace('[Ref] ', '');
          const val = item.matchedMainRow?.[rawKey];
          return String(val ?? '').toLowerCase().includes(query);
        } else {
          // Specific selected column
          const val = item.comparisonRow[searchColumn] ?? item.matchedMainRow?.[searchColumn];
          return String(val ?? '').toLowerCase().includes(query);
        }
      }

      return true;
    });
  }, [results, activeFilter, searchTerm, searchColumn]);

  // Sorting Logic
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortColumn === 'rowIndex') {
        valA = a.rowIndex;
        valB = b.rowIndex;
      } else if (sortColumn === 'decisionColor') {
        valA = a.decisionColor;
        valB = b.decisionColor;
      } else if (sortColumn === 'isMatched') {
        valA = a.isMatched ? 1 : 0;
        valB = b.isMatched ? 1 : 0;
      } else if (sortColumn === 'decisionReason') {
        valA = a.decisionReason;
        valB = b.decisionReason;
      } else if (sortColumn.startsWith('[Ref] ')) {
        const rawKey = sortColumn.replace('[Ref] ', '');
        valA = a.matchedMainRow?.[rawKey] ?? '';
        valB = b.matchedMainRow?.[rawKey] ?? '';
      } else {
        valA = a.comparisonRow[sortColumn] ?? '';
        valB = b.comparisonRow[sortColumn] ?? '';
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExportExcel = () => {
    try {
      const baseName = comparisonWb?.name || 'Excel_Matching_Output';
      exportStyledExcel(results, compHeaders, stats, baseName, exportColIds);
      onShowToast(`Professional Excel exported with ${exportColIds.length} customized columns`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Export failed', 'error');
    }
  };

  const handleExportCsv = () => {
    try {
      const baseName = comparisonWb?.name || 'Excel_Matching_Output';
      exportCsv(results, compHeaders, baseName, exportColIds);
      onShowToast(`CSV exported with ${exportColIds.length} customized columns`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Export failed', 'error');
    }
  };

  const getSolidBadge = (color: ResultColor | 'none') => {
    switch (color) {
      case 'green':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold text-white bg-[#059669] shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASSED
          </span>
        );
      case 'yellow':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold text-white bg-[#D97706] shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" />
            REVIEW
          </span>
        );
      case 'red':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold text-white bg-[#DC2626] shadow-sm">
            <XCircle className="w-3.5 h-3.5" />
            REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-slate-400 bg-slate-800">
            NO RULE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Incoming Rows */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {t.kpiTotalRows}
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
            {stats.totalIncoming.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Evaluated dataset</div>
        </div>

        {/* Green / Passed */}
        <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#059669]" />
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>{t.kpiPassed}</span>
            <span className="font-mono text-emerald-300 font-bold">
              {stats.totalIncoming > 0 ? ((stats.greenCount / stats.totalIncoming) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-400 font-mono tabular-nums">
            {stats.greenCount.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Solid Green status</div>
        </div>

        {/* Yellow / Review */}
        <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#D97706]" />
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>{t.kpiReview}</span>
            <span className="font-mono text-amber-300 font-bold">
              {stats.totalIncoming > 0 ? ((stats.yellowCount / stats.totalIncoming) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-amber-400 font-mono tabular-nums">
            {stats.yellowCount.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Solid Amber status</div>
        </div>

        {/* Red / Rejected */}
        <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#DC2626]" />
          <div className="text-[11px] font-medium text-rose-400 uppercase tracking-wider flex items-center justify-between">
            <span>{t.kpiRejected}</span>
            <span className="font-mono text-rose-300 font-bold">
              {stats.totalIncoming > 0 ? ((stats.redCount / stats.totalIncoming) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-rose-400 font-mono tabular-nums">
            {stats.redCount.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Solid Crimson status</div>
        </div>

        {/* Key Match Rate */}
        <div className="col-span-2 sm:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{t.kpiMatchRate}</span>
            <Percent className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-sky-400 font-mono tabular-nums">
            {stats.matchRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {stats.matchedCount} matched · {stats.unmatchedCount} new
          </div>
        </div>
      </div>

      {/* 2. Interactive Control Bar (Filters & Clean Professional Export) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Segmented Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setActiveFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterAll} ({results.length})
            </button>
            <button
              onClick={() => {
                setActiveFilter('green');
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeFilter === 'green'
                  ? 'bg-[#059669] text-white shadow-sm'
                  : 'text-emerald-400 hover:bg-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{t.filterGreen} ({stats.greenCount})</span>
            </button>
            <button
              onClick={() => {
                setActiveFilter('yellow');
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeFilter === 'yellow'
                  ? 'bg-[#D97706] text-white shadow-sm'
                  : 'text-amber-400 hover:bg-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{t.filterYellow} ({stats.yellowCount})</span>
            </button>
            <button
              onClick={() => {
                setActiveFilter('red');
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeFilter === 'red'
                  ? 'bg-[#DC2626] text-white shadow-sm'
                  : 'text-rose-400 hover:bg-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>{t.filterRed} ({stats.redCount})</span>
            </button>
            <button
              onClick={() => {
                setActiveFilter('unmatched');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeFilter === 'unmatched'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterUnmatched} ({stats.unmatchedCount})
            </button>
          </div>

          {/* Column Customizer Button & Professional Export Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Customize Columns Button */}
            <button
              onClick={() => setShowColumnModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 select-none group"
              title="Choose what columns to show in Results Table and in Excel Export"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Columns</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-emerald-300 border border-emerald-900/60 font-bold">
                {tableVisibleCount} Table · {exportVisibleCount} Export
              </span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-950 transition-colors whitespace-nowrap shrink-0"
              title="Export clean professional Excel workbook retaining solid Green, Yellow, and Red fills for selected columns"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>{t.exportExcel}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Export selected columns to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportCsv}</span>
            </button>
          </div>
        </div>

        {/* 3. DEDICATED REAL-TIME SEARCH BAR & SCOPE SELECTOR */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 max-w-2xl">
            {/* Search Scope Dropdown */}
            <div className="relative shrink-0">
              <select
                value={searchColumn}
                onChange={(e) => {
                  setSearchColumn(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                title="Search Scope"
              >
                <option value="all">All Columns (Real-time)</option>
                <option value="outcome">Decision Outcome</option>
                <option value="reason">Evaluation Reason</option>
                <option value="unmatched">Unmatched Discrepancy</option>
                <option value="matchKey">Match Key</option>
                <optgroup label="Comparison Data Columns">
                  {compHeaders.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </optgroup>
                {refHeaders.length > 0 && (
                  <optgroup label="Reference Data Columns">
                    {refHeaders.map((ref) => (
                      <option key={ref} value={ref}>
                        {ref}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Real-time Search Input Field */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search rows in real-time (type anything to filter instantly)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white rounded transition-colors"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Match Counter Badge */}
            {searchTerm.trim() && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shrink-0 font-mono">
                <Filter className="w-3 h-3" />
                {filteredRows.length} found
              </span>
            )}
          </div>

          {/* Rows Per Page Selector */}
          <div className="flex items-center gap-3 text-xs text-slate-400 self-end md:self-auto shrink-0">
            <span>{t.rowsPerPage}:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3.5. UNMATCHED RECORDS DIAGNOSTIC SUMMARY BANNER */}
      {stats.unmatchedCount > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-800/50 rounded-xl p-4 shadow-sm space-y-2.5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-900/60 border border-amber-700/60 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Unmatched Records Analysis</span>
                  <span className="font-mono text-[11px] px-2 py-0.2 rounded-full bg-amber-950 text-amber-300 border border-amber-700/80">
                    {stats.unmatchedCount} incoming items not matched
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Click any unmatched item badge below to inspect exactly why it is unmatched and view differing fields.
                </p>
              </div>
            </div>

            {activeFilter !== 'unmatched' && (
              <button
                onClick={() => {
                  setActiveFilter('unmatched');
                  setPage(1);
                }}
                className="self-start sm:self-auto text-xs font-semibold px-3 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/80 transition-colors shrink-0"
              >
                Filter only Unmatched ({stats.unmatchedCount})
              </button>
            )}
          </div>

          {/* Unmatched Identifier Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {stats.unmatchedItems?.slice(0, 30).map((item) => (
              <button
                key={item.rowIndex}
                onClick={() => {
                  const targetRow = results.find((r) => r.rowIndex === item.rowIndex);
                  if (targetRow) setSelectedRow(targetRow);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-950 hover:bg-amber-950/80 border border-amber-900/60 hover:border-amber-600 text-amber-300 transition-colors shadow-sm group select-none"
                title={`Row #${item.rowIndex}: ${item.reason}`}
              >
                <span className="text-slate-500 font-sans text-[10px]">Row #{item.rowIndex}</span>
                <span className="font-bold group-hover:underline">{item.identifier}</span>
                <Eye className="w-3 h-3 text-amber-400/80 group-hover:scale-110 transition-transform" />
              </button>
            ))}
            {stats.unmatchedItems && stats.unmatchedItems.length > 30 && (
              <span className="px-2 py-1 text-xs text-slate-500 font-mono">
                + {stats.unmatchedItems.length - 30} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4. Main Data Table with Dynamic Column Visibility & Real-Time Search Match Highlighting */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-300 font-semibold select-none">
              <tr>
                {/* Row # */}
                {isTableColVisible('rowIndex') && (
                  <th
                    onClick={() => handleSort('rowIndex')}
                    className="py-3 px-3 border-r border-slate-800 text-center w-14 font-mono text-slate-400 cursor-pointer hover:bg-slate-900/60"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>#</span>
                      {sortColumn === 'rowIndex' && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      )}
                    </div>
                  </th>
                )}

                {/* Solid Decision Status */}
                {isTableColVisible('decisionStatus') && (
                  <th
                    onClick={() => handleSort('decisionColor')}
                    className="py-3 px-4 border-r border-slate-800 whitespace-nowrap cursor-pointer hover:bg-slate-900/60 min-w-[130px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Decision Status</span>
                      {sortColumn === 'decisionColor' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>
                )}

                {/* Match Status */}
                {isTableColVisible('matchStatus') && (
                  <th
                    onClick={() => handleSort('isMatched')}
                    className="py-3 px-4 border-r border-slate-800 whitespace-nowrap cursor-pointer hover:bg-slate-900/60 min-w-[130px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{t.matchedStatus}</span>
                      {sortColumn === 'isMatched' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>
                )}

                {/* Evaluation Reason */}
                {isTableColVisible('decisionReason') && (
                  <th
                    onClick={() => handleSort('decisionReason')}
                    className="py-3 px-4 border-r border-slate-800 whitespace-nowrap cursor-pointer hover:bg-slate-900/60 min-w-[200px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{t.reason}</span>
                      {sortColumn === 'decisionReason' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>
                )}

                {/* Comparison Columns */}
                {compHeaders.filter((h) => isTableColVisible(h)).map((header) => (
                  <th
                    key={header}
                    onClick={() => handleSort(header)}
                    className="py-3 px-4 border-r border-slate-800 whitespace-nowrap cursor-pointer hover:bg-slate-900/60 font-mono text-slate-300"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{header}</span>
                      {sortColumn === header ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>
                ))}

                {/* Reference Columns */}
                {refHeaders.filter((ref) => isTableColVisible(ref)).map((refHeader) => (
                  <th
                    key={refHeader}
                    onClick={() => handleSort(refHeader)}
                    className="py-3 px-4 border-r border-slate-800 whitespace-nowrap cursor-pointer hover:bg-slate-900/60 font-mono text-purple-300 bg-purple-950/20"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/60 font-sans">
                        Ref
                      </span>
                      <span>{refHeader.replace('[Ref] ', '')}</span>
                      {sortColumn === refHeader ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-purple-400" /> : <ArrowDown className="w-3 h-3 text-purple-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>
                ))}

                {/* Actions */}
                <th className="py-3 px-3 text-center w-20">
                  {t.viewDetails}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {currentPageRows.length > 0 ? (
                currentPageRows.map((row) => {
                  const isGreen = row.decisionColor === 'green';
                  const isYellow = row.decisionColor === 'yellow';
                  const isRed = row.decisionColor === 'red';

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-800/60 transition-colors ${
                        isGreen
                          ? 'bg-emerald-950/20'
                          : isYellow
                          ? 'bg-amber-950/20'
                          : isRed
                          ? 'bg-rose-950/20'
                          : ''
                      }`}
                    >
                      {/* Row # */}
                      {isTableColVisible('rowIndex') && (
                        <td className="py-2.5 px-3 border-r border-slate-800/80 text-center text-slate-500 font-mono tabular-nums text-[11px]">
                          {highlightText(row.rowIndex, searchTerm)}
                        </td>
                      )}

                      {/* Decision Status with Solid Color Badge */}
                      {isTableColVisible('decisionStatus') && (
                        <td className="py-2.5 px-4 border-r border-slate-800/80 whitespace-nowrap">
                          {getSolidBadge(row.decisionColor)}
                        </td>
                      )}

                      {/* Match Status */}
                      {isTableColVisible('matchStatus') && (
                        <td className="py-2.5 px-4 border-r border-slate-800/80 whitespace-nowrap">
                          {row.isMatched ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              Matched
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/60 shrink-0">
                                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                                  UNMATCHED
                                </span>
                                {row.unmatchedInfo?.matchType === 'partial_mismatch' && (
                                  <span className="text-[9px] font-semibold text-rose-300 bg-rose-950/60 px-1 py-0.2 rounded border border-rose-900/60 shrink-0">
                                    Differs
                                  </span>
                                )}
                              </div>
                              <div
                                className="font-mono text-xs font-bold text-amber-300 hover:text-amber-200 cursor-pointer truncate max-w-[210px]"
                                onClick={() => setSelectedRow(row)}
                                title={row.unmatchedInfo?.unmatchedKeyDisplay || row.matchKey}
                              >
                                {highlightText(row.unmatchedInfo?.primaryIdentifier || row.matchKey || 'Unidentified', searchTerm)}
                              </div>
                              <span
                                className="text-[10px] text-slate-400 truncate max-w-[210px] font-sans"
                                title={row.unmatchedInfo?.reason}
                              >
                                {row.unmatchedInfo?.matchType === 'partial_mismatch'
                                  ? 'Ref match has differing fields'
                                  : 'Missing in Reference file'}
                              </span>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Evaluation Reason */}
                      {isTableColVisible('decisionReason') && (
                        <td className="py-2.5 px-4 border-r border-slate-800/80 text-xs text-slate-300 font-medium truncate max-w-xs">
                          <span title={row.decisionReason}>
                            {highlightText(row.decisionReason, searchTerm)}
                          </span>
                        </td>
                      )}

                      {/* Comparison Columns Values with Real-Time Match Highlighting & Inspection Badges */}
                      {compHeaders.filter((h) => isTableColVisible(h)).map((header) => {
                        const valStr = String(row.comparisonRow[header] ?? '');
                        const isWaiveOrAccept =
                          valStr.toLowerCase().includes('waive') ||
                          valStr.toLowerCase().includes('accept');

                        return (
                          <td
                            key={header}
                            className={`py-2.5 px-4 border-r border-slate-800/80 whitespace-nowrap font-mono text-xs ${
                              isWaiveOrAccept
                                ? 'text-emerald-300 font-bold bg-emerald-950/30'
                                : 'text-slate-200'
                            }`}
                          >
                            {highlightText(row.comparisonRow[header], searchTerm)}
                          </td>
                        );
                      })}

                      {/* Reference Columns Values */}
                      {refHeaders.filter((ref) => isTableColVisible(ref)).map((refHeader) => {
                        const rawKey = refHeader.replace('[Ref] ', '');
                        const val = row.matchedMainRow?.[rawKey];
                        return (
                          <td
                            key={refHeader}
                            className="py-2.5 px-4 border-r border-slate-800/80 whitespace-nowrap text-purple-200 font-mono text-xs bg-purple-950/10"
                          >
                            {highlightText(val, searchTerm)}
                          </td>
                        );
                      })}

                      {/* Row Inspect Button */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedRow(row)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                          title="Inspect row discrepancy"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={
                      (isTableColVisible('rowIndex') ? 1 : 0) +
                      (isTableColVisible('decisionStatus') ? 1 : 0) +
                      (isTableColVisible('matchStatus') ? 1 : 0) +
                      (isTableColVisible('decisionReason') ? 1 : 0) +
                      compHeaders.filter((h) => isTableColVisible(h)).length +
                      refHeaders.filter((r) => isTableColVisible(r)).length +
                      1
                    }
                    className="py-16 text-center text-slate-500 text-xs space-y-2"
                  >
                    <div>{t.noResultsFound}</div>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-xs text-emerald-400 hover:underline inline-block mt-1 font-medium"
                      >
                        Clear search filter ({searchTerm})
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Table Pagination Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            {t.showingRows}{' '}
            <strong className="text-slate-200 font-mono tabular-nums">
              {filteredRows.length > 0 ? (page - 1) * pageSize + 1 : 0}
            </strong>{' '}
            -{' '}
            <strong className="text-slate-200 font-mono tabular-nums">
              {Math.min(page * pageSize, filteredRows.length)}
            </strong>{' '}
            {t.of}{' '}
            <strong className="text-slate-200 font-mono tabular-nums">
              {filteredRows.length.toLocaleString()}
            </strong>{' '}
            rows
            {searchTerm.trim() && (
              <span className="text-slate-500 ml-2">
                (filtered from {results.length.toLocaleString()} total)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{t.prevPage}</span>
            </button>
            <span className="px-2 font-mono text-slate-300 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>{t.nextPage}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row Inspection Modal */}
      <RowDetailModal
        row={selectedRow}
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
      />

      {/* Column Customization Modal (Table & Export) */}
      <ColumnCustomizationModal
        isOpen={showColumnModal}
        onClose={() => setShowColumnModal(false)}
        columnConfigs={columnConfigs}
        onChangeConfigs={handleUpdateColumnConfigs}
        syncExportWithTable={syncExportWithTable}
        onToggleSync={handleToggleSyncExport}
        onResetDefaults={handleResetDefaultColumns}
      />
    </div>
  );
};
