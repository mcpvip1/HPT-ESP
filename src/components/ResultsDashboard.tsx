import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ShieldCheck,
  XCircle,
  PauseCircle,
  Percent,
  FileSpreadsheet,
  X,
  Filter,
  SlidersHorizontal,
  Table as TableIcon,
  EyeOff,
  Copy,
  Check,
  RotateCw,
  RefreshCw,
  Save,
  FileText,
  Clock,
  Link2,
  Cloud,
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
import { generatePreviewLink, copyPreviewLinkToClipboard, getSharePreviewUrl, getFixedPreviewUrl } from '../utils/previewSharing';
import type { SharedPreviewPayload } from '../utils/previewSharing';
import type { User } from 'firebase/auth';
import {
  publishPreviewSnapshot,
  publishSharedSnapshot,
  debounce,
  FIXED_PREVIEW_SHARE_ID,
} from '../lib/cloudSync';
import { RowDetailModal } from './RowDetailModal';
import { ColumnCustomizationModal } from './ColumnCustomizationModal';
import { ExcelColumnFilter, UniqueValueItem } from './ExcelColumnFilter';

interface ResultsDashboardProps {
  results: MatchedRow[];
  stats: MatchingStats;
  comparisonWb: WorkbookData | null;
  language: Language;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  initialFilter?: FilterType;
  initialOnlyAccept?: boolean;
  initialSearchTerm?: string;
  initialSearchColumn?: string;
  initialColumnConfigs?: ColumnConfigItem[];
  isPreviewMode?: boolean;
  onExitPreview?: () => void;
  onRefresh?: () => void;
  cloudUser?: User | null;
  holdReason?: string;
  onReleaseHoldKey?: (key: string) => Promise<{ key: string; green: number; yellow: number; total: number }>;
  onViewStateChange?: (v: { activeFilter: FilterType; searchTerm: string; searchColumn: string; onlyAccept: boolean }) => void;
}

type FilterType = 'all' | 'green' | 'yellow' | 'red' | 'blue' | 'unmatched';

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

const localeForDate = (lang: string): string =>
  lang === 'my' ? 'my-MM' : lang === 'th' ? 'th-TH' : lang === 'zh' ? 'zh-CN' : 'en-US';

function formatFileDateTime(ts: number | undefined, lang: string): string {
  if (ts === undefined || ts === null) return '—';
  try {
    return new Date(ts).toLocaleString(localeForDate(lang), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(ts).toLocaleString();
  }
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results,
  stats,
  comparisonWb,
  language,
  onShowToast,
  initialFilter,
  initialOnlyAccept,
  initialSearchTerm,
  initialSearchColumn,
  initialColumnConfigs,
  isPreviewMode,
  onExitPreview,
  onRefresh,
  cloudUser,
  holdReason = '',
  onReleaseHoldKey,
  onViewStateChange,
}) => {
  const t = translations[language];

  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter || 'all');
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
  const [searchColumn, setSearchColumn] = useState<string>(initialSearchColumn || 'all');
  // Public live-share: anyone with the link sees the latest snapshot, no sign-in
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<string>('rowIndex');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRow, setSelectedRow] = useState<MatchedRow | null>(null);

  const [releaseTarget, setReleaseTarget] = useState<{ key: string; count: number } | null>(null);
  const [supervisorConfirmed, setSupervisorConfirmed] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [hideSupersededPostpone, setHideSupersededPostpone] = useState<boolean>(true);
  // Report the current view state (filter tab, search, Only Accept) so the
  // studio can sync it to the cloud; debounced to avoid chatter on typing.
  useEffect(() => {
    if (isPreviewMode || !onViewStateChange) return;
    const timer = setTimeout(() => {
      onViewStateChange({
        activeFilter,
        searchTerm,
        searchColumn,
        onlyAccept: hideSupersededPostpone,
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [activeFilter, searchTerm, searchColumn, hideSupersededPostpone, isPreviewMode, onViewStateChange]);

  // Excel-style column filters: mapping colId -> allowed string values
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [openFilterColId, setOpenFilterColId] = useState<string | null>(null);
  const [filterAnchorRect, setFilterAnchorRect] = useState<DOMRect | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    try {
      // Re-sync latest saved column view settings from localStorage
      const saved = localStorage.getItem('excelmatch_column_settings_v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setColumnConfigs(parsed);
            setHasUnsavedColumnChanges(false);
          }
        } catch {}
      }
      if (onRefresh) onRefresh();
      onShowToast(t.dashRefreshedLatest, 'success');
    } catch {
      onShowToast(t.dashRefreshCompleted, 'info');
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 350);
    }
  };

  // Synchronize the Only Accept toggle when the parent provides it (preview links)
  useEffect(() => {
    if (initialOnlyAccept !== undefined) {
      setHideSupersededPostpone(initialOnlyAccept);
    }
  }, [initialOnlyAccept]);

  // Synchronize state when initialFilter/Search changes from URL or parent
  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (initialSearchTerm !== undefined) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  useEffect(() => {
    if (initialSearchColumn) {
      setSearchColumn(initialSearchColumn);
    }
  }, [initialSearchColumn]);

  // Safely derive comparison headers from comparisonWb, or fall back to results
  const compHeaders = useMemo(() => {
    if (comparisonWb?.headers && comparisonWb.headers.length > 0) {
      return comparisonWb.headers;
    }
    const keys = new Set<string>();
    for (const r of results) {
      if (r.comparisonRow) {
        Object.keys(r.comparisonRow).forEach((k) => keys.add(k));
      }
    }
    return Array.from(keys);
  }, [comparisonWb, results]);

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

  // Build the complete list of candidate columns with data & reference first, and Decision & System Audit as last columns
  const allCandidateColumns: ColumnConfigItem[] = useMemo(() => {
    const items: ColumnConfigItem[] = [
      { id: 'rowIndex', label: 'Row #', category: 'system', showInTable: true, showInExport: true },
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

    // Decision & System Audit Columns moved to last columns
    items.push(
      { id: 'decisionStatus', label: t.colDecisionStatus, category: 'system', showInTable: true, showInExport: true },
      { id: 'matchStatus', label: t.matchedStatus || 'Match Status', category: 'system', showInTable: true, showInExport: true },
      { id: 'decisionReason', label: t.reason || 'Evaluation Reason', category: 'system', showInTable: true, showInExport: true },
    );

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

  // Load custom column order and visibility (priority: preview link -> stored v2 -> default candidate)
  const loadStoredConfigs = (candidateCols: ColumnConfigItem[]): ColumnConfigItem[] => {
    if (initialColumnConfigs && initialColumnConfigs.length > 0) {
      return initialColumnConfigs;
    }
    try {
      const stored = localStorage.getItem('excelmatch_column_settings_v2');
      if (stored) {
        const parsed: {
          order: string[];
          visibility: Record<string, { table: boolean; export: boolean }>;
        } = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.order)) {
          const candidateMap = new Map(candidateCols.map((c) => [c.id, c]));
          const ordered: ColumnConfigItem[] = [];

          parsed.order.forEach((id) => {
            const found = candidateMap.get(id);
            if (found) {
              const vis = parsed.visibility?.[id];
              ordered.push({
                ...found,
                showInTable: vis?.table ?? found.showInTable,
                showInExport: vis?.export ?? found.showInExport,
              });
              candidateMap.delete(id);
            }
          });
          candidateMap.forEach((found) => ordered.push(found));
          return ordered;
        }
      }

      // Legacy fallback
      const legacySaved = localStorage.getItem('excelmatch_column_settings');
      if (legacySaved) {
        const parsed: Record<string, { table: boolean; export: boolean }> = JSON.parse(legacySaved);
        return candidateCols.map((c) => ({
          ...c,
          showInTable: parsed[c.id]?.table ?? c.showInTable,
          showInExport: parsed[c.id]?.export ?? c.showInExport,
        }));
      }
    } catch (e) {
      console.warn('Failed to load column settings', e);
    }
    return candidateCols;
  };

  // Persistent column order and visibility settings in localStorage
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfigItem[]>(() =>
    loadStoredConfigs(allCandidateColumns)
  );
  const [hasUnsavedColumnChanges, setHasUnsavedColumnChanges] = useState(false);

  useEffect(() => {
    setColumnConfigs(loadStoredConfigs(allCandidateColumns));
  }, [allCandidateColumns, initialColumnConfigs]);

  const handleUpdateColumnConfigs = (newConfigs: ColumnConfigItem[]) => {
    setColumnConfigs(newConfigs);
    setHasUnsavedColumnChanges(true);
  };

  // Move column left or right directly from table headers
  const handleMoveColumn = (colId: string, direction: 'left' | 'right') => {
    const visibleIdx = visibleTableColumns.findIndex((c) => c.id === colId);
    if (visibleIdx === -1) return;
    const targetVisibleIdx = direction === 'left' ? visibleIdx - 1 : visibleIdx + 1;
    if (targetVisibleIdx < 0 || targetVisibleIdx >= visibleTableColumns.length) return;

    const targetColId = visibleTableColumns[targetVisibleIdx].id;
    const fromIdx = columnConfigs.findIndex((c) => c.id === colId);
    const toIdx = columnConfigs.findIndex((c) => c.id === targetColId);
    if (fromIdx === -1 || toIdx === -1) return;

    const updated = [...columnConfigs];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);

    setColumnConfigs(updated);
    setHasUnsavedColumnChanges(true);
  };

  const handleSaveColumnConfigs = (newConfigs: ColumnConfigItem[]) => {
    setColumnConfigs(newConfigs);
    setHasUnsavedColumnChanges(false);
    try {
      const saveObj = {
        order: newConfigs.map((c) => c.id),
        visibility: {} as Record<string, { table: boolean; export: boolean }>,
      };
      newConfigs.forEach((c) => {
        saveObj.visibility[c.id] = { table: c.showInTable, export: c.showInExport };
      });
      localStorage.setItem('excelmatch_column_settings_v2', JSON.stringify(saveObj));

      // Sync to shared preview cache
      const latestPreview = localStorage.getItem('emp_shared_preview_latest');
      if (latestPreview) {
        try {
          const p = JSON.parse(latestPreview);
          p.columnConfigs = newConfigs;
          localStorage.setItem('emp_shared_preview_latest', JSON.stringify(p));
        } catch {}
      }

      // If in preview mode, also update hash immediately
      if (isPreviewMode) {
        const linkInfo = generatePreviewLink({
          version: 1,
          createdAt: Date.now(),
          comparisonWbName: comparisonWb?.name || 'Evaluation_Results',
        comparisonWbUploadedAt: comparisonWb?.uploadedAt,
          stats,
          results,
          filter: activeFilter,
          onlyAccept: hideSupersededPostpone,
          searchTerm,
          searchColumn,
          columnConfigs: newConfigs,
        });
        const hashPart = linkInfo.hashUrl.split('#')[1];
        if (hashPart && window.location.hash !== `#${hashPart}`) {
          window.history.replaceState(null, '', `#${hashPart}`);
        }
      }
    } catch (e) {
      console.warn('Failed to save column settings', e);
    }
    onShowToast(t.dashColumnLayoutSaved, 'success');
  };

  const handleResetDefaultColumns = () => {
    const defaults = allCandidateColumns.map((c) => ({
      ...c,
      showInTable: true,
      showInExport: true,
    }));
    handleSaveColumnConfigs(defaults);
    onShowToast(t.dashColumnsRestored, 'info');
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
      handleSaveColumnConfigs(updated);
    }
  };

  // Active columns shown in table, rendered strictly in customized sequence
  const visibleTableColumns = useMemo(() => {
    return columnConfigs.filter((c) => c.showInTable);
  }, [columnConfigs]);

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

  // Publish the latest results + active filter/search/columns to the cloud
  // (debounced): the private workspace snapshot for the owner's devices, and
  // the fixed public preview slot (/preview) so anyone with the share link
  // always fetches the latest on open or refresh.
  const debouncedPublishPreview = useRef(
    debounce((uid: string, payload: SharedPreviewPayload) => {
      publishPreviewSnapshot(uid, payload);
      publishSharedSnapshot(FIXED_PREVIEW_SHARE_ID, uid, payload);
    }, 2000)
  ).current;

  useEffect(() => {
    if (isPreviewMode || !cloudUser) return;
    if (!results || results.length === 0 || !stats) return;
    debouncedPublishPreview(cloudUser.uid, {
      version: 1,
      createdAt: Date.now(),
      comparisonWbName: comparisonWb?.name || 'Evaluation_Results',
      comparisonWbUploadedAt: comparisonWb?.uploadedAt,
      stats,
      results,
      filter: activeFilter,
      onlyAccept: hideSupersededPostpone,
      searchTerm,
      searchColumn,
      columnConfigs,
    });
  }, [
    isPreviewMode,
    cloudUser,
    results,
    stats,
    activeFilter,
    hideSupersededPostpone,
    searchTerm,
    searchColumn,
    columnConfigs,
    comparisonWb,
    debouncedPublishPreview,
  ]);

  // Keep URL hash updated seamlessly when in preview mode as filters or columns change
  useEffect(() => {
    if (!isPreviewMode) return;
    try {
      const linkInfo = generatePreviewLink({
        version: 1,
        createdAt: Date.now(),
        comparisonWbName: comparisonWb?.name || 'Evaluation_Results',
        comparisonWbUploadedAt: comparisonWb?.uploadedAt,
        stats,
        results,
        filter: activeFilter,
        onlyAccept: hideSupersededPostpone,
        searchTerm,
        searchColumn,
        columnConfigs,
      });
      const hashPart = linkInfo.hashUrl.split('#')[1];
      if (hashPart && window.location.hash !== `#${hashPart}`) {
        window.history.replaceState(null, '', `#${hashPart}`);
      }
    } catch {
      // Ignore URL length edge cases
    }
  }, [isPreviewMode, activeFilter, hideSupersededPostpone, searchTerm, searchColumn, columnConfigs, comparisonWb, stats, results]);

  const buildSharePayload = (): SharedPreviewPayload => ({
    version: 1,
    createdAt: Date.now(),
    comparisonWbName: comparisonWb?.name || 'Evaluation_Results',
    comparisonWbUploadedAt: comparisonWb?.uploadedAt,
    stats,
    results,
    filter: activeFilter,
    onlyAccept: hideSupersededPostpone,
    searchTerm,
    searchColumn,
    columnConfigs,
  });

  const copyTextToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast(t.dashCopyLinkFailed, 'error');
    }
  };

  const handleCopyShareLink = async () => {
    await copyTextToClipboard(getFixedPreviewUrl(), setShareLinkCopied);
  };

  // Manual publish to the fixed public preview slot (/preview).
  // The auto-publish is debounced; this lets the user force the latest
  // results to the preview link immediately (e.g. after swapping files).
  const handlePublishPreview = async () => {
    if (!cloudUser || !results || results.length === 0 || !stats) return;
    try {
      const payload: SharedPreviewPayload = {
        version: 1,
        createdAt: Date.now(),
        comparisonWbName: comparisonWb?.name || 'Evaluation_Results',
        comparisonWbUploadedAt: comparisonWb?.uploadedAt,
        stats,
        results,
        filter: activeFilter,
        onlyAccept: hideSupersededPostpone,
        searchTerm,
        searchColumn,
        columnConfigs,
      };
      await publishSharedSnapshot(FIXED_PREVIEW_SHARE_ID, cloudUser.uid, payload);
      onShowToast(t.dashPreviewPublished || 'Preview updated with latest results', 'success');
    } catch (e) {
      console.warn('Manual preview publish failed', e);
      onShowToast(t.dashPreviewPublishFailed || 'Failed to update preview', 'error');
    }
  };

  // Helper to retrieve cell string value for any column (System, Ref, Comp)
  const getRowColValue = (row: MatchedRow, colId: string): string => {
    if (colId === 'rowIndex') return String(row.rowIndex);
    if (colId === 'decisionStatus') {
      return row.decisionColor === 'green'
        ? t.badgePassed
        : row.decisionColor === 'yellow'
        ? t.badgeReview
        : row.decisionColor === 'red'
        ? t.badgeRejected
        : row.decisionColor === 'blue'
        ? t.badgeHold
        : t.badgeNoRule;
    }
    if (colId === 'matchStatus') {
      return row.isMatched ? t.dashValueMatched : t.dashValueUnmatched;
    }
    if (colId === 'decisionReason') {
      return row.decisionReason ? String(row.decisionReason).trim() : t.dashValueEmpty;
    }
    if (colId.startsWith('[Ref] ')) {
      const rawKey = colId.replace('[Ref] ', '');
      const val = row.matchedMainRow?.[rawKey];
      return val !== undefined && val !== null && String(val).trim() !== '' ? String(val) : t.dashValueBlanks;
    }
    let val = row.comparisonRow[colId];
    if (row.decisionColor === 'green' && typeof val === 'string' && val.toLowerCase().includes('postpone')) {
      val = 'Accept';
    }
    return val !== undefined && val !== null && String(val).trim() !== '' ? String(val) : '(Blanks)';
  };

  // Shared row predicate: status tab + Only Accept + column checklists + search.
  // `excludeColId` skips one column's own checklist so that column's dropdown
  // keeps showing all values available in the current view (Excel behavior).
  // In particular the status tab always applies, so e.g. under the green
  // filter a column dropdown never offers values that have no green rows.
  const passesRowFilters = (item: MatchedRow, excludeColId?: string): boolean => {
    // 1. Status Filter Tab
    if (activeFilter === 'green' && item.decisionColor !== 'green') return false;
    if (activeFilter === 'yellow' && item.decisionColor !== 'yellow') return false;
    if (activeFilter === 'red' && item.decisionColor !== 'red') return false;
    if (activeFilter === 'blue' && item.decisionColor !== 'blue') return false;
    if (activeFilter === 'unmatched' && item.isMatched) return false;

    // Deduplication: "only take accept" - optionally hide rows that were superseded by an Accept record
    if (hideSupersededPostpone && item.supersededByAccept) return false;

    // 2. Excel-Style Column Filters (Multi-Column Checklists)
    for (const [filterColId, allowedVals] of Object.entries(columnFilters)) {
      if (filterColId === excludeColId) continue;
      if (allowedVals && Array.isArray(allowedVals)) {
        const rowVal = getRowColValue(item, filterColId);
        if (!allowedVals.includes(rowVal)) {
          return false;
        }
      }
    }

    // 3. Real-Time Content Search Field
    const query = searchTerm.trim().toLowerCase();
    if (query) {
      if (searchColumn === 'all') {
        const inKey = item.matchKey.toLowerCase().includes(query);
        const inReason = item.decisionReason.toLowerCase().includes(query);
        const inOutcome = (item.decisionColor === 'green' ? 'passed accept' : item.decisionColor === 'yellow' ? 'review postpone' : item.decisionColor === 'red' ? 'rejected fail' : item.decisionColor === 'blue' ? 'hold blue' : '').includes(query);
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
        const outcomeStr = item.decisionColor === 'green' ? 'passed accept' : item.decisionColor === 'yellow' ? 'review postpone' : item.decisionColor === 'red' ? 'rejected fail' : item.decisionColor === 'blue' ? 'hold blue' : '';
        return outcomeStr.includes(query);
      } else if (searchColumn.startsWith('[Ref] ')) {
        const rawKey = searchColumn.replace('[Ref] ', '');
        const val = item.matchedMainRow?.[rawKey];
        return String(val ?? '').toLowerCase().includes(query);
      } else {
        const val = item.comparisonRow[searchColumn] ?? item.matchedMainRow?.[searchColumn];
        return String(val ?? '').toLowerCase().includes(query);
      }
    }

    return true;
  };

  // Helper to calculate distinct values and occurrences for Excel-style filter.
  // Counts only rows visible under the current status tab / search / other
  // column filters, so the dropdown never offers dead-end options.
  const getColumnUniqueValues = (colId: string): UniqueValueItem[] => {
    const counts = new Map<string, number>();
    for (const r of results) {
      if (!passesRowFilters(r, colId)) continue;
      const val = getRowColValue(r, colId);
      counts.set(val, (counts.get(val) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => {
        if (a.value === t.dashValueBlanks || a.value === t.dashValueEmpty) return 1;
        if (b.value === t.dashValueBlanks || b.value === t.dashValueEmpty) return -1;
        return a.value.localeCompare(b.value, undefined, { numeric: true, sensitivity: 'base' });
      });
  };

  // Real-Time Filter & Search Logic (shared predicate above)
  const filteredRows = useMemo(() => {
    return results.filter((item) => passesRowFilters(item));
  }, [results, activeFilter, columnFilters, searchTerm, searchColumn, hideSupersededPostpone]);

  // Sorting Logic
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortColumn === 'rowIndex') {
        valA = a.rowIndex;
      } else if (sortColumn === 'decisionColor') {
        valA = a.decisionColor;
      } else if (sortColumn === 'isMatched') {
        valA = a.isMatched ? 1 : 0;
      } else if (sortColumn === 'decisionReason') {
        valA = a.decisionReason;
      } else if (sortColumn.startsWith('[Ref] ')) {
        const rawKey = sortColumn.replace('[Ref] ', '');
        valA = a.matchedMainRow?.[rawKey] ?? '';
      } else {
        valA = a.comparisonRow[sortColumn] ?? '';
      }

      if (sortColumn === 'rowIndex') {
        valB = b.rowIndex;
      } else if (sortColumn === 'decisionColor') {
        valB = b.decisionColor;
      } else if (sortColumn === 'isMatched') {
        valB = b.isMatched ? 1 : 0;
      } else if (sortColumn === 'decisionReason') {
        valB = b.decisionReason;
      } else if (sortColumn.startsWith('[Ref] ')) {
        const rawKey = sortColumn.replace('[Ref] ', '');
        valB = b.matchedMainRow?.[rawKey] ?? '';
      } else {
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

  // Pagination (In Preview Mode, show all rows with no pagination cutoff)
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPageRows = useMemo(() => {
    if (isPreviewMode) {
      // User request: "Only show this Result Table in the live preview page; show all the rows."
      return sortedRows;
    }
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize, isPreviewMode]);

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
      onShowToast(t.dashExcelExported.replace('{count}', String(exportColIds.length)), 'success');
    } catch (err: any) {
      onShowToast(err.message || t.dashExportFailed, 'error');
    }
  };

  const handleExportCsv = () => {
    try {
      const baseName = comparisonWb?.name || 'Excel_Matching_Output';
      exportCsv(results, compHeaders, baseName, exportColIds);
      onShowToast(t.dashCsvExported.replace('{count}', String(exportColIds.length)), 'success');
    } catch (err: any) {
      onShowToast(err.message || t.dashExportFailed, 'error');
    }
  };

  const getSolidBadge = (color: ResultColor | 'none') => {
    switch (color) {
      case 'green':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold text-white bg-emerald-600 shadow-xs tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            {t.badgePassed}
          </span>
        );
      case 'yellow':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold text-white bg-amber-500 shadow-xs tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
            {t.badgeReview}
          </span>
        );
      case 'red':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold text-white bg-rose-600 shadow-xs tracking-wider">
            <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            {t.badgeRejected}
          </span>
        );
      case 'blue':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold text-white bg-blue-600 shadow-xs tracking-wider">
            <PauseCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            {t.badgeHold}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-slate-600 bg-slate-100">
            {t.badgeNoRule}
          </span>
        );
    }
  };

  // KPI stat cards double as the result filters (redesigned overview header)
  const totalResults = results.length;
  const kpiDefs: {
    key: FilterType;
    label: string;
    count: number;
    dot: string;
    active: string;
  }[] = [
    { key: 'all', label: t.filterAll, count: totalResults, dot: 'bg-slate-400', active: 'border-slate-300 bg-slate-50 ring-2 ring-slate-300' },
    { key: 'green', label: t.filterGreen, count: stats.greenCount ?? 0, dot: 'bg-emerald-500', active: 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-300' },
    { key: 'yellow', label: t.filterYellow, count: stats.yellowCount ?? 0, dot: 'bg-amber-500', active: 'border-amber-300 bg-amber-50 ring-2 ring-amber-300' },
    { key: 'red', label: t.filterRed, count: stats.redCount ?? 0, dot: 'bg-rose-500', active: 'border-rose-300 bg-rose-50 ring-2 ring-rose-300' },
    { key: 'blue', label: t.filterBlue, count: stats.blueCount ?? 0, dot: 'bg-blue-600', active: 'border-blue-300 bg-blue-50 ring-2 ring-blue-300' },
    { key: 'unmatched', label: t.filterUnmatched, count: stats.unmatchedCount ?? 0, dot: 'bg-violet-500', active: 'border-violet-300 bg-violet-50 ring-2 ring-violet-300' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Results overview: clickable KPI stat cards (filter the table) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {kpiDefs.map((k) => {
            const pct = totalResults > 0 ? Math.round((k.count / totalResults) * 100) : 0;
            const isActive = activeFilter === k.key;
            return (
              <button
                key={k.key}
                onClick={() => {
                  setActiveFilter(k.key);
                  setPage(1);
                }}
                className={`rounded-xl border p-3 text-left transition-all ${
                  isActive ? k.active : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${k.dot}`} />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 leading-tight">
                    {k.label}
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold tabular-nums text-slate-900">
                    {k.count.toLocaleString()}
                  </span>
                  {k.key !== 'all' && (
                    <span className="text-[11px] font-semibold text-slate-400">{pct}%</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. Action toolbar — grouped View / Share / Export actions */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3 pt-3 border-t border-slate-100">
          {/* Only Accept toggle */}
          <button
            onClick={() => {
              setHideSupersededPostpone(!hideSupersededPostpone);
              setPage(1);
            }}
            className="flex items-center gap-2.5 group pr-1"
            title={t.dashOnlyAcceptTitle}
          >
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                hideSupersededPostpone ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  hideSupersededPostpone ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </span>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 whitespace-nowrap">
              {t.dashOnlyAccept}
            </span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          {/* View group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0 group"
              title={t.dashRefreshTitle}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 group-hover:rotate-180 transition-transform ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{t.dashRefresh}</span>
            </button>


            {/* Save Column View & Sync button (Main Results page) */}
            {!isPreviewMode && (
              <button
                onClick={() => handleSaveColumnConfigs(columnConfigs)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0 select-none ${
                  hasUnsavedColumnChanges
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-200 shadow-md ring-1 ring-emerald-400 animate-pulse'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
                title={t.dashSaveViewTitle}
              >
                <Save className={`w-3.5 h-3.5 ${hasUnsavedColumnChanges ? 'text-white' : 'text-emerald-600'}`} />
                <span>{hasUnsavedColumnChanges ? t.dashSaveSyncView : t.dashSaveView}</span>
              </button>
            )}

            {/* Customize Columns Button (Exact same settings in both evaluation results & styled export and preview page) */}
            <button
              onClick={() => setShowColumnModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0 select-none group"
              title={t.dashColumnsTitle}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>{t.dashColumns}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-emerald-700 border border-emerald-200 font-bold">
                {tableVisibleCount}
              </span>
            </button>

          </div>
          {!isPreviewMode && (
            <>
              <div className="h-6 w-px bg-slate-200 hidden md:block" />
              {/* Share group */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Copy Share Link Button: copies the fixed public preview link (/preview).
                    Anyone opening it fetches the latest results from the cloud — no sign-in. */}
                <button
                  onClick={handleCopyShareLink}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0 select-none group"
                  title={t.dashCopyShareLink}
                >
                  {shareLinkCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                  )}
                  <span>{shareLinkCopied ? t.dashCopied : t.dashCopyShareLink}</span>
                </button>
                {/* Publish to Preview: force the current results to the public /preview link immediately */}
                {!isPreviewMode && (
                  <button
                    onClick={handlePublishPreview}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0 select-none"
                    title={t.dashPublishPreview || 'Update the public preview link with these results'}
                  >
                    <Cloud className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.dashPublishPreview || 'Update preview'}</span>
                  </button>
                )}

              </div>
              <div className="h-6 w-px bg-slate-200 hidden md:block" />
              {/* Export group */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
                  title={t.dashExportExcelTitle}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                  <span>{t.exportExcel}</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
                  title={t.dashExportCsvTitle}
                >
                  <Download className="w-3.5 h-3.5 text-slate-200" />
                  <span>{t.exportCsv}</span>
                </button>
              </div>
            </>
          )}
        </div>


        {/* 3. DEDICATED REAL-TIME SEARCH BAR & SCOPE SELECTOR */}
        <div className="pt-3 border-t border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 max-w-2xl">
            {/* Search Scope Dropdown */}
            {!isPreviewMode && (
              <div className="relative shrink-0">
                <select
                  value={searchColumn}
                  onChange={(e) => {
                    setSearchColumn(e.target.value);
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors shadow-xs"
                  title={t.dashSearchScopeTitle}
                >
                  <option value="all">{t.dashSearchScopeAll}</option>
                  <option value="outcome">{t.dashSearchScopeOutcome}</option>
                  <option value="reason">{t.dashSearchScopeReason}</option>
                  <option value="unmatched">{t.dashSearchScopeUnmatched}</option>
                  <option value="matchKey">{t.dashSearchScopeMatchKey}</option>
                  <optgroup label={t.dashOptgroupComparison}>
                    {compHeaders.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </optgroup>
                  {refHeaders.length > 0 && (
                    <optgroup label={t.dashOptgroupReference}>
                      {refHeaders.map((ref) => (
                        <option key={ref} value={ref}>
                          {ref}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            )}

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
                placeholder={t.dashSearchPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all font-mono shadow-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title={t.dashClearSearchTitle}
                  aria-label={t.dashClearSearchTitle}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Match Counter Badge */}
            {searchTerm.trim() && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 font-mono">
                <Filter className="w-3 h-3" />
                {t.dashRowsFound.replace('{count}', filteredRows.length.toLocaleString())}
              </span>
            )}
          </div>

          {/* Currently viewed file + last replaced time */}
          {comparisonWb && (
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto ml-auto">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]"
                title={comparisonWb.name}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-700 max-w-[160px] truncate">
                  {comparisonWb.name}
                </span>
              </span>
              {comparisonWb.uploadedAt ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-mono text-slate-600 whitespace-nowrap">
                    {formatFileDateTime(comparisonWb.uploadedAt, language)}
                  </span>
                </span>
              ) : null}
            </div>
          )}

          {/* Rows Per Page Selector (Only in Studio mode since Preview mode shows all rows) */}
          {!isPreviewMode && (
            <div className="flex items-center gap-3 text-xs text-slate-500 self-end md:self-auto shrink-0">
              <span>{t.rowsPerPage}:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 font-mono shadow-xs"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>
          )}
        </div>

        {/* Active Excel Column Filters Pill Bar */}
        {Object.keys(columnFilters).length > 0 && (
          <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>{t.dashActiveColumnFilters}</span>
            </span>
            {Object.entries(columnFilters).map(([colId, vals]) => {
              const colObj = allCandidateColumns.find((c) => c.id === colId);
              const label = colObj?.label ? colObj.label.replace('[Ref] ', '') : colId;
              return (
                <span
                  key={colId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs"
                >
                  <span className="font-sans font-medium text-slate-700">{label}:</span>
                  <span className="font-bold text-emerald-700">{t.dashValsSelected.replace('{count}', String(vals.length))}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setColumnFilters((prev) => {
                        const next = { ...prev };
                        delete next[colId];
                        return next;
                      });
                      setPage(1);
                    }}
                    className="p-0.5 hover:text-slate-900 rounded hover:bg-emerald-100 transition-colors ml-0.5 text-emerald-700"
                    title={t.dashClearFilterOn.replace('{label}', label)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setColumnFilters({});
                setPage(1);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 underline font-semibold ml-1 transition-colors"
            >
              {t.dashClearAllColumnFilters}
            </button>
          </div>
        )}
      </div>

      {/* 4. Main Data Table with Dynamic Column Visibility & Real-Time Search Match Highlighting */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-sm border-b border-slate-200 text-slate-700 font-bold select-none shadow-xs">
              <tr>
                {visibleTableColumns.map((col, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === visibleTableColumns.length - 1;
                  const isSorted =
                    sortColumn === col.id ||
                    (col.id === 'decisionStatus' && sortColumn === 'decisionColor') ||
                    (col.id === 'matchStatus' && sortColumn === 'isMatched');

                  const isColFiltered = columnFilters[col.id] !== undefined;

                  const handleColSort = () => {
                    if (col.id === 'decisionStatus') handleSort('decisionColor');
                    else if (col.id === 'matchStatus') handleSort('isMatched');
                    else handleSort(col.id);
                  };

                  // Freeze the row-number column on the left so rows stay identifiable
                  // while scrolling horizontally on small screens.
                  const isRowIndexCol = col.id === 'rowIndex';
                  return (
                    <th
                      key={col.id}
                      className={`py-3.5 px-3 border-r border-slate-200 whitespace-nowrap group/th transition-colors ${
                        isRowIndexCol
                          ? 'sticky left-0 z-20 bg-slate-100 text-slate-700'
                          : `relative ${
                              col.category === 'reference'
                                ? 'text-blue-800 bg-blue-50/60'
                                : 'text-slate-700'
                            }`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Sortable Header Label */}
                        <div
                          onClick={handleColSort}
                          className="flex items-center gap-1.5 cursor-pointer font-mono select-none hover:text-emerald-700 transition-colors"
                          title={t.dashClickToSortBy.replace('{label}', col.label)}
                        >
                          {col.category === 'reference' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-200 font-sans shadow-xs">
                              Ref
                            </span>
                          )}
                          <span>{col.label.replace('[Ref] ', '')}</span>
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-emerald-600 shrink-0" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-emerald-600 shrink-0" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                          )}
                        </div>

                        {/* Excel-style Column Filter & Move Actions Container */}
                        <div className="flex items-center gap-1">
                          {/* Excel Column Filter Dropdown Button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setFilterAnchorRect(rect);
                                setOpenFilterColId((prev) => (prev === col.id ? null : col.id));
                              }}
                              className={`p-1.5 rounded transition-colors ${
                                isColFiltered
                                  ? 'text-emerald-700 bg-emerald-100 border border-emerald-300 shadow-xs'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                              }`}
                              title={t.dashFilterLikeExcelTitle.replace('{label}', col.label)}
                              aria-label={t.dashFilterAria.replace('{label}', col.label)}
                            >
                              <Filter className="w-3.5 h-3.5" />
                            </button>

                            {openFilterColId === col.id && (
                              <ExcelColumnFilter
                                language={language}
                                columnId={col.id}
                                columnLabel={col.label}
                                uniqueValues={getColumnUniqueValues(col.id)}
                                selectedValues={columnFilters[col.id]}
                                anchorRect={filterAnchorRect}
                                onApply={(newVals) => {
                                  setColumnFilters((prev) => {
                                    const next = { ...prev };
                                    if (newVals === undefined) {
                                      delete next[col.id];
                                    } else {
                                      next[col.id] = newVals;
                                    }
                                    return next;
                                  });
                                  setPage(1);
                                }}
                                onClear={() => {
                                  setColumnFilters((prev) => {
                                    const next = { ...prev };
                                    delete next[col.id];
                                    return next;
                                  });
                                  setPage(1);
                                }}
                                onSort={(dir) => {
                                  if (col.id === 'decisionStatus') {
                                    setSortColumn('decisionColor');
                                  } else if (col.id === 'matchStatus') {
                                    setSortColumn('isMatched');
                                  } else {
                                    setSortColumn(col.id);
                                  }
                                  setSortDirection(dir);
                                }}
                                isOpen={true}
                                onClose={() => setOpenFilterColId(null)}
                              />
                            )}
                          </div>

                          {/* Move Column Left / Right Arrows (Only in Main Results page, hidden in Preview Mode per user instructions) */}
                          {!isPreviewMode && (
                            <div className="flex items-center gap-0.5 opacity-60 group-hover/th:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveColumn(col.id, 'left');
                                }}
                                disabled={isFirst}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                                title={t.dashMoveColumnLeft}
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveColumn(col.id, 'right');
                                }}
                                disabled={isLast}
                                className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                                title={t.dashMoveColumnRight}
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}

                {/* Actions column — frozen on the right so Inspect stays reachable on mobile */}
                <th className="py-3 px-3 text-center w-16 text-slate-500 whitespace-nowrap sticky right-0 z-20 bg-slate-100 border-l border-slate-200">
                  {t.viewDetails}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleTableColumns.length === 0 ? (
                <tr>
                  <td colSpan={100} className="py-16 text-center text-slate-500 bg-slate-50/60">
                    <div className="max-w-md mx-auto space-y-3 px-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-emerald-600 mx-auto">
                        <SlidersHorizontal className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{t.dashAllColumnsHidden}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {t.dashAllColumnsHiddenDesc}
                      </p>
                      <div className="flex justify-center gap-2.5 pt-2">
                        <button
                          onClick={handleResetDefaultColumns}
                          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                        >
                          {t.dashRestoreAllColumns}
                        </button>
                        <button
                          onClick={() => setShowColumnModal(true)}
                          className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
                        >
                          {t.dashChooseColumns}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : currentPageRows.length > 0 ? (
                currentPageRows.map((row) => {
                  const isGreen = row.decisionColor === 'green';
                  const isYellow = row.decisionColor === 'yellow';
                  const isRed = row.decisionColor === 'red';
                  const isBlue = row.decisionColor === 'blue';
                  // Opaque background for the frozen columns (must cover scrolled content)
                  const frozenBg = isGreen
                    ? 'bg-emerald-50'
                    : isYellow
                    ? 'bg-amber-50'
                    : isRed
                    ? 'bg-rose-50'
                    : isBlue
                    ? 'bg-blue-50'
                    : 'bg-white';

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors border-b border-slate-100 ${
                        isGreen
                          ? 'bg-emerald-50/30 hover:bg-emerald-50/70 border-l-[4px] border-l-emerald-500'
                          : isYellow
                          ? 'bg-amber-50/30 hover:bg-amber-50/70 border-l-[4px] border-l-amber-500'
                          : isRed
                          ? 'bg-rose-50/30 hover:bg-rose-50/70 border-l-[4px] border-l-rose-500'
                          : isBlue
                          ? 'bg-blue-50/40 hover:bg-blue-50/80 border-l-[4px] border-l-blue-600'
                          : 'even:bg-slate-50/40 hover:bg-slate-50 border-l-[4px] border-l-transparent'
                      }`}
                    >
                      {visibleTableColumns.map((col) => {
                        if (col.id === 'rowIndex') {
                          return (
                            <td
                              key={col.id}
                              className={`py-2.5 px-3 border-r border-slate-200 text-center text-slate-500 font-mono tabular-nums text-[11px] font-bold sticky left-0 z-[5] ${frozenBg}`}
                            >
                              {highlightText(row.rowIndex, searchTerm)}
                            </td>
                          );
                        }

                        if (col.id === 'decisionStatus') {
                          return (
                            <td key={col.id} className="py-2.5 px-4 border-r border-slate-200 whitespace-nowrap">
                              {getSolidBadge(row.decisionColor)}
                            </td>
                          );
                        }

                        if (col.id === 'matchStatus') {
                          return (
                            <td key={col.id} className="py-2.5 px-4 border-r border-slate-200 whitespace-nowrap">
                              {row.isMatched ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-2.5 py-1 rounded-md shadow-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 stroke-[2.5]" />
                                  {t.dashCellMatched}
                                </span>
                              ) : (
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-white bg-amber-500 shadow-xs shrink-0">
                                      <AlertTriangle className="w-3 h-3 text-white shrink-0" />
                                      {t.dashCellUnmatched}
                                    </span>
                                    {row.unmatchedInfo?.matchType === 'partial_mismatch' && (
                                      <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1 py-0.2 rounded border border-rose-200 shrink-0">
                                        {t.dashCellDiffers}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    className="font-mono text-xs font-bold text-amber-800 hover:text-amber-900 cursor-pointer truncate max-w-[210px]"
                                    onClick={() => setSelectedRow(row)}
                                    title={row.unmatchedInfo?.unmatchedKeyDisplay || row.matchKey}
                                  >
                                    {highlightText(row.unmatchedInfo?.primaryIdentifier || row.matchKey || t.dashUnidentified, searchTerm)}
                                  </div>
                                  <span
                                    className="text-[10px] text-slate-500 truncate max-w-[210px] font-sans"
                                    title={row.unmatchedInfo?.reason}
                                  >
                                    {row.unmatchedInfo?.matchType === 'partial_mismatch'
                                      ? t.dashRefDifferingFields
                                      : t.dashMissingInRef}
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        }

                        if (col.id === 'decisionReason') {
                          return (
                            <td key={col.id} className="py-2.5 px-4 border-r border-slate-200 text-xs text-slate-700 font-medium truncate max-w-xs">
                              <span title={row.decisionReason}>
                                {highlightText(row.decisionReason, searchTerm)}
                              </span>
                            </td>
                          );
                        }

                        // Inspection cell filled badges helper
                        const renderFilledInspectionCell = (rawVal: any) => {
                          const valStr = String(rawVal ?? '');
                          const lower = valStr.toLowerCase();
                          if (lower.includes('accept') || lower.includes('waive') || lower.includes('certified ok') || lower.includes('normal')) {
                            return (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white bg-green-600 shadow-xs tracking-wide">
                                {valStr}
                              </span>
                            );
                          }
                          if (lower.includes('postpone') || lower.includes('pending') || lower.includes('hold') || lower.includes('review') || lower.includes('quarantine')) {
                            return (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white bg-amber-500 shadow-xs tracking-wide">
                                {valStr}
                              </span>
                            );
                          }
                          if (lower.includes('reject') || lower.includes('fail') || lower.includes('discrepant') || lower.includes('out of spec')) {
                            return (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white bg-rose-600 shadow-xs tracking-wide">
                                {valStr}
                              </span>
                            );
                          }
                          return highlightText(valStr, searchTerm);
                        };

                        if (col.id.startsWith('[Ref] ')) {
                          const rawKey = col.id.replace('[Ref] ', '');
                          let valStr = String(row.matchedMainRow?.[rawKey] ?? '');
                          if (row.decisionColor === 'green' && valStr.toLowerCase().includes('postpone')) {
                            valStr = 'Accept';
                          }
                          const isInspectionCol = col.id.toLowerCase().includes('status') || col.id.toLowerCase().includes('result') || col.id.toLowerCase().includes('grade');

                          return (
                            <td
                              key={col.id}
                              className="py-2.5 px-4 border-r border-slate-200 whitespace-nowrap font-mono text-xs text-slate-800 bg-blue-50/20"
                            >
                              {isInspectionCol ? renderFilledInspectionCell(valStr) : highlightText(valStr, searchTerm)}
                            </td>
                          );
                        }

                        // Default: Comparison column
                        let valStr = String(row.comparisonRow[col.id] ?? '');
                        if (row.decisionColor === 'green' && valStr.toLowerCase().includes('postpone')) {
                          valStr = 'Accept';
                        }
                        const isInspectionCol = col.id.toLowerCase().includes('status') || col.id.toLowerCase().includes('result') || col.id.toLowerCase().includes('grade');

                        return (
                          <td
                            key={col.id}
                            className="py-2.5 px-4 border-r border-slate-200 whitespace-nowrap font-mono text-xs text-slate-800"
                          >
                            {isInspectionCol ? renderFilledInspectionCell(valStr) : highlightText(valStr, searchTerm)}
                          </td>
                        );
                      })}

                      {/* Row Inspect Button — frozen on the right for mobile reachability */}
                      <td className={`py-2.5 px-3 text-center whitespace-nowrap sticky right-0 z-[5] border-l border-slate-200 ${frozenBg}`}>
                        <div className="flex items-center justify-center gap-1.5">
                          {!isPreviewMode && row.isHold && row.holdKey && onReleaseHoldKey && (
                            <button
                              onClick={() => {
                                const count = results.filter((r) => r.isHold && r.holdKey === row.holdKey).length;
                                setReleaseTarget({ key: row.holdKey as string, count });
                                setSupervisorConfirmed(false);
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors"
                              title={t.dashRemoveFromHoldTitle}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              {t.dashRemoveFromHold}
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedRow(row)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            title={t.dashInspectRowTitle}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={visibleTableColumns.length + 1}
                    className="py-16 text-center text-slate-500 text-xs space-y-2"
                  >
                    <div>{t.noResultsFound}</div>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-xs text-emerald-600 hover:underline inline-block mt-1 font-semibold"
                      >
                        {t.dashClearSearchFilter.replace('{term}', searchTerm)}
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Table Pagination Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          {isPreviewMode ? (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 font-mono">
                  {t.dashShowingAllRows.replace('{count}', currentPageRows.length.toLocaleString())}
                </span>
                {results.length !== currentPageRows.length && (
                  <span className="text-slate-500">
                    {t.dashFilteredFromTotal.replace('{count}', results.length.toLocaleString())}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {t.dashFullResultView}
              </div>
            </div>
          ) : (
            <>
              <div>
                {t.showingRows}{' '}
                <strong className="text-slate-800 font-mono tabular-nums">
                  {filteredRows.length > 0 ? (page - 1) * pageSize + 1 : 0}
                </strong>{' '}
                -{' '}
                <strong className="text-slate-800 font-mono tabular-nums">
                  {Math.min(page * pageSize, filteredRows.length)}
                </strong>{' '}
                {t.of}{' '}
                <strong className="text-slate-800 font-mono tabular-nums">
                  {filteredRows.length.toLocaleString()}
                </strong>{' '}
                {t.dashRowsUnit}
                {searchTerm.trim() && (
                  <span className="text-slate-500 ml-2">
                    {t.dashFilteredFromTotal.replace('{count}', results.length.toLocaleString())}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{t.prevPage}</span>
                </button>
                <span className="px-2 font-mono text-slate-700 font-bold tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                >
                  <span>{t.nextPage}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Supervisor Release Dialog */}
      {releaseTarget && onReleaseHoldKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">{t.dashRemoveFromHold}</h4>
              </div>
              <button
                onClick={() => setReleaseTarget(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 cursor-pointer hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                checked={supervisorConfirmed}
                onChange={(e) => setSupervisorConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-800 font-bold">{t.dashReleaseSupervisor}</span>
            </label>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t.dashReleaseDesc.replace('{key}', releaseTarget.key).replace('{n}', String(releaseTarget.count))}
            </p>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
              <div className="text-[11px] font-bold text-blue-900">{t.dashHoldReasonLabel}</div>
              <div className="text-xs text-blue-800">
                {holdReason.trim() ? holdReason : t.dashReleaseNoReason}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setReleaseTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                disabled={!supervisorConfirmed || isReleasing}
                onClick={async () => {
                  setIsReleasing(true);
                  try {
                    const outcome = await onReleaseHoldKey(releaseTarget.key);
                    onShowToast(
                      t.dashReleaseOutcomeToast
                        .replace('{key}', outcome.key)
                        .replace('{g}', String(outcome.green))
                        .replace('{y}', String(outcome.yellow)),
                      'success'
                    );
                  } finally {
                    setIsReleasing(false);
                    setReleaseTarget(null);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.dashRemoveFromHold}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row Inspection Modal */}
      <RowDetailModal
        row={selectedRow}
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        language={language}
      />

      {/* Column Customization Modal (Table & Export) */}
      <ColumnCustomizationModal
        isOpen={showColumnModal}
        onClose={() => setShowColumnModal(false)}
        columnConfigs={columnConfigs}
        onChangeConfigs={handleUpdateColumnConfigs}
        onSaveConfigs={handleSaveColumnConfigs}
        syncExportWithTable={syncExportWithTable}
        onToggleSync={handleToggleSyncExport}
        onResetDefaults={handleResetDefaultColumns}
        language={language}
      />

    </div>
  );
};
