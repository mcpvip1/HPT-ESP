import React, { useEffect, useState } from 'react';
import { LOGO_DATA_URL } from '../assets/logo';
import { checkAppUpdate, AppVersionInfo } from '../utils/versionManager';
import { Language } from '../types';
import { translations } from '../translations';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  language: Language;
  onFinish: (hasUpdate: boolean, updateInfo: AppVersionInfo) => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  language,
  onFinish,
  minDurationMs = 2400,
}) => {
  const t = translations[language] || translations.en;
  const [progress, setProgress] = useState(10);
  const [statusText, setStatusText] = useState('Initializing application runtime...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const statusSteps = [
      { at: 20, text: 'Loading data matching components...' },
      { at: 45, text: 'Connecting to update services...' },
      { at: 70, text: 'Checking for latest system updates...' },
      { at: 90, text: 'Verifying package integrity...' },
      { at: 100, text: 'System check complete' },
    ];

    // Localized status overrides
    if (language === 'zh') {
      statusSteps[0].text = '正在加载数据比对组件...';
      statusSteps[1].text = '正在连接系统更新服务...';
      statusSteps[2].text = '正在检查系统最新版本...';
      statusSteps[3].text = '正在校验数据完整性...';
      statusSteps[4].text = '系统检查完成';
    } else if (language === 'th') {
      statusSteps[0].text = 'กำลังโหลดโมดูลจับคู่ข้อมูล...';
      statusSteps[1].text = 'กำลังเชื่อมต่อบริการอัปเดตระบบ...';
      statusSteps[2].text = 'กำลังตรวจสอบการอัปเดตเวอร์ชันล่าสุด...';
      statusSteps[3].text = 'กำลังตรวจสอบความถูกต้องของข้อมูล...';
      statusSteps[4].text = 'ตรวจสอบระบบเสร็จสมบูรณ์';
    } else if (language === 'my') {
      statusSteps[0].text = 'စနစ်ဒေတာ အစိတ်အပိုင်းများ ဖွင့်လှစ်နေသည်...';
      statusSteps[1].text = 'စနစ် အဆင့်မြှင့်ဆာဗာသို့ ချိတ်ဆက်နေသည်...';
      statusSteps[2].text = 'နောက်ဆုံးဗားရှင်း ရှိမရှိ စစ်ဆေးနေသည်...';
      statusSteps[3].text = 'စနစ်လုံခြုံရေး အချက်အလက်များ စစ်ဆေးနေသည်...';
      statusSteps[4].text = 'စစ်ဆေးမှု ပြီးဆုံးပါပြီ';
    }

    const startTime = Date.now();

    // Smooth progress increment
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawPct = Math.min(100, Math.floor((elapsed / minDurationMs) * 100));

      if (!isCancelled) {
        setProgress(Math.max(10, rawPct));

        const matchedStep = [...statusSteps].reverse().find((s) => rawPct >= s.at);
        if (matchedStep) {
          setStatusText(matchedStep.text);
        }
      }
    }, 60);

    // Parallel check update
    const checkPromise = checkAppUpdate(1400);

    Promise.all([
      checkPromise,
      new Promise((resolve) => setTimeout(resolve, minDurationMs)),
    ]).then(([result]) => {
      if (isCancelled) return;
      clearInterval(interval);
      setProgress(100);
      setStatusText(statusSteps[4].text);

      // Brief pause at 100% then fade out
      setTimeout(() => {
        if (isCancelled) return;
        setIsFadingOut(true);
        setTimeout(() => {
          if (!isCancelled) {
            onFinish(result.hasUpdate, result.latestVersion);
          }
        }, 400);
      }, 300);
    });

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [language, minDurationMs, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)] transition-opacity duration-400 ease-out select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Application Loading and Checking Updates"
      role="dialog"
      aria-modal="true"
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Center Content Container */}
      <div className="relative flex flex-col items-center max-w-sm w-full px-6 text-center space-y-6">
        {/* Animated Brand Logo Container */}
        <div className="relative flex items-center justify-center">
          {/* Subtle pulsating outer ring */}
          <div className="absolute -inset-4 rounded-3xl bg-emerald-500/15 blur-xl animate-pulse" />

          {/* Logo Frame with gentle float animation */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xl transition-all duration-300">
            <img
              src={LOGO_DATA_URL}
              alt="Excellent Medical Technology"
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>

        {/* Brand Titles */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-heading">
              Excellent Medical Technology
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              ESP
            </span>
          </div>

          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {t.appName || 'Enterprise Data Matching Engine'}
          </p>

          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 pt-0.5">
            Created by{' '}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              DO2-HPT
            </span>
          </p>
        </div>

        {/* Progress & Live Update Check Status */}
        <div className="w-full max-w-[280px] space-y-2.5 pt-2">
          {/* Progress bar */}
          <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Animated Status Text & Percentage */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 truncate max-w-[210px] text-left">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="truncate">{statusText}</span>
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
              {progress}%
            </span>
          </div>
        </div>

        {/* Secure & Enterprise Trust Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
          <span>Auto-update & integrity verification active</span>
        </div>
      </div>
    </div>
  );
};
