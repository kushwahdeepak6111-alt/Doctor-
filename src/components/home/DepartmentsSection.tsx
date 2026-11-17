import React from 'react';
import { ArrowRight, CalendarCheck2 } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useT } from '../../i18n/translations';
import { SpecializationIcon } from '../SpecializationIcon';

export function DepartmentsSection() {
  const { language, navigate, specializations, startBookingWith } = useClinic();
  const t = useT(language);

  return (
    <section id="section-departments" className="scroll-mt-16 bg-[#F4F8FC] border-b border-[#E2EAF2]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-5">
            <p className="text-xs font-semibold tracking-wide uppercase text-[#1C7ED6]">
              {t.specializationsSection.eyebrow}
            </p>
            <h2 className="font-display text-3xl sm:text-[34px] font-bold text-[#0B2D52] leading-tight">
              {language === 'hi'
                ? 'प्रमुख चिकित्सा विभागों में विशेषज्ञ देखभाल'
                : 'Specialized Care Across Key Departments'}
            </h2>
            <p className="text-[15px] text-[#5C6F84] leading-relaxed">
              {t.specializationsSection.subtitle}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => navigate('/specializations')}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-full transition-colors whitespace-nowrap"
              >
                <span>{t.specializationsSection.viewAll}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {specializations.map((spec) => {
              const name = language === 'hi' ? spec.nameHi : spec.name;
              const desc = language === 'hi' ? spec.shortDescriptionHi : spec.shortDescription;
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => startBookingWith({ specializationId: spec.id })}
                  className="text-left bg-white border border-[#E2EAF2] hover:border-[#1C7ED6] rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EAF3FC] text-[#1C7ED6] group-hover:bg-[#1C7ED6] group-hover:text-white flex items-center justify-center transition-colors">
                    <SpecializationIcon iconKey={spec.iconKey} className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#0B2D52]">{name}</h3>
                    <p className="text-xs text-[#5C6F84] mt-1 line-clamp-2 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* 6th Quick Action Card to Complete Balanced 3x2 Grid */}
            <button
              type="button"
              onClick={() => navigate('/book')}
              className="text-left bg-[#EAF3FC] border border-[#C5DDF8] hover:border-[#1C7ED6] rounded-2xl p-5 flex flex-col justify-between gap-3 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1C7ED6] text-white flex items-center justify-center">
                <CalendarCheck2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-[#0B2D52]">
                  {language === 'hi' ? 'अपॉइंटमेंट बुक करें' : 'Schedule Consultation'}
                </h3>
                <p className="text-xs text-[#195392] mt-1">
                  {language === 'hi' ? 'उपलब्ध समय स्लॉट चुनें →' : 'Choose specialist & time slot →'}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
