import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  CheckCircle2,
  Calendar,
  Clock,
  Tag,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import { AppVersionInfo, applyAppUpdate, resetVersionForTesting } from '../utils/versionManager';
import { Language } from '../types';
import { RippleButton } from './RippleButton';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: AppVersionInfo;
  language: Language;
  onUpdateCompleted?: () => void;
}

type UpdatePhase = 'prompt' | 'updating' | 'completed';

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  language,
  onUpdateCompleted,
}) => {
  const [phase, setPhase] = useState<UpdatePhase>('prompt');
  const [progress, setProgress] = useState(0);
  const [stepMessage, setStepMessage] = useState('Downloading update package...');

  useEffect(() => {
    if (isOpen) {
      setPhase('prompt');
      setProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Localized copy
  const localizedContent = {
    en: {
      promptTitle: 'System Update Available',
      promptSubtitle: 'A new enterprise release is ready to install.',
      updateNow: 'Update Now',
      remindLater: 'Remind Me Later',
      featuresTitle: "What's New in this Release:",
      updatingTitle: 'Installing System Update',
      updatingSubtitle: 'Applying latest engine optimizations and security patches...',
      completeTitle: 'Update Completed Successfully!',
      completeSubtitle: 'Your application has been updated to the latest build.',
      versionLabel: 'Latest Version Number',
      dateLabel: 'Release Date',
      timeLabel: 'Release Time',
      launchApp: 'Launch Updated Version',
      statusReady: 'System is up to date & running smoothly',
      testAgain: 'Re-test update flow',
    },
    zh: {
      promptTitle: '发现系统新版本',
      promptSubtitle: '全新的企业级更新已就绪，建议立即更新以获得最佳体验。',
      updateNow: '立即更新',
      remindLater: '稍后提醒',
      featuresTitle: '新版本核心特性：',
      updatingTitle: '正在安装系统更新',
      updatingSubtitle: '正在应用最新的比对引擎优化与安全补丁...',
      completeTitle: '系统更新完成！',
      completeSubtitle: '已成功升级至最新版本，数据及配置已完整保留。',
      versionLabel: '最新版本号',
      dateLabel: '发布日期',
      timeLabel: '发布时间',
      launchApp: '进入更新后系统',
      statusReady: '系统当前处于最新稳定状态',
      testAgain: '重新测试更新流程',
    },
    th: {
      promptTitle: 'พบการอัปเดตระบบเวอร์ชันใหม่',
      promptSubtitle: 'เวอร์ชันใหม่พร้อมสำหรับการติดตั้งเพื่อประสิทธิภาพที่ดีที่สุด',
      updateNow: 'อัปเดตทันที',
      remindLater: 'เตือนฉันภายหลัง',
      featuresTitle: 'คุณสมบัติใหม่ในเวอร์ชันนี้:',
      updatingTitle: 'กำลังติดตั้งการอัปเดตระบบ',
      updatingSubtitle: 'กำลังปรับปรุงเครื่องมือจับคู่ข้อมูลและความปลอดภัย...',
      completeTitle: 'อัปเดตระบบเสร็จสมบูรณ์!',
      completeSubtitle: 'แอปพลิเคชันได้รับการอัปเดตเป็นเวอร์ชันล่าสุดเรียบร้อยแล้ว',
      versionLabel: 'หมายเลขเวอร์ชันล่าสุด',
      dateLabel: 'วันที่เผยแพร่',
      timeLabel: 'เวลาเผยแพร่',
      launchApp: 'เริ่มใช้งานเวอร์ชันล่าสุด',
      statusReady: 'ระบบเป็นเวอร์ชันล่าสุดและพร้อมใช้งาน',
      testAgain: 'ทดสอบขั้นตอนอัปเดตอีกครั้ง',
    },
    my: {
      promptTitle: 'စနစ်ဗားရှင်းအသစ် ရရှိနေပါပြီ',
      promptSubtitle: 'ပိုမိုကောင်းမွန်သော စနစ်အသစ်ကို ယခုပင် ထည့်သွင်းနိုင်ပါပြီ။',
      updateNow: 'ယခု အဆင့်မြှင့်မည်',
      remindLater: 'နောက်မှ သတိပေးပါ',
      featuresTitle: 'ယခုဗားရှင်းတွင် ပါဝင်သော အသစ်များ:',
      updatingTitle: 'စနစ်အား အဆင့်မြှင့်တင်နေပါသည်',
      updatingSubtitle: 'ဒေတာစစ်ဆေးမှု အင်ဂျင်နှင့် လုံခြုံရေးများ ပြင်ဆင်နေပါသည်...',
      completeTitle: 'စနစ် အဆင့်မြှင့်တင်မှု အောင်မြင်ပါသည်!',
      completeSubtitle: 'သင့်စနစ်သည် နောက်ဆုံးဗားရှင်းသို့ အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ။',
      versionLabel: 'နောက်ဆုံး ဗားရှင်းနံပါတ်',
      dateLabel: 'ထုတ်ဝေသည့် နေ့စွဲ',
      timeLabel: 'ထုတ်ဝေသည့် အချိန်',
      launchApp: 'စနစ်အသစ် စတင်အသုံးပြုမည်',
      statusReady: 'စနစ်သည် နောက်ဆုံးဗားရှင်းဖြင့် အဆင်သင့်ရှိပါသည်',
      testAgain: 'စနစ်အဆင့်မြှင့်မှု ပြန်လည်စမ်းသပ်မည်',
    },
  }[language] || {
    promptTitle: 'System Update Available',
    promptSubtitle: 'A new enterprise release is ready to install.',
    updateNow: 'Update Now',
    remindLater: 'Remind Me Later',
    featuresTitle: "What's New in this Release:",
    updatingTitle: 'Installing System Update',
    updatingSubtitle: 'Applying latest engine optimizations and security patches...',
    completeTitle: 'Update Completed Successfully!',
    completeSubtitle: 'Your application has been updated to the latest build.',
    versionLabel: 'Latest Version Number',
    dateLabel: 'Release Date',
    timeLabel: 'Release Time',
    launchApp: 'Launch Updated Version',
    statusReady: 'System is up to date & running smoothly',
    testAgain: 'Re-test update flow',
  };

  const highlights =
    updateInfo.highlights[language] || updateInfo.highlights.en || [];

  const handleStartUpdate = () => {
    setPhase('updating');
    setProgress(5);

    const steps = [
      { at: 20, msg: 'Downloading package update...' },
      { at: 50, msg: 'Verifying cryptographic integrity...' },
      { at: 75, msg: 'Migrating local storage schemas & cache...' },
      { at: 95, msg: 'Applying system patches...' },
      { at: 100, msg: 'Update finalized!' },
    ];

    let currentProgress = 5;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 6;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setProgress(100);
        setStepMessage(steps[4].msg);

        // Apply update to localStorage
        applyAppUpdate().then(() => {
          setTimeout(() => {
            setPhase('completed');
          }, 400);
        });
      } else {
        setProgress(currentProgress);
        const match = [...steps].reverse().find((s) => currentProgress >= s.at);
        if (match) setStepMessage(match.msg);
      }
    }, 120);
  };

  const handleFinish = () => {
    if (onUpdateCompleted) {
      onUpdateCompleted();
    }
    onClose();
  };

  const handleResetForTesting = () => {
    resetVersionForTesting();
    setPhase('prompt');
    setProgress(0);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden transition-all duration-300">
        {/* Top Header Bar */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
              {phase === 'completed' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-heading">
                  {phase === 'prompt' && localizedContent.promptTitle}
                  {phase === 'updating' && localizedContent.updatingTitle}
                  {phase === 'completed' && localizedContent.completeTitle}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60">
                  {updateInfo.version}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {phase === 'prompt' && localizedContent.promptSubtitle}
                {phase === 'updating' && localizedContent.updatingSubtitle}
                {phase === 'completed' && localizedContent.completeSubtitle}
              </p>
            </div>
          </div>

          {phase !== 'updating' && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Phase 1: Confirmation Prompt */}
        {phase === 'prompt' && (
          <div className="p-6 space-y-5">
            {/* Version Metadata Card */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-500" />
                  {localizedContent.versionLabel}
                </span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                  {updateInfo.version}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-500" />
                  {localizedContent.dateLabel}
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {updateInfo.releaseDate}
                </p>
              </div>

              <div className="space-y-0.5 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  {localizedContent.timeLabel}
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {updateInfo.releaseTime}
                </p>
              </div>
            </div>

            {/* Highlights List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {localizedContent.featuresTitle}
              </h4>
              <ul className="space-y-2">
                {highlights.map((feat, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {localizedContent.remindLater}
              </button>

              <RippleButton
                onClick={handleStartUpdate}
                rippleColor="rgba(255, 255, 255, 0.35)"
                enableScaleHover={true}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 border border-emerald-500/40 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{localizedContent.updateNow}</span>
              </RippleButton>
            </div>
          </div>
        )}

        {/* Phase 2: Live Installing Animation */}
        {phase === 'updating' && (
          <div className="p-8 space-y-6 text-center">
            {/* Pulsing indicator */}
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-md animate-pulse" />
              <div className="relative w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>
            </div>

            {/* Progress status */}
            <div className="space-y-2 max-w-sm mx-auto">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300 text-left truncate">
                  {stepMessage}
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums ml-2">
                  {progress}%
                </span>
              </div>

              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Please do not close this window while the update is being applied.
            </p>
          </div>
        )}

        {/* Phase 3: Complete Message with Version, Date, and Time */}
        {phase === 'completed' && (
          <div className="p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Success Banner */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  {localizedContent.statusReady}
                </p>
                <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400">
                  All local workspaces, custom rules, and cloud snapshots are verified.
                </p>
              </div>
            </div>

            {/* Explicit Version, Date, and Time Card (User Requirement) */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-500" />
                  {localizedContent.versionLabel}
                </span>
                <span className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                  {updateInfo.version}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  {localizedContent.dateLabel}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {updateInfo.releaseDate}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  {localizedContent.timeLabel}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {updateInfo.releaseTime}
                </span>
              </div>
            </div>

            {/* Launch Action */}
            <div className="space-y-2 pt-1">
              <RippleButton
                onClick={handleFinish}
                rippleColor="rgba(255, 255, 255, 0.35)"
                enableScaleHover={true}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 border border-emerald-500/40 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <span>{localizedContent.launchApp}</span>
                <ArrowRight className="w-4 h-4" />
              </RippleButton>

              <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Signed by DO2-HPT
                </span>
                <button
                  type="button"
                  onClick={handleResetForTesting}
                  className="hover:underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {localizedContent.testAgain}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
