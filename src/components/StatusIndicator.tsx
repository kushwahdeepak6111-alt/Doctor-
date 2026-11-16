import React from 'react';
import { AlertCircle, Ban, CheckCheck, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { AppointmentStatus, Language } from '../types/clinic';
import { STATUS_LABELS } from '../i18n/translations';

export function StatusIndicator({
  status,
  language,
}: {
  status: AppointmentStatus;
  language: Language;
}) {
  const label = STATUS_LABELS[status]?.[language] || status;

  const config: Record<
    AppointmentStatus,
    { classes: string; icon: React.ReactNode }
  > = {
    pending: {
      classes: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    confirmed: {
      classes: 'bg-[#EAF3FC] text-[#0B2D52] border-[#C5DDF8]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#1C7ED6]" aria-hidden="true" />,
    },
    completed: {
      classes: 'bg-slate-100 text-[#0B2D52] border-[#E2EAF2]',
      icon: <CheckCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    cancelled: {
      classes: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    rejected: {
      classes: 'bg-rose-50 text-rose-900 border-rose-300',
      icon: <Ban className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    missed: {
      classes: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
  };

  const current = config[status] || config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${current.classes}`}
    >
      {current.icon}
      <span>{label}</span>
    </span>
  );
}
