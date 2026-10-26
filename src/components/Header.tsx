import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  SlidersHorizontal,
  Cloud,
  Database,
  LogOut,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { LOGO_DATA_URL } from '../assets/logo';
import { CountryFlag } from './CountryFlag';
import type { User } from '@supabase/supabase-js';
import { Language } from '../types';
import { translations } from '../translations';
import { SyncProgressIndicator } from './SyncProgressIndicator';

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
  supabaseUser?: User | null;
  isSupabaseConnected?: boolean;
  onOpenSupabaseConfig?: () => void;
  onOpenSyncHistory?: () => void;
  onSupabaseSignOut?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onCheckForUpdates?: () => void;
  currentVersion?: string;
  currentBuildTime?: string;
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
  supabaseUser,
  isSupabaseConnected,
  onOpenSupabaseConfig,
  onOpenSyncHistory,
  onSupabaseSignOut,
  theme = 'light',
  onToggleTheme,
  onCheckForUpdates,
  currentVersion,
  currentBuildTime,
}) => {
  const t = translations[language];
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  // Sync & Config buttons stay hidden until the logo is triple-clicked
  // (toggles back off on the next triple-click). Session-only: every fresh
  // open starts hidden again.
  const [advancedVisible, setAdvancedVisible] = useState(false);
  const logoClicksRef = useRef({ count: 0, lastTime: 0 });
  const handleLogoClick = () => {
    if (onSelectStep) onSelectStep(1);
    const now = Date.now();
    const clicks = logoClicksRef.current;
    clicks.count = now - clicks.lastTime > 800 ? 1 : clicks.count + 1;
    clicks.lastTime = now;
    if (clicks.count >= 3) {
      clicks.count = 0;
      setAdvancedVisible((v) => !v);
    }
  };
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
              onClick={handleLogoClick}
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
                <span
                  className="text-[10px] font-mono font-medium text-[var(--text-muted)] tracking-wide"
                  title={
                    currentBuildTime
                      ? `Build ${currentVersion || 'dev'} · ${currentBuildTime}`
                      : `Build ${currentVersion || 'dev'}`
                  }
                >
                  Build: {currentVersion || 'dev'}
                </span>
              </span>
            </button>
          </div>

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

            {/* Check for Updates Button */}
            {onCheckForUpdates && (
              <button
                onClick={onCheckForUpdates}
                title={`System Updates (Current build: ${currentVersion || 'dev'})`}
                className="tbtn tbtn--neutral hover:!border-emerald-300 hover:!text-emerald-600 !h-9 !px-2.5 sm:!px-3"
              >
                <span className="tbtn__icon">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </span>
                <span className="hidden sm:inline">Updates</span>
              </button>
            )}

            {/* Restore Original Stage Button */}
            {onOpenRestoreConfirm && (
              <button
                onClick={onOpenRestoreConfirm}
                title="Restore original stage - Clears all history, files, and data"
                className="tbtn tbtn--neutral hover:!border-rose-300 hover:!text-rose-600 !h-9 !px-3"
              >
                <span className="tbtn__icon">
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                </span>
                <span className="hidden sm:inline">Restore Stage</span>
                <span className="sm:hidden">Restore</span>
              </button>
            )}

            {/* Live Upload & Sync Progress Widget (hidden until logo triple-click) */}
            {advancedVisible && onOpenSyncHistory && (
              <SyncProgressIndicator
                onOpenHistory={onOpenSyncHistory}
                isSupabaseConnected={Boolean(isSupabaseConnected)}
              />
            )}

            {/* Supabase Cloud Sync settings & status button (hidden until logo triple-click) */}
            {advancedVisible && onOpenSupabaseConfig && (
              <button
                type="button"
                onClick={onOpenSupabaseConfig}
                title={isSupabaseConnected ? 'Supabase Settings & Diagnostics' : 'Configure Supabase Cloud Database'}
                className={`flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isSupabaseConnected
                    ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="hidden sm:inline">
                  {isSupabaseConnected ? 'Config' : 'Connect Supabase'}
                </span>
                <span className="sm:hidden">DB</span>
              </button>
            )}

            {/* Supabase Authenticated User / Sign-Out */}
            {supabaseUser && onSupabaseSignOut && (
              <button
                onClick={onSupabaseSignOut}
                title={`Signed in as ${supabaseUser.email || 'Supabase User'}. Click to sign out.`}
                className="tbtn tbtn--excel !h-9 !px-3"
              >
                <span className="tbtn__icon">
                  <Cloud className="w-3.5 h-3.5" />
                </span>
                <span className="hidden sm:inline text-xs truncate max-w-[120px]">
                  {supabaseUser.email?.split('@')[0] || 'Synced'}
                </span>
                <LogOut className="w-3 h-3 opacity-60 ml-0.5" />
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

            {/* Rules & Logic Settings Button */}
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
          </div>
        </div>
      </div>
    </header>
  );
};
