import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  SlidersHorizontal,
  Cloud,
  CloudUpload,
  LogOut,
  RotateCcw,
  Sun,
  Moon,
  ShieldAlert,
} from 'lucide-react';
import { LOGO_DATA_URL } from '../assets/logo';
import { ProgressRing } from './ProgressRing';
import { CountryFlag, GoogleIcon } from './CountryFlag';
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
  onOpenRestoreConfirm?: () => void;
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
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onSelectStep,
  language,
  onLanguageChange,
  onOpenRulesSetting,
  onOpenRestoreConfirm,
  hasRefFile,
  hasResults,
  isPreviewMode,
  onExitPreview,
  cloudUser,
  onCloudSignIn,
  onCloudSignOut,
  activeUpload,
  onOpenSyncPanel,
  theme = 'light',
  onToggleTheme,
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
    <header className="sticky top-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border-b border-[var(--border)] shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 sm:gap-6 h-16">
          {/* Brand: Excellent Medical Technology logo + name + creator */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                if (!isPreviewMode && onSelectStep) onSelectStep(1);
              }}
              className="flex items-center gap-2 sm:gap-2.5 min-w-0 focus:outline-none group cursor-pointer text-left"
              title="Excellent Medical Technology ESP"
            >
              <img
                src={LOGO_DATA_URL}
                alt="Excellent Medical Technology"
                className="h-9 sm:h-10 w-auto shrink-0"
              />
              <span className="hidden md:flex flex-col items-start leading-tight min-w-0">
                <span className="text-[13px] font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                  Excellent Medical Technology <span className="text-[var(--accent)]">ESP</span>
                </span>
                <span className="text-[10px] font-medium text-[var(--text-muted)] tracking-wide">
                  Created by <span className="font-bold text-[var(--accent)]">DO2-HPT</span>
                </span>
              </span>
            </button>
          </div>

          {/* Mode Tag if in Preview */}
          {isPreviewMode && (
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-lg bg-[var(--success-soft)] border border-[var(--success-border)] text-xs font-semibold text-[var(--success)] min-w-0">
              <span className="pulse-dot shrink-0" />
              <span className="hidden min-[420px]:inline truncate">{t.headerResultPreview}</span>
              <span className="hidden sm:inline text-[var(--text-muted)] font-normal">
                {t.headerLiveTable}
              </span>
            </div>
          )}

          {/* Language Selector, Theme Switcher & Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="tbtn tbtn--neutral !h-9 !px-2.5"
                aria-label="Toggle theme"
              >
                <span className="tbtn__icon">
                  {theme === 'dark' ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  )}
                </span>
                <span className="hidden md:inline text-xs font-semibold">
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>
            )}

            {/* Restore Original Stage Button */}
            {!isPreviewMode && onOpenRestoreConfirm && (
              <button
                onClick={onOpenRestoreConfirm}
                title="Restore original stage - Clears all history, files, and data from cloud and local database"
                className="tbtn tbtn--neutral hover:!border-rose-300 hover:!text-rose-600 !h-9 !px-3"
              >
                <span className="tbtn__icon">
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                </span>
                <span className="hidden sm:inline">Restore Stage</span>
                <span className="sm:hidden">Restore</span>
              </button>
            )}

            {/* Cloud sync upload status: animated arrow while uploading, opens status & history */}
            {cloudUser && onOpenSyncPanel && (
              <button
                onClick={onOpenSyncPanel}
                title={t.syncPanelTitle}
                className="tbtn tbtn--upload !h-9 !px-3"
              >
                <span className="tbtn__icon">
                  {activeUpload ? (
                    <ProgressRing
                      pct={activeUpload.total > 0 ? Math.round((activeUpload.done / activeUpload.total) * 100) : null}
                      size={18}
                    />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5" />
                  )}
                </span>
                {activeUpload ? (
                  <span className="font-mono text-xs font-bold tabular-nums">
                    {activeUpload.total > 0 ? `${Math.round((activeUpload.done / activeUpload.total) * 100)}%` : '…'}
                  </span>
                ) : (
                  <span className="hidden sm:inline text-xs">{t.syncAllSynced}</span>
                )}
              </button>
            )}

            {/* Cloud sync: sign in with Google to share rules & live preview across devices */}
            {cloudUser ? (
              <button
                onClick={onCloudSignOut}
                title={t.headerSignedInTitle.replace('{email}', cloudUser.email || t.headerGoogleUser)}
                className="tbtn tbtn--excel !h-9 !px-3"
              >
                <span className="tbtn__icon">
                  <Cloud className="w-3.5 h-3.5" />
                </span>
                <span className="hidden sm:inline text-xs">{t.headerSynced}</span>
                <LogOut className="w-3 h-3 opacity-60 ml-0.5" />
              </button>
            ) : (
              <button
                onClick={onCloudSignIn}
                title={t.headerSignInTitle}
                className="tbtn tbtn--print !h-9 !px-3"
              >
                <span className="tbtn__icon">
                  <GoogleIcon className="w-3.5 h-3.5" />
                </span>
                <span className="hidden sm:inline text-xs">{t.headerSync}</span>
              </button>
            )}

            {/* Language Switcher Dropdown with Country Flag */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="tbtn tbtn--neutral !h-9 !px-2.5"
                aria-label={t.headerSelectLanguage}
              >
                <CountryFlag language={language} className="w-4 h-3 rounded-xs shadow-2xs" />
                <span className="hidden sm:inline text-xs font-semibold">{languageLabels[language].native}</span>
                <span className="sm:hidden text-xs font-mono font-bold">{languageLabels[language].code}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {(Object.keys(languageLabels) as Language[]).map((langKey) => (
                    <button
                      key={langKey}
                      onClick={() => {
                        onLanguageChange(langKey);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                        language === langKey
                          ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-tx)] font-bold'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-soft)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <CountryFlag language={langKey} className="w-4 h-3 rounded-xs shadow-2xs" />
                        <span>{languageLabels[langKey].native}</span>
                      </span>
                      <span className="text-[var(--text-muted)] text-[10px] uppercase font-mono font-bold">
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
                className="tbtn tbtn--primary !h-9 !px-3.5"
                title={t.headerRulesTitle}
              >
                <span className="tbtn__icon">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </span>
                <span className="hidden sm:inline text-xs">{t.rulesLogicSetting}</span>
                <span className="sm:hidden text-xs">{t.headerRulesShort}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
