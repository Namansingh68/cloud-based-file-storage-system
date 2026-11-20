import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  const getIconAndStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
          borderColor: 'border-emerald-500/30 dark:border-emerald-500/40',
          bgColor: 'bg-white dark:bg-slate-900',
          textColor: 'text-slate-900 dark:text-white',
          glow: 'shadow-emerald-500/10'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
          borderColor: 'border-rose-500/30 dark:border-rose-500/40',
          bgColor: 'bg-white dark:bg-slate-900',
          textColor: 'text-slate-900 dark:text-white',
          glow: 'shadow-rose-500/10'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
          borderColor: 'border-amber-500/30 dark:border-amber-500/40',
          bgColor: 'bg-white dark:bg-slate-900',
          textColor: 'text-slate-900 dark:text-white',
          glow: 'shadow-amber-500/10'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-4 h-4 text-brand-500 shrink-0" />,
          borderColor: 'border-brand-500/30 dark:border-brand-500/40',
          bgColor: 'bg-white dark:bg-slate-900',
          textColor: 'text-slate-900 dark:text-white',
          glow: 'shadow-brand-500/10'
        };
    }
  };

  const style = getIconAndStyle();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm pointer-events-none animate-slide-up">
      <div
        className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border ${style.borderColor} ${style.bgColor} shadow-xl ${style.glow} backdrop-blur-md transition-all`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {style.icon}
          <p className={`text-xs font-semibold ${style.textColor} truncate`}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
