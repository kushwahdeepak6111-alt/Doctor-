import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  FileCheck2,
  HeartHandshake,
  Languages,
  MessageSquareQuote,
  ShieldCheck,
  Star,
  Stethoscope,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useT } from '../i18n/translations';
import { CLINIC_IMAGES } from '../lib/clinicImages';
import { ClinicLocationSection } from '../components/ClinicLocationSection';
import { DoctorCard } from '../components/DoctorCard';
import { HomeSeoSection } from '../components/HomeSeoSection';
import { SpecializationIcon } from '../components/SpecializationIcon';
import type { AvailabilitySlot, PublicPatientFeedback } from '../types/clinic';

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function HomePage() {
  const {
    language,
    navigate,
    specializations,
    doctors,
    startBookingWith,
    setBookingDraft,
  } = useClinic();
  const t = useT(language);

  // Quick-Booking Widget State (Section 8)
  const [qbSpecId, setQbSpecId] = useState('');
  const [qbDocId, setQbDocId] = useState('');
  const [qbDate, setQbDate] = useState(getTomorrowStr);
  const [qbSlot, setQbSlot] = useState('');
  const [qbSlots, setQbSlots] = useState<AvailabilitySlot[]>([]);
  const [qbLoading, setQbLoading] = useState(false);
  const [publicFeedbacks, setPublicFeedbacks] = useState<PublicPatientFeedback[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/feedback/public')
      .then((res) => res.json())
      .then((data: { feedbacks?: PublicPatientFeedback[] }) => {
        if (active) setPublicFeedbacks(Array.isArray(data.feedbacks) ? data.feedbacks : []);
      })
      .catch(() => {
        // Leave empty
      });
    return () => {
      active = false;
    };
  }, []);

  const qbDoctors = useMemo(() => {
    if (!qbSpecId) return doctors;
    return doctors.filter((d) => d.specializationId === qbSpecId);
  }, [doctors, qbSpecId]);

  useEffect(() => {
    if (!qbSpecId && specializations[0]?.id) {
      setQbSpecId(specializations[0].id);
    }
  }, [specializations, qbSpecId]);

  useEffect(() => {
    if (qbDoctors.length > 0 && !qbDoctors.some((d) => d.id === qbDocId)) {
      setQbDocId(qbDoctors[0].id);
      setQbSlot('');
    }
  }, [qbDoctors, qbDocId]);

  useEffect(() => {
    if (!qbDocId || !qbDate) {
      setQbSlots([]);
      return;
    }
    let active = true;
    setQbLoading(true);
    fetch(
      `/api/availability?doctorId=${encodeURIComponent(qbDocId)}&date=${encodeURIComponent(qbDate)}`
    )
      .then((r) => r.json())
      .then((d: { slots?: AvailabilitySlot[] }) => {
        if (!active) return;
        const available = (d.slots || []).filter((s) => s.status === 'available');
        setQbSlots(available);
        setQbSlot((prev) =>
          available.some((s) => s.time === prev) ? prev : available[0]?.time || ''
        );
      })
      .catch(() => {
        if (active) setQbSlots([]);
      })
      .finally(() => {
        if (active) setQbLoading(false);
      });
    return () => {
      active = false;
    };
  }, [qbDocId, qbDate]);

  const handleQuickBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qbDocId) {
      navigate('/book');
      return;
    }
    const doc = doctors.find((d) => d.id === qbDocId);
    setBookingDraft((prev) => ({
      ...prev,
      specializationId: doc?.specializationId || qbSpecId,
      doctorId: qbDocId,
      date: qbDate,
      timeSlot: qbSlot,
      step: qbSlot ? 5 : 4,
    }));
    navigate('/book');
  };

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
            image: CLINIC_IMAGES.doctor_cardiology,
            action: () => navigate('/book'),
          },
          {
            tag: 'पारिवारिक देखभाल',
            title: 'पाँच प्रमुख विभागों में समन्वित बाह्य रोगी परामर्श',
            desc: 'कार्डियोलॉजी, बाल रोग, ऑर्थोपेडिक्स, त्वचा रोग और आंतरिक चिकित्सा सेवाएं जानें।',
            image: CLINIC_IMAGES.facility_interior,
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
            image: CLINIC_IMAGES.doctor_cardiology,
            action: () => navigate('/book'),
          },
          {
            tag: 'Outpatient Care',
            title: 'Coordinated Multi-Specialty Consultations Under One Roof',
            desc: 'Explore Cardiology, Pediatrics, Orthopedics, Dermatology, and Internal Medicine.',
            image: CLINIC_IMAGES.facility_interior,
            action: () => navigate('/specializations'),
          },
        ];

  return (
    <div className="bg-white">
      {/* 1. CLEAN DEEP OCEAN NAVY HERO */}
      <section id="section-hero" className="scroll-mt-16 relative bg-[#0B2D52] text-white overflow-hidden">
        {/* Blended Right-Side Image on Desktop / Framed Top Image on Mobile */}
        <div className="relative lg:absolute lg:inset-y-0 lg:right-0 lg:w-[52%] pointer-events-none">
          <img
            src={CLINIC_IMAGES.doctor_pediatrics}
            alt={
              language === 'hi'
                ? 'आरोग्य मल्टी-स्पेशलिटी क्लिनिक की विशेषज्ञ चिकित्सक'
                : 'Specialist physician at Arogya Multi-Specialty Clinic'
            }
            referrerPolicy="no-referrer"
            className="w-full h-[260px] sm:h-[340px] lg:h-full object-cover object-top"
          />
          <div
            aria-hidden="true"
            className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#0B2D52] via-[#0B2D52]/70 to-transparent"
          />
          <div
            aria-hidden="true"
            className="lg:hidden absolute inset-0 bg-gradient-to-t from-[#0B2D52] via-[#0B2D52]/25 to-transparent"
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
                className="min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-full transition-colors whitespace-nowrap"
              >
                <span>{t.hero.primaryCta}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/specializations')}
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

      {/* 2. SPECIALIZED CARE ACROSS KEY DEPARTMENTS (5 / 7 SPLIT) */}
      <section id="section-departments" className="scroll-mt-16 bg-[#F4F8FC] border-b border-[#E2EAF2]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-5">
              <p className="text-xs font-semibold tracking-wide uppercase text-[#1C7ED6]">
                {t.specializationsSection.eyebrow}
              </p>
              <h2 className="font-display text-3xl sm:text-[34px] font-bold text-[#0B2D52] leading-tight">
                {language === 'hi'
                  ? 'प्रमुख चिकित्सा विभागों में विशेषज्ञ देखभाल'
                  : 'Specialized Care Across Key Departments'}
              </h2>
              <p className="text-[15px] text-[#5C6F84] leading-relaxed">
                {t.specializationsSection.subtitle}
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/specializations')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-full transition-colors whitespace-nowrap"
                >
                  <span>{t.specializationsSection.viewAll}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {specializations.map((spec) => {
                const name = language === 'hi' ? spec.nameHi : spec.name;
                const desc = language === 'hi' ? spec.shortDescriptionHi : spec.shortDescription;
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => startBookingWith({ specializationId: spec.id })}
                    className="text-left bg-white border border-[#E2EAF2] hover:border-[#1C7ED6] rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#EAF3FC] text-[#1C7ED6] group-hover:bg-[#1C7ED6] group-hover:text-white flex items-center justify-center transition-colors">
                      <SpecializationIcon iconKey={spec.iconKey} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-[#0B2D52]">{name}</h3>
                      <p className="text-xs text-[#5C6F84] mt-1 line-clamp-2 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* 6th Quick Action Card to Complete Balanced 3x2 Grid */}
              <button
                type="button"
                onClick={() => navigate('/book')}
                className="text-left bg-[#EAF3FC] border border-[#C5DDF8] hover:border-[#1C7ED6] rounded-2xl p-5 flex flex-col justify-between gap-3 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1C7ED6] text-white flex items-center justify-center">
                  <CalendarCheck2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-[#0B2D52]">
                    {language === 'hi' ? 'अपॉइंटमेंट बुक करें' : 'Schedule Consultation'}
                  </h3>
                  <p className="text-xs text-[#195392] mt-1">
                    {language === 'hi' ? 'उपलब्ध समय स्लॉट चुनें →' : 'Choose specialist & time slot →'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. YOUR HEALTH IS OUR PRIORITY BANNER + 4-ITEM ICON BAR */}
      <section id="section-commitment" className="scroll-mt-16 bg-white border-b border-[#E2EAF2]">
        <div className="relative bg-[#0B2D52] text-white overflow-hidden">
          <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6 relative h-64 sm:h-80 lg:h-[360px]">
              <img
                src={CLINIC_IMAGES.facility_interior}
                alt={
                  language === 'hi'
                    ? 'क्लिनिक में चिकित्सक और रोगी परामर्श'
                    : 'Physician consulting with patient in modern clinic suite'
                }
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div
                aria-hidden="true"
                className="hidden lg:block absolute inset-y-0 right-0 w-36 bg-gradient-to-l from-[#0B2D52] to-transparent"
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

      {/* 4. MEET OUR EXPERT DOCTORS */}
      <section id="section-doctors" className="scroll-mt-16 bg-[#F4F8FC] border-b border-[#E2EAF2]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold tracking-wide uppercase text-[#1C7ED6]">
                {t.doctorsSection.eyebrow}
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B2D52] tracking-tight">
                {language === 'hi'
                  ? 'हमारे विशेषज्ञ चिकित्सकों से मिलें'
                  : 'Meet Our Expert Doctors'}
              </h2>
              <p className="text-[15px] text-[#5C6F84] leading-relaxed">
                {t.doctorsSection.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doctors')}
              className="self-start sm:self-auto min-h-[42px] inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <span>{t.doctorsSection.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.slice(0, 4).map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. A MODERN CLINIC BUILT FOR BETTER HEALTH BANNER */}
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
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div
              aria-hidden="true"
              className="hidden lg:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#082240] to-transparent"
            />
          </div>
        </div>
      </section>

      {/* 6. CLINICAL PRECISION SPLIT CARD */}
      <section id="section-diagnostics" className="scroll-mt-16 bg-[#F4F8FC] border-b border-[#E2EAF2]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <div className="bg-white border border-[#E2EAF2] rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6 h-64 sm:h-80 lg:h-full min-h-[300px]">
              <img
                src={CLINIC_IMAGES.facility_interior}
                alt={
                  language === 'hi'
                    ? 'आधुनिक जांच एवं परामर्श कक्ष'
                    : 'Diagnostic and consultation room interior'
                }
                loading="lazy"
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

      {/* 7. WHY CHOOSE AROGYA CLINIC? */}
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
              <div className="rounded-2xl lg:rounded-l-[120px] overflow-hidden border border-[#E2EAF2] aspect-[4/3] bg-[#F4F8FC]">
                <img
                  src={CLINIC_IMAGES.doctor_cardiology}
                  alt={
                    language === 'hi'
                      ? 'वरिष्ठ हृदय रोग विशेषज्ञ डॉ. आरिस शर्मा'
                      : 'Senior Cardiologist Dr. Aris Sharma'
                  }
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. BOOK AN APPOINTMENT TODAY, ONLINE (LIVE INTERACTIVE SPLIT CARD) */}
      <section id="section-quick-book" className="scroll-mt-16 bg-[#0B2D52] text-white">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <p className="text-xs font-semibold tracking-wide uppercase text-[#7DD3FC]">
                {language === 'hi' ? 'सरल एवं सुविधाजनक' : 'Easy & Convenient'}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight max-w-lg">
                {language === 'hi'
                  ? 'आज ही ऑनलाइन अपॉइंटमेंट बुक करें'
                  : 'Book An Appointment Today, Online'}
              </h2>
              <p className="text-[15px] text-slate-200 leading-relaxed max-w-lg">
                {language === 'hi'
                  ? 'कुछ ही चरणों में अपना विभाग, चिकित्सक और उपलब्ध समय चुनें। रिसेप्शन द्वारा पुष्टि के बाद आपको पोर्टल में अपडेट मिलेगा।'
                  : 'Skip the waiting room queue—choose your department, preferred specialist, and live available time slot in seconds.'}
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/book')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/25 rounded-full transition-colors"
                >
                  <span>{t.hero.primaryCta}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Functional Quick-Booking Mini Card */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleQuickBookSubmit}
                className="bg-white text-[#10233B] rounded-2xl p-6 shadow-xl space-y-4 border border-[#E2EAF2]"
              >
                <h3 className="font-display text-lg font-bold text-[#0B2D52]">
                  {language === 'hi' ? 'अपॉइंटमेंट चुनें' : 'Book Your Appointment'}
                </h3>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="qb-spec" className="block text-xs font-semibold text-[#5C6F84] mb-1">
                      {t.booking.steps[0]}
                    </label>
                    <select
                      id="qb-spec"
                      value={qbSpecId}
                      onChange={(e) => setQbSpecId(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl bg-[#F4F8FC]"
                    >
                      {specializations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {language === 'hi' ? s.nameHi : s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="qb-doc" className="block text-xs font-semibold text-[#5C6F84] mb-1">
                      {t.booking.steps[1]}
                    </label>
                    <select
                      id="qb-doc"
                      value={qbDocId}
                      onChange={(e) => setQbDocId(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl bg-[#F4F8FC]"
                    >
                      {qbDoctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {language === 'hi' ? d.nameHi : d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="qb-date" className="block text-xs font-semibold text-[#5C6F84] mb-1">
                        {t.booking.steps[2]}
                      </label>
                      <input
                        id="qb-date"
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        value={qbDate}
                        onChange={(e) => setQbDate(e.target.value)}
                        className="w-full min-h-[42px] px-3 py-2 text-xs font-mono border border-[#E2EAF2] rounded-xl bg-[#F4F8FC] tabular-nums"
                      />
                    </div>
                    <div>
                      <label htmlFor="qb-slot" className="block text-xs font-semibold text-[#5C6F84] mb-1">
                        {t.booking.steps[3]}
                      </label>
                      <select
                        id="qb-slot"
                        value={qbSlot}
                        disabled={qbLoading}
                        onChange={(e) => setQbSlot(e.target.value)}
                        className="w-full min-h-[42px] px-3 py-2 text-xs font-mono border border-[#E2EAF2] rounded-xl bg-[#F4F8FC] tabular-nums disabled:opacity-60"
                      >
                        {qbLoading ? (
                          <option value="">
                            {language === 'hi' ? 'स्लॉट जांचे जा रहे हैं...' : 'Checking slots...'}
                          </option>
                        ) : qbSlots.length === 0 ? (
                          <option value="">
                            {language === 'hi' ? 'कोई स्लॉट नहीं' : 'No open slots'}
                          </option>
                        ) : (
                          qbSlots.map((s) => (
                            <option key={s.time} value={s.time}>
                              {s.time}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[46px] px-5 py-3 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
                >
                  {language === 'hi' ? 'आगे बढ़ें' : 'Book Now'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 9. PATIENT GUIDES & PREPARATION INSIGHTS */}
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
                className="bg-white border border-[#E2EAF2] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="aspect-[16/10] bg-[#EAF3FC] overflow-hidden">
                    <img
                      src={guide.image}
                      alt={guide.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
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

      {/* 10. VERIFIED PATIENT FEEDBACK & REVIEWS */}
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
              onClick={() => navigate('/portal')}
              className="self-start sm:self-auto min-h-[40px] inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#EAF3FC] border border-[#E2EAF2] rounded-full transition-colors whitespace-nowrap"
            >
              <span>{language === 'hi' ? 'पोर्टल से समीक्षा साझा करें' : 'Share Feedback in Portal'}</span>
            </button>
          </div>

          {publicFeedbacks.length === 0 ? (
            <div className="rounded-2xl border border-[#E2EAF2] bg-[#F8FBFF] p-8 text-center space-y-2">
              <MessageSquareQuote className="w-8 h-8 text-[#1C7ED6] mx-auto" aria-hidden="true" />
              <h3 className="font-display text-base font-bold text-[#0B2D52]">
                {language === 'hi'
                  ? 'अभी कोई सार्वजनिक समीक्षा स्वीकृत नहीं हुई है'
                  : 'No approved public reviews published yet'}
              </h3>
              <p className="text-xs sm:text-sm text-[#5C6F84] max-w-lg mx-auto">
                {language === 'hi'
                  ? 'केवल पूर्ण हो चुके अपॉइंटमेंट वाले सत्यापित रोगी, उनकी सहमति और क्लिनिक प्रशासन की स्वीकृति के बाद ही समीक्षाएं यहाँ प्रदर्शित की जाती हैं।'
                  : 'Only verified patients who have completed a clinic visit, consented to public display, and passed clinic moderation appear here.'}
              </p>
            </div>
          ) : (
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
                      <p className="text-xs text-[#5C6F84] border-l-2 border-[#1C7ED6] pl-2.5">
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
          )}
        </div>
      </section>

      {/* 11. CLINIC LOCATION, MAPS & DIRECT CONTACT */}
      <section id="section-location" className="scroll-mt-16 bg-[#F4F8FC] border-t border-[#E2EAF2]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <ClinicLocationSection compact />
        </div>
      </section>

      {/* 12. HEALTHCARE DIRECTORY & SEO SEARCH DISCOVERY */}
      <HomeSeoSection />
    </div>
  );
}
