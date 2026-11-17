import React, { useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, Globe2, GraduationCap, Stethoscope } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useT, WEEKDAY_LABELS } from '../i18n/translations';
import { resolveClinicImage } from '../lib/clinicImages';
import type { WeekdayKey } from '../types/clinic';

const WEEK_ORDER: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function DoctorDetailPage({ slug }: { slug: string }) {
  const { language, doctors, specializations, navigate, startBookingWith } = useClinic();
  const t = useT(language);
  const [imgError, setImgError] = useState(false);

  const doctor = doctors.find((d) => d.slug === slug);
  if (!doctor) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#0B2D52]">
          {language === 'hi' ? 'चिकित्सक प्रोफ़ाइल नहीं मिली' : 'Doctor Profile Not Found'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/doctors')}
          className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] rounded-xl"
        >
          {t.doctorsSection.viewAll}
        </button>
      </div>
    );
  }

  const spec = specializations.find((s) => s.id === doctor.specializationId);
  const name = language === 'hi' ? doctor.nameHi : doctor.name;
  const qualification = language === 'hi' ? doctor.qualificationHi : doctor.qualification;
  const summary = language === 'hi' ? doctor.experienceSummaryHi : doctor.experienceSummary;
  const bio = language === 'hi' ? doctor.bioHi : doctor.bio;
  const specName = spec ? (language === 'hi' ? spec.nameHi : spec.name) : '';
  const conditions = spec ? (language === 'hi' ? spec.commonConditionsHi : spec.commonConditions) : [];

  return (
    <div className="bg-white">
      <div className="border-b border-[#E2EAF2] bg-[#F4F8FC]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            type="button"
            onClick={() => navigate('/doctors')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B2D52] hover:text-[#1C7ED6] py-1"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{t.doctorsSection.viewAll}</span>
          </button>
        </div>
      </div>

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Portrait Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#E2EAF2] shadow-xs bg-[#F4F8FC]">
              {!imgError ? (
                <img
                  src={resolveClinicImage(doctor.imageKey)}
                  alt={name}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#EAF3FC] text-[#0B2D52] p-6 text-center">
                  <Stethoscope className="w-10 h-10 text-[#1C7ED6] mb-2" aria-hidden="true" />
                  <span className="font-display font-semibold text-sm">{name}</span>
                </div>
              )}
            </div>

            <div className="border border-[#E2EAF2] rounded-2xl p-5 bg-[#F4F8FC] space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5C6F84]">{t.doctorsSection.feeLabel}</span>
                <span className="font-mono font-bold text-[#0B2D52] tabular-nums">
                  ₹{doctor.consultationFee}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-[#E2EAF2]">
                <span className="text-[#5C6F84]">{t.doctorsSection.languagesLabel}</span>
                <span className="font-medium text-[#0B2D52]">
                  {(language === 'hi' ? doctor.languagesHi : doctor.languages).join(', ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => startBookingWith({ doctorId: doctor.id })}
                className="w-full min-h-[46px] mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
              >
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>{t.doctorsSection.bookVisit}</span>
              </button>
            </div>
          </div>

          {/* Details & Schedule Column */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-3 pb-6 border-b border-[#E2EAF2]">
              <p className="text-xs font-semibold text-[#1C7ED6]">{specName}</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0B2D52]">
                {name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#5C6F84]">
                <span className="inline-flex items-center gap-1.5 text-[#0B2D52] font-medium">
                  <GraduationCap className="w-4 h-4 text-[#1C7ED6]" aria-hidden="true" />
                  {qualification}
                </span>
                <span aria-hidden="true">·</span>
                <span>{summary}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Globe2 className="w-4 h-4 text-[#1C7ED6]" aria-hidden="true" />
                  {(language === 'hi' ? doctor.languagesHi : doctor.languages).join(', ')}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                {language === 'hi' ? 'चिकित्सक परिचय' : 'Clinical Overview'}
              </h2>
              <p className="text-[15px] text-[#10233B]/90 leading-relaxed">{bio}</p>
            </div>

            {conditions.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                  {language === 'hi' ? 'प्रमुख परामर्श सेवाएं' : 'Consultations & Services'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {conditions.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2.5 border border-[#E2EAF2] rounded-xl p-3.5 bg-[#F4F8FC]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#1C7ED6] shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="text-sm text-[#10233B]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                {t.doctorsSection.scheduleLabel}
              </h2>
              <div className="border border-[#E2EAF2] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F4F8FC] border-b border-[#E2EAF2] text-xs font-semibold text-[#5C6F84]">
                      <th className="px-4 py-3">{language === 'hi' ? 'दिन' : 'Day'}</th>
                      <th className="px-4 py-3">{language === 'hi' ? 'ओपीडी समय' : 'OPD Hours'}</th>
                      <th className="px-4 py-3 text-right">{language === 'hi' ? 'स्लॉट अवधि' : 'Slot Duration'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2EAF2] text-sm">
                    {WEEK_ORDER.map((day) => {
                      const row = doctor.schedule[day];
                      return (
                        <tr key={day} className="hover:bg-[#F4F8FC]/60">
                          <td className="px-4 py-3 font-medium text-[#0B2D52]">
                            {language === 'hi' ? WEEKDAY_LABELS[day].hi : WEEKDAY_LABELS[day].en}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {row.enabled ? (
                              <span className="text-[#0B2D52] font-medium font-mono">
                                {row.start} – {row.end}
                              </span>
                            ) : (
                              <span className="text-[#5C6F84]">{t.doctorsSection.closedDay}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-[#5C6F84] font-mono tabular-nums">
                            {row.enabled ? `${row.slotMinutes} min` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
