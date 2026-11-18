import React, { useMemo, useState } from 'react';
import { Calendar, Filter, RotateCcw, Search } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useT, WEEKDAY_LABELS } from '../i18n/translations';
import { DoctorCard } from '../components/DoctorCard';
import { searchDoctorsStatic } from '../data/clinicData';
import type { WeekdayKey } from '../types/clinic';

const WEEKDAYS: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function DoctorsPage() {
  const { language, doctors, specializations, navigate } = useClinic();
  const t = useT(language);
  const isHi = language === 'hi';

  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('q') || '';
  });
  const [specFilter, setSpecFilter] = useState(() => {
    if (typeof window === 'undefined') return 'all';
    return new URLSearchParams(window.location.search).get('specializationId') || 'all';
  });
  const [dayFilter, setDayFilter] = useState<WeekdayKey | ''>('');
  const [dateFilter, setDateFilter] = useState('');

  const results = useMemo(
    () =>
      searchDoctorsStatic({
        doctors,
        specializations,
        q: search,
        specializationId: specFilter,
        day: dayFilter,
        date: dateFilter,
      }),
    [doctors, specializations, search, specFilter, dayFilter, dateFilter]
  );

  const hasActiveFilters = Boolean(
    search.trim() || specFilter !== 'all' || dayFilter || dateFilter
  );

  const handleClearFilters = () => {
    setSearch('');
    setSpecFilter('all');
    setDayFilter('');
    setDateFilter('');
  };

  return (
    <div className="bg-white min-h-[70vh]">
      <section className="bg-[#F4F8FC] border-b border-[#E2EAF2]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold text-[#1C7ED6]">{t.doctorsSection.eyebrow}</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0B2D52]">
              {t.doctorsSection.title}
            </h1>
            <p className="text-[15px] text-[#5C6F84] leading-relaxed">
              {t.doctorsSection.subtitle}
            </p>
          </div>

          {/* Smart Doctor Search & Filter Bar */}
          <div className="bg-white border border-[#E2EAF2] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0B2D52]">
                <Filter className="w-3.5 h-3.5 text-[#1C7ED6]" aria-hidden="true" />
                <span>
                  {isHi ? 'स्मार्ट चिकित्सक खोज एवं फ़िल्टर' : 'Smart Doctor Search & Availability Filter'}
                </span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C7ED6] hover:text-[#1868B2] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isHi ? 'फ़िल्टर साफ़ करें' : 'Clear Filters'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-4 relative">
                <Search
                  className="w-4 h-4 text-[#5C6F84] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    isHi
                      ? 'नाम, विभाग या विशेषज्ञता खोजें...'
                      : 'Search doctor name, department, or specialty...'
                  }
                  aria-label={t.doctorsSection.searchPlaceholder}
                  className="w-full min-h-[42px] pl-10 pr-3.5 py-2 text-sm bg-[#F8FBFF] border border-[#E2EAF2] rounded-xl text-[#10233B] placeholder:text-[#5C6F84]"
                />
              </div>

              <div className="lg:col-span-3">
                <select
                  aria-label={isHi ? 'चिकित्सा विभाग चुनें' : 'Filter by specialization'}
                  value={specFilter}
                  onChange={(e) => setSpecFilter(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#F8FBFF] border border-[#E2EAF2] rounded-xl text-[#10233B]"
                >
                  <option value="all">{t.doctorsSection.filterAll}</option>
                  {specializations.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {isHi ? spec.nameHi : spec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  aria-label={isHi ? 'उपलब्ध दिन चुनें' : 'Filter by available weekday'}
                  value={dayFilter}
                  onChange={(e) => setDayFilter(e.target.value as WeekdayKey | '')}
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-[#F8FBFF] border border-[#E2EAF2] rounded-xl text-[#10233B]"
                >
                  <option value="">{isHi ? 'सभी कार्यदिवस' : 'Any Available Day'}</option>
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
                  aria-label={isHi ? 'उपलब्ध तिथि चुनें' : 'Filter by available appointment date'}
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full min-h-[42px] pl-9 pr-3 py-2 text-sm font-mono bg-[#F8FBFF] border border-[#E2EAF2] rounded-xl text-[#10233B] tabular-nums"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C6F84]">
          <span>
            {isHi
              ? `${results.length} विशेषज्ञ चिकित्सक मिले`
              : `Showing ${results.length} specialist${results.length === 1 ? '' : 's'}`}
          </span>
          {dateFilter && (
            <span className="font-medium text-[#0B2D52]">
              {isHi
                ? `तिथि ${dateFilter} पर सत्यापित उपलब्धता`
                : `Filtered for open slots on ${dateFilter}`}
            </span>
          )}
        </div>

        {results.length === 0 ? (
          <div className="border border-[#E2EAF2] rounded-2xl p-10 text-center space-y-3 bg-[#F4F8FC]">
            <p className="font-display text-lg font-bold text-[#0B2D52]">
              {isHi ? 'इस खोज के अनुसार कोई चिकित्सक उपलब्ध नहीं है' : 'No specialists match these filters'}
            </p>
            <p className="text-sm text-[#5C6F84] max-w-md mx-auto">
              {dateFilter
                ? isHi
                  ? 'चयनित तिथि पर कोई खाली स्लॉट नहीं मिला। कृपया अन्य तिथि आज़माएँ या बुकिंग पृष्ठ पर जाएं।'
                  : 'No open appointment slots were found on that date. Try clearing the date filter or choosing another weekday.'
                : isHi
                  ? 'कृपया खोज शब्द बदलें या सभी फ़िल्टर रीसेट करें।'
                  : 'Try adjusting your search keywords, specialization, or day filter.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#1C7ED6] rounded-lg cursor-pointer"
              >
                {isHi ? 'सभी फ़िल्टर साफ़ करें' : 'Clear Filters'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/book')}
                className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-white border border-[#CBD5E1] rounded-lg cursor-pointer"
              >
                {isHi ? 'अपॉइंटमेंट बुक करें' : 'Go to Appointment Booking'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((item) => (
              <DoctorCard
                key={item.doctor.id}
                doctor={item.doctor}
                availabilityMeta={{
                  availableCount: item.availableCount,
                  nextAvailableDate: item.nextAvailableDate,
                  nextAvailableSlot: item.nextAvailableSlot,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
