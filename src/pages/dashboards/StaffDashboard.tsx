import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarPlus,
  Check,
  Clock,
  FileText,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { apiFetch } from '../../lib/authFetch';
import { useT } from '../../i18n/translations';
import { AppointmentSlipModal } from '../../components/AppointmentSlipModal';
import { StatusIndicator } from '../../components/StatusIndicator';
import type {
  Appointment,
  AppointmentStatus,
  AvailabilitySlot,
  ContactMessage,
} from '../../types/clinic';

export function StaffDashboard() {
  const { language, user, doctors, specializations, logout, addToast } = useClinic();
  const t = useT(language);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inquiries, setInquiries] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState<'pending' | 'confirmed' | 'cancelled' | 'availability' | 'inquiries'>('pending');
  const [search, setSearch] = useState('');
  const [slipAppointmentId, setSlipAppointmentId] = useState<string | null>(null);

  // Doctor availability lookup state
  const [availDocId, setAvailDocId] = useState(doctors[0]?.id || '');
  const [availDate, setAvailDate] = useState(new Date().toISOString().slice(0, 10));
  const [availSlots, setAvailSlots] = useState<AvailabilitySlot[]>([]);

  // Assisted booking modal
  const [assistOpen, setAssistOpen] = useState(false);
  const [assistDocId, setAssistDocId] = useState(doctors[0]?.id || '');
  const [assistDate, setAssistDate] = useState(new Date().toISOString().slice(0, 10));
  const [assistSlot, setAssistSlot] = useState('');
  const [assistSlots, setAssistSlots] = useState<AvailabilitySlot[]>([]);
  const [assistSlotsLoading, setAssistSlotsLoading] = useState(false);
  const [assistSubmitting, setAssistSubmitting] = useState(false);
  const [assistName, setAssistName] = useState('');
  const [assistPhone, setAssistPhone] = useState('');
  const [assistEmail, setAssistEmail] = useState('');
  const [assistReason, setAssistReason] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await apiFetch('/api/admin/overview', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(
          language === 'hi'
            ? 'रिसेप्शन डेटा लोड करने में समस्या हुई।'
            : 'Unable to load reception desk records.'
        );
      }
      const data = await res.json();
      setAppointments(data.appointments || []);
      setInquiries(data.contactMessages || []);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : language === 'hi'
            ? 'नेटवर्क त्रुटि।'
            : 'Network error while loading desk overview.'
      );
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!availDocId && doctors[0]?.id) setAvailDocId(doctors[0].id);
    if (!assistDocId && doctors[0]?.id) setAssistDocId(doctors[0].id);
  }, [doctors, availDocId, assistDocId]);

  useEffect(() => {
    if (!availDocId || !availDate) return;
    apiFetch(`/api/availability?doctorId=${encodeURIComponent(availDocId)}&date=${encodeURIComponent(availDate)}`)
      .then((r) => r.json())
      .then((d) => setAvailSlots(d.slots || []))
      .catch(() => setAvailSlots([]));
  }, [availDocId, availDate, appointments]);

  useEffect(() => {
    if (!assistOpen || !assistDocId || !assistDate) return;
    setAssistSlotsLoading(true);
    apiFetch(`/api/availability?doctorId=${encodeURIComponent(assistDocId)}&date=${encodeURIComponent(assistDate)}`)
      .then((r) => r.json())
      .then((d) => setAssistSlots(d.slots || []))
      .catch(() => setAssistSlots([]))
      .finally(() => setAssistSlotsLoading(false));
  }, [assistOpen, assistDocId, assistDate]);

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    const res = await apiFetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      addToast(language === 'hi' ? 'स्थिति अपडेट हो गई।' : `Appointment marked ${status}.`, 'success');
      void loadOverview();
    } else {
      addToast(language === 'hi' ? 'अपडेट विफल रहा।' : 'Unable to update appointment status.', 'error');
    }
  };

  const handleMarkInquiryReviewed = async (id: string) => {
    const res = await apiFetch(`/api/contact/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'reviewed' }),
    });
    if (res.ok) {
      addToast(language === 'hi' ? 'संदेश समीक्षित चिह्नित।' : 'Inquiry marked reviewed.', 'success');
      void loadOverview();
    }
  };

  const handleAssistBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = doctors.find((d) => d.id === assistDocId);
    if (!doc || !assistSlot) return;
    setAssistSubmitting(true);
    try {
      const res = await apiFetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          doctorId: doc.id,
          specializationId: doc.specializationId,
          date: assistDate,
          timeSlot: assistSlot,
          patientName: assistName,
          patientPhone: assistPhone,
          patientEmail: assistEmail || 'walkin@arogyaclinic.in',
          reason: assistReason,
          autoConfirmByStaff: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Booking failed', 'error');
        return;
      }
      addToast(
        language === 'hi' ? 'रोगी अपॉइंटमेंट कन्फर्म किया गया।' : 'Assisted appointment confirmed.',
        'success'
      );
      setAssistOpen(false);
      setAssistName('');
      setAssistPhone('');
      setAssistEmail('');
      setAssistReason('');
      setAssistSlot('');
      void loadOverview();
    } finally {
      setAssistSubmitting(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appointments
      .filter((a) => {
        if (tab === 'pending') return a.status === 'pending';
        if (tab === 'confirmed') return a.status === 'confirmed';
        if (tab === 'cancelled') return a.status === 'cancelled';
        return true;
      })
      .filter((a) => {
        if (!q) return true;
        return (
          a.patientName.toLowerCase().includes(q) ||
          a.referenceCode.toLowerCase().includes(q) ||
          a.patientPhone.toLowerCase().includes(q)
        );
      });
  }, [appointments, tab, search]);

  const openAssistSlots = assistSlots.filter((s) => s.status === 'available');

  return (
    <div className="bg-[#F4F8FC] min-h-[82vh] py-8 lg:py-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#1C7ED6]">{t.portal.staff.welcome}</p>
            <h1 className="font-display text-2xl font-bold text-[#0B2D52] mt-0.5">{user?.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setAssistOpen(true)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl whitespace-nowrap transition-colors"
            >
              <CalendarPlus className="w-4 h-4" aria-hidden="true" />
              <span>{t.portal.staff.assistBook}</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#E2EAF2]/60 border border-[#E2EAF2] rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>{t.portal.signOut}</span>
            </button>
          </div>
        </div>

        {/* Fast Operations Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: 'pending',
                label: `${t.portal.staff.pendingQueue} (${appointments.filter((a) => a.status === 'pending').length})`,
              },
              {
                id: 'confirmed',
                label: `${t.portal.staff.confirmedList} (${appointments.filter((a) => a.status === 'confirmed').length})`,
              },
              {
                id: 'cancelled',
                label: `${t.portal.staff.cancelledList} (${appointments.filter((a) => a.status === 'cancelled').length})`,
              },
              { id: 'availability', label: t.portal.staff.doctorAvail },
              { id: 'inquiries', label: `${t.portal.staff.inquiries} (${inquiries.length})` },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as typeof tab)}
                className={`min-h-[42px] px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                  tab === item.id
                    ? 'bg-[#0B2D52] text-white border-[#0B2D52]'
                    : 'bg-white text-[#10233B] border-[#E2EAF2] hover:bg-[#EAF3FC]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab !== 'availability' && tab !== 'inquiries' && (
            <div className="relative md:w-72">
              <Search
                className="w-4 h-4 text-[#5C6F84] absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === 'hi' ? 'रोगी, फ़ोन या कोड खोजें...' : 'Search patient, phone, or ref...'}
                aria-label={language === 'hi' ? 'रोगी या कोड खोजें' : 'Search patient or reference code'}
                className="w-full min-h-[42px] pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E2EAF2] rounded-xl focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none"
              />
            </div>
          )}
        </div>

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
              onClick={() => void loadOverview()}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white border border-rose-200 rounded-lg text-rose-800 hover:bg-rose-100"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <div className="h-28 bg-white border border-[#E2EAF2] rounded-2xl animate-pulse" />
            <div className="h-28 bg-white border border-[#E2EAF2] rounded-2xl animate-pulse" />
          </div>
        ) : tab === 'availability' ? (
          <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0B2D52]">
                  {t.booking.steps[1]}
                </label>
                <select
                  value={availDocId}
                  onChange={(e) => setAvailDocId(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'hi' ? d.nameHi : d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0B2D52]">
                  {t.booking.steps[2]}
                </label>
                <input
                  type="date"
                  value={availDate}
                  onChange={(e) => setAvailDate(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-sm font-mono border border-[#E2EAF2] rounded-xl"
                />
              </div>
            </div>
            {availSlots.length === 0 ? (
              <p className="text-sm text-[#5C6F84]">{t.booking.noSlots}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {availSlots.map((s) => (
                  <div
                    key={s.time}
                    className={`rounded-xl border px-3 py-2.5 font-mono text-xs font-semibold tabular-nums flex items-center justify-between ${
                      s.status === 'booked'
                        ? 'bg-slate-100 text-[#5C6F84] border-[#E2EAF2]'
                        : 'bg-[#EAF3FC] text-[#0B2D52] border-[#C5DDF8]'
                    }`}
                  >
                    <span>{s.time}</span>
                    <span>{s.status === 'booked' ? t.booking.booked : t.booking.available}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : tab === 'inquiries' ? (
          <div className="bg-white border border-[#E2EAF2] rounded-2xl shadow-xs divide-y divide-[#E2EAF2]">
            {inquiries.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#5C6F84]">
                {language === 'hi' ? 'कोई संपर्क संदेश नहीं।' : 'No contact inquiries yet.'}
              </div>
            ) : (
              inquiries.map((msg) => (
                <div key={msg.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C6F84]">
                      <Mail className="w-3.5 h-3.5 text-[#1C7ED6]" aria-hidden="true" />
                      <span className="font-semibold text-[#0B2D52]">{msg.name}</span>
                      <span>·</span>
                      <span>{msg.email}</span>
                      <span>·</span>
                      <span className="font-mono">{msg.createdAt.slice(0, 10)}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#0B2D52]">{msg.subject}</p>
                    <p className="text-sm text-[#5C6F84]">{msg.message}</p>
                  </div>
                  {msg.status === 'new' ? (
                    <button
                      type="button"
                      onClick={() => handleMarkInquiryReviewed(msg.id)}
                      className="self-start sm:self-center min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl whitespace-nowrap transition-colors"
                    >
                      {language === 'hi' ? 'समीक्षित चिह्नित करें' : 'Mark Reviewed'}
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-[#0B2D52] inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      {language === 'hi' ? 'समीक्षित' : 'Reviewed'}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white border border-[#E2EAF2] rounded-2xl p-8 text-center space-y-2 shadow-xs">
                <p className="text-sm text-[#5C6F84]">
                  {language === 'hi' ? 'कोई रिकॉर्ड नहीं मिला।' : 'No matching appointments.'}
                </p>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-xs font-semibold text-[#1C7ED6] hover:underline"
                  >
                    {language === 'hi' ? 'खोज साफ़ करें' : 'Clear search'}
                  </button>
                )}
              </div>
            ) : (
              filteredAppointments.map((appt) => {
                const doc = doctors.find((d) => d.id === appt.doctorId);
                const spec = specializations.find((s) => s.id === appt.specializationId);
                return (
                  <div
                    key={appt.id}
                    className="bg-white border border-[#E2EAF2] rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <StatusIndicator status={appt.status} language={language} />
                        <span className="font-mono text-xs text-[#5C6F84] tabular-nums">
                          {appt.referenceCode}
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#0B2D52] tabular-nums">
                          {appt.date} · {appt.timeSlot}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-bold text-[#0B2D52]">
                        {appt.patientName} ·{' '}
                        <span className="font-mono font-normal text-sm">{appt.patientPhone}</span>
                      </h3>
                      <p className="text-xs text-[#1C7ED6] font-medium">
                        {doc ? (language === 'hi' ? doc.nameHi : doc.name) : ''} ·{' '}
                        {spec ? (language === 'hi' ? spec.nameHi : spec.name) : ''}
                      </p>
                      <p className="text-sm text-[#5C6F84]">{appt.reason}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      {(appt.status === 'pending' || appt.status === 'confirmed' || appt.status === 'completed') && (
                        <button
                          type="button"
                          onClick={() => setSlipAppointmentId(appt.id)}
                          className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#EAF3FC] border border-[#E2EAF2] rounded-xl transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#1C7ED6]" aria-hidden="true" />
                          <span>{appt.status === 'pending' ? 'Receipt' : 'Slip / PDF'}</span>
                        </button>
                      )}
                      {appt.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateStatus(appt.id, 'confirmed')}
                            className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
                          >
                            {t.portal.doctor.confirm}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(appt.id, 'rejected')}
                            className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                          >
                            {language === 'hi' ? 'अस्वीकार' : 'Reject'}
                          </button>
                        </>
                      )}
                      {(appt.status === 'pending' || appt.status === 'confirmed') && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateStatus(appt.id, 'completed')}
                            className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-xl transition-colors"
                          >
                            {t.portal.doctor.complete}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(appt.id, 'cancelled')}
                            className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                          >
                            {t.portal.doctor.cancel}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Assisted Booking Modal */}
      {assistOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assist-modal-title"
          className="fixed inset-0 z-50 bg-[#071A30]/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E2EAF2] rounded-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between">
              <h2 id="assist-modal-title" className="font-display text-lg font-bold text-[#0B2D52]">
                {t.portal.staff.assistBook}
              </h2>
              <button
                type="button"
                onClick={() => setAssistOpen(false)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#5C6F84] hover:bg-[#F4F8FC]"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssistBook} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0B2D52]">
                    {t.booking.steps[1]} <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={assistDocId}
                    onChange={(e) => {
                      setAssistDocId(e.target.value);
                      setAssistSlot('');
                    }}
                    className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {language === 'hi' ? d.nameHi : d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0B2D52]">
                    {t.booking.steps[2]} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={assistDate}
                    onChange={(e) => {
                      setAssistDate(e.target.value);
                      setAssistSlot('');
                    }}
                    className="w-full min-h-[42px] px-3 py-2 text-sm font-mono border border-[#E2EAF2] rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-[#0B2D52]">
                  {t.booking.steps[3]} <span className="text-rose-600">*</span>
                </span>
                {assistSlotsLoading ? (
                  <p className="text-xs text-[#5C6F84]">
                    {language === 'hi' ? 'उपलब्ध स्लॉट लोड हो रहे हैं...' : 'Loading available slots...'}
                  </p>
                ) : openAssistSlots.length === 0 ? (
                  <p className="text-xs text-[#5C6F84] bg-[#F4F8FC] border border-[#E2EAF2] rounded-xl p-3">
                    {t.booking.noSlots}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {openAssistSlots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        onClick={() => setAssistSlot(s.time)}
                        className={`min-h-[36px] px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                          assistSlot === s.time
                            ? 'bg-[#1C7ED6] text-white border-[#1C7ED6]'
                            : 'bg-white text-[#0B2D52] border-[#E2EAF2] hover:border-[#1C7ED6]'
                        }`}
                      >
                        <Clock className="w-3 h-3 inline mr-1" aria-hidden="true" />
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0B2D52]">
                  {t.booking.patientName} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.booking.patientName}
                  value={assistName}
                  onChange={(e) => setAssistName(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0B2D52]">
                    {t.booking.patientPhone} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder={t.booking.patientPhone}
                    value={assistPhone}
                    onChange={(e) => setAssistPhone(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0B2D52]">
                    {t.booking.patientEmail}
                  </label>
                  <input
                    type="email"
                    placeholder={t.booking.patientEmail}
                    value={assistEmail}
                    onChange={(e) => setAssistEmail(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0B2D52]">
                  {t.booking.visitReason} <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder={t.booking.visitReason}
                  value={assistReason}
                  onChange={(e) => setAssistReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={!assistSlot || assistSubmitting}
                className="w-full min-h-[44px] px-4 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] disabled:opacity-50 rounded-xl transition-colors"
              >
                {language === 'hi' ? 'कन्फर्म अपॉइंटमेंट बनाएं' : 'Create Confirmed Appointment'}
              </button>
            </form>
          </div>
        </div>
      )}
      <AppointmentSlipModal
        appointmentId={slipAppointmentId}
        onClose={() => setSlipAppointmentId(null)}
      />
    </div>
  );
}
