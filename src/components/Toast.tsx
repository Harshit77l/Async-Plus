import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type?: 'success' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <aside aria-label="Notifications" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </aside>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      case 'info':
        return <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div
      role="alert"
      className="pointer-events-auto flex items-start gap-3 bg-white text-slate-900 px-4 py-3 rounded-xl border border-slate-200/90 shadow-lg shadow-slate-900/5 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h5 className="text-xs font-semibold text-slate-800 tracking-tight">{toast.title}</h5>
        {toast.description && (
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
