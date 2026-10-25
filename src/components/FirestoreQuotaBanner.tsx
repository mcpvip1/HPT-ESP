import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, RefreshCw, X, ShieldCheck, Database } from 'lucide-react';
import { Language } from '../types';
import { firebaseConfig } from '../lib/firebase';
import { resetQuotaCircuitBreaker } from '../lib/cloudSync';

interface FirestoreQuotaBannerProps {
  language: Language;
  onRetry?: () => void;
}

export const FirestoreQuotaBanner: React.FC<FirestoreQuotaBannerProps> = ({
  language,
  onRetry,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const projectId = firebaseConfig.projectId || 'gen-lang-client-0015030647';
  const databaseId = firebaseConfig.firestoreDatabaseId || 'ai-studio-hptexcelmatcher-8cb9172d-5e94-4a50-b48b-9df246a87183';
  const upgradeUrl = `https://console.firebase.google.com/project/${projectId}/firestore/databases/${databaseId}/data?openUpgradeDialog=true`;

  const copy = {
    en: {
      title: 'Firestore Daily Write Quota Limit Reached',
      badge: 'Local Mode Active',
      desc: 'The Google Cloud Firestore free daily write units limit has been reached for this project. The app has safely switched to local IndexedDB mode.',
      safeNotice: 'All your workbooks, mapping rules, and matching results are safely preserved on your computer.',
      resetNotice: 'The daily free quota resets at midnight (Pacific Time).',
      upgradeBtn: 'Upgrade / Manage Database',
      pricingLink: 'View Spark Plan Quotas',
      retryBtn: 'Retry Connection',
      dismiss: 'Dismiss',
    },
    zh: {
      title: 'Firestore 每日写入配额已达上限',
      badge: '已启用本地存储模式',
      desc: '当前项目的 Google Cloud Firestore 免费每日写入配额已耗尽。应用已平滑切换至本地 IndexedDB 离线存储模式。',
      safeNotice: '您的所有工作簿、字段映射规则及比对决策结果均已安全保存在本地。',
      resetNotice: '免费每日配额将于午夜（太平洋时间）自动重置。',
      upgradeBtn: '升级 / 管理数据库',
      pricingLink: '查看 Spark 方案配额',
      retryBtn: '重试连接',
      dismiss: '关闭',
    },
    th: {
      title: 'โควตาการเขียนรายวันของ Firestore เต็มแล้ว',
      badge: 'เปิดใช้งานโหมดบันทึกในเครื่อง',
      desc: 'โควตาการเขียนฟรีรายวันของ Google Cloud Firestore สำหรับโปรเจกต์นี้เต็มแล้ว ระบบได้สลับมาใช้ IndexedDB ในเครื่องอย่างปลอดภัย',
      safeNotice: 'สมุดงาน กฎการจับคู่ และผลลัพธ์ทั้งหมดของคุณได้รับการบันทึกไว้อย่างปลอดภัยในเครื่อง',
      resetNotice: 'โควตาฟรีรายวันจะรีเซ็ตทุกเที่ยงคืน (เวลาแปซิฟิก)',
      upgradeBtn: 'อัปเกรด / จัดการฐานข้อมูล',
      pricingLink: 'ดูรายละเอียดโควตาแผน Spark',
      retryBtn: 'ลองเชื่อมต่อใหม่',
      dismiss: 'ปิด',
    },
    my: {
      title: 'Firestore နေ့စဉ် ရေးသားမှု ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
      badge: 'စက်တွင်း သိုလှောင်မှု စနစ်သို့ ပြောင်းထားသည်',
      desc: 'ဤပရောဂျက်အတွက် Google Cloud Firestore နေ့စဉ် အခမဲ့ ရေးသားမှု ကန့်သတ်ချက် ပြည့်သွားပါပြီ။ စနစ်သည် IndexedDB သို့ အလိုအလျောက် ပြောင်းလဲလိုက်ပါပြီ။',
      safeNotice: 'သင့်ဖိုင်များ၊ စစ်ဆေးမှု စည်းမျဉ်းများနှင့် ရလဒ်များအားလုံးကို သင့်ကွန်ပျူတာထဲတွင် လုံခြုံစွာ သိမ်းဆည်းထားပါသည်။',
      resetNotice: 'နေ့စဉ် အခမဲ့ ကန့်သတ်ချက်သည် ညသန်းခေါင်တွင် အလိုအလျောက် ပြန်လည်စတင်ပါမည်။',
      upgradeBtn: 'ဒေတာဘေ့စ် အဆင့်မြှင့်မည်',
      pricingLink: 'Spark Plan အချက်အလက် ကြည့်ရန်',
      retryBtn: 'ပြန်လည် စမ်းသပ်မည်',
      dismiss: 'ပိတ်မည်',
    },
  }[language] || {
    title: 'Firestore Daily Write Quota Limit Reached',
    badge: 'Local Mode Active',
    desc: 'The Google Cloud Firestore free daily write units limit has been reached for this project. The app has safely switched to local IndexedDB mode.',
    safeNotice: 'All your workbooks, mapping rules, and matching results are safely preserved on your computer.',
    resetNotice: 'The daily free quota resets at midnight (Pacific Time).',
    upgradeBtn: 'Upgrade / Manage Database',
    pricingLink: 'View Spark Plan Quotas',
    retryBtn: 'Retry Connection',
    dismiss: 'Dismiss',
  };

  const handleRetry = () => {
    resetQuotaCircuitBreaker();
    if (onRetry) onRetry();
  };

  return (
    <div className="w-full bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/80 px-4 py-3 sm:px-6 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Icon & Description */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700/80 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0 mt-0.5 shadow-2xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200">
                {copy.title}
              </h4>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60">
                {copy.badge}
              </span>
            </div>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              {copy.desc} {copy.safeNotice} <span className="text-amber-700 dark:text-amber-400 font-medium">{copy.resetNotice}</span>
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {/* Direct upgrade link formatted according to Firebase skill requirements */}
          <a
            href={upgradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 shadow-xs hover:shadow-sm transition-all"
            title="Open Firebase Console to upgrade or configure quota"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{copy.upgradeBtn}</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          {/* Pricing link */}
          <a
            href="https://firebase.google.com/pricing#cloud-firestore"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          >
            <span>{copy.pricingLink}</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Retry Connection */}
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
            title="Retry cloud connection"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">{copy.retryBtn}</span>
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-200/60 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
            aria-label={copy.dismiss}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
