import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useT } from '../../i18n/translations';
import { CLINIC_IMAGES } from '../../lib/clinicImages';
import { prefetchRoute } from '../../lib/routePrefetch';

export function ModernClinicSection() {
  const { language, navigate } = useClinic();
  const t = useT(language);

  return (
    <section id="section-about-clinic" className="scroll-mt-16 bg-[#082240] text-white overflow-hidden">
      <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-center">
        <div className="lg:col-span-6 px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-6">
          <p className="text-xs font-semibold tracking-wide uppercase text-[#7DD3FC]">
            {language === 'hi' ? 'आरोग्य क्लिनिक परिचय' : 'About Arogya Clinic'}
          </p>
          <h2 className="font-display text-3xl sm:text-[34px] font-bold text-white leading-tight">
            {language === 'hi'
              ? 'बेहतर स्वास्थ्य के लिए निर्मित आधुनिक क्लिनिक'
              : 'A Modern Clinic Built for Better Health'}
          </h2>
          <p className="text-[15px] text-slate-200 leading-relaxed max-w-lg">
            {t.facilitySection.desc}
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => navigate('/about')}
              onMouseEnter={() => prefetchRoute('/about')}
              onFocus={() => prefetchRoute('/about')}
              onTouchStart={() => prefetchRoute('/about')}
              className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-full transition-colors"
            >
              <span>{language === 'hi' ? 'अधिक जानें' : 'Learn More'}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15">
            <div>
              <div className="font-display text-lg font-bold text-white">5</div>
              <div className="text-xs text-slate-300">
                {language === 'hi' ? 'चिकित्सा विभाग' : 'Specialties'}
              </div>
            </div>
            <div>
              <div className="font-display text-lg font-bold text-white">Mon–Sat</div>
              <div className="text-xs text-slate-300">
                {language === 'hi' ? 'ओपीडी सेवा' : 'OPD Schedule'}
              </div>
            </div>
            <div>
              <div className="font-display text-lg font-bold text-white">EN / हिं</div>
              <div className="text-xs text-slate-300">
                {language === 'hi' ? 'द्विभाषी सहायता' : 'Bilingual Desk'}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 relative h-72 sm:h-96 lg:h-[440px]">
          <img
            src={CLINIC_IMAGES.hero_lobby}
            alt={
              language === 'hi'
                ? 'आरोग्य क्लिनिक का आधुनिक स्वागत कक्ष'
                : 'Modern architectural reception lounge at Arogya Clinic'
            }
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="hidden lg:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#082240] to-transparent"
          />
          <div
            aria-hidden="true"
            className="lg:hidden absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#082240] to-transparent"
          />
        </div>
      </div>
    </section>
  );
}
