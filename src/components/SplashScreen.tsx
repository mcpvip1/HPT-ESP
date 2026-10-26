import React from 'react';
import { LOGO_DATA_URL } from '../assets/logo';
import { Language } from '../types';
import { translations } from '../translations';
import { ShieldCheck, AlertTriangle, RotateCcw, ArrowRight } from 'lucide-react';

/**
 * Professional startup splash: every line on screen reflects a real event.
 * App owns the sequence (update check -> local scan -> cloud download ->
 * apply) and passes its live state here; this component only renders it.
 * Nothing here is timer-animated: the bar moves when a phase moves, and
 * the download bar shows the real column being downloaded and its percent.
 */
export type SplashPhase =
  | 'checking-update'
  | 'update-found'
  | 'up-to-date'
  | 'scanning'
  | 'downloading'
  | 'found-missing'
  | 'uploading'
  | 'applying'
  | 'complete'
  | 'error';

export interface SplashSyncState {
  phase: SplashPhase;
  /** Overall 0-100 for the main bar (event-driven, never timer-animated). */
  percent: number;
  messageKey: keyof typeof splashCopy.en;
  /** Current download item label (downloading phase). */
  downloadItem?: string;
  /** 0-100 within the download phase. */
  downloadPercent?: number;
  downloadDone?: number;
  downloadTotal?: number;
  /** Labels of cloud columns that failed to download (error phase). */
  failedItems?: string[];
}

interface SplashScreenProps {
  language: Language;
  syncState: SplashSyncState;
  onRetry: () => void;
  onContinueLocal: () => void;
}

export const splashCopy = {
  en: {
    checkingUpdate: 'Checking update now…',
    updateFound: 'Update found',
    upToDate: "You're up to date",
    scanning: 'Scanning local data…',
    downloading: 'Downloading {item}… {pct}%',
    foundMissing: 'Found missing data, syncing from cloud now. Please wait.',
    uploading: 'Uploading local data to cloud…',
    applying: 'Applying downloaded data…',
    scanComplete: 'Scan complete.',
    syncComplete: 'Sync complete.',
    continuedLocal: 'Continuing with local data.',
    cloudError: "Couldn't sync with cloud",
    cloudErrorDesc:
      'Some items could not be downloaded. Your local data is safe. Retry the download, or continue with local data only.',
    failedItems: 'Failed items:',
    retry: 'Retry',
    continueLocal: 'Continue with local data',
    downloadingFromCloud: 'Downloading from cloud',
    ofItems: 'of {total} items',
  },
  zh: {
    checkingUpdate: '正在检查更新…',
    updateFound: '发现新版本',
    upToDate: '已是最新版本',
    scanning: '正在扫描本地数据…',
    downloading: '正在下载{item}…{pct}%',
    foundMissing: '发现缺失数据，正在从云端同步，请稍候。',
    uploading: '正在将本地数据上传到云端…',
    applying: '正在应用下载的数据…',
    scanComplete: '扫描完成。',
    syncComplete: '同步完成。',
    continuedLocal: '将继续使用本地数据。',
    cloudError: '无法与云端同步',
    cloudErrorDesc: '部分内容下载失败。您的本地数据是安全的。您可以重试下载，或仅使用本地数据继续。',
    failedItems: '失败项目：',
    retry: '重试',
    continueLocal: '仅使用本地数据继续',
    downloadingFromCloud: '正在从云端下载',
    ofItems: '共 {total} 项',
  },
  th: {
    checkingUpdate: 'กำลังตรวจสอบการอัปเดต…',
    updateFound: 'พบการอัปเดต',
    upToDate: 'คุณใช้เวอร์ชันล่าสุดแล้ว',
    scanning: 'กำลังสแกนข้อมูลในเครื่อง…',
    downloading: 'กำลังดาวน์โหลด {item}… {pct}%',
    foundMissing: 'พบข้อมูลที่ขาดหาย กำลังซิงก์จากคลาวด์ โปรดรอสักครู่',
    uploading: 'กำลังอัปโหลดข้อมูลในเครื่องไปยังคลาวด์…',
    applying: 'กำลังนำข้อมูลที่ดาวน์โหลดมาใช้…',
    scanComplete: 'สแกนเสร็จสมบูรณ์',
    syncComplete: 'ซิงก์เสร็จสมบูรณ์',
    continuedLocal: 'ดำเนินการต่อด้วยข้อมูลในเครื่อง',
    cloudError: 'ไม่สามารถซิงก์กับคลาวด์ได้',
    cloudErrorDesc:
      'บางรายการดาวน์โหลดไม่สำเร็จ ข้อมูลในเครื่องของคุณปลอดภัย ลองดาวน์โหลดอีกครั้ง หรือดำเนินการต่อด้วยข้อมูลในเครื่องเท่านั้น',
    failedItems: 'รายการที่ล้มเหลว:',
    retry: 'ลองอีกครั้ง',
    continueLocal: 'ดำเนินการต่อด้วยข้อมูลในเครื่อง',
    downloadingFromCloud: 'กำลังดาวน์โหลดจากคลาวด์',
    ofItems: 'จากทั้งหมด {total} รายการ',
  },
  my: {
    checkingUpdate: 'အပ်ဒိတ်ကို စစ်ဆေးနေသည်…',
    updateFound: 'အပ်ဒိတ်တွေ့ရှိသည်',
    upToDate: 'နောက်ဆုံးဗားရှင်းကို အသုံးပြုနေပါသည်',
    scanning: 'ဒေသခံဒေတာကို စကင်ဖတ်နေသည်…',
    downloading: '{item} ကို ဒေါင်းလုဒ်လုပ်နေသည်… {pct}%',
    foundMissing: 'ပျောက်နေသောဒေတာတွေ့ရှိသည်၊ cloud မှ sync လုပ်နေသည်။ ခဏစောင့်ပါ။',
    uploading: 'ဒေသခံဒေတာကို cloud သို့ တင်နေသည်…',
    applying: 'ဒေါင်းလုဒ်လုပ်ထားသောဒေတာကို အသုံးပြုနေသည်…',
    scanComplete: 'စကင်ဖတ်ခြင်း ပြီးမြောက်သည်။',
    syncComplete: 'Sync လုပ်ခြင်း ပြီးမြောက်သည်။',
    continuedLocal: 'ဒေသခံဒေတာဖြင့်သာ ဆက်လက်လုပ်ဆောင်မည်။',
    cloudError: 'Cloud နှင့် sync လုပ်၍မရပါ',
    cloudErrorDesc:
      'အချို့အရာများကို ဒေါင်းလုဒ်၍မရပါ။ သင့်ဒေသခံဒေတာသည် လုံခြုံပါသည်။ ပြန်လည်ကြိုးစားပါ၊ သို့မဟုတ် ဒေသခံဒေတာဖြင့်သာ ဆက်လက်လုပ်ဆောင်ပါ။',
    failedItems: 'မအောင်မြင်သောအရာများ:',
    retry: 'ပြန်လည်ကြိုးစားမည်',
    continueLocal: 'ဒေသခံဒေတာဖြင့်သာ ဆက်လုပ်မည်',
    downloadingFromCloud: 'Cloud မှ ဒေါင်းလုဒ်လုပ်နေသည်',
    ofItems: 'စုစုပေါင်း {total} ခု',
  },
} as const;

export const SplashScreen: React.FC<SplashScreenProps> = ({
  language,
  syncState,
  onRetry,
  onContinueLocal,
}) => {
  const t = translations[language] || translations.en;
  const copy = splashCopy[language] || splashCopy.en;
  const isError = syncState.phase === 'error';
  const isDownloading = syncState.phase === 'downloading';

  const message = copy[syncState.messageKey]
    .replace('{item}', syncState.downloadItem || '')
    .replace('{pct}', String(syncState.downloadPercent ?? 0));

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)] select-none"
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

        {/* Progress & Live Status */}
        <div className="w-full max-w-[280px] space-y-2.5 pt-2">
          {/* Progress bar */}
          <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                isError
                  ? 'bg-gradient-to-r from-rose-500 to-red-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
              }`}
              style={{ width: `${syncState.percent}%` }}
            />
          </div>

          {/* Live Status Text & Percentage */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 truncate max-w-[210px] text-left">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isError ? 'bg-rose-500' : 'bg-emerald-500 animate-ping'
                }`}
              />
              <span className="truncate">{message}</span>
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
              {syncState.percent}%
            </span>
          </div>

          {/* Real download progress: what is downloading, and how far along */}
          {isDownloading && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 py-2.5 text-left space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {copy.downloadingFromCloud}
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                  {syncState.downloadPercent ?? 0}%
                </span>
              </div>
              <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${syncState.downloadPercent ?? 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="truncate">{syncState.downloadItem}</span>
                {typeof syncState.downloadDone === 'number' &&
                  typeof syncState.downloadTotal === 'number' && (
                    <span className="shrink-0 tabular-nums">
                      {syncState.downloadDone} {copy.ofItems.replace('{total}', String(syncState.downloadTotal))}
                    </span>
                  )}
              </div>
            </div>
          )}

          {/* Error: what failed, and the choice to retry or continue local-only */}
          {isError && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 px-3 py-3 text-left space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    {copy.cloudError}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                    {copy.cloudErrorDesc}
                  </p>
                </div>
              </div>
              {syncState.failedItems && syncState.failedItems.length > 0 && (
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">{copy.failedItems}</span>{' '}
                  {syncState.failedItems.join(', ')}
                </p>
              )}
              <div className="flex gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {copy.retry}
                </button>
                <button
                  type="button"
                  onClick={onContinueLocal}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                >
                  {copy.continueLocal}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
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
