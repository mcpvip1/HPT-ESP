import React, { useState, useRef, useEffect } from 'react';
import { Globe, SlidersHorizontal, Cloud, CloudUpload, LogOut } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import type { ActiveUpload } from '../types';
import type { User } from 'firebase/auth';
import { Language } from '../types';
import { translations } from '../translations';

interface HeaderProps {
  currentStep?: 1 | 2;
  onSelectStep?: (step: 1 | 2) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenRulesSetting: () => void;
  hasRefFile: boolean;
  hasCompFile: boolean;
  hasResults: boolean;
  isPreviewMode?: boolean;
  onExitPreview?: () => void;
  cloudUser?: User | null;
  onCloudSignIn?: () => void;
  onCloudSignOut?: () => void;
  activeUpload?: ActiveUpload | null;
  onOpenSyncPanel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onSelectStep,
  language,
  onLanguageChange,
  onOpenRulesSetting,
  hasRefFile,
  hasResults,
  isPreviewMode,
  onExitPreview,
  cloudUser,
  onCloudSignIn,
  onCloudSignOut,
  activeUpload,
  onOpenSyncPanel,
}) => {
  const t = translations[language];
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const languageLabels: Record<Language, { native: string; code: string }> = {
    en: { native: 'English', code: 'EN' },
    my: { native: 'မြန်မာ', code: 'MY' },
    th: { native: 'ไทย', code: 'TH' },
    zh: { native: '中文', code: 'ZH' },
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 sm:gap-6 h-16">
          {/* Brand: Excellent Medical Technology logo + name + creator */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                if (!isPreviewMode && onSelectStep) onSelectStep(1);
              }}
              className="flex items-center gap-2 sm:gap-2.5 min-w-0 focus:outline-none group"
              title="Excellent Medical Technology ESP"
            >
              <img
                src={`${import.meta.env.BASE_URL}excellent-logo-transparent.png`}
                alt="Excellent Medical Technology"
                className="h-9 sm:h-10 w-auto shrink-0"
              />
              <span className="hidden md:flex flex-col items-start leading-tight min-w-0">
                <span className="text-[13px] font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                  Excellent Medical Technology <span className="text-brand-600">ESP</span>
                </span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wide">
                  Created by <span className="font-bold text-accent-600">DO2-HPT</span>
                </span>
              </span>
            </button>
          </div>

          {/* Mode Tag if in Preview */}
          {isPreviewMode && (
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-lg bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700 min-w-0">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse shrink-0" />
              <span className="hidden min-[420px]:inline truncate">{t.headerResultPreview}</span>
              <span className="hidden sm:inline text-slate-500 font-normal">
                {t.headerLiveTable}
              </span>
            </div>
          )}

          {/* Language Selector & Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Cloud sync upload status: animated arrow while uploading, opens status & history */}
            {cloudUser && onOpenSyncPanel && (
              <button
                onClick={onOpenSyncPanel}
                title={t.syncPanelTitle}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                {activeUpload ? (
                  <>
                    <ProgressRing
                      pct={activeUpload.total > 0 ? Math.round((activeUpload.done / activeUpload.total) * 100) : null}
                      size={20}
                    />
                    <span className="font-bold tabular-nums">
                      {activeUpload.total > 0 ? `${Math.round((activeUpload.done / activeUpload.total) * 100)}%` : '…'}
                    </span>
                    <span className="hidden lg:inline max-w-[160px] truncate text-sky-600/80 font-normal">
                      {activeUpload.fileName}
                    </span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.syncAllSynced}</span>
                  </>
                )}
              </button>
            )}
            {/* Cloud sync: sign in with Google to share rules & live preview across devices */}
            {cloudUser ? (
              <button
                onClick={onCloudSignOut}
                title={t.headerSignedInTitle.replace('{email}', cloudUser.email || t.headerGoogleUser)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.headerSynced}</span>
                <LogOut className="w-3 h-3 opacity-60" />
              </button>
            ) : (
              <button
                onClick={onCloudSignIn}
                title={t.headerSignInTitle}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                <Cloud className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">{t.headerSync}</span>
              </button>
            )}
            {/* Language Switcher Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors whitespace-nowrap shrink-0 shadow-xs"
                aria-label={t.headerSelectLanguage}
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">{languageLabels[language].native}</span>
                <span className="sm:hidden">{languageLabels[language].code}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {(Object.keys(languageLabels) as Language[]).map((langKey) => (
                    <button
                      key={langKey}
                      onClick={() => {
                        onLanguageChange(langKey);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                        language === langKey
                          ? 'bg-brand-50 text-brand-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span>{languageLabels[langKey].native}</span>
                      <span className="text-slate-400 text-[10px] uppercase font-mono">
                        {languageLabels[langKey].code}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* In preview mode, do not show editor action buttons per user request */}
            {!isPreviewMode && (
              <button
                onClick={onOpenRulesSetting}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 group focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                title={t.headerRulesTitle}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-brand-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">{t.rulesLogicSetting}</span>
                <span className="sm:hidden">{t.headerRulesShort}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
