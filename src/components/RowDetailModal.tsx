import React from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Layers,
  HelpCircle,
  FileQuestion,
  GitCompare,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { MatchedRow } from '../types';

interface RowDetailModalProps {
  row: MatchedRow | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RowDetailModal: React.FC<RowDetailModalProps> = ({
  row,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !row) return null;

  const compKeys = Object.keys(row.comparisonRow);
  const refKeys = row.matchedMainRow ? Object.keys(row.matchedMainRow) : [];
  const unmatched = row.unmatchedInfo;
  const closestRef = unmatched?.closestReferenceRow;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <span
              className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ${
                row.decisionColor === 'green'
                  ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]'
                  : row.decisionColor === 'yellow'
                  ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]'
                  : row.decisionColor === 'red'
                  ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]'
                  : 'bg-slate-500'
              }`}
            />
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Row #{row.rowIndex} Full Discrepancy & Evaluation Inspection</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>Match Key:</span>
                <span className="font-mono text-emerald-300 font-semibold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  {row.matchKey || 'N/A'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. UNMATCHED ROOT-CAUSE DIAGNOSIS BANNER (High Visibility) */}
        {!row.isMatched ? (
          <div className="p-4 mx-5 sm:mx-6 mt-4 rounded-xl bg-amber-950/30 border border-amber-800/60 text-slate-200 shrink-0 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/40 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Unmatched Discrepancy Analysis
                  </span>
                  <h4 className="text-sm font-bold text-white font-mono">
                    Which one is unmatched:{' '}
                    <span className="text-amber-300 font-bold underline decoration-amber-500/60">
                      {unmatched?.primaryIdentifier || row.matchKey || 'This Record'}
                    </span>
                  </h4>
                </div>
              </div>
              <span className="self-start sm:self-auto text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700/80 shrink-0">
                {unmatched?.matchType === 'partial_mismatch'
                  ? 'Partial Mismatch (Differing Fields)'
                  : 'Missing in Reference File'}
              </span>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div className="flex items-start gap-1.5">
                <span className="text-slate-400 font-semibold shrink-0">Reason:</span>
                <span className="text-slate-100 font-medium">{unmatched?.reason || row.decisionReason}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-slate-400 font-semibold shrink-0">Incoming Key Values:</span>
                <span className="font-mono text-amber-300/90">{unmatched?.unmatchedKeyDisplay || row.matchKey}</span>
              </div>
            </div>

            {/* Field Diff Breakdown */}
            {unmatched?.fieldDiffs && unmatched.fieldDiffs.length > 0 && (
              <div className="pt-2 border-t border-amber-900/30">
                <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Key Column Comparison Status</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {unmatched.fieldDiffs.map((diff, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border text-xs font-mono flex flex-col justify-between ${
                        diff.isMatch
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans mb-1">
                        <span>{diff.comparisonCol}</span>
                        {diff.isMatch ? (
                          <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                            <CheckCircle2 className="w-3 h-3" /> MATCH
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-0.5 font-bold">
                            <X className="w-3 h-3" /> DIFFER
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-slate-200 truncate">
                          <span className="text-slate-500 font-sans text-[10px]">Incoming:</span>{' '}
                          {String(diff.compValue ?? '—')}
                        </div>
                        <div className="text-slate-300 truncate">
                          <span className="text-slate-500 font-sans text-[10px]">Reference:</span>{' '}
                          {String(diff.refValue ?? 'Not Found')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 mx-5 sm:mx-6 mt-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Matched Successfully with Reference Record (Exact Key Match)</span>
            </div>
            <div className="text-slate-300">
              <span className="text-slate-400 mr-1.5">Decision:</span>
              <strong className="text-white">{row.decisionReason}</strong>
            </div>
          </div>
        )}

        {/* 2. Side-by-Side Data Comparison */}
        <div className="flex-1 overflow-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Comparison File Row */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Incoming Comparison Record</span>
              <span className="text-[11px] font-mono text-slate-500">Row #{row.rowIndex}</span>
            </h4>
            <div className="space-y-2 text-xs overflow-y-auto flex-1 divide-y divide-slate-800/50">
              {compKeys.map((k) => {
                const val = row.comparisonRow[k];
                const isFailedKey = unmatched?.fieldDiffs.some(
                  (d) => d.comparisonCol === k && !d.isMatch
                );

                return (
                  <div
                    key={k}
                    className={`flex items-start justify-between py-1.5 gap-4 ${
                      isFailedKey ? 'bg-rose-950/30 px-2 rounded' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-slate-400 font-mono text-[11px]">{k}</span>
                      {isFailedKey && (
                        <span className="text-[10px] px-1 rounded bg-rose-950 text-rose-300 border border-rose-800/60 font-sans font-bold">
                          Mismatch
                        </span>
                      )}
                    </div>
                    <span className="text-slate-100 font-mono text-right break-all font-medium">
                      {String(val ?? '—')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reference File Row / Closest Candidate */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>
                {row.matchedMainRow
                  ? 'Matched Reference Record'
                  : closestRef
                  ? 'Closest Reference Candidate'
                  : 'Reference Record'}
              </span>
              {closestRef && !row.matchedMainRow && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 font-sans font-bold">
                  Partial Match
                </span>
              )}
            </h4>

            {row.matchedMainRow ? (
              <div className="space-y-2 text-xs overflow-y-auto flex-1 divide-y divide-slate-800/50">
                {refKeys.map((k) => (
                  <div
                    key={k}
                    className="flex items-start justify-between py-1.5 gap-4"
                  >
                    <span className="text-slate-400 font-mono text-[11px] shrink-0">{k}</span>
                    <span className="text-slate-100 font-mono text-right break-all font-medium">
                      {String(row.matchedMainRow![k] ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            ) : closestRef ? (
              <div className="space-y-2 text-xs overflow-y-auto flex-1 divide-y divide-slate-800/50">
                <div className="pb-2 text-[11px] text-amber-300/90 font-medium">
                  Showing the closest candidate row found in Reference catalog for comparison:
                </div>
                {Object.keys(closestRef).map((k) => {
                  const val = closestRef[k];
                  const isMatchingCol = unmatched?.fieldDiffs.some(
                    (d) => d.mainCol === k && d.isMatch
                  );
                  const isDifferingCol = unmatched?.fieldDiffs.some(
                    (d) => d.mainCol === k && !d.isMatch
                  );

                  return (
                    <div
                      key={k}
                      className={`flex items-start justify-between py-1.5 gap-4 ${
                        isMatchingCol
                          ? 'bg-emerald-950/20 px-2 rounded'
                          : isDifferingCol
                          ? 'bg-rose-950/30 px-2 rounded'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-slate-400 font-mono text-[11px]">{k}</span>
                        {isMatchingCol && (
                          <span className="text-[10px] px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-sans">
                            Matched
                          </span>
                        )}
                        {isDifferingCol && (
                          <span className="text-[10px] px-1 rounded bg-rose-950 text-rose-300 border border-rose-800/60 font-sans">
                            Differs
                          </span>
                        )}
                      </div>
                      <span className="text-slate-100 font-mono text-right break-all font-medium">
                        {String(val ?? '—')}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs space-y-2">
                <FileQuestion className="w-10 h-10 text-slate-600" />
                <div className="font-semibold text-slate-400">
                  Zero Matching Records in Reference File
                </div>
                <p className="max-w-xs text-slate-500 text-[11px]">
                  No row in the Reference dataset contains the key identifier{' '}
                  <strong className="text-amber-400 font-mono">{unmatched?.primaryIdentifier || row.matchKey}</strong>.
                  This is a brand new incoming item.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-mono">
            Status: <span className="text-slate-200 font-bold">{row.isMatched ? 'MATCHED' : 'UNMATCHED (NEW)'}</span> · Layer: <span className="text-emerald-400 font-bold">{row.decisionLayerName || 'Inspection'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
