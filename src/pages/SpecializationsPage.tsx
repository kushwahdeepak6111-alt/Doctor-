import React, { useMemo, useState } from 'react';
import { ArrowRight, Calendar, Check, Clock, RotateCcw, Search } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useT, WEEKDAY_LABELS } from '../i18n/translations';
import { SpecializationIcon } from '../components/SpecializationIcon';
import { searchDoctors } from '../lib/clinicCatalog';
import type { WeekdayKey } from '../types/clinic';

const WEEKDAYS: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function SpecializationsPage() {
  const { language, specializations, doctors, navigate, startBookingWith } = useClinic();
  const t = useT(language);
  const isHi = language === 'hi';

  const [selectedSlug, setSelectedSlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState<WeekdayKey | ''>('');
  const [dateFilter, setDateFilter] = useState('');

  const selectedSpec = specializations.find((s) => s.slug === selectedSlug);
  const usingDoctorFilter = Boolean(searchQuery.trim() || dayFilter || dateFilter);

  const searchResults = useMemo(
    () =>
      searchDoctors({
        doctors,
        specializations,
        q: searchQuery,
        specializationId: selectedSpec?.id || 'all',
        day: dayFilter,
        date: dateFilter,
      }),
    [doctors, specializations, searchQuery, selectedSpec, dayFilter, dateFilter]
  );

  const visibleSpecs =
    selectedSlug === 'all'
      ? specializations
      : specializations.filter((s) => s.slug === selectedSlug);

  const availabilityByDoctor = useMemo(
    () => new Map(searchResults.map((r) => [r.doctor.id, r])),
    [searchResults]
  );

  return (
    <div className="bg-white min-h-[70vh]">
      <section className="bg-[#F4F8FC] border-b border-[#E2EAF2]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-6">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold text-[#1C7ED6]">
              {t.specializationsSection.eyebrow}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0B2D52]">
              {t.specializationsSection.title}
            </h1>
            <p className="text-[15px] text-[#5C6F84] leading-relaxed">
              {t.specializationsSection.subtitle}
            </p>
          </div>

          {/* Interactive Department Filter Tabs */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter medical departments">
            <button
              type="button"
              onClick={() => setSelectedSlug('all')}
              className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                selectedSlug === 'all'
                  ? 'bg-[#0B2D52] text-white border-[#0B2D52]'
                  : 'bg-white text-[#10233B] border-[#E2EAF2] hover:bg-[#EAF3FC]'
              }`}
            >
              {t.doctorsSection.filterAll}
            </button>
            {specializations.map((spec) => (
              <button
                key={spec.id}
                type="button"
                onClick={() => setSelectedSlug(spec.slug)}
                className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                  selectedSlug === spec.slug
                    ? 'bg-[#0B2D52] text-white border-[#0B2D52]'
                    : 'bg-white text-[#10233B] border-[#E2EAF2] hover:bg-[#EAF3FC]'
                }`}
              >
                {isHi ? spec.nameHi : spec.name}
              </button>
            ))}
          </div>

          {/* Smart Doctor & Availability Filter Bar inside Specializations */}
          <div className="bg-white border border-[#E2EAF2] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-5 relative">
              <Search
                className="w-4 h-4 text-[#5C6F84] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isHi
                    ? 'विभाग में चिकित्सक या विशेषज्ञता खोजें...'
                    : 'Filter specialists by doctor name or condition...'
                }
                className="w-full min-h-[40px] pl-10 pr-3 py-1.5 text-sm bg-[#F8FBFF] border border-[#E2EAF2] rounded-xl text-[#10233B]"
              />
            </div>

            <div className="lg:col-span-3">
              <select
                aria-label={isHi ? 'कार्यदिवस चुनें' : 'Available day'}
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value as WeekdayKey | '')}
                className="w-full min-h-[40px] px-3 py-1.5 text-sm bg-[#F8FBFF] border border-[#E2EAF2] rounded-xl text-[#10233B]"
              >
                <option value="">{isHi ? 'कोई भी उपलब्ध दिन' : 'Any Available Day'}</option>
                {WEEKDAYS.map((wk) => (
                  <option key={wk} value={wk}>
                    {isHi ? WEEKDAY_LABELS[wk].hi : WEEKDAY_LABELS[wk].en}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3 relative">
              <Calendar
                className="w-4 h-4 text-[#5C6F84] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                aria-label={isHi ? 'उपलब्ध तिथि चुनें' : 'Filter by available date'}
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 text-xs font-mono bg-[#F8FBFF] border border-[#E2EAF2] rounded-xl text-[#10233B] tabular-nums"
              />
            </div>

            <div className="lg:col-span-1 flex justify-end">
              {usingDoctorFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDayFilter('');
                    setDateFilter('');
                  }}
                  title={isHi ? 'फ़िल्टर साफ़ करें' : 'Clear Filters'}
                  className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-[#1C7ED6] hover:bg-[#EAF3FC] rounded-xl inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="lg:hidden">{isHi ? 'साफ़ करें' : 'Clear'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-6">
        {usingDoctorFilter && (
          <div className="rounded-2xl border border-[#C5DDF8] bg-[#F4F8FC] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm font-bold text-[#0B2D52]">
                {isHi
                  ? `${searchResults.length} मिलान करने वाले विशेषज्ञ मिले`
                  : `${searchResults.length} matching specialist${searchResults.length === 1 ? '' : 's'} found`}
              </h2>
              <button
                type="button"
                onClick={() => navigate('/doctors')}
                className="text-xs font-semibold text-[#1C7ED6] hover:underline cursor-pointer"
              >
                {isHi ? 'पूर्ण चिकित्सक खोज खोलें →' : 'Open full doctor directory →'}
              </button>
            </div>

            {searchResults.length === 0 ? (
              <p className="text-xs text-[#5C6F84]">
                {isHi
                  ? 'चयनित फ़िल्टर के अनुसार कोई डॉक्टर स्लॉट नहीं मिला।'
                  : 'No specialists matched the selected date, day, or search filter.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResults.map((res) => (
                  <div
                    key={res.doctor.id}
                    className="bg-white border border-[#E2EAF2] rounded-xl p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#0B2D52] truncate">
                        {isHi ? res.doctor.nameHi : res.doctor.name}
                      </p>
                      <p className="text-xs text-[#5C6F84] truncate">
                        {isHi ? res.doctor.qualificationHi : res.doctor.qualification}
                      </p>
                      {res.nextAvailableDate && res.nextAvailableSlot && (
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#1C7ED6] tabular-nums">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          {res.nextAvailableDate} · {res.nextAvailableSlot} ({res.availableCount}{' '}
                          {isHi ? 'स्लॉट' : 'open'})
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        startBookingWith({
                          doctorId: res.doctor.id,
                          date: res.nextAvailableDate || undefined,
                        })
                      }
                      className="shrink-0 px-3 py-2 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-lg cursor-pointer"
                    >
                      {isHi ? 'बुक करें' : 'Book'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {visibleSpecs.map((spec) => {
          const deptDoctors = doctors.filter((d) => d.specializationId === spec.id);
          const conditions =
            language === 'hi' ? spec.commonConditionsHi : spec.commonConditions;

          return (
            <article
              key={spec.id}
              className="border border-[#E2EAF2] rounded-2xl p-6 sm:p-8 bg-white grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#EAF3FC] text-[#1C7ED6] flex items-center justify-center shrink-0">
                    <SpecializationIcon iconKey={spec.iconKey} className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0B2D52]">
                      {language === 'hi' ? spec.nameHi : spec.name}
                    </h2>
                    <p className="text-xs text-[#5C6F84]">
                      {deptDoctors.length}{' '}
                      {language === 'hi' ? 'परामर्श चिकित्सक' : 'Assigned Consultants'}
                    </p>
                  </div>
                </div>

                <p className="text-[15px] text-[#10233B]/90 leading-relaxed">
                  {language === 'hi' ? spec.overviewHi : spec.overview}
                </p>

                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-[#5C6F84]">
                    {language === 'hi' ? 'प्रमुख परामर्श क्षेत्र' : 'Clinical Scope & Consultations'}
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {conditions.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-sm text-[#10233B]">
                        <Check className="w-4 h-4 text-[#1C7ED6] shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between bg-[#F4F8FC] rounded-xl p-5 border border-[#E2EAF2] gap-5">
                <div className="space-y-3">
                  <h3 className="font-display text-sm font-bold text-[#0B2D52]">
                    {t.specializationsSection.assignedDoctors}
                  </h3>
                  {deptDoctors.length === 0 ? (
                    <p className="text-xs text-[#5C6F84]">
                      {language === 'hi'
                        ? 'इस विभाग के लिए डॉक्टर रोस्टर क्लिनिक डेस्क द्वारा समन्वित किया जाता है।'
                        : 'Consultations in this department are coordinated through our reception desk.'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {deptDoctors.map((doc) => {
                        const meta = availabilityByDoctor.get(doc.id);
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between gap-3 bg-white border border-[#E2EAF2] rounded-xl p-3.5"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#0B2D52] truncate">
                                {language === 'hi' ? doc.nameHi : doc.name}
                              </p>
                              <p className="text-xs text-[#5C6F84] truncate">
                                {language === 'hi' ? doc.qualificationHi : doc.qualification}
                              </p>
                              {meta?.nextAvailableDate && meta?.nextAvailableSlot && (
                                <p className="text-[11px] text-[#1C7ED6] font-medium mt-0.5 tabular-nums">
                                  {meta.nextAvailableDate} · {meta.nextAvailableSlot}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => navigate(`/doctors/${doc.slug}`)}
                              className="shrink-0 text-xs font-semibold text-[#1C7ED6] hover:text-[#1868B2] whitespace-nowrap"
                            >
                              {t.doctorsSection.viewProfile}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => startBookingWith({ specializationId: spec.id })}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
                >
                  <span>{t.specializationsSection.bookDept}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
