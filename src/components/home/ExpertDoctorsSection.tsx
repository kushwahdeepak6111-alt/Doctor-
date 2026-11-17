import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useT } from '../../i18n/translations';
import { DoctorCard } from '../DoctorCard';
import { prefetchRoute } from '../../lib/routePrefetch';

export function ExpertDoctorsSection() {
  const { language, navigate, doctors } = useClinic();
  const t = useT(language);

  return (
    <section id="section-doctors" className="scroll-mt-16 bg-[#F4F8FC] border-b border-[#E2EAF2]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold tracking-wide uppercase text-[#1C7ED6]">
              {t.doctorsSection.eyebrow}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2D52] tracking-tight">
              {language === 'hi'
                ? 'हमारे विशेषज्ञ चिकित्सकों से मिलें'
                : 'Meet Our Expert Doctors'}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.slice(0, 4).map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} />
          ))}
        </div>
      </div>
    </section>
  );
}
