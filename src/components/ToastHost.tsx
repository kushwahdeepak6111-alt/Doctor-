import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export function ToastHost() {
  const { toasts, dismissToast } = useClinic();
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="no-print fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg bg-white ${
            toast.tone === 'error'
              ? 'border-rose-200 text-rose-900'
              : toast.tone === 'success'
                ? 'border-[#C5DDF8] text-[#0B2D52]'
                : 'border-[#E2EAF2] text-[#10233B]'
          }`}
        >
          {toast.tone === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
          ) : toast.tone === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#1C7ED6] shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <Info className="w-4 h-4 text-[#0B2D52] shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="text-[#5C6F84] hover:text-[#10233B] p-0.5 rounded"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
