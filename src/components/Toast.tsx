import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  language?: Language;
}

const styles: Record<
  ToastMessage['type'],
  { bar: string; iconWrap: string; progress: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    bar: 'bg-brand-500',
    iconWrap: 'bg-brand-100 text-brand-600',
    progress: 'bg-brand-500',
    Icon: CheckCircle2,
  },
  error: {
    bar: 'bg-rose-500',
    iconWrap: 'bg-rose-100 text-rose-600',
    progress: 'bg-rose-500',
    Icon: AlertCircle,
  },
  info: {
    bar: 'bg-sky-500',
    iconWrap: 'bg-sky-100 text-sky-600',
    progress: 'bg-sky-500',
    Icon: Info,
  },
};

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss, language = 'en' }) => {
  const t = translations[language];
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100%-2.5rem)] pointer-events-none">
      {toasts.map((toast) => {
        const s = styles[toast.type];
        const Icon = s.Icon;
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto relative overflow-hidden flex items-center gap-3 pl-4 pr-2.5 py-3 rounded-xl bg-white border border-slate-200/80 shadow-xl shadow-slate-900/[0.08] animate-[toast-slide-in_0.28s_cubic-bezier(0.21,1.02,0.73,1)]"
          >
            <span className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar}`} aria-hidden="true" />
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${s.iconWrap}`}
              aria-hidden="true"
            >
              <Icon className="w-4 h-4" />
            </span>
            <p className="flex-1 min-w-0 text-[13px] font-medium leading-snug text-slate-800">
              {toast.text}
            </p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label={t.toastDismiss}
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <span
              className={`absolute bottom-0 left-0 h-[3px] ${s.progress} animate-[toast-progress_4.5s_linear_forwards]`}
              aria-hidden="true"
            />
          </div>
        );
      })}
    </div>
  );
};
