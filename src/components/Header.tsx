import React, { useState, useRef, useEffect } from 'react';
import { Globe, SlidersHorizontal, FileSpreadsheet } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single text element wordmark with icon */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <button
              onClick={() => {
                if (!isPreviewMode && onSelectStep) onSelectStep(1);
              }}
              className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 focus:outline-none"
            >
              ExcelMatch Pro
            </button>
          </div>

          {/* Zone 2: Mode Tag if in Preview */}
          {isPreviewMode && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span>Result Preview</span>
              <span className="hidden sm:inline text-slate-500 font-normal font-sans">
                (Read-Only Table View)
              </span>
            </div>
          )}

          {/* Zone 3: Language Selector & Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Language Switcher Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{languageLabels[language].native}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-lg bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {(Object.keys(languageLabels) as Language[]).map((langKey) => (
                    <button
                      key={langKey}
                      onClick={() => {
                        onLanguageChange(langKey);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                        language === langKey
                          ? 'bg-emerald-950/60 text-emerald-400 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{languageLabels[langKey].native}</span>
                      <span className="text-slate-500 text-[10px] uppercase font-mono">
                        {languageLabels[langKey].code}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* In preview mode, show Exit / Open Full App. Otherwise show Rules & Logic Setting */}
            {isPreviewMode ? (
              onExitPreview && (
                <button
                  onClick={onExitPreview}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-lg border border-slate-700 transition-all shadow-sm whitespace-nowrap shrink-0"
                  title="Exit live preview and return to full app editor"
                >
                  <span>Open Full App</span>
                </button>
              )
            ) : (
              <button
                onClick={onOpenRulesSetting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-all shadow-sm whitespace-nowrap shrink-0 group focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                title="Configure mapping keys and decision rules (saved permanently in browser)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">{t.rulesLogicSetting}</span>
                <span className="sm:hidden">Rules</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
