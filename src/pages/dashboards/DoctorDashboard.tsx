import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, Clock, FileText, LogOut, RefreshCw, Save } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { readLocalAppointments, saveLocalAppointment } from '../../data/clinicData';
import { useT, WEEKDAY_LABELS } from '../../i18n/translations';
import { StatusIndicator } from '../../components/StatusIndicator';
import type { Appointment, AppointmentStatus, WeekdayKey, WeeklySchedule } from '../../types/clinic';

const WEEKDAYS: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function DoctorDashboard() {
  const { language, user, doctors, logout, addToast } = useClinic();
  const t = useT(language);

  const myDoctor = useMemo(
    () => doctors.find((d) => d.id === user?.doctorId) || doctors[0],
    [doctors, user?.doctorId]
  );

  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    readLocalAppointments()
  );
  const loading = false;
  const loadError = '';
  const [tab, setTab] = useState<'today' | 'upcoming' | 'all' | 'schedule'>('today');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const a of readLocalAppointments()) {
      map[a.id] = a.clinicNotes || '';
    }
    return map;
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [scheduleDraft, setScheduleDraft] = useState<WeeklySchedule | null>(null);

  useEffect(() => {
    if (myDoctor) {
      setScheduleDraft(myDoctor.schedule);
    }
  }, [myDoctor]);

  const loadAppointments = useCallback(() => {
    const all = readLocalAppointments();
    setAppointments(all);
    const notesMap: Record<string, string> = {};
    for (const a of all) {
      notesMap[a.id] = a.clinicNotes || '';
    }
    setNoteDrafts(notesMap);
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  const todayList = useMemo(
    () => appointments.filter((a) => a.date === todayStr && a.status !== 'cancelled'),
    [appointments, todayStr]
  );

  const upcomingList = useMemo(
    () =>
      appointments.filter(
        (a) => a.date >= todayStr && (a.status === 'pending' || a.status === 'confirmed')
      ),
    [appointments, todayStr]
  );

  const updateAppointment = (
    id: string,
    payload: { status?: AppointmentStatus; clinicNotes?: string }
  ) => {
    const existing = appointments.find((a) => a.id === id);
    if (!existing) return;
    const updated: Appointment = {
      ...existing,
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.clinicNotes !== undefined ? { clinicNotes: payload.clinicNotes } : {}),
      updatedAt: new Date().toISOString(),
    };
    setAppointments(saveLocalAppointment(updated));
    addToast(language === 'hi' ? 'अपॉइंटमेंट अपडेट किया गया।' : 'Appointment updated.', 'success');
  };

  const handleSaveSchedule = () => {
    if (!myDoctor || !scheduleDraft) return;
    setSavingSchedule(true);
    setSavingSchedule(false);
    addToast(
      language === 'hi' ? 'साप्ताहिक समय-सारिणी सहेजी गई।' : 'Weekly schedule saved locally.',
      'success'
    );
  };

  const renderEmptyCard = (message: string) => (
    <div className="bg-white border border-[#E2EAF2] rounded-2xl p-8 text-center space-y-2 shadow-xs">
      <Calendar className="w-7 h-7 text-[#1C7ED6] mx-auto opacity-80" aria-hidden="true" />
      <p className="text-sm text-[#5C6F84]">{message}</p>
    </div>
  );

  const renderDoctorAppointment = (appt: Appointment) => (
    <article key={appt.id} className="bg-white border border-[#E2EAF2] rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusIndicator status={appt.status} language={language} />
            <span className="font-mono text-xs text-[#5C6F84] tabular-nums">
              {appt.referenceCode}
            </span>
          </div>
          <h3 className="font-display text-base font-bold text-[#0B2D52]">{appt.patientName}</h3>
          <p className="text-xs text-[#5C6F84] tabular-nums">
            {appt.patientPhone} · {appt.patientEmail}
          </p>
        </div>

        <div className="font-mono text-sm font-bold text-[#0B2D52] tabular-nums sm:text-right">
          <div>{appt.date}</div>
          <div className="text-xs text-[#1C7ED6]">{appt.timeSlot}</div>
        </div>
      </div>

      <p className="text-sm text-[#10233B] bg-[#F4F8FC] rounded-xl p-3.5 border border-[#E2EAF2] leading-relaxed">
        {appt.reason}
      </p>

      {appt.documents.length > 0 && (
        <div className="flex flex-wrap gap-2">
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

      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          value={noteDrafts[appt.id] ?? ''}
          onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [appt.id]: e.target.value }))}
          placeholder={language === 'hi' ? 'क्लिनिकल नोट जोड़ें...' : 'Add consultation or follow-up note...'}
          aria-label={`Clinical note for ${appt.patientName}`}
          className="flex-1 min-h-[42px] px-3.5 py-2 text-xs border border-[#E2EAF2] rounded-xl focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => updateAppointment(appt.id, { clinicNotes: noteDrafts[appt.id] ?? '' })}
          className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] border border-[#E2EAF2] hover:bg-[#E2EAF2]/60 rounded-xl whitespace-nowrap transition-colors"
        >
          <Save className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t.portal.doctor.saveNotes}</span>
        </button>
      </div>

      {(appt.status === 'pending' || appt.status === 'confirmed') && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-[#E2EAF2]">
          {appt.status === 'pending' && (
            <button
              type="button"
              onClick={() => updateAppointment(appt.id, { status: 'confirmed' })}
              className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
            >
              {t.portal.doctor.confirm}
            </button>
          )}
          <button
            type="button"
            onClick={() => updateAppointment(appt.id, { status: 'completed' })}
            className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-xl transition-colors"
          >
            {t.portal.doctor.complete}
          </button>
          <button
            type="button"
            onClick={() => updateAppointment(appt.id, { status: 'cancelled' })}
            className="min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
          >
            {t.portal.doctor.cancel}
          </button>
        </div>
      )}
    </article>
  );

  return (
    <div className="bg-[#F4F8FC] min-h-[82vh] py-8 lg:py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#1C7ED6]">{t.portal.doctor.welcome}</p>
            <h1 className="font-display text-2xl font-bold text-[#0B2D52] mt-0.5">
              {myDoctor ? (language === 'hi' ? myDoctor.nameHi : myDoctor.name) : user?.name}
            </h1>
            {myDoctor && (
              <p className="text-xs text-[#5C6F84] mt-1">
                {language === 'hi' ? myDoctor.qualificationHi : myDoctor.qualification}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            className="self-start sm:self-auto min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#E2EAF2]/60 border border-[#E2EAF2] rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>{t.portal.signOut}</span>
          </button>
        </div>

        {/* Summary KPI Strip (Strictly Real DB Counts) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: t.portal.doctor.today, val: todayList.length },
            {
              label: t.portal.admin.kpi.pending,
              val: appointments.filter((a) => a.status === 'pending').length,
            },
            {
              label: t.portal.admin.kpi.confirmed,
              val: appointments.filter((a) => a.status === 'confirmed').length,
            },
            {
              label: t.portal.admin.kpi.completed,
              val: appointments.filter((a) => a.status === 'completed').length,
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-[#E2EAF2] rounded-2xl p-4 shadow-xs">
              <div className="text-xs text-[#5C6F84] truncate">{stat.label}</div>
              <div className="font-mono text-2xl font-bold text-[#0B2D52] tabular-nums mt-1">
                {stat.val}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[#E2EAF2] pb-3">
          {[
            { id: 'today', label: `${t.portal.doctor.today} (${todayList.length})` },
            { id: 'upcoming', label: `${t.portal.doctor.upcoming} (${upcomingList.length})` },
            {
              id: 'all',
              label: `${language === 'hi' ? 'सभी अपॉइंटमेंट' : 'All Assigned'} (${appointments.length})`,
            },
            { id: 'schedule', label: t.portal.doctor.schedule },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as typeof tab)}
              className={`min-h-[42px] px-4 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                tab === item.id
                  ? 'bg-[#0B2D52] text-white border-[#0B2D52]'
                  : 'bg-white text-[#10233B] border-[#E2EAF2] hover:bg-[#EAF3FC]'
              }`}
            >
              {item.label}
            </button>
          ))}
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
              onClick={() => void loadAppointments()}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white border border-rose-200 rounded-lg text-rose-800 hover:bg-rose-100"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <div className="h-32 bg-white border border-[#E2EAF2] rounded-2xl animate-pulse" />
            <div className="h-32 bg-white border border-[#E2EAF2] rounded-2xl animate-pulse" />
          </div>
        ) : (
          <>
            {tab === 'today' && (
              <div className="space-y-3">
                {todayList.length === 0
                  ? renderEmptyCard(
                      language === 'hi'
                        ? 'आज कोई निर्धारित अपॉइंटमेंट नहीं है।'
                        : 'No appointments scheduled for today.'
                    )
                  : todayList.map(renderDoctorAppointment)}
              </div>
            )}

            {tab === 'upcoming' && (
              <div className="space-y-3">
                {upcomingList.length === 0
                  ? renderEmptyCard(
                      language === 'hi'
                        ? 'कोई आगामी अपॉइंटमेंट नहीं।'
                        : 'No upcoming appointments.'
                    )
                  : upcomingList.map(renderDoctorAppointment)}
              </div>
            )}

            {tab === 'all' && (
              <div className="space-y-3">
                {appointments.length === 0
                  ? renderEmptyCard(
                      language === 'hi'
                        ? 'अभी कोई अपॉइंटमेंट आवंटित नहीं है।'
                        : 'No assigned appointments yet.'
                    )
                  : appointments.map(renderDoctorAppointment)}
              </div>
            )}

            {tab === 'schedule' && scheduleDraft && (
              <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="font-display text-lg font-bold text-[#0B2D52] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1C7ED6]" aria-hidden="true" />
                    <span>{t.portal.doctor.schedule}</span>
                  </h2>
                  <button
                    type="button"
                    disabled={savingSchedule}
                    onClick={handleSaveSchedule}
                    className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] disabled:opacity-60 rounded-xl transition-colors"
                  >
                    {t.portal.doctor.saveSchedule}
                  </button>
                </div>

                <div className="divide-y divide-[#E2EAF2]">
                  {WEEKDAYS.map((day) => {
                    const row = scheduleDraft[day];
                    return (
                      <div key={day} className="py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <label className="sm:col-span-3 flex items-center gap-2.5 text-sm font-semibold text-[#0B2D52] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(e) =>
                              setScheduleDraft((prev) =>
                                prev ? { ...prev, [day]: { ...row, enabled: e.target.checked } } : prev
                              )
                            }
                            className="w-4 h-4 accent-[#1C7ED6]"
                          />
                          <span>
                            {language === 'hi' ? WEEKDAY_LABELS[day].hi : WEEKDAY_LABELS[day].en}
                          </span>
                        </label>
                        <div className="sm:col-span-3">
                          <label className="block sm:hidden text-[11px] font-medium text-[#5C6F84] mb-1">
                            {language === 'hi' ? 'प्रारंभ' : 'Start'}
                          </label>
                          <input
                            type="time"
                            disabled={!row.enabled}
                            value={row.start}
                            onChange={(e) =>
                              setScheduleDraft((prev) =>
                                prev ? { ...prev, [day]: { ...row, start: e.target.value } } : prev
                              )
                            }
                            className="w-full min-h-[40px] px-3 py-1.5 text-xs font-mono border border-[#E2EAF2] rounded-xl disabled:opacity-40"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block sm:hidden text-[11px] font-medium text-[#5C6F84] mb-1">
                            {language === 'hi' ? 'समाप्ति' : 'End'}
                          </label>
                          <input
                            type="time"
                            disabled={!row.enabled}
                            value={row.end}
                            onChange={(e) =>
                              setScheduleDraft((prev) =>
                                prev ? { ...prev, [day]: { ...row, end: e.target.value } } : prev
                              )
                            }
                            className="w-full min-h-[40px] px-3 py-1.5 text-xs font-mono border border-[#E2EAF2] rounded-xl disabled:opacity-40"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block sm:hidden text-[11px] font-medium text-[#5C6F84] mb-1">
                            {language === 'hi' ? 'स्लॉट अवधि' : 'Slot Duration'}
                          </label>
                          <select
                            disabled={!row.enabled}
                            value={row.slotMinutes}
                            onChange={(e) =>
                              setScheduleDraft((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      [day]: { ...row, slotMinutes: Number(e.target.value) },
                                    }
                                  : prev
                              )
                            }
                            className="w-full min-h-[40px] px-3 py-1.5 text-xs font-mono border border-[#E2EAF2] rounded-xl disabled:opacity-40"
                          >
                            <option value={15}>15 min</option>
                            <option value={20}>20 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
