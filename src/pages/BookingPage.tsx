import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BellPlus,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  FileUp,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { computeDoctorSlots } from '../lib/clinicCatalog';
import {
  createAppointmentInSupabase,
  createWaitlistEntryInSupabase,
} from '../lib/clinicDb';
import { useT } from '../i18n/translations';
import { resolveClinicImage } from '../lib/clinicImages';
import { buildBookingWhatsAppHref } from '../lib/contactLinks';
import { AppointmentSlipModal } from '../components/AppointmentSlipModal';
import { SpecializationIcon } from '../components/SpecializationIcon';
import { StatusIndicator } from '../components/StatusIndicator';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import type {
  Appointment,
  AppointmentDocument,
  AppointmentWaitlistEntry,
  NotificationChannel,
  WaitlistTimeRange,
} from '../types/clinic';

function buildNext14Days(): string[] {
  const days: string[] = [];
  const base = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

export function BookingPage() {
  const {
    language,
    specializations,
    doctors,
    settings,
    reviewSummary: _reviewSummary,
    bootstrapLoading,
    bootstrapError,
    refreshBootstrap,
    user,
    bookingDraft,
    setBookingDraft,
    resetBookingDraft,
    navigate,
    addToast,
  } = useClinic();
  const t = useT(language);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    patientName?: string;
    patientPhone?: string;
    patientEmail?: string;
    reason?: string;
  }>({});
  const [submittedAppt, setSubmittedAppt] = useState<Appointment | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [successPopupOpen, setSuccessPopupOpen] = useState(false);
  const [slipModalOpenId, setSlipModalOpenId] = useState<string | null>(null);

  // Smart Waitlist form state (Step 4 - local demo state)
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistEndDate, setWaitlistEndDate] = useState('');
  const [waitlistTimeRange, setWaitlistTimeRange] = useState<WaitlistTimeRange>('any');
  const [waitlistChannel, setWaitlistChannel] = useState<NotificationChannel>('whatsapp');
  const [waitlistConsent, setWaitlistConsent] = useState(true);
  const [waitlistDoneId, setWaitlistDoneId] = useState<string | null>(null);

  const upcomingDates = useMemo(() => buildNext14Days(), []);
  const availableSpecializations = useMemo(
    () =>
      Array.isArray(specializations)
        ? specializations.filter((s) => Boolean(s && s.active !== false && s.id && s.name))
        : [],
    [specializations]
  );
  const selectedSpec = availableSpecializations.find((s) => s.id === bookingDraft.specializationId);
  const deptDoctors = useMemo(
    () =>
      bookingDraft.specializationId
        ? doctors.filter((d) => d.active !== false && d.specializationId === bookingDraft.specializationId)
        : doctors.filter((d) => d.active !== false),
    [doctors, bookingDraft.specializationId]
  );
  const selectedDoctor = doctors.find((d) => d.id === bookingDraft.doctorId);

  const slotsLoading = false;
  const slotsError = false;
  const slots = useMemo(() => {
    if (!selectedDoctor || !bookingDraft.date) return [];
    return computeDoctorSlots(selectedDoctor, bookingDraft.date);
  }, [selectedDoctor, bookingDraft.date]);

  const setStep = (step: number) => {
    setErrorMsg('');
    setFieldErrors({});
    setBookingDraft((prev) => ({ ...prev, step }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = bookingDraft.documents.length;
    if (currentCount + files.length > 3) {
      setErrorMsg(
        language === 'hi'
          ? 'अधिकतम 3 दस्तावेज़ अपलोड किए जा सकते हैं।'
          : 'You can attach up to 3 documents.'
      );
      return;
    }

    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg(
          language === 'hi'
            ? `${file.name} 2 MB से बड़ा है। कृपया छोटी फ़ाइल चुनें।`
            : `${file.name} exceeds the 2 MB limit.`
        );
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const docItem: AppointmentDocument = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: String(reader.result || ''),
          uploadedAt: new Date().toISOString(),
        };
        setBookingDraft((prev) => ({
          ...prev,
          documents: [...prev.documents, docItem].slice(0, 3),
        }));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleValidateDetailsAndProceed = () => {
    const nextFieldErrors: typeof fieldErrors = {};
    if (!bookingDraft.patientName.trim()) {
      nextFieldErrors.patientName =
        language === 'hi' ? 'रोगी का पूरा नाम आवश्यक है।' : 'Patient full name is required.';
    }
    if (bookingDraft.patientPhone.trim().length < 7) {
      nextFieldErrors.patientPhone =
        language === 'hi' ? 'मान्य मोबाइल नंबर दर्ज करें।' : 'Enter a valid mobile number.';
    }
    if (!/^\S+@\S+\.\S+$/.test(bookingDraft.patientEmail.trim())) {
      nextFieldErrors.patientEmail =
        language === 'hi' ? 'मान्य ईमेल पता दर्ज करें।' : 'Enter a valid email address.';
    }
    if (bookingDraft.reason.trim().length < 5) {
      nextFieldErrors.reason =
        language === 'hi'
          ? 'कृपया कम से कम 5 अक्षरों में परामर्श का कारण लिखें।'
          : 'Please enter at least 5 characters describing the visit reason.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setErrorMsg(
        language === 'hi'
          ? 'कृपया चिह्नित आवश्यक फ़ील्ड सही से भरें।'
          : 'Please review the highlighted required fields below.'
      );
      return;
    }
    setFieldErrors({});
    setStep(6);
  };

  const openWhatsAppTab = (url: string) => {
    if (!url || typeof document === 'undefined') return;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSubmitBooking = async () => {
    setErrorMsg('');
    if (!selectedDoctor || !bookingDraft.date || !bookingDraft.timeSlot) {
      setErrorMsg(
        language === 'hi'
          ? 'कृपया चिकित्सक, तिथि और समय स्लॉट चुनें।'
          : 'Please select a doctor, date, and time slot.'
      );
      return;
    }

    setSubmitting(true);
    const nowIso = new Date().toISOString();
    const referenceCode = `ARG-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const newAppt: Appointment = {
      id: `appt-${Date.now()}`,
      referenceCode,
      patientId: user?.id || null,
      patientName: bookingDraft.patientName.trim(),
      patientPhone: bookingDraft.patientPhone.trim(),
      patientEmail: bookingDraft.patientEmail.trim(),
      doctorId: selectedDoctor.id,
      specializationId: bookingDraft.specializationId || selectedDoctor.specializationId,
      date: bookingDraft.date,
      timeSlot: bookingDraft.timeSlot,
      reason: bookingDraft.reason.trim(),
      status: 'confirmed',
      documents: bookingDraft.documents,
      clinicNotes:
        language === 'hi'
          ? 'ऑनलाइन बुकिंग Supabase डेटाबेस और व्हाट्सएप डेस्क के लिए तैयार।'
          : 'Online booking saved and formatted for WhatsApp desk.',
      createdByRole: user?.role || 'guest',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const waUrl = buildBookingWhatsAppHref({
      clinicPhone: settings?.phone,
      language,
      referenceCode,
      doctorName: language === 'hi' ? selectedDoctor.nameHi : selectedDoctor.name,
      speciality:
        language === 'hi'
          ? selectedDoctor.specialityHi || selectedSpec?.nameHi || selectedDoctor.speciality
          : selectedDoctor.speciality || selectedSpec?.name || '',
      date: newAppt.date,
      timeSlot: newAppt.timeSlot,
      fees: selectedDoctor.fees || selectedDoctor.consultationFee,
      patientName: newAppt.patientName,
      patientPhone: newAppt.patientPhone,
      patientEmail: newAppt.patientEmail,
      reason: newAppt.reason,
    });

    try {
      const result = await createAppointmentInSupabase(newAppt);
      setSubmittedAppt(result.data);
      setWhatsappUrl(waUrl);
      setSuccessPopupOpen(true);
      setStep(8);

      if (result.persistedInSupabase) {
        addToast(
          language === 'hi'
            ? 'अपॉइंटमेंट Supabase में सहेजा गया! व्हाट्सएप खुल रहा है...'
            : 'Booking saved to database & confirmed! Opening WhatsApp...',
          'success'
        );
      } else if (result.schemaMissing) {
        addToast(
          language === 'hi'
            ? 'बुकिंग तैयार है। कृपया Supabase SQL Editor में supabase/schema.sql चलाएँ।'
            : 'Booking prepared locally. Run supabase/schema.sql in Supabase SQL Editor to enable cloud table storage.',
          'info'
        );
      } else {
        addToast(
          language === 'hi'
            ? 'अपॉइंटमेंट सफलतापूर्वक तैयार! व्हाट्सएप खुल रहा है...'
            : 'Booking confirmed! Opening WhatsApp with your booking details.',
          'success'
        );
      }

      openWhatsAppTab(waUrl);
    } catch (err) {
      setErrorMsg(
        err instanceof Error && err.message
          ? err.message
          : language === 'hi'
            ? 'अपॉइंटमेंट सहेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
            : 'Unable to save booking. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDraft.doctorId || !bookingDraft.date) return;
    setErrorMsg('');
    const nowIso = new Date().toISOString();
    const entry: AppointmentWaitlistEntry = {
      id: `wait-${Date.now()}`,
      patientId: user?.id || 'guest',
      patientName: bookingDraft.patientName || user?.name || 'Patient',
      patientEmail: bookingDraft.patientEmail || user?.email || '',
      patientPhone: bookingDraft.patientPhone || user?.phone || '',
      doctorId: bookingDraft.doctorId,
      specializationId: bookingDraft.specializationId || selectedDoctor?.specializationId || '',
      preferredDate: bookingDraft.date,
      preferredEndDate: waitlistEndDate || undefined,
      preferredTimeRange: waitlistTimeRange,
      notificationPreference: waitlistChannel,
      consentToNotify: waitlistConsent,
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      const res = await createWaitlistEntryInSupabase(entry);
      setWaitlistDoneId(res.data.id);
      setWaitlistOpen(false);
      addToast(
        language === 'hi'
          ? 'आपको अपॉइंटमेंट प्रतीक्षा सूची में जोड़ दिया गया है।'
          : res.persistedInSupabase
            ? 'Waitlist request saved to Supabase database.'
            : 'Added to appointment waitlist.',
        'success'
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error && err.message
          ? err.message
          : 'Failed to submit waitlist request.'
      );
    }
  };

  const activeStep = submittedAppt ? 8 : bookingDraft.step;

  return (
    <div className="bg-[#F4F8FC] min-h-[82vh] py-10 lg:py-14">
      <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#1C7ED6]">{t.booking.eyebrow}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2D52]">
            {t.booking.title}
          </h1>
          <p className="text-sm text-[#5C6F84]">{t.booking.subtitle}</p>
        </div>

        {/* Step Progress Indicator */}
        <nav aria-label="Booking progress" className="bg-white border border-[#E2EAF2] rounded-2xl p-4 shadow-xs">
          {/* Compact Mobile Progress */}
          <div className="md:hidden space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-[#1C7ED6] tabular-nums">
                {language === 'hi'
                  ? `चरण ${activeStep} / ${t.booking.steps.length}`
                  : `Step ${activeStep} of ${t.booking.steps.length}`}
              </span>
              <span className="font-display font-bold text-[#0B2D52]">
                {t.booking.steps[activeStep - 1]}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#F4F8FC] border border-[#E2EAF2] overflow-hidden">
              <div
                className="h-full bg-[#1C7ED6] rounded-full transition-all duration-300"
                style={{ width: `${Math.round((activeStep / t.booking.steps.length) * 100)}%` }}
              />
            </div>
          </div>

          {/* Desktop 8-Step Horizontal Bar */}
          <ol className="hidden md:flex items-center justify-between gap-2">
            {t.booking.steps.map((label, idx) => {
              const stepNum = idx + 1;
              const isDone = activeStep > stepNum;
              const isCurrent = activeStep === stepNum;
              return (
                <li key={label} className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold flex items-center justify-center shrink-0 border ${
                      isDone
                        ? 'bg-[#1C7ED6] text-white border-[#1C7ED6]'
                        : isCurrent
                          ? 'bg-[#0B2D52] text-white border-[#0B2D52]'
                          : 'bg-[#F4F8FC] text-[#5C6F84] border-[#E2EAF2]'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : stepNum}
                  </span>
                  <span
                    className={`text-xs font-medium truncate ${
                      isCurrent ? 'text-[#0B2D52] font-semibold' : 'text-[#5C6F84]'
                    }`}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Live Selection Context Bar for Steps 3-7 */}
        {activeStep >= 3 && activeStep <= 7 && (selectedSpec || selectedDoctor) && (
          <div className="bg-white border border-[#E2EAF2] rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            {selectedSpec && (
              <span className="text-[#5C6F84]">
                <strong className="text-[#0B2D52]">
                  {language === 'hi' ? selectedSpec.nameHi : selectedSpec.name}
                </strong>
              </span>
            )}
            {selectedDoctor && (
              <span className="text-[#1C7ED6] font-semibold">
                {language === 'hi' ? selectedDoctor.nameHi : selectedDoctor.name}
              </span>
            )}
            {bookingDraft.date && (
              <span className="font-mono text-[#0B2D52] tabular-nums">
                {bookingDraft.date}
                {bookingDraft.timeSlot ? ` · ${bookingDraft.timeSlot}` : ''}
              </span>
            )}
          </div>
        )}

        {/* Main Step Card */}
        <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: SPECIALIZATION */}
          {activeStep === 1 && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                  {t.booking.selectSpecPrompt}
                </h2>
                {selectedSpec && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C7ED6]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{language === 'hi' ? selectedSpec.nameHi : selectedSpec.name}</span>
                  </span>
                )}
              </div>

              {bootstrapLoading ? (
                <div className="space-y-4" aria-live="polite" aria-busy="true">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#5C6F84]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1C7ED6]" aria-hidden="true" />
                    <span>
                      {language === 'hi'
                        ? 'चिकित्सा विभाग लोड हो रहे हैं...'
                        : 'Loading available medical departments...'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-32 rounded-xl border border-[#E2EAF2] bg-[#F4F8FC] animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ) : bootstrapError ? (
                <div
                  role="alert"
                  className="border border-rose-200 rounded-xl p-6 bg-rose-50 text-sm text-rose-900 space-y-3"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {language === 'hi'
                          ? 'चिकित्सा विभाग लोड करने में समस्या आई।'
                          : 'Unable to load medical departments.'}
                      </p>
                      <p className="text-xs opacity-90">{bootstrapError}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void refreshBootstrap()}
                    className="min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-lg"
                  >
                    {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
                  </button>
                </div>
              ) : availableSpecializations.length === 0 ? (
                <div className="border border-[#E2EAF2] rounded-xl p-6 bg-[#F4F8FC] space-y-3">
                  <p className="text-sm text-[#10233B]">
                    {language === 'hi'
                      ? 'वर्तमान में ऑनलाइन बुकिंग के लिए कोई चिकित्सा विभाग उपलब्ध नहीं है। कृपया पुनः प्रयास करें या क्लिनिक से संपर्क करें।'
                      : 'No medical departments are currently available for online booking. Please retry or contact clinic reception.'}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => void refreshBootstrap()}
                      className="min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-lg"
                    >
                      {language === 'hi' ? 'पुनः लोड करें' : 'Reload Departments'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/contact')}
                      className="min-h-[42px] px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-white border border-[#E2EAF2] rounded-lg"
                    >
                      {t.nav.contact}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-100 visible"
                  role="radiogroup"
                  aria-label={t.booking.steps[0]}
                >
                  {availableSpecializations.map((spec) => {
                    const selected = bookingDraft.specializationId === spec.id;
                    const count = doctors.filter(
                      (d) => d.active !== false && d.specializationId === spec.id
                    ).length;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          setErrorMsg('');
                          setBookingDraft((prev) => ({
                            ...prev,
                            specializationId: spec.id,
                            doctorId: prev.specializationId === spec.id ? prev.doctorId : '',
                            timeSlot: prev.specializationId === spec.id ? prev.timeSlot : '',
                          }));
                        }}
                        className={`w-full min-w-0 min-h-[118px] text-left rounded-xl border p-4 sm:p-5 transition-colors flex flex-col justify-between gap-3 ${
                          selected
                            ? 'border-[#1C7ED6] ring-2 ring-[#1C7ED6]/25 bg-[#EAF3FC] dark:bg-[#1C7ED6]/20 dark:border-[#38BDF8]'
                            : 'border-[#E2EAF2] bg-white dark:bg-[#0F2744] dark:border-[#1E3A5F] hover:border-[#1C7ED6]/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              selected
                                ? 'bg-[#1C7ED6] text-white'
                                : 'bg-[#EAF3FC] text-[#1C7ED6] dark:bg-[#163459] dark:text-[#60A5FA]'
                            }`}
                          >
                            <SpecializationIcon iconKey={spec.iconKey} className="w-5 h-5" />
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-[#5C6F84] tabular-nums">
                              {count} {language === 'hi' ? 'चिकित्सक' : count === 1 ? 'Doctor' : 'Doctors'}
                            </span>
                            {selected && (
                              <span
                                className="w-5 h-5 rounded-full bg-[#1C7ED6] text-white flex items-center justify-center shrink-0"
                                aria-hidden="true"
                              >
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 w-full">
                          <h3 className="font-display text-base font-bold text-[#0B2D52] break-words">
                            {language === 'hi' ? spec.nameHi : spec.name}
                          </h3>
                          <p className="text-xs text-[#5C6F84] mt-1 leading-relaxed break-words">
                            {language === 'hi' ? spec.shortDescriptionHi : spec.shortDescription}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 border-t border-[#E2EAF2] flex items-center justify-between gap-3">
                <p className="text-xs text-[#5C6F84]">
                  {selectedSpec
                    ? `${language === 'hi' ? 'चयनित विभाग:' : 'Selected:'} ${
                        language === 'hi' ? selectedSpec.nameHi : selectedSpec.name
                      }`
                    : language === 'hi'
                      ? 'आगे बढ़ने के लिए ऊपर एक विभाग चुनें।'
                      : 'Select a department above to continue.'}
                </p>
                <button
                  type="button"
                  disabled={!selectedSpec || bootstrapLoading}
                  onClick={() => {
                    if (!selectedSpec) {
                      setErrorMsg(
                        language === 'hi'
                          ? 'कृपया आगे बढ़ने से पहले एक चिकित्सा विभाग चुनें।'
                          : 'Please select a medical department before continuing.'
                      );
                      return;
                    }
                    setStep(2);
                  }}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] disabled:opacity-50 rounded-xl shrink-0"
                >
                  <span>{t.booking.next}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DOCTOR */}
          {activeStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                  {t.booking.selectDoctorPrompt}
                </h2>
                {selectedSpec && (
                  <span className="text-xs font-medium text-[#1C7ED6]">
                    {language === 'hi' ? selectedSpec.nameHi : selectedSpec.name}
                  </span>
                )}
              </div>

              {deptDoctors.length === 0 ? (
                <div className="border border-[#E2EAF2] rounded-xl p-6 bg-[#F4F8FC] space-y-3">
                  <p className="text-sm text-[#10233B]">
                    {language === 'hi'
                      ? 'वर्तमान में इस विभाग में कोई ऑनलाइन स्लॉट चिकित्सक सूचीबद्ध नहीं है। कृपया कोई अन्य विभाग चुनें या रिसेप्शन से संपर्क करें।'
                      : 'No online-bookable doctors are currently assigned to this department. Please choose another department or contact reception.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#0B2D52] rounded-lg"
                  >
                    {t.booking.back}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {deptDoctors.map((doc) => {
                    const selected = bookingDraft.doctorId === doc.id;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          setBookingDraft((prev) => ({
                            ...prev,
                            doctorId: doc.id,
                            timeSlot: '',
                            step: 3,
                          }));
                        }}
                        className={`text-left rounded-xl border p-4 flex items-center gap-4 transition-colors ${
                          selected
                            ? 'border-[#1C7ED6] bg-[#EAF3FC]/50'
                            : 'border-[#E2EAF2] bg-white hover:border-[#0B2D52]/40'
                        }`}
                      >
                        <img
                          src={doc.photo || resolveClinicImage(doc.imageKey)}
                          alt={language === 'hi' ? doc.nameHi : doc.name}
                          className="w-16 h-20 rounded-lg object-cover object-top shrink-0 bg-[#F4F8FC]"
                        />
                        <div className="min-w-0 space-y-1">
                          <h3 className="font-display text-base font-bold text-[#0B2D52] truncate">
                            {language === 'hi' ? doc.nameHi : doc.name}
                          </h3>
                          <p className="text-xs text-[#5C6F84] truncate">
                            {language === 'hi' ? doc.specialityHi || doc.qualificationHi : doc.speciality || doc.qualification}
                          </p>
                          <p className="text-xs font-mono font-semibold text-[#1C7ED6] tabular-nums">
                            ₹{doc.fees || doc.consultationFee} · ★ {doc.rating.toFixed(1)} · {(language === 'hi' ? doc.languagesHi : doc.languages).join(', ')}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] border border-[#E2EAF2] rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>{t.booking.back}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DATE */}
          {activeStep === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                {t.booking.selectDatePrompt}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {upcomingDates.map((dStr) => {
                  const dateObj = new Date(`${dStr}T00:00:00`);
                  const dayLabel = dateObj.toLocaleDateString(
                    language === 'hi' ? 'hi-IN' : 'en-IN',
                    { weekday: 'short' }
                  );
                  const dayNum = dateObj.toLocaleDateString(
                    language === 'hi' ? 'hi-IN' : 'en-IN',
                    { day: '2-digit', month: 'short' }
                  );
                  const selected = bookingDraft.date === dStr;
                  return (
                    <button
                      key={dStr}
                      type="button"
                      onClick={() => {
                        setBookingDraft((prev) => ({
                          ...prev,
                          date: dStr,
                          timeSlot: '',
                        }));
                      }}
                      className={`min-h-[64px] rounded-xl border p-2.5 text-center transition-colors ${
                        selected
                          ? 'border-[#1C7ED6] bg-[#1C7ED6] text-white'
                          : 'border-[#E2EAF2] bg-white text-[#0B2D52] hover:bg-[#F4F8FC]'
                      }`}
                    >
                      <div className={`text-[11px] font-medium ${selected ? 'text-white/90' : 'text-[#5C6F84]'}`}>
                        {dayLabel}
                      </div>
                      <div className="text-sm font-bold tabular-nums mt-0.5">{dayNum}</div>
                    </button>
                  );
                })}
              </div>

              <div className="max-w-xs space-y-1.5">
                <label htmlFor="booking-date-input" className="block text-xs font-semibold text-[#5C6F84]">
                  {language === 'hi' ? 'या कैलेंडर से तिथि चुनें' : 'Or pick any upcoming date'}
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#5C6F84] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id="booking-date-input"
                    type="date"
                    min={upcomingDates[0]}
                    value={bookingDraft.date}
                    onChange={(e) =>
                      setBookingDraft((prev) => ({
                        ...prev,
                        date: e.target.value,
                        timeSlot: '',
                      }))
                    }
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 text-sm border border-[#E2EAF2] rounded-xl font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2EAF2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] border border-[#E2EAF2] rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>{t.booking.back}</span>
                </button>
                <button
                  type="button"
                  disabled={!bookingDraft.date}
                  onClick={() => setStep(4)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] disabled:opacity-50 rounded-xl"
                >
                  <span>{t.booking.next}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: TIME SLOT */}
          {activeStep === 4 && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                  {t.booking.selectTimePrompt}
                </h2>
                <span className="font-mono text-xs text-[#5C6F84] tabular-nums">
                  {bookingDraft.date}
                </span>
              </div>

              {slotsLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="h-12 rounded-xl bg-[#F4F8FC] animate-pulse border border-[#E2EAF2]" />
                  ))}
                </div>
              ) : slotsError ? (
                <div className="border border-rose-200 rounded-xl p-6 bg-rose-50 text-sm text-rose-900 space-y-3">
                  <p>
                    {language === 'hi'
                      ? 'स्लॉट उपलब्धता लोड करने में समस्या हुई। कृपया पुनः प्रयास करें।'
                      : 'Unable to load slot availability. Please try again or pick another date.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#0B2D52] rounded-lg"
                  >
                    {t.booking.back}
                  </button>
                </div>
              ) : slots.length === 0 ? (
                <div className="border border-[#E2EAF2] rounded-xl p-6 bg-[#F4F8FC] text-sm text-[#5C6F84] space-y-3">
                  <p>{t.booking.noSlots}</p>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#0B2D52] rounded-lg"
                  >
                    {t.booking.back}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-5 text-xs text-[#5C6F84]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded border border-[#1C7ED6] bg-white inline-block" />
                      {t.booking.available}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
                      {t.booking.booked}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {slots.map((slot) => {
                      const isBooked = slot.status === 'booked';
                      const isSelected = bookingDraft.timeSlot === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={isBooked}
                          onClick={() =>
                            setBookingDraft((prev) => ({ ...prev, timeSlot: slot.time }))
                          }
                          className={`min-h-[48px] rounded-xl border px-3 py-2.5 font-mono text-sm font-semibold tabular-nums flex items-center justify-center gap-1.5 transition-colors ${
                            isBooked
                              ? 'bg-slate-100 text-slate-400 border-[#E2EAF2] cursor-not-allowed line-through'
                              : isSelected
                                ? 'bg-[#1C7ED6] text-white border-[#1C7ED6]'
                                : 'bg-white text-[#0B2D52] border-[#E2EAF2] hover:border-[#1C7ED6]'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{slot.time}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Smart Appointment Waitlist Trigger & Form */}
              <div className="rounded-xl border border-[#C5DDF8] bg-[#F8FBFF] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#0B2D52] flex items-center gap-1.5">
                      <BellPlus className="w-4 h-4 text-[#1C7ED6]" aria-hidden="true" />
                      <span>
                        {language === 'hi'
                          ? 'पसंदीदा समय उपलब्ध नहीं है?'
                          : 'Preferred slot unavailable or booked?'}
                      </span>
                    </p>
                    <p className="text-xs text-[#5C6F84] mt-0.5">
                      {language === 'hi'
                        ? 'यदि कोई अपॉइंटमेंट रद्द होता है तो सूचना पाने के लिए प्रतीक्षा सूची में शामिल हों।'
                        : 'Join the Appointment Waitlist to be notified automatically if a slot opens up.'}
                    </p>
                  </div>
                  {user?.role === 'patient' ? (
                    <button
                      type="button"
                      onClick={() => setWaitlistOpen((prev) => !prev)}
                      className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#10233B] rounded-lg cursor-pointer"
                    >
                      {waitlistOpen
                        ? language === 'hi'
                          ? 'फॉर्म बंद करें'
                          : 'Close Waitlist Form'
                        : language === 'hi'
                          ? 'प्रतीक्षा सूची में शामिल हों'
                          : 'Join Appointment Waitlist'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-[#0B2D52] bg-white border border-[#CBD5E1] hover:bg-[#EAF3FC] rounded-lg cursor-pointer"
                    >
                      {language === 'hi'
                        ? 'प्रतीक्षा सूची के लिए रोगी लॉगिन करें'
                        : 'Sign in as Patient to Join Waitlist'}
                    </button>
                  )}
                </div>

                {waitlistDoneId && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {language === 'hi'
                        ? 'प्रतीक्षा सूची अनुरोध दर्ज हो गया है! स्लॉट खुलते ही आपको पोर्टल में सूचित किया जाएगा।'
                        : 'Waitlist request active! We will notify you in your Patient Portal if a matching slot opens.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('/portal')}
                      className="font-semibold underline cursor-pointer"
                    >
                      {language === 'hi' ? 'पोर्टल देखें' : 'View in Portal'}
                    </button>
                  </div>
                )}

                {waitlistOpen && user?.role === 'patient' && (
                  <form onSubmit={handleJoinWaitlist} className="pt-3 border-t border-[#E2EAF2] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#0B2D52]">
                          {language === 'hi' ? 'अंतिम तिथि तक (वैकल्पिक)' : 'Through Date (Optional)'}
                        </label>
                        <input
                          type="date"
                          min={bookingDraft.date}
                          value={waitlistEndDate}
                          onChange={(e) => setWaitlistEndDate(e.target.value)}
                          className="w-full min-h-[38px] px-2.5 py-1.5 text-xs font-mono border border-[#E2EAF2] rounded-lg bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#0B2D52]">
                          {language === 'hi' ? 'पसंदीदा समय अवधि' : 'Preferred Time Range'}
                        </label>
                        <select
                          value={waitlistTimeRange}
                          onChange={(e) => setWaitlistTimeRange(e.target.value as WaitlistTimeRange)}
                          className="w-full min-h-[38px] px-2.5 py-1.5 text-xs border border-[#E2EAF2] rounded-lg bg-white"
                        >
                          <option value="any">{language === 'hi' ? 'कोई भी समय' : 'Any Available Time'}</option>
                          <option value="morning">{language === 'hi' ? 'सुबह (< 12:00)' : 'Morning (Before 12:00)'}</option>
                          <option value="afternoon">{language === 'hi' ? 'दोपहर (12:00–16:00)' : 'Afternoon (12:00–16:00)'}</option>
                          <option value="evening">{language === 'hi' ? 'शाम (16:00+)' : 'Evening (16:00 onwards)'}</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#0B2D52]">
                          {language === 'hi' ? 'सूचना माध्यम' : 'Notification Preference'}
                        </label>
                        <select
                          value={waitlistChannel}
                          onChange={(e) => setWaitlistChannel(e.target.value as NotificationChannel)}
                          className="w-full min-h-[38px] px-2.5 py-1.5 text-xs border border-[#E2EAF2] rounded-lg bg-white"
                        >
                          <option value="in_app">{language === 'hi' ? 'पोर्टल अलर्ट (सक्रिय)' : 'In-App Portal Alert (Active)'}</option>
                          <option value="whatsapp">WhatsApp (+ In-App Fallback)</option>
                          <option value="sms">SMS (+ In-App Fallback)</option>
                          <option value="email">Email (+ In-App Fallback)</option>
                        </select>
                      </div>
                    </div>

                    <label className="flex items-start gap-2 text-xs text-[#10233B] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={waitlistConsent}
                        onChange={(e) => setWaitlistConsent(e.target.checked)}
                        required
                        className="mt-0.5"
                      />
                      <span>
                        {language === 'hi'
                          ? 'यदि चुना गया स्लॉट खुलता है तो मुझे सूचित करने की सहमति देता/देती हूँ। (यह स्वचालित बुकिंग पुष्टि नहीं होगी।)'
                          : 'I consent to receive a waitlist alert if a matching slot becomes available. (Notification offers the slot; booking is confirmed only after completion.)'}
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={!waitlistConsent}
                      className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] disabled:opacity-60 rounded-lg cursor-pointer"
                    >
                      {language === 'hi'
                        ? 'प्रतीक्षा सूची अनुरोध दर्ज करें'
                        : 'Confirm Waitlist Request'}
                    </button>
                  </form>
                )}
              </div>

              <div className="pt-4 border-t border-[#E2EAF2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] border border-[#E2EAF2] rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>{t.booking.back}</span>
                </button>
                <button
                  type="button"
                  disabled={!bookingDraft.timeSlot}
                  onClick={() => setStep(5)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] disabled:opacity-50 rounded-xl"
                >
                  <span>{t.booking.next}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: PATIENT DETAILS & REASON */}
          {activeStep === 5 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                {t.booking.detailsPrompt}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="bk-name" className="block text-xs font-semibold text-[#0B2D52]">
                    {t.booking.patientName} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="bk-name"
                    type="text"
                    autoComplete="name"
                    aria-invalid={Boolean(fieldErrors.patientName)}
                    value={bookingDraft.patientName}
                    onChange={(e) => {
                      setFieldErrors((prev) => ({ ...prev, patientName: undefined }));
                      setBookingDraft((prev) => ({ ...prev, patientName: e.target.value }));
                    }}
                    className={`w-full min-h-[44px] px-3.5 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C7ED6]/15 ${
                      fieldErrors.patientName
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-[#E2EAF2] focus:border-[#1C7ED6]'
                    }`}
                  />
                  {fieldErrors.patientName && (
                    <p className="text-xs text-rose-700">{fieldErrors.patientName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="bk-phone" className="block text-xs font-semibold text-[#0B2D52]">
                    {t.booking.patientPhone} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="bk-phone"
                    type="tel"
                    autoComplete="tel"
                    aria-invalid={Boolean(fieldErrors.patientPhone)}
                    value={bookingDraft.patientPhone}
                    onChange={(e) => {
                      setFieldErrors((prev) => ({ ...prev, patientPhone: undefined }));
                      setBookingDraft((prev) => ({ ...prev, patientPhone: e.target.value }));
                    }}
                    className={`w-full min-h-[44px] px-3.5 py-2 text-sm border rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1C7ED6]/15 ${
                      fieldErrors.patientPhone
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-[#E2EAF2] focus:border-[#1C7ED6]'
                    }`}
                  />
                  {fieldErrors.patientPhone && (
                    <p className="text-xs text-rose-700">{fieldErrors.patientPhone}</p>
                  )}
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="bk-email" className="block text-xs font-semibold text-[#0B2D52]">
                    {t.booking.patientEmail} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="bk-email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(fieldErrors.patientEmail)}
                    value={bookingDraft.patientEmail}
                    onChange={(e) => {
                      setFieldErrors((prev) => ({ ...prev, patientEmail: undefined }));
                      setBookingDraft((prev) => ({ ...prev, patientEmail: e.target.value }));
                    }}
                    className={`w-full min-h-[44px] px-3.5 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C7ED6]/15 ${
                      fieldErrors.patientEmail
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-[#E2EAF2] focus:border-[#1C7ED6]'
                    }`}
                  />
                  {fieldErrors.patientEmail && (
                    <p className="text-xs text-rose-700">{fieldErrors.patientEmail}</p>
                  )}
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="bk-reason" className="block text-xs font-semibold text-[#0B2D52]">
                    {t.booking.visitReason} <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="bk-reason"
                    rows={3}
                    aria-invalid={Boolean(fieldErrors.reason)}
                    value={bookingDraft.reason}
                    placeholder={t.booking.visitReasonPlaceholder}
                    onChange={(e) => {
                      setFieldErrors((prev) => ({ ...prev, reason: undefined }));
                      setBookingDraft((prev) => ({ ...prev, reason: e.target.value }));
                    }}
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C7ED6]/15 ${
                      fieldErrors.reason
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-[#E2EAF2] focus:border-[#1C7ED6]'
                    }`}
                  />
                  {fieldErrors.reason && (
                    <p className="text-xs text-rose-700">{fieldErrors.reason}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2EAF2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] border border-[#E2EAF2] rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>{t.booking.back}</span>
                </button>
                <button
                  type="button"
                  onClick={handleValidateDetailsAndProceed}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl"
                >
                  <span>{t.booking.next}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: OPTIONAL DOCUMENT UPLOAD */}
          {activeStep === 6 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                {t.booking.uploadLabel}
              </h2>
              <p className="text-sm text-[#5C6F84]">{t.booking.docsPrompt}</p>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#E2EAF2] hover:border-[#1C7ED6] rounded-2xl p-8 bg-[#F4F8FC] cursor-pointer transition-colors text-center">
                <FileUp className="w-7 h-7 text-[#1C7ED6] mb-2" aria-hidden="true" />
                <span className="text-sm font-semibold text-[#0B2D52]">
                  {language === 'hi' ? 'फ़ाइल चुनने के लिए क्लिक करें' : 'Click to attach reports or prescriptions'}
                </span>
                <span className="text-xs text-[#5C6F84] mt-1">{t.booking.uploadHint}</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>

              {bookingDraft.documents.length > 0 && (
                <ul className="space-y-2">
                  {bookingDraft.documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-3 border border-[#E2EAF2] rounded-xl px-4 py-2.5 bg-white"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0B2D52] truncate">{doc.name}</p>
                        <p className="text-xs text-[#5C6F84] font-mono tabular-nums">
                          {Math.max(1, Math.round(doc.size / 1024))} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setBookingDraft((prev) => ({
                            ...prev,
                            documents: prev.documents.filter((d) => d.id !== doc.id),
                          }))
                        }
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                        aria-label={`Remove ${doc.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="pt-4 border-t border-[#E2EAF2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] border border-[#E2EAF2] rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>{t.booking.back}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(7)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl"
                >
                  <span>{t.booking.next}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: REVIEW & SUBMIT */}
          {activeStep === 7 && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                {t.booking.reviewPrompt}
              </h2>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-[#E2EAF2] rounded-xl p-5 bg-[#F4F8FC] text-sm">
                <div>
                  <dt className="text-xs text-[#5C6F84]">{t.booking.steps[0]}</dt>
                  <dd className="font-semibold text-[#0B2D52] mt-0.5">
                    {selectedSpec ? (language === 'hi' ? selectedSpec.nameHi : selectedSpec.name) : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5C6F84]">{t.booking.steps[1]}</dt>
                  <dd className="font-semibold text-[#0B2D52] mt-0.5">
                    {selectedDoctor ? (language === 'hi' ? selectedDoctor.nameHi : selectedDoctor.name) : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5C6F84]">{t.booking.steps[2]} & {t.booking.steps[3]}</dt>
                  <dd className="font-mono font-semibold text-[#1C7ED6] mt-0.5 tabular-nums">
                    {bookingDraft.date} · {bookingDraft.timeSlot}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5C6F84]">{t.doctorsSection.feeLabel}</dt>
                  <dd className="font-mono font-semibold text-[#0B2D52] mt-0.5 tabular-nums">
                    ₹{selectedDoctor?.fees || selectedDoctor?.consultationFee || 800}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5C6F84]">{t.booking.patientName}</dt>
                  <dd className="font-medium text-[#10233B] mt-0.5">{bookingDraft.patientName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5C6F84]">{t.booking.patientPhone}</dt>
                  <dd className="font-medium text-[#10233B] mt-0.5 tabular-nums">{bookingDraft.patientPhone}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-[#5C6F84]">{t.booking.visitReason}</dt>
                  <dd className="text-[#10233B] mt-0.5">{bookingDraft.reason}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-[#5C6F84]">{t.booking.steps[5]}</dt>
                  <dd className="text-[#10233B] mt-0.5">
                    {bookingDraft.documents.length > 0
                      ? bookingDraft.documents.map((d) => d.name).join(', ')
                      : language === 'hi'
                        ? 'कोई दस्तावेज़ संलग्न नहीं'
                        : 'No files attached'}
                  </dd>
                </div>
              </dl>

              {settings && (
                <p className="text-xs text-[#5C6F84] bg-[#EAF3FC]/70 border border-[#C5DDF8] rounded-xl px-4 py-3">
                  {language === 'hi' ? settings.bookingNoticeHi : settings.bookingNotice}
                </p>
              )}

              <div className="pt-4 border-t border-[#E2EAF2] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] border border-[#E2EAF2] rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>{t.booking.back}</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitBooking}
                  className="min-h-[46px] inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] disabled:opacity-60 rounded-xl"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>{submitting ? t.booking.submitting : t.booking.submit}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 8: CONFIRMATION STATUS SCREEN */}
          {activeStep === 8 && submittedAppt && (
            <div className="py-4 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF3FC] text-[#1C7ED6] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <StatusIndicator status={submittedAppt.status} language={language} />
                  <h2 className="font-display text-2xl font-bold text-[#0B2D52]">
                    {t.booking.pendingTitle}
                  </h2>
                  <p className="text-sm text-[#10233B] leading-relaxed">
                    {t.booking.pendingNotice}
                  </p>
                </div>
              </div>

              <div className="border border-[#E2EAF2] rounded-xl p-5 bg-[#F4F8FC] grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-[#5C6F84]">{t.booking.referenceLabel}</span>
                  <span className="font-mono font-bold text-[#0B2D52] tabular-nums">
                    {submittedAppt.referenceCode}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-[#5C6F84]">{t.booking.steps[1]}</span>
                  <span className="font-semibold text-[#0B2D52]">
                    {selectedDoctor ? (language === 'hi' ? selectedDoctor.nameHi : selectedDoctor.name) : ''}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-[#5C6F84]">{t.booking.steps[2]} & {t.booking.steps[3]}</span>
                  <span className="font-mono font-semibold text-[#1C7ED6] tabular-nums">
                    {submittedAppt.date} · {submittedAppt.timeSlot}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#128C7E] hover:bg-[#0F766A] rounded-xl cursor-pointer transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    <span>
                      {language === 'hi'
                        ? 'व्हाट्सएप पर विवरण भेजें'
                        : 'Open WhatsApp Booking'}
                    </span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSlipModalOpenId(submittedAppt.id)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl cursor-pointer"
                >
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {language === 'hi'
                      ? 'कन्फर्मेशन स्लिप / PDF'
                      : 'View Slip & PDF'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedAppt(null);
                    setSuccessPopupOpen(false);
                    resetBookingDraft();
                  }}
                  className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-[#0B2D52] bg-[#F4F8FC] border border-[#E2EAF2] rounded-xl cursor-pointer"
                >
                  {t.booking.bookAnotherCta}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Success Popup Modal */}
      {successPopupOpen && submittedAppt && typeof document !== 'undefined'
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-success-modal-title"
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto"
            >
              <div className="w-full max-w-md rounded-2xl border border-[#E2EAF2] bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-[#E2EAF2] bg-[#F4F8FC] px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h2
                        id="booking-success-modal-title"
                        className="font-display text-base font-bold text-[#0B2D52]"
                      >
                        {language === 'hi'
                          ? 'अपॉइंटमेंट बुकिंग सफल!'
                          : 'Appointment Booking Confirmed!'}
                      </h2>
                      <p className="text-[11px] font-mono text-[#1C7ED6] font-semibold">
                        {submittedAppt.referenceCode}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccessPopupOpen(false)}
                    aria-label={language === 'hi' ? 'बंद करें' : 'Close'}
                    className="rounded-lg p-1.5 text-[#5C6F84] hover:bg-white hover:text-[#0B2D52] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs text-[#5C6F84] leading-relaxed">
                    {language === 'hi'
                      ? 'आपका अपॉइंटमेंट विवरण तैयार है और व्हाट्सएप में भेजा जा रहा है। नीचे अपना सारांश देखें:'
                      : 'Your booking summary is ready and formatted for WhatsApp confirmation. Review your details below:'}
                  </p>

                  <div className="rounded-xl border border-[#E2EAF2] bg-[#F8FBFF] p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#5C6F84]">{language === 'hi' ? 'चिकित्सक' : 'Doctor'}</span>
                      <span className="font-semibold text-[#0B2D52]">
                        {selectedDoctor
                          ? language === 'hi'
                            ? selectedDoctor.nameHi
                            : selectedDoctor.name
                          : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#5C6F84]">{language === 'hi' ? 'विशेषज्ञता' : 'Speciality'}</span>
                      <span className="font-medium text-[#1C7ED6]">
                        {selectedDoctor
                          ? language === 'hi'
                            ? selectedDoctor.specialityHi || selectedDoctor.speciality
                            : selectedDoctor.speciality
                          : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#5C6F84]">{language === 'hi' ? 'तिथि एवं समय' : 'Date & Slot'}</span>
                      <span className="font-mono font-semibold text-[#0B2D52] tabular-nums">
                        {submittedAppt.date} · {submittedAppt.timeSlot}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#5C6F84]">{language === 'hi' ? 'रोगी' : 'Patient'}</span>
                      <span className="font-medium text-[#0B2D52]">{submittedAppt.patientName}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2EAF2]">
                      <span className="text-[#5C6F84]">{t.doctorsSection.feeLabel}</span>
                      <span className="font-mono font-bold text-[#0B2D52] tabular-nums">
                        ₹{selectedDoctor?.fees || selectedDoctor?.consultationFee || 800}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 pt-1">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#128C7E] hover:bg-[#0F766A] rounded-xl transition-colors"
                      >
                        <WhatsAppIcon className="w-4 h-4 shrink-0" />
                        <span>
                          {language === 'hi'
                            ? 'व्हाट्सएप पर बुकिंग भेजें'
                            : 'Send Booking on WhatsApp'}
                        </span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSuccessPopupOpen(false)}
                      className="w-full min-h-[42px] px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#EAF3FC] border border-[#E2EAF2] rounded-xl cursor-pointer"
                    >
                      {language === 'hi' ? 'रसीद और सारांश देखें' : 'Done · View Confirmation'}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      <AppointmentSlipModal
        appointmentId={slipModalOpenId}
        appointment={submittedAppt}
        onClose={() => setSlipModalOpenId(null)}
      />
    </div>
  );
}
