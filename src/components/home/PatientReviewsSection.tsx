import React from 'react';
import { ShieldCheck, Star } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { STATIC_PUBLIC_REVIEWS } from '../../data/clinicData';

export function PatientReviewsSection() {
  const { language, navigate } = useClinic();
  const publicFeedbacks = STATIC_PUBLIC_REVIEWS;

  return (
    <section id="section-reviews" className="scroll-mt-16 bg-white border-t border-[#E2EAF2]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide uppercase text-[#1C7ED6]">
              {language === 'hi' ? 'सत्यापित रोगी अनुभव' : 'Verified Patient Feedback'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2D52]">
              {language === 'hi'
                ? 'पूर्ण परामर्श के बाद रोगी समीक्षाएं'
                : 'Patient Reviews After Completed Visits'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/book')}
            className="self-start sm:self-auto min-h-[40px] inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#EAF3FC] border border-[#E2EAF2] rounded-full transition-colors whitespace-nowrap"
          >
            <span>{language === 'hi' ? 'अपॉइंटमेंट बुक करें' : 'Book Consultation'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {publicFeedbacks.slice(0, 6).map((fb) => (
            <article
              key={fb.id}
              className="rounded-2xl border border-[#E2EAF2] bg-[#F8FBFF] p-6 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5 text-amber-500" aria-label={`${fb.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-4 h-4 ${idx < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md border border-[#C5DDF8] bg-[#EAF3FC] px-2 py-0.5 text-[11px] font-medium text-[#0B2D52]">
                    <ShieldCheck className="w-3 h-3 text-[#1C7ED6]" aria-hidden="true" />
                    {language === 'hi' ? 'सत्यापित विज़िट' : 'Verified Patient Visit'}
                  </span>
                </div>

                <p className="text-sm text-[#10233B] leading-relaxed">“{fb.comment}”</p>
                {fb.doctorFeedback && (
                  <p className="text-xs text-[#5C6F84] rounded-lg border border-[#E2EAF2] bg-white px-3 py-2">
                    {fb.doctorFeedback}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#E2EAF2] text-xs text-[#5C6F84] flex items-center justify-between gap-2">
                <span className="font-semibold text-[#0B2D52]">
                  {language === 'hi' ? fb.doctorNameHi : fb.doctorName}
                </span>
                <span>{language === 'hi' ? fb.specializationNameHi : fb.specializationName}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
