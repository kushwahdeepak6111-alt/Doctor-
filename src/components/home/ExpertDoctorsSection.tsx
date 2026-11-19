import React from 'react';
import { AlertCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useT } from '../../i18n/translations';
import { DoctorCard } from '../DoctorCard';
import { prefetchRoute } from '../../lib/routePrefetch';

export function ExpertDoctorsSection() {
  const { language, navigate, doctors, bootstrapLoading, bootstrapError, refreshBootstrap } = useClinic();
  const t = useT(language);
  const isHi = language === 'hi';

  return (
    <section id="section-doctors" className="scroll-mt-16 bg-[#F4F8FC] border-b border-[#E2EAF2]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold tracking-wide uppercase text-[#1C7ED6]">
              {t.doctorsSection.eyebrow}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2D52] tracking-tight">
              {isHi ? 'हमारे विशेषज्ञ चिकित्सकों से मिलें' : 'Meet Our Expert Doctors'}
            </h2>
            <p className="text-[15px] text-[#5C6F84] leading-relaxed">
              {t.doctorsSection.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/doctors')}
            onMouseEnter={() => prefetchRoute('/doctors')}
            onFocus={() => prefetchRoute('/doctors')}
            onTouchStart={() => prefetchRoute('/doctors')}
            className="self-start sm:self-auto min-h-[42px] inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-full transition-colors whitespace-nowrap shrink-0"
          >
            <span>{t.doctorsSection.viewAll}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {bootstrapError ? (
          <div
            role="alert"
            className="border border-rose-200 rounded-2xl p-6 bg-rose-50 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-display text-sm font-bold">
                  {isHi ? 'चिकित्सकों की सूची लोड नहीं हो सकी' : 'Unable to load doctors from Supabase'}
                </p>
                <p className="text-xs opacity-90">{bootstrapError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void refreshBootstrap()}
              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-xl shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isHi ? 'पुनः प्रयास करें' : 'Retry'}</span>
            </button>
          </div>
        ) : bootstrapLoading ? (
          <div className="space-y-4" aria-live="polite" aria-busy="true">
            <div className="flex items-center gap-2 text-xs font-medium text-[#5C6F84]">
              <Loader2 className="w-4 h-4 animate-spin text-[#1C7ED6]" aria-hidden="true" />
              <span>
                {isHi ? 'चिकित्सक डेटा लोड हो रहा है...' : 'Loading specialists from Supabase...'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[360px] rounded-2xl border border-[#E2EAF2] bg-white animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : doctors.length === 0 ? (
          <div className="border border-[#E2EAF2] rounded-2xl p-8 bg-white text-center space-y-2">
            <p className="font-display text-base font-bold text-[#0B2D52]">
              {isHi ? 'कोई चिकित्सक उपलब्ध नहीं है' : 'No specialists found in database'}
            </p>
            <button
              type="button"
              onClick={() => void refreshBootstrap()}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1C7ED6] rounded-lg cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isHi ? 'पुनः लोड करें' : 'Reload'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.slice(0, 4).map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
