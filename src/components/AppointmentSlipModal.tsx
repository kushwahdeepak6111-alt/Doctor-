import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
  Printer,
  X,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { apiFetch } from '../lib/authFetch';
import { downloadAppointmentSlipPdf } from '../lib/slipGenerator';
import type { AppointmentSlipData } from '../types/clinic';
import { ClinicLogo } from './ClinicLogo';

interface AppointmentSlipModalProps {
  appointmentId: string | null;
  onClose: () => void;
}

export function AppointmentSlipModal({ appointmentId, onClose }: AppointmentSlipModalProps) {
  const { language, addToast } = useClinic();
  const [slip, setSlip] = useState<AppointmentSlipData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!appointmentId) {
      setSlip(null);
      setError('');
      return;
    }
    let active = true;
    setLoading(true);
    setError('');
    apiFetch(`/api/appointments/${encodeURIComponent(appointmentId)}/slip`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Could not load appointment slip');
        }
        if (active) setSlip(data.slip as AppointmentSlipData);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load slip');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appointmentId]);

  useEffect(() => {
    if (!appointmentId || typeof document === 'undefined') return;
    document.body.dataset.printModal = 'true';
    return () => {
      delete document.body.dataset.printModal;
    };
  }, [appointmentId]);

  if (!appointmentId || typeof document === 'undefined') return null;

  const isHi = language === 'hi';
  const isReceipt = slip?.documentType === 'request_receipt';

  const handleDownloadPdf = async () => {
    if (!slip) return;
    setDownloading(true);
    try {
      await downloadAppointmentSlipPdf(slip);
      addToast(
        isHi
          ? 'पीडीएफ सफलतापूर्वक डाउनलोड हो गई है।'
          : isReceipt
            ? 'Appointment Request Receipt PDF downloaded.'
            : 'Appointment Confirmation Slip PDF downloaded.',
        'success'
      );
    } catch {
      addToast(
        isHi
          ? 'पीडीएफ बनाने में त्रुटि हुई। कृपया प्रिंट विकल्प आज़माएँ।'
          : 'Failed to generate PDF file. Please try the Print button instead.',
        'error'
      );
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      addToast(
        isHi ? 'प्रिंट डायलॉग नहीं खुल सका।' : 'Unable to open print dialog on this device.',
        'error'
      );
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto print:static print:inset-auto print:bg-white print:p-0 print:overflow-visible"
      role="dialog"
      aria-modal="true"
      aria-label={isHi ? 'अपॉइंटमेंट स्लिप' : 'Appointment Slip'}
    >
      <div className="w-full max-w-2xl rounded-xl border border-[#E2EAF2] bg-white shadow-2xl overflow-hidden my-6 print:max-w-none print:border-0 print:shadow-none print:my-0">
        {/* Top Action Bar (hidden during print) */}
        <div
          data-no-print="true"
          className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-[#E2EAF2] bg-[#F4F8FC] px-5 py-3.5"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0B2D52]">
            <FileText className="w-4 h-4 text-[#1C7ED6]" />
            <span>
              {isReceipt
                ? isHi
                  ? 'अपॉइंटमेंट अनुरोध रसीद'
                  : 'Appointment Request Receipt'
                : isHi
                  ? 'अपॉइंटमेंट कन्फर्मेशन स्लिप'
                  : 'Appointment Confirmation Slip'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {slip && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-medium text-[#0B2D52] hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isHi ? 'प्रिंट' : 'Print'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#0B2D52] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#10233B] disabled:opacity-60 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {downloading
                      ? isHi
                        ? 'बना रहा है...'
                        : 'Generating...'
                      : isHi
                        ? 'PDF डाउनलोड करें'
                        : 'Download PDF'}
                  </span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={isHi ? 'बंद करें' : 'Close'}
              className="rounded-md p-1.5 text-[#5C6F84] hover:bg-white hover:text-[#0B2D52] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 print-area">
          {loading ? (
            <div className="py-12 text-center text-sm text-[#5C6F84]">
              {isHi ? 'स्लिप लोड हो रही है...' : 'Loading verified clinic document...'}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {isHi ? 'स्लिप उपलब्ध नहीं है' : 'Document Unavailable'}
                </p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          ) : slip ? (
            <div className="space-y-6">
              {/* Clinic Letterhead */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E2EAF2] pb-5">
                <div>
                  <ClinicLogo label={isHi ? slip.clinicNameHi : slip.clinicName} />
                  <p className="mt-1 text-xs font-medium text-[#5C6F84]">
                    {isHi ? 'मल्टी-स्पेशलिटी बाह्य रोगी केंद्र' : 'Multi-Specialty Outpatient Clinic'}
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-[#5C6F84]">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#1C7ED6] shrink-0" />
                      <span>{isHi ? slip.clinicAddressHi : slip.clinicAddress}</span>
                    </p>
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#1C7ED6]" />
                        {slip.clinicPhone}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#1C7ED6]" />
                        {slip.clinicEmail}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      isReceipt
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-[#C5DDF8] bg-[#EAF3FC] text-[#0B2D52]'
                    }`}
                  >
                    {isReceipt ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1C7ED6]" />
                    )}
                    <span>
                      {isReceipt
                        ? isHi
                          ? 'अनुरोध रसीद (अपुष्ट)'
                          : 'Request Receipt (Pending Confirmation)'
                        : slip.status === 'completed'
                          ? isHi
                            ? 'पूर्ण परामर्श स्लिप'
                            : 'Completed Consultation Slip'
                          : isHi
                            ? 'कन्फर्मेशन स्लिप'
                            : 'Appointment Confirmation Slip'}
                    </span>
                  </span>
                  <div className="mt-2 font-mono text-lg font-bold text-[#0B2D52]">
                    {slip.referenceCode}
                  </div>
                  <p className="text-[11px] text-[#5C6F84]">
                    {isHi ? 'संदर्भ कोड' : 'Reference Code'}
                  </p>
                </div>
              </div>

              {/* Important Notice for Pending */}
              {isReceipt && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-900">
                  <strong>{isHi ? 'महत्वपूर्ण:' : 'Notice:'}</strong>{' '}
                  {isHi
                    ? 'यह एक अपॉइंटमेंट अनुरोध रसीद है, अंतिम पुष्टि नहीं। क्लिनिक रिसेप्शन द्वारा पुष्टि के बाद कन्फर्मेशन स्लिप जारी की जाएगी।'
                    : 'This document is an Appointment Request Receipt, not a final confirmation. Your Appointment Confirmation Slip becomes available once clinic reception confirms the visit.'}
                </div>
              )}

              {/* Appointment Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-[#E2EAF2] bg-[#F8FBFF] p-5 text-sm">
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#5C6F84]">
                    {isHi ? 'रोगी का नाम' : 'Patient Name'}
                  </span>
                  <span className="mt-1 block font-semibold text-[#0B2D52]">{slip.patientName}</span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#5C6F84]">
                    {isHi ? 'चिकित्सा विभाग' : 'Department / Specialization'}
                  </span>
                  <span className="mt-1 block font-semibold text-[#0B2D52]">
                    {isHi ? slip.specializationNameHi : slip.specializationName}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#5C6F84]">
                    {isHi ? 'विशेषज्ञ चिकित्सक' : 'Consulting Doctor'}
                  </span>
                  <span className="mt-1 block font-semibold text-[#0B2D52]">
                    {isHi ? slip.doctorNameHi : slip.doctorName}
                  </span>
                  {slip.doctorQualification && (
                    <span className="block text-xs text-[#5C6F84]">{slip.doctorQualification}</span>
                  )}
                </div>

                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#5C6F84]">
                    {isHi ? 'अपॉइंटमेंट तिथि एवं समय' : 'Appointment Date & Time'}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1.5 font-semibold text-[#0B2D52] tabular-nums">
                    <CalendarCheck2 className="w-4 h-4 text-[#1C7ED6]" />
                    {slip.date} • {slip.timeSlot}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#5C6F84]">
                    {isHi ? 'बुकिंग तिथि' : 'Booking Timestamp'}
                  </span>
                  <span className="mt-1 block text-xs text-[#10233B] tabular-nums">
                    {new Date(slip.bookedAt).toLocaleString(isHi ? 'hi-IN' : 'en-IN')}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#5C6F84]">
                    {isHi ? 'क्लिनिक ओपीडी समय' : 'Clinic Hours'}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#10233B]">
                    <Building2 className="w-3.5 h-3.5 text-[#1C7ED6]" />
                    {isHi ? slip.clinicHoursHi : slip.clinicHours}
                  </span>
                </div>
              </div>

              {/* Clinic Instructions */}
              <div className="rounded-lg border border-[#E2EAF2] bg-white p-4 text-xs leading-relaxed text-[#5C6F84]">
                <span className="block font-semibold text-[#0B2D52] mb-1">
                  {isHi ? 'क्लिनिक निर्देश' : 'Clinic Instructions'}
                </span>
                <p>{isHi ? slip.clinicNoticeHi : slip.clinicNotice}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
