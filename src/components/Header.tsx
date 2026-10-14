import React, { useState, useRef, useEffect } from 'react';
import { Globe, Sparkles, FileSpreadsheet } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface HeaderProps {
  currentStep: 1 | 2 | 3;
  onSelectStep: (step: 1 | 2 | 3) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLoadSampleData: () => void;
  hasRefFile: boolean;
  hasCompFile: boolean;
  hasResults: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onSelectStep,
  language,
  onLanguageChange,
  onLoadSampleData,
  hasRefFile,
  hasCompFile,
  hasResults,
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
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <button
              onClick={() => onSelectStep(1)}
              className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 focus:outline-none"
            >
              ExcelMatch Pro
            </button>
          </div>

          {/* Zone 2: 3-zone clean navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onSelectStep(1)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                currentStep === 1
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {t.step1}
                {hasRefFile && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                )}
              </span>
            </button>

            <button
              onClick={() => onSelectStep(2)}
              disabled={!hasRefFile && !hasCompFile}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                currentStep === 2
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : !hasRefFile && !hasCompFile
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {t.step2}
              </span>
            </button>

            <button
              onClick={() => onSelectStep(3)}
              disabled={!hasResults}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                currentStep === 3
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : !hasResults
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {t.step3}
                {hasResults && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                )}
              </span>
            </button>
          </nav>

          {/* Zone 3: Language Selector & Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
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

            {/* Load Sample Data Button */}
            <button
              onClick={onLoadSampleData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition-all shadow-sm whitespace-nowrap shrink-0"
              title="Load realistic procurement dataset to test rules instantly"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{t.loadDemoData}</span>
              <span className="sm:hidden">Demo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
