import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { CLINIC_IMAGES } from '../../lib/clinicImages';

export function ClinicalPrecisionSection() {
  const { language } = useClinic();

  return (
    <section id="section-diagnostics" className="scroll-mt-16 bg-[#F4F8FC] border-b border-[#E2EAF2]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="bg-white border border-[#E2EAF2] rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 h-64 sm:h-80 lg:h-full min-h-[300px]">
            <img
              src={CLINIC_IMAGES.facility_interior}
              alt={
                language === 'hi'
                  ? 'आधुनिक जांच एवं परामर्श कक्ष'
                  : 'Diagnostic and consultation room interior'
              }
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-6 p-7 sm:p-10 space-y-5">
            <p className="text-xs font-semibold tracking-wide uppercase text-[#1C7ED6]">
              {language === 'hi' ? 'क्लिनिकल गुणवत्ता' : 'Clinical Precision'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2D52] leading-snug">
              {language === 'hi'
                ? 'बेहतर परिणामों के लिए सुव्यवस्थित देखभाल'
                : 'Structured Diagnostics for Better Outcomes'}
            </h2>
            <p className="text-sm sm:text-[15px] text-[#5C6F84] leading-relaxed">
              {language === 'hi'
                ? 'हम आधुनिक जांच उपकरणों, डिजिटल रिकॉर्ड अपलोड और प्रमाण-आधारित प्रोटोकॉल का उपयोग करते हैं।'
                : 'We pair clean outpatient examination suites with digital report preparation and evidence-based treatment plans.'}
            </p>
            <ul className="space-y-2.5 text-sm text-[#10233B]">
              {(language === 'hi'
                ? [
                    'आधुनिक बाह्य रोगी परामर्श कक्ष',
                    'पूर्व-परामर्श डिजिटल रिपोर्ट समीक्षा',
                    'सटीक स्लॉट समय एवं डबल-बुकिंग सुरक्षा',
                    'द्विभाषी रोगी एवं चिकित्सक पोर्टल',
                  ]
                : [
                    'Modern Outpatient Consultation Suites',
                    'Pre-Visit Digital Report Review',
                    'Strict Slot Timing & Double-Booking Protection',
                    'Bilingual Patient & Doctor Portals',
                  ]
              ).map((line) => (
                <li key={line} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1C7ED6] shrink-0" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
