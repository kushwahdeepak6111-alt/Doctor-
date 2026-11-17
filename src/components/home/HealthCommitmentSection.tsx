import React from 'react';
import { ArrowRight, Building2, HeartHandshake, ShieldCheck, Stethoscope } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { CLINIC_IMAGES } from '../../lib/clinicImages';
import { prefetchRoute } from '../../lib/routePrefetch';

export function HealthCommitmentSection() {
  const { language, navigate } = useClinic();

  const priorityHighlights =
    language === 'hi'
      ? [
          { icon: Stethoscope, title: 'सटीक जांच सुविधा' },
          { icon: ShieldCheck, title: 'योग्य विशेषज्ञ' },
          { icon: HeartHandshake, title: 'व्यक्तिगत उपचार' },
          { icon: Building2, title: 'शांत क्लिनिक परिसर' },
        ]
      : [
          { icon: Stethoscope, title: 'Modern Diagnostics' },
          { icon: ShieldCheck, title: 'Verified Specialists' },
          { icon: HeartHandshake, title: 'Personalized Care' },
          { icon: Building2, title: 'Calm Environment' },
        ];

  return (
    <section id="section-commitment" className="scroll-mt-16 bg-white border-b border-[#E2EAF2]">
      <div className="relative bg-[#0B2D52] text-white overflow-hidden">
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 relative h-64 sm:h-80 lg:h-auto lg:min-h-[360px]">
            <img
              src={CLINIC_IMAGES.consultation_suite}
              alt={
                language === 'hi'
                  ? 'क्लिनिक में चिकित्सक और रोगी परामर्श'
                  : 'Physician consulting with patient in modern clinic suite'
              }
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            <div
              aria-hidden="true"
              className="hidden lg:block absolute inset-y-0 right-0 w-36 bg-gradient-to-l from-[#0B2D52] to-transparent"
            />
            <div
              aria-hidden="true"
              className="lg:hidden absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0B2D52] to-transparent"
            />
          </div>

          <div className="lg:col-span-6 px-6 py-10 sm:px-10 lg:px-12 space-y-4">
            <p className="text-xs font-semibold tracking-wide uppercase text-[#7DD3FC]">
              {language === 'hi' ? 'हमारी प्राथमिकता' : 'Our Health Commitment'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-snug">
              {language === 'hi'
                ? 'आपका स्वास्थ्य हमारी सर्वोच्च प्राथमिकता है'
                : 'Your Health Is Our Priority'}
            </h2>
            <p className="text-sm sm:text-[15px] text-slate-200 leading-relaxed max-w-lg">
              {language === 'hi'
                ? 'हम स्पष्ट चिकित्सा संवाद, सटीक निदान और शांत क्लिनिक वातावरण के साथ व्यक्तिगत देखभाल प्रदान करते हैं।'
                : 'We provide personalized outpatient care, structured scheduling, and an unhurried environment focused on your long-term wellbeing.'}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => navigate('/about')}
                onMouseEnter={() => prefetchRoute('/about')}
                onFocus={() => prefetchRoute('/about')}
                onTouchStart={() => prefetchRoute('/about')}
                className="min-h-[42px] inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/25 rounded-full transition-colors"
              >
                <span>{language === 'hi' ? 'अधिक जानें' : 'Learn More'}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Column Horizontal Feature Strip */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {priorityHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EAF3FC] text-[#1C7ED6] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="font-display text-sm font-semibold text-[#0B2D52]">
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
