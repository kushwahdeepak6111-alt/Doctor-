import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useT } from '../i18n/translations';
import { CLINIC_FAQ_ITEMS } from '../data/faqItems';

export function FaqPage() {
  const { language, navigate } = useClinic();
  const t = useT(language);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="bg-white min-h-[75vh]">
      <section className="bg-[#F4F8FC] border-b border-[#E2EAF2]">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-3">
          <p className="text-xs font-semibold text-[#1C7ED6]">{t.faqSection.eyebrow}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0B2D52]">
            {t.faqSection.title}
          </h1>
          <p className="text-[15px] text-[#5C6F84] leading-relaxed">
            {t.faqSection.subtitle}
          </p>
        </div>
      </section>

      <section className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-4">
        {CLINIC_FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={item.qEn} className="border border-[#E2EAF2] rounded-2xl bg-white overflow-hidden">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-[#F4F8FC] transition-colors"
              >
                <span className="font-display text-base font-bold text-[#0B2D52]">
                  {language === 'hi' ? item.qHi : item.qEn}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[#5C6F84] shrink-0 transition-transform ${
                    isOpen ? 'rotate-180 text-[#1C7ED6]' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-sm text-[#10233B]/85 leading-relaxed border-t border-[#E2EAF2]">
                  {language === 'hi' ? item.aHi : item.aEn}
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#E2EAF2]">
          <p className="text-sm text-[#5C6F84]">
            {language === 'hi'
              ? 'यदि आपका कोई अन्य प्रश्न है, तो कृपया हमारी रिसेप्शन टीम से संपर्क करें।'
              : 'Have another question about your upcoming visit?'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-xl"
          >
            {t.nav.contact}
          </button>
        </div>
      </section>
    </div>
  );
}
