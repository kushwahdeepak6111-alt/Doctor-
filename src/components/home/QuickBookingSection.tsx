import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useT } from '../../i18n/translations';
import type { AvailabilitySlot } from '../../types/clinic';

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function QuickBookingSection() {
  const { language, navigate, specializations, doctors, setBookingDraft } = useClinic();
  const t = useT(language);

  const [qbSpecId, setQbSpecId] = useState('');
  const [qbDocId, setQbDocId] = useState('');
  const [qbDate, setQbDate] = useState(getTomorrowStr);
  const [qbSlot, setQbSlot] = useState('');
  const [qbSlots, setQbSlots] = useState<AvailabilitySlot[]>([]);
  const [qbLoading, setQbLoading] = useState(false);

  const qbDoctors = useMemo(() => {
    if (!qbSpecId) return doctors;
    return doctors.filter((d) => d.specializationId === qbSpecId);
  }, [doctors, qbSpecId]);

  useEffect(() => {
    if (!qbSpecId && specializations[0]?.id) {
      setQbSpecId(specializations[0].id);
    }
  }, [specializations, qbSpecId]);

  useEffect(() => {
    if (qbDoctors.length > 0 && !qbDoctors.some((d) => d.id === qbDocId)) {
      setQbDocId(qbDoctors[0].id);
      setQbSlot('');
    }
  }, [qbDoctors, qbDocId]);

  useEffect(() => {
    if (!qbDocId || !qbDate) {
      setQbSlots([]);
      return;
    }
    let active = true;
    setQbLoading(true);
    fetch(
      `/api/availability?doctorId=${encodeURIComponent(qbDocId)}&date=${encodeURIComponent(qbDate)}`
    )
      .then((r) => r.json())
      .then((d: { slots?: AvailabilitySlot[] }) => {
        if (!active) return;
        const available = (d.slots || []).filter((s) => s.status === 'available');
        setQbSlots(available);
        setQbSlot((prev) =>
          available.some((s) => s.time === prev) ? prev : available[0]?.time || ''
        );
      })
      .catch(() => {
        if (active) setQbSlots([]);
      })
      .finally(() => {
        if (active) setQbLoading(false);
      });
    return () => {
      active = false;
    };
  }, [qbDocId, qbDate]);

  const handleQuickBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qbDocId) {
      navigate('/book');
      return;
    }
    const doc = doctors.find((d) => d.id === qbDocId);
    setBookingDraft((prev) => ({
      ...prev,
      specializationId: doc?.specializationId || qbSpecId,
      doctorId: qbDocId,
      date: qbDate,
      timeSlot: qbSlot,
      step: qbSlot ? 5 : 4,
    }));
    navigate('/book');
  };

  return (
    <section id="section-quick-book" className="scroll-mt-16 bg-[#0B2D52] text-white">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-semibold tracking-wide uppercase text-[#7DD3FC]">
              {language === 'hi' ? 'सरल एवं सुविधाजनक' : 'Easy & Convenient'}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight max-w-lg">
              {language === 'hi'
                ? 'आज ही ऑनलाइन अपॉइंटमेंट बुक करें'
                : 'Book An Appointment Today, Online'}
            </h2>
            <p className="text-[15px] text-slate-200 leading-relaxed max-w-lg">
              {language === 'hi'
                ? 'कुछ ही चरणों में अपना विभाग, चिकित्सक और उपलब्ध समय चुनें। रिसेप्शन द्वारा पुष्टि के बाद आपको पोर्टल में अपडेट मिलेगा।'
                : 'Skip the waiting room queue—choose your department, preferred specialist, and live available time slot in seconds.'}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => navigate('/book')}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/25 rounded-full transition-colors"
              >
                <span>{t.hero.primaryCta}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Functional Quick-Booking Mini Card */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleQuickBookSubmit}
              className="bg-white text-[#10233B] rounded-2xl p-6 shadow-xl space-y-4 border border-[#E2EAF2]"
            >
              <h3 className="font-display text-lg font-bold text-[#0B2D52]">
                {language === 'hi' ? 'अपॉइंटमेंट चुनें' : 'Book Your Appointment'}
              </h3>

              <div className="space-y-3">
                <div>
                  <label htmlFor="qb-spec" className="block text-xs font-semibold text-[#5C6F84] mb-1">
                    {t.booking.steps[0]}
                  </label>
                  <select
                    id="qb-spec"
                    value={qbSpecId}
                    onChange={(e) => setQbSpecId(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl bg-[#F4F8FC]"
                  >
                    {specializations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {language === 'hi' ? s.nameHi : s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="qb-doc" className="block text-xs font-semibold text-[#5C6F84] mb-1">
                    {t.booking.steps[1]}
                  </label>
                  <select
                    id="qb-doc"
                    value={qbDocId}
                    onChange={(e) => setQbDocId(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl bg-[#F4F8FC]"
                  >
                    {qbDoctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {language === 'hi' ? d.nameHi : d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="qb-date" className="block text-xs font-semibold text-[#5C6F84] mb-1">
                      {t.booking.steps[2]}
                    </label>
                    <input
                      id="qb-date"
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={qbDate}
                      onChange={(e) => setQbDate(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 text-xs font-mono border border-[#E2EAF2] rounded-xl bg-[#F4F8FC] tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="qb-slot" className="block text-xs font-semibold text-[#5C6F84] mb-1">
                      {t.booking.steps[3]}
                    </label>
                    <select
                      id="qb-slot"
                      value={qbSlot}
                      disabled={qbLoading}
                      onChange={(e) => setQbSlot(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 text-xs font-mono border border-[#E2EAF2] rounded-xl bg-[#F4F8FC] tabular-nums disabled:opacity-60"
                    >
                      {qbLoading ? (
                        <option value="">
                          {language === 'hi' ? 'स्लॉट जांचे जा रहे हैं...' : 'Checking slots...'}
                        </option>
                      ) : qbSlots.length === 0 ? (
                        <option value="">
                          {language === 'hi' ? 'कोई स्लॉट नहीं' : 'No open slots'}
                        </option>
                      ) : (
                        qbSlots.map((s) => (
                          <option key={s.time} value={s.time}>
                            {s.time}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] px-5 py-3 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
              >
                {language === 'hi' ? 'आगे बढ़ें' : 'Book Now'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
