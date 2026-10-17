import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Check,
  Plus,
  ArrowRight,
  Filter,
  CheckCircle2,
  HelpCircle,
  Search,
  Zap,
  Tag,
  DollarSign,
  FileText,
  Boxes,
  Layers,
  Calendar,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ColumnMapping, Language } from '../types';
import {
  analyzeColumnSuggestions,
  ColumnSuggestion,
  SuggestionCategory,
} from '../utils/suggestionEngine';
import { translations } from '../translations';

interface SuggestionEnginePanelProps {
  refHeaders: string[];
  compHeaders: string[];
  mappings: ColumnMapping[];
  onApplyAll: (newMappings: ColumnMapping[]) => void;
  onApplyOne: (mainCol: string, comparisonCol: string) => void;
  language: Language;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

export const SuggestionEnginePanel: React.FC<SuggestionEnginePanelProps> = ({
  refHeaders,
  compHeaders,
  mappings,
  onApplyAll,
  onApplyOne,
  language,
  onShowToast,
  isCollapsible = false,
  defaultExpanded = true,
}) => {
  const t = translations[language];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideMapped, setHideMapped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Analyze suggestions based on current headers and active mappings
  const analysis = useMemo(() => {
    return analyzeColumnSuggestions(refHeaders, compHeaders, mappings);
  }, [refHeaders, compHeaders, mappings]);

  // Filter suggestions by search, category, and mapped status
  const filteredSuggestions = useMemo(() => {
    return analysis.suggestions.filter((s) => {
      if (hideMapped && s.isAlreadyMapped) return false;
      if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCol =
          s.mainCol.toLowerCase().includes(q) ||
          s.comparisonCol.toLowerCase().includes(q) ||
          s.reason.toLowerCase().includes(q) ||
          s.categoryLabel.toLowerCase().includes(q);
        if (!matchesCol) return false;
      }
      return true;
    });
  }, [analysis.suggestions, hideMapped, selectedCategory, searchQuery]);

  const handleApplyAllSuggestions = () => {
    const unmapped = analysis.suggestions.filter((s) => !s.isAlreadyMapped);
    if (unmapped.length === 0) return;

    // Create unique new mappings preserving existing ones
    const newItems: ColumnMapping[] = unmapped.map((s, idx) => ({
      id: `map_sug_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      mainCol: s.mainCol,
      comparisonCol: s.comparisonCol,
    }));

    onApplyAll([...mappings, ...newItems]);
    onShowToast?.(
      `Applied ${unmapped.length} intelligent column mappings via Suggestion Engine.`,
      'success'
    );
  };

  const getCategoryIcon = (cat: SuggestionCategory) => {
    switch (cat) {
      case 'value':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
      case 'identifier':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'material':
        return <Boxes className="w-3.5 h-3.5 text-indigo-600" />;
      case 'tracking':
        return <Layers className="w-3.5 h-3.5 text-amber-600" />;
      case 'quantity':
        return <Zap className="w-3.5 h-3.5 text-cyan-600" />;
      case 'date':
        return <Calendar className="w-3.5 h-3.5 text-purple-600" />;
      case 'status':
        return <Activity className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getCategoryBadgeClass = (cat: SuggestionCategory) => {
    switch (cat) {
      case 'value':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'identifier':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'material':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'tracking':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'quantity':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'date':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'status':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (refHeaders.length === 0 || compHeaders.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Suggestion Engine Banner / Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-slate-50 border-b border-emerald-100/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Suggestion Engine
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Zap className="w-3 h-3 text-emerald-600" />
                Industry Terminology
              </span>
              {analysis.unmappedSuggestionsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  {analysis.unmappedSuggestionsCount} ready to map
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Proposes intelligent column mappings based on common industry terminology (e.g., matching <strong className="text-slate-800 font-semibold">Amt</strong>, <strong className="text-slate-800 font-semibold">Total</strong>, or <strong className="text-slate-800 font-semibold">Net</strong> to the value column, POs, Lots, and Quantities).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {analysis.unmappedSuggestionsCount > 0 && (
            <button
              onClick={handleApplyAllSuggestions}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Apply All Suggestions ({analysis.unmappedSuggestionsCount})</span>
            </button>
          )}

          {isCollapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Controls: Category Filter Pills & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({analysis.totalSuggestions})
              </button>

              {analysis.categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    selectedCategory === cat.key
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {getCategoryIcon(cat.key as SuggestionCategory)}
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      selectedCategory === cat.key ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search and hide toggle */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter suggestions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-500 w-36 sm:w-48"
                />
              </div>

              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideMapped}
                  onChange={(e) => setHideMapped(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Hide active</span>
              </label>
            </div>
          </div>

          {/* Suggestions List */}
          {filteredSuggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSuggestions.map((suggestion) => {
                const isMapped = suggestion.isAlreadyMapped;
                return (
                  <div
                    key={suggestion.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                      isMapped
                        ? 'bg-slate-50/60 border-slate-200 opacity-80'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Top Row: Category and Confidence Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadgeClass(
                          suggestion.category
                        )}`}
                      >
                        {getCategoryIcon(suggestion.category)}
                        {suggestion.categoryLabel}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            suggestion.confidence >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {suggestion.confidence}% Match
                        </span>

                        {isMapped && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Column Names pair */}
                    <div className="flex items-center justify-between gap-2 bg-slate-50/90 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex-1 min-w-0">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          Main (ESP)
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900 truncate block">
                          {suggestion.mainCol}
                        </span>
                      </div>

                      <div className="px-2 text-slate-400 font-bold shrink-0 text-xs">
                        ⟷
                      </div>

                      <div className="flex-1 min-w-0 text-right">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          Incoming (DO2-HPT)
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-800 truncate block">
                          {suggestion.comparisonCol}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Explanation & Action */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <p className="text-[11px] text-slate-500 leading-tight truncate pr-2" title={suggestion.reason}>
                        {suggestion.reason}
                      </p>

                      {!isMapped ? (
                        <button
                          onClick={() => onApplyOne(suggestion.mainCol, suggestion.comparisonCol)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shrink-0 shadow-xs"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>Apply</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-medium shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mapped</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              No matching suggestions for the selected filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
