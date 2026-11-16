import React from 'react';
import { CalendarCheck2, FileText, MapPin, ShieldCheck } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useT } from '../i18n/translations';
import { CLINIC_IMAGES } from '../lib/clinicImages';

export function AboutPage() {
  const { language, settings, navigate } = useClinic();
  const t = useT(language);

  const standards =
    language === 'hi'
      ? [
          {
            icon: <ShieldCheck className="w-5 h-5 text-[#1C7ED6]" aria-hidden="true" />,
            title: 'स्पष्ट चिकित्सा संवाद',
            desc: 'प्रत्येक परामर्श में निदान, दवाइयों और अगले चरणों को आपकी सहज भाषा (हिन्दी या अंग्रेज़ी) में समझाया जाता है।',
          },
          {
            icon: <CalendarCheck2 className="w-5 h-5 text-[#1C7ED6]" aria-hidden="true" />,
            title: 'रिसेप्शन-सत्यापित शेड्यूलिंग',
            desc: 'सभी ऑनलाइन अनुरोध पहले डबल-बुकिंग से सुरक्षित होते हैं और फिर क्लिनिक डेस्क द्वारा अंतिम रूप से कन्फर्म किए जाते हैं।',
          },
          {
            icon: <FileText className="w-5 h-5 text-[#1C7ED6]" aria-hidden="true" />,
            title: 'एकीकृत मेडिकल रिकॉर्ड तैयारी',
            desc: 'आप बुकिंग के समय ही अपनी जांच रिपोर्ट और पुराने पर्चे सुरक्षित रूप से अपलोड कर सकते हैं।',
          },
        ]
      : [
          {
            icon: <ShieldCheck className="w-5 h-5 text-[#1C7ED6]" aria-hidden="true" />,
            title: 'Clear Clinical Communication',
            desc: 'Every consultation prioritizes unhurried explanations of findings, medications, and next steps in English or Hindi.',
          },
          {
            icon: <CalendarCheck2 className="w-5 h-5 text-[#1C7ED6]" aria-hidden="true" />,
            title: 'Reception-Verified Scheduling',
            desc: 'Online slot requests protect against double booking immediately while our reception desk verifies and confirms each visit.',
          },
          {
            icon: <FileText className="w-5 h-5 text-[#1C7ED6]" aria-hidden="true" />,
            title: 'Pre-Visit Record Preparation',
            desc: 'Attach recent laboratory reports or referral notes during booking so your specialist reviews context beforehand.',
          },
        ];

  return (
    <div className="bg-white">
      <section className="border-b border-[#E2EAF2] bg-[#F4F8FC]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold text-[#1C7ED6]">{t.nav.about}</p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0B2D52] leading-tight">
              {language === 'hi'
                ? 'विश्वास, समयबद्धता और समन्वित बाह्य रोगी देखभाल के लिए समर्पित।'
                : 'Built for coordinated, unhurried outpatient healthcare.'}
            </h1>
            <p className="text-base sm:text-lg text-[#5C6F84] leading-relaxed">
              {language === 'hi'
                ? 'आरोग्य मल्टी-स्पेशलिटी क्लिनिक में हम पांच प्रमुख चिकित्सा विभागों को एक शांत, पारिवारिक क्लिनिक परिसर में एक साथ लाते हैं।'
                : 'At Arogya Multi-Specialty Clinic, five core medical specialties operate side by side in a calm outpatient center designed around clarity and patient respect.'}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-[#E2EAF2] aspect-[16/10] bg-[#F4F8FC]">
            <img
              src={CLINIC_IMAGES.facility_interior}
              alt={language === 'hi' ? 'परामर्श कक्ष' : 'Clinic consultation suite'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-6 space-y-5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2D52]">
              {language === 'hi'
                ? 'एक ही परिसर में पाँच विशेषज्ञ विभाग'
                : 'Five specialized outpatient departments under one roof'}
            </h2>
            <p className="text-[15px] text-[#5C6F84] leading-relaxed">
              {language === 'hi'
                ? 'बड़े अस्पतालों की भीड़ और लंबी कतारों के बजाय, हमारा क्लिनिक पूर्व-निर्धारित समय स्लॉट पर काम करता है ताकि प्रत्येक रोगी को पर्याप्त समय और ध्यान मिल सके।'
                : 'Rather than navigating crowded hospital corridors, patients visit scheduled consultation suites where cardiologists, pediatricians, orthopedists, dermatologists, and internal medicine physicians coordinate smoothly.'}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/doctors')}
                className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
              >
                {t.hero.secondaryCta}
              </button>
              <button
                type="button"
                onClick={() => navigate('/book')}
                className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#E2EAF2]/60 border border-[#E2EAF2] rounded-xl transition-colors"
              >
                {t.hero.primaryCta}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {standards.map((item) => (
            <div
              key={item.title}
              className="border border-[#E2EAF2] rounded-2xl p-6 bg-white space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EAF3FC] flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="font-display text-lg font-bold text-[#0B2D52]">{item.title}</h3>
              <p className="text-sm text-[#5C6F84] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {settings && (
          <div className="rounded-2xl border border-[#E2EAF2] bg-[#F4F8FC] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1C7ED6]">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                <span>{t.footer.visitUs}</span>
              </div>
              <p className="font-display text-lg font-bold text-[#0B2D52]">
                {language === 'hi' ? settings.addressHi : settings.address}
              </p>
              <p className="text-sm text-[#5C6F84]">
                {language === 'hi' ? settings.hoursHi : settings.hours} · {settings.phone}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/contact')}
              className="shrink-0 min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-xl transition-colors"
            >
              {t.nav.contact}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
