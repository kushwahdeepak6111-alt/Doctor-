import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Globe,
  Search,
  Stethoscope,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export function HomeSeoSection() {
  const { language, navigate, specializations, doctors, settings, reviewSummary } = useClinic();
  const isHi = language === 'hi';

  const clinicName = isHi
    ? settings?.clinicNameHi || 'आरोग्य मल्टी-स्पेशलिटी क्लिनिक'
    : settings?.clinicName || 'Arogya Multi-Specialty Clinic';
  const clinicAddress = isHi
    ? settings?.addressHi || '14, गुलमोहर एन्क्लेव मेडिकल आर्केड, नई दिल्ली 110049'
    : settings?.address || '14, Gulmohar Enclave Medical Arcade, New Delhi 110049';
  const clinicHours = isHi
    ? settings?.hoursHi || 'सोमवार – शनिवार, सुबह 08:30 – रात 08:00 बजे'
    : settings?.hours || 'Monday – Saturday, 08:30 AM – 08:00 PM';

  const popularQueries = isHi
    ? [
        { label: 'नई दिल्ली में हृदय रोग विशेषज्ञ', href: '/doctors?q=Cardiology' },
        { label: 'बाल रोग और शिशु टीकाकरण परामर्श', href: '/doctors?q=Pediatrics' },
        { label: 'घुटने व कमर दर्द (ऑर्थोपेडिक्स)', href: '/doctors?q=Orthopedics' },
        { label: 'त्वचा, एलर्जी व बाल उपचार (डर्मेटोलॉजी)', href: '/doctors?q=Dermatology' },
        { label: 'मधुमेह व थायरॉइड सामान्य चिकित्सा', href: '/doctors?q=Internal+Medicine' },
        { label: 'ऑनलाइन ओपीडी अपॉइंटमेंट बुकिंग', href: '/book' },
      ]
    : [
        { label: 'Cardiologist in New Delhi', href: '/doctors?q=Cardiology' },
        { label: 'Pediatrician & Vaccination Care', href: '/doctors?q=Pediatrics' },
        { label: 'Orthopedic Joint & Spine Specialist', href: '/doctors?q=Orthopedics' },
        { label: 'Dermatologist & Skin Clinic', href: '/doctors?q=Dermatology' },
        { label: 'Internal Medicine, Diabetes & Thyroid', href: '/doctors?q=Internal+Medicine' },
        { label: 'Online Outpatient Slot Booking', href: '/book' },
      ];

  const handleSpaLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <section
      id="section-seo"
      aria-labelledby="seo-directory-heading"
      className="scroll-mt-16 bg-white border-t border-[#E2EAF2]"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16 space-y-10">
        {/* Top Summary & Crawlability Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E2EAF2]">
          <div className="max-w-3xl space-y-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-[#1C7ED6]">
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {isHi
                  ? 'हेल्थकेयर निर्देशिका एवं सर्च इंडेक्स'
                  : 'Clinic Healthcare Directory & Search Index'}
              </span>
            </p>
            <h2
              id="seo-directory-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-[#0B2D52] leading-tight"
            >
              {isHi
                ? `${clinicName} — विशेषज्ञ चिकित्सक, विभाग एवं बाह्य रोगी सेवाएं`
                : `${clinicName} — Specialists, Treatments & OPD Services`}
            </h2>
            <p className="text-sm text-[#5C6F84] leading-relaxed">
              {isHi
                ? `${clinicAddress} में स्थित हमारा क्लिनिक ${clinicHours} तक कार्डियोलॉजी, बाल रोग, हड्डी रोग, त्वचा रोग और आंतरिक चिकित्सा में द्विभाषी (हिन्दी एवं अंग्रेज़ी) ओपीडी परामर्श प्रदान करता है।`
                : `Located at ${clinicAddress}, our outpatient center offers bilingual English & Hindi specialist consultations across Cardiology, Pediatrics, Orthopedics, Dermatology, and Internal Medicine (${clinicHours}).`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="/doctors"
              onClick={(e) => handleSpaLink(e, '/doctors')}
              className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-xl transition-colors"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isHi ? 'सभी चिकित्सक खोजें' : 'Explore Doctor Directory'}</span>
            </a>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#EAF3FC] border border-[#E2EAF2] rounded-xl transition-colors"
            >
              <span>XML Sitemap</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#1C7ED6]" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* 4-Column Structured SEO Directory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Medical Departments & Treatments */}
          <nav aria-label={isHi ? 'चिकित्सा विभाग निर्देशिका' : 'Medical departments directory'} className="space-y-3">
            <h3 className="font-display text-sm font-bold text-[#0B2D52] flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#1C7ED6]" aria-hidden="true" />
              <span>{isHi ? 'प्रमुख चिकित्सा विभाग' : 'Departments & Specialties'}</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              {specializations.map((spec) => (
                <li key={spec.id}>
                  <a
                    href={`/doctors?specializationId=${encodeURIComponent(spec.id)}`}
                    onClick={(e) =>
                      handleSpaLink(e, `/doctors?specializationId=${encodeURIComponent(spec.id)}`)
                    }
                    className="group flex items-center justify-between gap-2 py-1 text-[#10233B] hover:text-[#1C7ED6] transition-colors"
                  >
                    <span className="font-medium truncate">
                      {isHi ? spec.nameHi : spec.name}
                    </span>
                    <ArrowRight
                      className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1C7ED6] shrink-0"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 2: Verified Specialist Profiles */}
          <nav aria-label={isHi ? 'विशेषज्ञ चिकित्सक प्रोफ़ाइल' : 'Specialist doctor profiles'} className="space-y-3">
            <h3 className="font-display text-sm font-bold text-[#0B2D52]">
              {isHi ? 'सत्यापित विशेषज्ञ प्रोफ़ाइल' : 'Verified Specialist Profiles'}
            </h3>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              {doctors.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={`/doctors/${doc.slug}`}
                    onClick={(e) => handleSpaLink(e, `/doctors/${doc.slug}`)}
                    className="block py-1 group"
                  >
                    <div className="font-medium text-[#10233B] group-hover:text-[#1C7ED6] transition-colors">
                      {isHi ? doc.nameHi : doc.name}
                    </div>
                    <div className="text-[11px] text-[#5C6F84] truncate">
                      {isHi ? doc.qualificationHi : doc.qualification} · ₹{doc.consultationFee}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 3: Popular Patient Searches */}
          <nav aria-label={isHi ? 'लोकप्रिय क्लिनिक खोज' : 'Popular patient searches'} className="space-y-3">
            <h3 className="font-display text-sm font-bold text-[#0B2D52]">
              {isHi ? 'लोकप्रिय रोगी खोज' : 'Popular Clinic Searches'}
            </h3>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              {popularQueries.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={(e) => handleSpaLink(e, item.href)}
                    className="inline-flex items-center gap-1.5 py-1 text-[#10233B] hover:text-[#1C7ED6] transition-colors"
                  >
                    <Search className="w-3 h-3 text-[#1C7ED6] shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 4: Clinic Pages & Search Readiness */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold text-[#0B2D52]">
              {isHi ? 'क्लिनिक जानकारी एवं संसाधन' : 'Patient Resources & Indexing'}
            </h3>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              {[
                { label: isHi ? 'ऑनलाइन अपॉइंटमेंट बुक करें' : 'Online Appointment Booking', path: '/book' },
                { label: isHi ? 'सभी चिकित्सा विभाग' : 'All Medical Departments', path: '/specializations' },
                { label: isHi ? 'रोगी सामान्य प्रश्न (FAQ)' : 'Patient FAQs & Policies', path: '/faq' },
                { label: isHi ? 'क्लिनिक के बारे में' : 'About Arogya Clinic', path: '/about' },
                { label: isHi ? 'पता, मैप एवं संपर्क' : 'Directions & Contact Desk', path: '/contact' },
              ].map((link) => (
                <li key={link.path}>
                  <a
                    href={link.path}
                    onClick={(e) => handleSpaLink(e, link.path)}
                    className="py-1 inline-block text-[#10233B] hover:text-[#1C7ED6] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-3 rounded-xl border border-[#E2EAF2] bg-[#F8FBFF] p-3.5 space-y-1.5 text-[11px] text-[#5C6F84]">
              <div className="flex items-center gap-1.5 font-semibold text-[#0B2D52]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>
                  {isHi ? 'सत्यापित Schema.org डेटा सक्रिय' : 'Structured MedicalClinic Schema Active'}
                </span>
              </div>
              <p>
                {reviewSummary && reviewSummary.count > 0
                  ? isHi
                    ? `औसत रोगी रेटिंग: ${reviewSummary.averageRating.toFixed(1)}/5 (${reviewSummary.count} सत्यापित समीक्षाएं)`
                    : `Verified Rating: ${reviewSummary.averageRating.toFixed(1)}/5 (${reviewSummary.count} patient reviews)`
                  : isHi
                    ? 'द्विभाषी इंडेक्स (English / हिन्दी) · XML साइटमैप एवं Robots.txt सक्रिय'
                    : 'Bilingual EN/HI Index · Live XML Sitemap & Robots.txt'}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[#1C7ED6] hover:underline"
                >
                  /sitemap.xml
                </a>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[#1C7ED6] hover:underline"
                >
                  /robots.txt
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
