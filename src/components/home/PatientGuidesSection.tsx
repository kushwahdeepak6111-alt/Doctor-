import React from 'react';
import { ArrowRight, FileCheck2 } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useT } from '../../i18n/translations';
import { CLINIC_IMAGES } from '../../lib/clinicImages';

export function PatientGuidesSection() {
  const { language, navigate } = useClinic();
  const t = useT(language);

  const guides =
    language === 'hi'
      ? [
          {
            tag: 'अपॉइंटमेंट गाइड',
            title: 'ऑनलाइन अपॉइंटमेंट पुष्टि प्रक्रिया कैसे काम करती है',
            desc: 'स्लॉट चयन से लेकर रिसेप्शन द्वारा पुष्टि और पोर्टल अपडेट तक की पूरी जानकारी।',
            image: CLINIC_IMAGES.hero_lobby,
            action: () => navigate('/faq'),
          },
          {
            tag: 'हृदय एवं सामान्य जांच',
            title: 'अपने विशेषज्ञ परामर्श से पहले मेडिकल रिपोर्ट कैसे तैयार करें',
            desc: 'बुकिंग के चरण 6 में पिछली लैब रिपोर्ट या पर्चे सुरक्षित रूप से अपलोड करने की विधि।',
            image: CLINIC_IMAGES.guide_diagnostics_prep,
            action: () => navigate('/book'),
          },
          {
            tag: 'पारिवारिक देखभाल',
            title: 'पाँच प्रमुख विभागों में समन्वित बाह्य रोगी परामर्श',
            desc: 'कार्डियोलॉजी, बाल रोग, ऑर्थोपेडिक्स, त्वचा रोग और आंतरिक चिकित्सा सेवाएं जानें।',
            image: CLINIC_IMAGES.consultation_suite,
            action: () => navigate('/specializations'),
          },
        ]
      : [
          {
            tag: 'Booking Guide',
            title: 'How Online Slot Request & Clinic Confirmation Works',
            desc: 'Learn how double-booking protection holds your requested time until reception confirms.',
            image: CLINIC_IMAGES.hero_lobby,
            action: () => navigate('/faq'),
          },
          {
            tag: 'Visit Preparation',
            title: 'Sharing Lab Reports & Prescriptions Ahead of Your Visit',
            desc: 'Attach recent PDF or image records during Step 6 of booking for specialist review.',
            image: CLINIC_IMAGES.guide_diagnostics_prep,
            action: () => navigate('/book'),
          },
          {
            tag: 'Outpatient Care',
            title: 'Coordinated Multi-Specialty Consultations Under One Roof',
            desc: 'Explore Cardiology, Pediatrics, Orthopedics, Dermatology, and Internal Medicine.',
            image: CLINIC_IMAGES.consultation_suite,
            action: () => navigate('/specializations'),
          },
        ];

  return (
    <section id="section-guides" className="scroll-mt-16 bg-[#F4F8FC]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide uppercase text-[#1C7ED6]">
              {language === 'hi' ? 'रोगी मार्गदर्शन' : 'Patient Preparation'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2D52]">
              {language === 'hi'
                ? 'स्वास्थ्य एवं विज़िट मार्गदर्शन'
                : 'Clinic & Visit Preparation Guides'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/faq')}
            className="self-start sm:self-auto min-h-[40px] inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-full transition-colors whitespace-nowrap"
          >
            <span>{t.nav.faq}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <article
              key={guide.title}
              className="group bg-white border border-[#E2EAF2] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[#C5DDF8] transition-all"
            >
              <div>
                <div className="aspect-[16/10] bg-[#EAF3FC] overflow-hidden">
                  <img
                    src={guide.image}
                    alt={guide.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-5 space-y-2">
                  <div className="text-xs font-semibold text-[#1C7ED6]">{guide.tag}</div>
                  <h3 className="font-display text-base font-bold text-[#0B2D52] leading-snug">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-[#5C6F84] leading-relaxed">{guide.desc}</p>
                </div>
              </div>
              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={guide.action}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B2D52] hover:text-[#1C7ED6] transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{language === 'hi' ? 'विवरण देखें' : 'Read Guide'}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
