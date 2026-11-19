import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  Clock,
  FileText,
  LogOut,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  Star,
  User as UserIcon,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import {
  computeDoctorSlots,
  readLocalAppointments,
  saveLocalAppointment,
} from '../../lib/clinicCatalog';
import {
  createPatientFeedbackInSupabase,
  fetchAllFeedbackFromSupabase,
  fetchAppointmentsFromSupabase,
  fetchWaitlistEntriesFromSupabase,
  updateAppointmentInSupabase,
  updateWaitlistStatusInSupabase,
} from '../../lib/clinicDb';
import { useT } from '../../i18n/translations';
import { AppointmentSlipModal } from '../../components/AppointmentSlipModal';
import { StatusIndicator } from '../../components/StatusIndicator';
import type {
  Appointment,
  AppointmentWaitlistEntry,
  ClinicNotification,
  PatientFeedback,
} from '../../types/clinic';

export function PatientDashboard() {
  const {
    language,
    user,
    doctors,
    specializations,
    logout,
    navigate,
    startBookingWith,
    addToast,
  } = useClinic();
  const t = useT(language);
  const isHi = language === 'hi';

  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    readLocalAppointments()
  );
  const [notifications, setNotifications] = useState<ClinicNotification[]>([
    {
      id: 'notif-demo-1',
      userId: user?.id || 'user-patient-1',
      title: 'Welcome to Arogya Patient Portal',
      titleHi: 'आरोग्य रोगी पोर्टल में आपका स्वागत है',
      message: 'View upcoming visits, download confirmation slips, or book another specialist.',
      messageHi: 'अपने आगामी अपॉइंटमेंट देखें, स्लिप डाउनलोड करें या नया परामर्श बुक करें।',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [myFeedbacks, setMyFeedbacks] = useState<PatientFeedback[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<AppointmentWaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState<
    'upcoming' | 'pending' | 'history' | 'waitlist' | 'notifications' | 'profile'
  >('upcoming');

  const [slipAppointmentId, setSlipAppointmentId] = useState<string | null>(null);

  // Feedback form state
  const [feedbackOpenApptId, setFeedbackOpenApptId] = useState<string | null>(null);
  const [fbRating, setFbRating] = useState(5);
  const [fbComment, setFbComment] = useState('');
  const [fbDoctorFeedback, setFbDoctorFeedback] = useState('');
  const [fbConsent, setFbConsent] = useState(true);
  const [fbSubmitting, setFbSubmitting] = useState(false);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [apptRes, fbRes, waitRes] = await Promise.all([
        fetchAppointmentsFromSupabase(),
        fetchAllFeedbackFromSupabase(user?.id),
        fetchWaitlistEntriesFromSupabase(user?.id),
      ]);
      setAppointments(apptRes.appointments);
      setMyFeedbacks(fbRes);
      setWaitlistEntries(waitRes);
    } catch (err) {
      setAppointments(readLocalAppointments());
      setLoadError(
        err instanceof Error && err.message ? err.message : 'Unable to sync portal records.'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  const confirmedList = useMemo(
    () => appointments.filter((a) => a.status === 'confirmed'),
    [appointments]
  );
  const pendingList = useMemo(
    () => appointments.filter((a) => a.status === 'pending'),
    [appointments]
  );
  const historyList = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.status === 'completed' ||
          a.status === 'cancelled' ||
          a.status === 'rejected' ||
          a.status === 'missed'
      ),
    [appointments]
  );

  const feedbackByAppt = useMemo(
    () => new Map(myFeedbacks.map((f) => [f.appointmentId, f])),
    [myFeedbacks]
  );

  const activeWaitlistCount = waitlistEntries.filter(
    (w) => w.status === 'active' || w.status === 'notified'
  ).length;

  const nextConfirmed = confirmedList[0];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleCancel = async (id: string) => {
    const existing = appointments.find((a) => a.id === id);
    if (!existing) return;
    const updated: Appointment = {
      ...existing,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };
    const nextList = saveLocalAppointment(updated);
    setAppointments(nextList);
    try {
      await updateAppointmentInSupabase(id, {
        status: 'cancelled',
        updatedBy: user?.email,
      });
      addToast(isHi ? 'अपॉइंटमेंट रद्द कर दिया गया।' : 'Appointment cancelled.', 'info');
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Unable to sync cancellation.',
        'error'
      );
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent, appointmentId: string) => {
    e.preventDefault();
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return;
    setFbSubmitting(true);
    const doc = doctors.find((d) => d.id === appt.doctorId);
    const spec = specializations.find((s) => s.id === appt.specializationId);
    const created: PatientFeedback = {
      id: `fb-${Date.now()}`,
      appointmentId,
      patientId: user?.id || 'user-patient-1',
      doctorId: appt.doctorId,
      specializationId: appt.specializationId,
      rating: fbRating,
      comment: fbComment.trim(),
      doctorFeedback: fbDoctorFeedback.trim() || undefined,
      publicConsent: fbConsent,
      status: 'pending_review',
      verifiedVisit: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await createPatientFeedbackInSupabase({
        feedback: created,
        doctorName: doc?.name || appt.doctorId,
        doctorNameHi: doc?.nameHi || doc?.name || appt.doctorId,
        specializationName: spec?.name || doc?.speciality || '',
        specializationNameHi: spec?.nameHi || doc?.specialityHi || '',
      });
      setMyFeedbacks((prev) => [res.data, ...prev]);
      setFeedbackOpenApptId(null);
      setFbComment('');
      setFbDoctorFeedback('');
      setFbRating(5);
      addToast(
        res.persistedInSupabase
          ? isHi
            ? 'प्रतिक्रिया Supabase डेटाबेस में सहेजी गई।'
            : 'Verified feedback submitted to clinic database.'
          : isHi
            ? 'प्रतिक्रिया स्थानीय रूप से सहेजी गई।'
            : 'Verified feedback recorded locally.',
        'success'
      );
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Failed to submit feedback.',
        'error'
      );
    } finally {
      setFbSubmitting(false);
    }
  };

  const handleWithdrawWaitlist = async (waitlistId: string) => {
    setWaitlistEntries((prev) =>
      prev.map((w) => (w.id === waitlistId ? { ...w, status: 'withdrawn' } : w))
    );
    try {
      await updateWaitlistStatusInSupabase(waitlistId, 'withdrawn');
    } catch {
      // Keep local update
    }
    addToast(
      isHi ? 'प्रतीक्षा सूची अनुरोध वापस ले लिया गया।' : 'Waitlist entry withdrawn.',
      'info'
    );
  };

  const handleBookFromWaitlist = (entry: AppointmentWaitlistEntry) => {
    if (!entry.notifiedSlot) return;
    const { date, timeSlot } = entry.notifiedSlot;
    const doc = doctors.find((d) => d.id === entry.doctorId);
    const stillOpen = doc
      ? computeDoctorSlots(doc, date, appointments).some(
          (s) => s.time === timeSlot && s.status === 'available'
        )
      : true;
    startBookingWith({
      doctorId: entry.doctorId,
      date,
      timeSlot: stillOpen ? timeSlot : undefined,
      waitlistId: entry.id,
    });
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSavingProfile(false);
    addToast(isHi ? 'प्रोफ़ाइल अपडेट की गई।' : 'Profile updated locally.', 'success');
  };

  const renderEmptyState = () => (
    <div className="bg-white border border-[#E2EAF2] rounded-2xl p-8 text-center space-y-3">
      <Calendar className="w-8 h-8 text-[#1C7ED6] mx-auto opacity-80" aria-hidden="true" />
      <p className="text-sm text-[#5C6F84]">{t.portal.patient.noAppointments}</p>
      <button
        type="button"
        onClick={() => navigate('/book')}
        className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
        <span>{t.portal.patient.bookNow}</span>
      </button>
    </div>
  );

  const renderAppointmentCard = (appt: Appointment) => {
    const doc = doctors.find((d) => d.id === appt.doctorId);
    const spec = specializations.find((s) => s.id === appt.specializationId);
    const existingFeedback = feedbackByAppt.get(appt.id);
    const slipEligible =
      appt.status === 'pending' || appt.status === 'confirmed' || appt.status === 'completed';

    return (
      <article
        key={appt.id}
        className="border border-[#E2EAF2] rounded-2xl p-5 bg-white shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusIndicator status={appt.status} language={language} />
              <span className="font-mono text-xs text-[#5C6F84] tabular-nums">
                {appt.referenceCode}
              </span>
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#0B2D52]">
                {doc ? (isHi ? doc.nameHi : doc.name) : appt.doctorId}
              </h3>
              <p className="text-xs text-[#1C7ED6] font-medium">
                {spec ? (isHi ? spec.nameHi : spec.name) : ''}
              </p>
            </div>
            <p className="text-sm text-[#10233B]/85 leading-relaxed">{appt.reason}</p>
            {appt.clinicNotes && (
              <div className="text-xs text-[#5C6F84] bg-[#F4F8FC] border border-[#E2EAF2] rounded-xl px-3 py-2">
                <strong className="text-[#0B2D52]">
                  {isHi ? 'क्लिनिक नोट:' : 'Clinic note:'}
                </strong>{' '}
                {appt.clinicNotes}
              </div>
            )}
            {appt.documents.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {appt.documents.map((d) => (
                  <a
                    key={d.id}
                    href={d.dataUrl}
                    download={d.name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#0B2D52] bg-[#EAF3FC] hover:bg-[#D7E9FA] rounded-lg border border-[#C5DDF8] transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#1C7ED6] shrink-0" aria-hidden="true" />
                    <span className="truncate max-w-[180px]">{d.name}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E2EAF2]">
            <div className="text-left sm:text-right">
              <div className="font-mono text-sm font-bold text-[#0B2D52] tabular-nums">
                {appt.date}
              </div>
              <div className="font-mono text-xs text-[#5C6F84] tabular-nums">{appt.timeSlot}</div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              {slipEligible && (
                <button
                  type="button"
                  onClick={() => setSlipAppointmentId(appt.id)}
                  className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B2D52] bg-[#EAF3FC] hover:bg-[#D7E9FA] border border-[#C5DDF8] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#1C7ED6]" aria-hidden="true" />
                  <span>
                    {appt.status === 'pending'
                      ? isHi
                        ? 'रसीद / PDF'
                        : 'Request Receipt & PDF'
                      : isHi
                        ? 'स्लिप / PDF'
                        : 'Confirmation Slip & PDF'}
                  </span>
                </button>
              )}

              {(appt.status === 'pending' || appt.status === 'confirmed') && (
                <button
                  type="button"
                  onClick={() => handleCancel(appt.id)}
                  className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                >
                  {t.portal.patient.cancelAppt}
                </button>
              )}

              {appt.status === 'completed' && !existingFeedback && (
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackOpenApptId(
                      feedbackOpenApptId === appt.id ? null : appt.id
                    );
                    setFbRating(5);
                    setFbComment('');
                    setFbDoctorFeedback('');
                    setFbConsent(true);
                  }}
                  className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isHi ? 'प्रतिक्रिया दें' : 'Leave Verified Feedback'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Existing Verified Feedback Status */}
        {existingFeedback && (
          <div className="rounded-xl border border-[#E2EAF2] bg-[#F8FBFF] p-3.5 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-[#0B2D52]">
                <span>{isHi ? 'आपकी सबमिट की गई समीक्षा:' : 'Your Submitted Feedback:'}</span>
                <span className="inline-flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: existingFeedback.rating }).map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </span>
              </div>
              <span className="rounded border border-[#C5DDF8] bg-white px-2 py-0.5 text-[11px] font-medium text-[#0B2D52]">
                {existingFeedback.status === 'approved'
                  ? isHi
                    ? 'स्वीकृत एवं प्रकाशित'
                    : 'Approved'
                  : existingFeedback.status === 'pending_review'
                    ? isHi
                      ? 'समीक्षा के लिए लंबित'
                      : 'Pending Clinic Moderation'
                    : existingFeedback.status === 'rejected'
                      ? isHi
                        ? 'अस्वीकृत'
                        : 'Not Published'
                      : isHi
                        ? 'छुपाया गया'
                        : 'Hidden'}
              </span>
            </div>
            <p className="text-[#5C6F84]">“{existingFeedback.comment}”</p>
          </div>
        )}

        {/* Inline Feedback Submission Form */}
        {feedbackOpenApptId === appt.id && !existingFeedback && (
          <form
            onSubmit={(e) => void handleSubmitFeedback(e, appt.id)}
            className="rounded-xl border border-[#C5DDF8] bg-[#F8FBFF] p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-display text-sm font-bold text-[#0B2D52]">
                {isHi ? 'सत्यापित विज़िट प्रतिक्रिया' : 'Verified Visit Feedback'}
              </h4>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setFbRating(starVal)}
                    aria-label={`${starVal} stars`}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        starVal <= fbRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0B2D52]">
                {isHi ? 'आपका अनुभव *' : 'Your Clinic Visit Feedback *'}
              </label>
              <textarea
                rows={3}
                required
                minLength={5}
                value={fbComment}
                onChange={(e) => setFbComment(e.target.value)}
                placeholder={
                  isHi
                    ? 'अपनी परामर्श प्रक्रिया और क्लिनिक अनुभव साझा करें...'
                    : 'Share your consultation and clinic experience...'
                }
                className="w-full px-3 py-2 text-xs bg-white border border-[#E2EAF2] rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0B2D52]">
                {isHi
                  ? 'चिकित्सक के लिए विशेष टिप्पणी (वैकल्पिक)'
                  : 'Doctor-Specific Feedback (Optional)'}
              </label>
              <input
                type="text"
                value={fbDoctorFeedback}
                onChange={(e) => setFbDoctorFeedback(e.target.value)}
                placeholder={
                  isHi
                    ? 'उदा. स्पष्ट मार्गदर्शन और शांत परामर्श'
                    : 'e.g. Clear diagnosis explanation and follow-up guidance'
                }
                className="w-full min-h-[38px] px-3 py-1.5 text-xs bg-white border border-[#E2EAF2] rounded-lg"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-[#10233B] cursor-pointer">
              <input
                type="checkbox"
                checked={fbConsent}
                onChange={(e) => setFbConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                {isHi
                  ? 'मैं क्लिनिक वेबसाइट पर बिना निजी संपर्क विवरण दिखाए इस समीक्षा को प्रकाशित करने की सहमति देता/देती हूँ।'
                  : 'I consent to displaying this verified feedback publicly (without exposing my personal contact info) after clinic approval.'}
              </span>
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={fbSubmitting}
                className="min-h-[38px] px-4 py-1.5 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] disabled:opacity-60 rounded-lg cursor-pointer"
              >
                {fbSubmitting
                  ? isHi
                    ? 'सबमिट हो रहा है...'
                    : 'Submitting...'
                  : isHi
                    ? 'प्रतिक्रिया सबमिट करें'
                    : 'Submit Verified Feedback'}
              </button>
              <button
                type="button"
                onClick={() => setFeedbackOpenApptId(null)}
                className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-[#5C6F84] bg-white border border-[#E2EAF2] rounded-lg cursor-pointer"
              >
                {isHi ? 'रद्द करें' : 'Cancel'}
              </button>
            </div>
          </form>
        )}
      </article>
    );
  };

  return (
    <div className="bg-[#F4F8FC] min-h-[82vh] py-8 lg:py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Welcome Header */}
        <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#1C7ED6]">{t.portal.patient.welcome}</p>
            <h1 className="font-display text-2xl font-bold text-[#0B2D52] mt-0.5">
              {isHi ? `नमस्ते, ${user?.name}` : `Welcome, ${user?.name}`}
            </h1>
            <p className="text-xs text-[#5C6F84] mt-1">{user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/book')}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl whitespace-nowrap transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{t.portal.patient.bookNow}</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] border border-[#E2EAF2] hover:bg-[#E2EAF2]/60 rounded-xl whitespace-nowrap transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>{t.portal.signOut}</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: t.portal.patient.confirmed, val: confirmedList.length },
            { label: t.portal.patient.pending, val: pendingList.length },
            { label: t.portal.patient.history, val: historyList.length },
            { label: isHi ? 'प्रतीक्षा सूची' : 'Waitlist', val: activeWaitlistCount },
            { label: t.portal.notifications, val: unreadCount },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-[#E2EAF2] rounded-2xl p-4 shadow-xs">
              <div className="text-xs text-[#5C6F84] truncate">{stat.label}</div>
              <div className="font-mono text-2xl font-bold text-[#0B2D52] tabular-nums mt-1">
                {stat.val}
              </div>
            </div>
          ))}
        </div>

        {/* Highlighted Upcoming Confirmed Appointment */}
        {nextConfirmed && (
          <div className="bg-[#0B2D52] text-white rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#7DD3FC]">{t.portal.patient.upcoming}</p>
              <h2 className="font-display text-xl font-bold">
                {(() => {
                  const d = doctors.find((doc) => doc.id === nextConfirmed.doctorId);
                  return d ? (isHi ? d.nameHi : d.name) : '';
                })()}
              </h2>
              <p className="text-sm text-slate-300">{nextConfirmed.reason}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums">
              <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 text-center">
                <div className="text-[11px] text-slate-300">{isHi ? 'तिथि' : 'Date'}</div>
                <div className="text-sm font-bold">{nextConfirmed.date}</div>
              </div>
              <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 text-center">
                <div className="text-[11px] text-slate-300">{isHi ? 'समय' : 'Time'}</div>
                <div className="text-sm font-bold">{nextConfirmed.timeSlot}</div>
              </div>
              <button
                type="button"
                onClick={() => setSlipAppointmentId(nextConfirmed.id)}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 font-sans text-xs font-semibold text-[#0B2D52] bg-white hover:bg-[#EAF3FC] rounded-xl cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#1C7ED6]" />
                <span>{isHi ? 'स्लिप / PDF' : 'Slip & PDF'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#E2EAF2] pb-3">
          {[
            { id: 'upcoming', label: `${t.portal.patient.confirmed} (${confirmedList.length})` },
            { id: 'pending', label: `${t.portal.patient.pending} (${pendingList.length})` },
            { id: 'history', label: `${t.portal.patient.history} (${historyList.length})` },
            {
              id: 'waitlist',
              label: `${isHi ? 'प्रतीक्षा सूची' : 'Waitlist'} (${waitlistEntries.length})`,
            },
            { id: 'notifications', label: `${t.portal.notifications} (${unreadCount})` },
            { id: 'profile', label: t.portal.patient.profile },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as typeof tab)}
              className={`min-h-[42px] px-4 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
                tab === item.id
                  ? 'bg-[#0B2D52] text-white border-[#0B2D52]'
                  : 'bg-white text-[#10233B] border-[#E2EAF2] hover:bg-[#EAF3FC]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {loadError && (
          <div
            role="alert"
            className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-rose-900"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
              <span>{loadError}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadData()}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white border border-rose-200 rounded-lg text-rose-800 hover:bg-rose-100"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isHi ? 'पुनः प्रयास करें' : 'Retry'}</span>
            </button>
          </div>
        )}

        {/* Tab Content */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-28 bg-white border border-[#E2EAF2] rounded-2xl animate-pulse" />
            <div className="h-28 bg-white border border-[#E2EAF2] rounded-2xl animate-pulse" />
          </div>
        ) : (
          <>
            {tab === 'upcoming' && (
              <div className="space-y-3">
                {confirmedList.length === 0
                  ? renderEmptyState()
                  : confirmedList.map(renderAppointmentCard)}
              </div>
            )}

            {tab === 'pending' && (
              <div className="space-y-3">
                {pendingList.length === 0
                  ? renderEmptyState()
                  : pendingList.map(renderAppointmentCard)}
              </div>
            )}

            {tab === 'history' && (
              <div className="space-y-3">
                {historyList.length === 0
                  ? renderEmptyState()
                  : historyList.map(renderAppointmentCard)}
              </div>
            )}

            {tab === 'waitlist' && (
              <div className="space-y-3">
                {waitlistEntries.length === 0 ? (
                  <div className="bg-white border border-[#E2EAF2] rounded-2xl p-8 text-center space-y-3">
                    <Clock className="w-8 h-8 text-[#1C7ED6] mx-auto opacity-80" aria-hidden="true" />
                    <p className="text-sm text-[#5C6F84]">
                      {isHi
                        ? 'आप अभी किसी अपॉइंटमेंट प्रतीक्षा सूची में नहीं हैं।'
                        : 'You do not have any waitlist requests right now.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/book')}
                      className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.portal.patient.bookNow}</span>
                    </button>
                  </div>
                ) : (
                  waitlistEntries.map((entry) => {
                    const doc = doctors.find((d) => d.id === entry.doctorId);
                    const spec = specializations.find((s) => s.id === entry.specializationId);
                    return (
                      <article
                        key={entry.id}
                        className="bg-white border border-[#E2EAF2] rounded-2xl p-5 shadow-xs space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                                  entry.status === 'notified'
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                    : entry.status === 'active'
                                      ? 'border-[#C5DDF8] bg-[#EAF3FC] text-[#0B2D52]'
                                      : 'border-[#E2EAF2] bg-slate-100 text-[#5C6F84]'
                                }`}
                              >
                                {entry.status === 'notified'
                                  ? isHi
                                    ? 'स्लॉट उपलब्ध — बुक करें'
                                    : 'Slot Opened — Action Required'
                                  : entry.status === 'active'
                                    ? isHi
                                      ? 'सक्रिय प्रतीक्षा'
                                      : 'Active Waitlist'
                                    : entry.status}
                              </span>
                              <span className="text-xs font-mono text-[#5C6F84]">
                                {entry.preferredDate}
                                {entry.preferredEndDate ? ` → ${entry.preferredEndDate}` : ''}
                              </span>
                            </div>
                            <h3 className="font-display text-base font-bold text-[#0B2D52] mt-1.5">
                              {doc ? (isHi ? doc.nameHi : doc.name) : entry.doctorId}
                            </h3>
                            <p className="text-xs text-[#1C7ED6]">
                              {spec ? (isHi ? spec.nameHi : spec.name) : ''} · Time:{' '}
                              {entry.preferredTimeRange} · Alert: {entry.notificationPreference}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {entry.status === 'notified' && entry.notifiedSlot && (
                              <button
                                type="button"
                                onClick={() => void handleBookFromWaitlist(entry)}
                                className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl cursor-pointer"
                              >
                                {isHi ? 'उपलब्ध स्लॉट बुक करें' : 'Book Available Slot'}
                              </button>
                            )}
                            {(entry.status === 'active' || entry.status === 'notified') && (
                              <button
                                type="button"
                                onClick={() => void handleWithdrawWaitlist(entry.id)}
                                className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer"
                              >
                                {isHi ? 'वापस लें' : 'Withdraw'}
                              </button>
                            )}
                          </div>
                        </div>

                        {entry.status === 'notified' && entry.notifiedSlot && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
                            <strong>
                              {isHi ? 'स्लॉट खुला है:' : 'Slot Opened:'}{' '}
                              {entry.notifiedSlot.date} · {entry.notifiedSlot.timeSlot}
                            </strong>{' '}
                            —{' '}
                            {isHi
                              ? 'यह अभी कन्फर्म बुकिंग नहीं है। कृपया स्लॉट सुरक्षित करने के लिए तुरंत "उपलब्ध स्लॉट बुक करें" पर क्लिक करें।'
                              : 'This alert is NOT a confirmed appointment yet. Click "Book Available Slot" to complete booking before someone else books it.'}
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {tab === 'notifications' && (
              <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-[#0B2D52] flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#1C7ED6]" aria-hidden="true" />
                    <span>{t.portal.notifications}</span>
                  </h2>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-[#1C7ED6] hover:underline inline-flex items-center gap-1 py-1"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t.portal.markAllRead}</span>
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p className="text-sm text-[#5C6F84]">{t.portal.noNotifications}</p>
                ) : (
                  <div className="divide-y divide-[#E2EAF2]">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`py-3.5 ${n.read ? 'opacity-75' : 'font-medium'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-[#0B2D52]">
                            {isHi ? n.titleHi : n.title}
                          </h3>
                          <span className="text-[11px] font-mono text-[#5C6F84] tabular-nums">
                            {n.createdAt.slice(0, 10)}
                          </span>
                        </div>
                        <p className="text-sm text-[#5C6F84] mt-1">
                          {isHi ? n.messageHi : n.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'profile' && (
              <form
                onSubmit={handleSaveProfile}
                className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs max-w-xl space-y-4"
              >
                <h2 className="font-display text-lg font-bold text-[#0B2D52] flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[#1C7ED6]" aria-hidden="true" />
                  <span>{t.portal.patient.profile}</span>
                </h2>
                <div className="space-y-1.5">
                  <label htmlFor="prof-name" className="block text-xs font-semibold text-[#0B2D52]">
                    {t.auth.name} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="prof-name"
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-[#E2EAF2] rounded-xl focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="prof-phone" className="block text-xs font-semibold text-[#0B2D52]">
                    {t.auth.phone} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="prof-phone"
                    type="tel"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-[#E2EAF2] rounded-xl tabular-nums focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] disabled:opacity-60 rounded-xl transition-colors"
                >
                  {t.portal.patient.saveProfile}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <AppointmentSlipModal
        appointmentId={slipAppointmentId}
        onClose={() => setSlipAppointmentId(null)}
      />
    </div>
  );
}
