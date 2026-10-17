import React from 'react';
import { Database, Loader2, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface GlobalLoadingSkeletonProps {
  message?: string;
  language?: Language;
}

export const GlobalLoadingSkeleton: React.FC<GlobalLoadingSkeletonProps> = ({
  message,
  language,
}) => {
  let resolved: Language | undefined = language;
  if (!resolved) {
    try {
      const saved = localStorage.getItem('excelmatch_language');
      if (saved === 'my' || saved === 'th' || saved === 'zh') resolved = saved;
    } catch { /* ignore */ }
  }
  const t = translations[resolved || 'en'];
  const displayMessage = message || t.loadingRestoreMessage;
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none animate-in fade-in duration-300">
      {/* 1. Header Bar Skeleton */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}excellent-logo-web.jpg`}
            alt="Excellent Medical Technology"
            className="h-9 w-auto animate-pulse"
          />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight">Excellent Medical Technology</span>
              <span className="text-brand-400 font-bold text-base">ESP</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-950 text-brand-400 border border-brand-800/60 font-semibold hidden sm:inline-flex items-center gap-1">
                <Database className="w-3 h-3" /> {t.loadingIndexedDbActive}
              </span>
            </div>
            <div className="h-2.5 w-48 bg-slate-800 rounded animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-24 bg-slate-800 rounded-lg animate-pulse hidden sm:block" />
          <div className="h-8 w-28 bg-slate-800 rounded-lg animate-pulse" />
        </div>
      </header>

      {/* 2. Main Loading Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Step Indicator Skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="h-8 w-36 bg-slate-800 rounded-lg animate-pulse" />
            <span className="text-slate-700 hidden sm:inline">→</span>
            <div className="h-8 w-44 bg-slate-800/60 rounded-lg animate-pulse hidden sm:block" />
            <span className="text-slate-700 hidden sm:inline">→</span>
            <div className="h-8 w-36 bg-slate-800/40 rounded-lg animate-pulse hidden sm:block" />
          </div>
          <div className="h-8 w-32 bg-slate-800 rounded-lg animate-pulse hidden sm:block" />
        </div>

        {/* Global Loading Status Banner */}
        <div className="bg-slate-900/90 border border-brand-900/50 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 via-slate-800/20 to-sky-500/5 pointer-events-none" />

          <div className="relative flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-brand-950/80 border border-brand-700/60 flex items-center justify-center text-brand-400 shadow-lg shadow-brand-950/50">
                <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
              </div>
              <Sparkles className="w-4 h-4 text-brand-300 absolute -top-1 -right-1 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center justify-center gap-2">
                <span>{t.loadingWorkspaceTitle}</span>
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {displayMessage}
              </p>
            </div>

            {/* Shimmer Progress Track */}
            <div className="w-full max-w-xs h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
              <div className="h-full bg-brand-500 rounded-full w-2/3 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Realistic Card Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1 Skeleton */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-slate-800/60 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-16 bg-slate-800 rounded animate-pulse" />
            </div>

            <div className="h-44 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40 flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-slate-800 animate-pulse" />
              <div className="h-3.5 w-40 bg-slate-800 rounded animate-pulse" />
              <div className="h-2.5 w-28 bg-slate-800/60 rounded animate-pulse" />
            </div>
          </div>

          {/* Card 2 Skeleton */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-slate-800/60 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-16 bg-slate-800 rounded animate-pulse" />
            </div>

            <div className="h-44 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40 flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-slate-800 animate-pulse" />
              <div className="h-3.5 w-40 bg-slate-800 rounded animate-pulse" />
              <div className="h-2.5 w-28 bg-slate-800/60 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
