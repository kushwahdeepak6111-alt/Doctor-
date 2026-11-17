import React from 'react';
import { Building2, CalendarCheck2, HeartHandshake, ShieldCheck } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { CLINIC_IMAGES } from '../../lib/clinicImages';

export function WhyChooseSection() {
  const { language } = useClinic();

  const whyChooseItems =
    language === 'hi'
      ? [
          { icon: ShieldCheck, title: 'विशेषज्ञ चिकित्सा टीम', desc: 'प्रत्येक विभाग में योग्य एवं अनुभवी ओपीडी चिकित्सक।' },
          { icon: Building2, title: 'आधुनिक परामर्श कक्ष', desc: 'स्वच्छ, शांत और सुव्यवस्थित बाह्य रोगी जांच सुविधाएं।' },
          { icon: HeartHandshake, title: 'रोगी-केंद्रित देखभाल', desc: 'बिना जल्दबाज़ी के स्पष्ट संवाद और फॉलो-अप।' },
          { icon: CalendarCheck2, title: 'रिसेप्शन सत्यापित स्लॉट', desc: 'डबल-बुकिंग सुरक्षा के साथ पारदर्शी अपॉइंटमेंट समय।' },
        ]
      : [
          { icon: ShieldCheck, title: 'Verified Medical Team', desc: 'Qualified MD, MS, and DM outpatient consultants.' },
          { icon: Building2, title: 'Modern Outpatient Suites', desc: 'Clean, quiet consultation rooms built for comfort.' },
          { icon: HeartHandshake, title: 'Patient-Centered Care', desc: 'Unhurried consultations with clear follow-up notes.' },
          { icon: CalendarCheck2, title: 'Confirmed Slot Discipline', desc: 'Double-booking protection and reception verification.' },
        ];

  return (
    <section id="section-advantages" className="scroll-mt-16 bg-white border-b border-[#E2EAF2]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-2 max-w-xl">
              <p className="text-xs font-semibold tracking-wide uppercase text-[#1C7ED6]">
                {language === 'hi' ? 'हमारी विशेषताएं' : 'Our Advantages'}
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2D52]">
                {language === 'hi'
                  ? 'आरोग्य क्लिनिक क्यों चुनें?'
                  : 'Why Choose Arogya Clinic?'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {whyChooseItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="space-y-3">
                    <div className="w-11 h-11 rounded-full bg-[#1C7ED6] text-white flex items-center justify-center">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-sm font-bold text-[#0B2D52]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#5C6F84] leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-2xl lg:rounded-l-[120px] overflow-hidden border border-[#E2EAF2] shadow-xs aspect-[4/3] bg-[#F4F8FC]">
              <img
                src={CLINIC_IMAGES.doctor_cardiology}
                alt={
                  language === 'hi'
                    ? 'वरिष्ठ हृदय रोग विशेषज्ञ डॉ. आरिस शर्मा'
                    : 'Senior Cardiologist Dr. Aris Sharma'
                }
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
