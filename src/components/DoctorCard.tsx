import React, { useState } from 'react';
import { ArrowRight, Calendar, Clock, Stethoscope } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useT } from '../i18n/translations';
import { resolveClinicImage } from '../lib/clinicImages';
import type { Doctor } from '../types/clinic';

export interface DoctorCardAvailabilityMeta {
  availableCount: number;
  nextAvailableSlot: string | null;
  nextAvailableDate: string | null;
}

export function DoctorCard({
  doctor,
  availabilityMeta,
}: {
  doctor: Doctor;
  availabilityMeta?: DoctorCardAvailabilityMeta;
}) {
  const { language, specializations, navigate, startBookingWith } = useClinic();
  const t = useT(language);
  const [imgError, setImgError] = useState(false);

  const spec = specializations.find((s) => s.id === doctor.specializationId);
  const name = language === 'hi' ? doctor.nameHi : doctor.name;
  const specName = spec ? (language === 'hi' ? spec.nameHi : spec.name) : '';
  const qualification = language === 'hi' ? doctor.qualificationHi : doctor.qualification;
  const experience = language === 'hi' ? doctor.experienceSummaryHi : doctor.experienceSummary;
  const bio = language === 'hi' ? doctor.bioHi : doctor.bio;
  const languagesText = (language === 'hi' ? doctor.languagesHi : doctor.languages).join(', ');

  return (
    <article className="group h-full flex flex-col bg-white border border-[#E2EAF2] rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#C5DDF8] transition-all">
      <button
        type="button"
        onClick={() => navigate(`/doctors/${doctor.slug}`)}
        className="relative aspect-[4/4] bg-[#F4F8FC] overflow-hidden text-left w-full shrink-0"
        aria-label={name}
      >
        {!imgError ? (
          <img
            src={resolveClinicImage(doctor.imageKey)}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#EAF3FC] text-[#0B2D52] p-6 text-center">
            <Stethoscope className="w-10 h-10 text-[#1C7ED6] mb-2" aria-hidden="true" />
            <span className="font-display font-semibold text-sm">{name}</span>
          </div>
        )}
      </button>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-[#1C7ED6]">{specName}</div>
          <h3 className="font-display text-base font-bold text-[#0B2D52] leading-snug">
            <button
              type="button"
              onClick={() => navigate(`/doctors/${doctor.slug}`)}
              className="hover:text-[#1C7ED6] text-left transition-colors"
            >
              {name}
            </button>
          </h3>
          <p className="text-xs font-medium text-[#5C6F84] line-clamp-1">{qualification}</p>
          {experience && (
            <p className="text-[11px] text-[#0B2D52]/80 font-medium line-clamp-1">{experience}</p>
          )}
          {bio && (
            <p className="text-xs text-[#5C6F84]/90 line-clamp-2 leading-relaxed pt-1">{bio}</p>
          )}
        </div>

        <div className="space-y-3 pt-3 border-t border-[#E2EAF2]">
          {availabilityMeta && (
            <div className="rounded-lg bg-[#F4F8FC] border border-[#E2EAF2] px-2.5 py-2 text-[11px] flex items-center justify-between gap-2">
              {availabilityMeta.nextAvailableDate && availabilityMeta.nextAvailableSlot ? (
                <>
                  <span className="inline-flex items-center gap-1 text-[#0B2D52] font-medium tabular-nums truncate">
                    <Clock className="w-3 h-3 text-[#1C7ED6] shrink-0" aria-hidden="true" />
                    {availabilityMeta.nextAvailableDate} · {availabilityMeta.nextAvailableSlot}
                  </span>
                  <span className="font-semibold text-[#1C7ED6] whitespace-nowrap">
                    {availabilityMeta.availableCount}{' '}
                    {language === 'hi' ? 'स्लॉट' : 'open'}
                  </span>
                </>
              ) : (
                <span className="text-[#5C6F84]">
                  {language === 'hi'
                    ? 'चयनित तिथि पर स्लॉट उपलब्ध नहीं'
                    : 'No open slots in checked window'}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[#5C6F84] gap-2">
            <span className="truncate">{languagesText}</span>
            <span className="font-mono font-semibold text-[#0B2D52] tabular-nums whitespace-nowrap">
              ₹{doctor.consultationFee}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate(`/doctors/${doctor.slug}`)}
              className="min-h-[42px] inline-flex items-center justify-center px-3 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#EAF3FC] border border-[#E2EAF2] rounded-xl transition-colors whitespace-nowrap"
            >
              {t.doctorsSection.viewProfile}
            </button>
            <button
              type="button"
              onClick={() =>
                startBookingWith({
                  doctorId: doctor.id,
                  date: availabilityMeta?.nextAvailableDate || undefined,
                })
              }
              className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {language === 'hi' ? 'बुक करें' : 'Book'}
              </span>
              <ArrowRight className="w-3 h-3 shrink-0 hidden sm:inline" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
