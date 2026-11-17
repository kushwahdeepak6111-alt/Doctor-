import React from 'react';
import { Clock, Languages, ShieldCheck, Stethoscope } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useT } from '../../i18n/translations';
import { CLINIC_IMAGES } from '../../lib/clinicImages';
import { prefetchRoute } from '../../lib/routePrefetch';

export function HeroSection() {
  const { language, navigate } = useClinic();
  const t = useT(language);

  const heroStats =
    language === 'hi'
      ? [
          { icon: Stethoscope, value: '5 प्रमुख', label: 'चिकित्सा विभाग' },
          { icon: ShieldCheck, value: 'MD / MS / DM', label: 'योग्य विशेषज्ञ' },
          { icon: Clock, value: 'सोम – शनि', label: '08:30 AM – 08:00 PM' },
          { icon: Languages, value: 'हिन्दी / EN', label: 'द्विभाषी परामर्श' },
        ]
      : [
          { icon: Stethoscope, value: '5 Core', label: 'Medical Departments' },
          { icon: ShieldCheck, value: 'MD / MS / DM', label: 'Verified Specialists' },
          { icon: Clock, value: 'Mon – Sat', label: '08:30 AM – 08:00 PM' },
          { icon: Languages, value: 'EN & हिं', label: 'Bilingual Care' },
        ];

  return (
    <section id="section-hero" className="scroll-mt-16 relative bg-[#0B2D52] text-white overflow-hidden">
      {/* Blended Right-Side Image on Desktop / Framed Top Image on Mobile */}
      <div className="relative lg:absolute lg:inset-y-0 lg:right-0 lg:w-[54%] pointer-events-none">
        <img
          src={CLINIC_IMAGES.hero_specialist_care}
          alt={
            language === 'hi'
              ? 'आरोग्य मल्टी-स्पेशलिटी क्लिनिक की विशेषज्ञ चिकित्सक टीम'
              : 'Specialist physicians at Arogya Multi-Specialty Clinic'
          }
          loading="eager"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-[250px] sm:h-[340px] lg:h-full object-cover object-[center_20%]"
        />
        <div
          aria-hidden="true"
          className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#0B2D52] via-[#0B2D52]/75 via-35% to-transparent"
        />
        <div
          aria-hidden="true"
          className="lg:hidden absolute inset-0 bg-gradient-to-t from-[#0B2D52] via-[#0B2D52]/30 to-transparent"
        />
      </div>

      <div className="relative max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 sm:pt-10 lg:pt-20 lg:pb-10">
        <div className="max-w-xl space-y-5 pb-10 lg:pb-14">
          <p className="text-xs font-semibold tracking-wide text-[#7DD3FC]">
            {language === 'hi'
              ? 'विश्वसनीय देखभाल, स्वस्थ कल'
              : 'Trusted Care, Healthier Tomorrow'}
          </p>

          <h1 className="font-display text-[clamp(2.2rem,4.2vw,3.6rem)] font-bold text-white leading-[1.1] tracking-tight">
            {language === 'hi'
              ? 'उज्जवल और स्वस्थ भविष्य के लिए विशेषज्ञ स्वास्थ्य सेवा।'
              : 'World-Class Healthcare for a Brighter Future'}
          </h1>

          <p className="text-[15px] sm:text-base text-slate-200 leading-relaxed max-w-lg">
            {t.hero.subcopy}
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={() => navigate('/book')}
              onMouseEnter={() => prefetchRoute('/book')}
              onFocus={() => prefetchRoute('/book')}
              onTouchStart={() => prefetchRoute('/book')}
              className="min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-full transition-colors whitespace-nowrap"
            >
              <span>{t.hero.primaryCta}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/specializations')}
              onMouseEnter={() => prefetchRoute('/specializations')}
              onFocus={() => prefetchRoute('/specializations')}
              onTouchStart={() => prefetchRoute('/specializations')}
              className="min-h-[46px] inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/25 rounded-full transition-colors whitespace-nowrap"
            >
              {language === 'hi' ? 'हमारे विभाग देखें' : 'Our Departments'}
            </button>
          </div>
        </div>

        {/* Integrated Hero Bottom Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-white/15">
          {heroStats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#7DD3FC]" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-base sm:text-lg font-bold text-white leading-tight truncate">
                    {item.value}
                  </div>
                  <div className="text-xs text-slate-300 truncate">{item.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
