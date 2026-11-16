import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarCheck2,
  Compass,
  HelpCircle,
  MapPin,
  Search,
  Stethoscope,
  X,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

interface SearchEntry {
  id: string;
  category: 'section' | 'page' | 'department' | 'doctor';
  titleEn: string;
  titleHi: string;
  subtitleEn: string;
  subtitleHi: string;
  keywords: string;
  action: () => void;
}

export function BottomSectionSearch() {
  const { language, navigate, scrollToSection, specializations, doctors } = useClinic();
  const isHi = language === 'hi';
  const [query, setQuery] = useState('');

  const allEntries = useMemo<SearchEntry[]>(() => {
    const sections: SearchEntry[] = [
      {
        id: 'sec-departments',
        category: 'section',
        titleEn: 'Specialized Medical Departments',
        titleHi: 'प्रमुख चिकित्सा विभाग',
        subtitleEn: 'Home section · Cardiology, Pediatrics, Orthopedics, Dermatology & Medicine',
        subtitleHi: 'होम सेक्शन · कार्डियोलॉजी, बाल रोग, हड्डी रोग, त्वचा एवं सामान्य चिकित्सा',
        keywords: 'departments specialties cardiology pediatrics orthopedics dermatology medicine विभाग सेवाएं',
        action: () => scrollToSection('section-departments', '/'),
      },
      {
        id: 'sec-doctors',
        category: 'section',
        titleEn: 'Meet Our Expert Doctors',
        titleHi: 'हमारे विशेषज्ञ चिकित्सकों से मिलें',
        subtitleEn: 'Home section · Specialist physicians, qualifications & OPD fees',
        subtitleHi: 'होम सेक्शन · विशेषज्ञ चिकित्सक, योग्यता एवं परामर्श शुल्क',
        keywords: 'doctors specialists physicians md ms dm fee चिकित्सक डॉक्टर शुल्क',
        action: () => scrollToSection('section-doctors', '/'),
      },
      {
        id: 'sec-quick-book',
        category: 'section',
        titleEn: 'Quick Online Appointment Booking',
        titleHi: 'त्वरित ऑनलाइन अपॉइंटमेंट बुकिंग',
        subtitleEn: 'Home section · Select department, doctor, date & time slot',
        subtitleHi: 'होम सेक्शन · विभाग, चिकित्सक, तिथि और समय स्लॉट चुनें',
        keywords: 'book appointment slot schedule online booking अपॉइंटमेंट बुकिंग स्लॉट',
        action: () => scrollToSection('section-quick-book', '/'),
      },
      {
        id: 'sec-diagnostics',
        category: 'section',
        titleEn: 'Clinical Precision & Diagnostics',
        titleHi: 'क्लिनिकल गुणवत्ता एवं जांच सुविधाएं',
        subtitleEn: 'Home section · Pre-visit report uploads & outpatient suites',
        subtitleHi: 'होम सेक्शन · पूर्व-परामर्श रिपोर्ट समीक्षा और परामर्श कक्ष',
        keywords: 'diagnostics precision lab reports suites जांच रिपोर्ट कक्ष',
        action: () => scrollToSection('section-diagnostics', '/'),
      },
      {
        id: 'sec-advantages',
        category: 'section',
        titleEn: 'Why Choose Arogya Clinic',
        titleHi: 'आरोग्य क्लिनिक क्यों चुनें',
        subtitleEn: 'Home section · Verified medical team & reception slot discipline',
        subtitleHi: 'होम सेक्शन · सत्यापित चिकित्सा टीम और पारदर्शी समय व्यवस्था',
        keywords: 'why choose advantages trust clinic standards विशेषताएं विश्वास',
        action: () => scrollToSection('section-advantages', '/'),
      },
      {
        id: 'sec-guides',
        category: 'section',
        titleEn: 'Clinic & Visit Preparation Guides',
        titleHi: 'स्वास्थ्य एवं विज़िट मार्गदर्शन',
        subtitleEn: 'Home section · How booking confirmation & report uploads work',
        subtitleHi: 'होम सेक्शन · अपॉइंटमेंट पुष्टि और रिपोर्ट अपलोड मार्गदर्शन',
        keywords: 'guides preparation instructions news tips मार्गदर्शन निर्देश',
        action: () => scrollToSection('section-guides', '/'),
      },
      {
        id: 'sec-reviews',
        category: 'section',
        titleEn: 'Verified Patient Reviews',
        titleHi: 'सत्यापित रोगी समीक्षाएं',
        subtitleEn: 'Home section · Feedback from completed outpatient consultations',
        subtitleHi: 'होम सेक्शन · पूर्ण परामर्श के बाद रोगी अनुभव',
        keywords: 'reviews feedback ratings patient stories testimonials समीक्षा प्रतिक्रिया रेटिंग',
        action: () => scrollToSection('section-reviews', '/'),
      },
      {
        id: 'sec-location',
        category: 'section',
        titleEn: 'Clinic Location, Map & Directions',
        titleHi: 'क्लिनिक लोकेशन, मैप और दिशा-निर्देश',
        subtitleEn: 'Home section · Address, Google Maps & OPD timings',
        subtitleHi: 'होम सेक्शन · पता, गूगल मैप्स और क्लिनिक समय',
        keywords: 'location map address directions google maps hours पता लोकेशन नक्शा समय',
        action: () => scrollToSection('section-location', '/'),
      },
      {
        id: 'sec-about-clinic',
        category: 'section',
        titleEn: 'About Arogya Modern Clinic',
        titleHi: 'आरोग्य क्लिनिक परिचय',
        subtitleEn: 'Home section · Bilingual desk, 5 specialties & OPD schedule',
        subtitleHi: 'होम सेक्शन · द्विभाषी सहायता और ओपीडी जानकारी',
        keywords: 'about clinic facility overview bilingual हमारे बारे में परिचय',
        action: () => scrollToSection('section-about-clinic', '/'),
      },
      {
        id: 'sec-commitment',
        category: 'section',
        titleEn: 'Your Health Is Our Priority',
        titleHi: 'आपका स्वास्थ्य हमारी प्राथमिकता',
        subtitleEn: 'Home section · Personalized care & calm clinic environment',
        subtitleHi: 'होम सेक्शन · व्यक्तिगत देखभाल और शांत वातावरण',
        keywords: 'priority commitment personalized care calm environment प्राथमिकता देखभाल',
        action: () => scrollToSection('section-commitment', '/'),
      },
      {
        id: 'sec-seo',
        category: 'section',
        titleEn: 'Healthcare Directory & SEO Index',
        titleHi: 'हेल्थकेयर निर्देशिका एवं SEO इंडेक्स',
        subtitleEn: 'Home bottom section · All specialties, doctors, popular searches & sitemap',
        subtitleHi: 'होम बॉटम सेक्शन · सभी विभाग, चिकित्सक, लोकप्रिय खोज एवं साइटमैप',
        keywords: 'seo directory index sitemap search healthcare specialties doctors निर्देशिका खोज',
        action: () => scrollToSection('section-seo', '/'),
      },
    ];

    const pages: SearchEntry[] = [
      {
        id: 'page-doctors',
        category: 'page',
        titleEn: 'Smart Doctor Search Directory',
        titleHi: 'स्मार्ट चिकित्सक खोज निर्देशिका',
        subtitleEn: 'Page · Filter all specialists by department, weekday & open slots',
        subtitleHi: 'पृष्ठ · विभाग, दिन और उपलब्ध स्लॉट के अनुसार चिकित्सक खोजें',
        keywords: 'all doctors directory filter availability search चिकित्सक सूची खोज',
        action: () => navigate('/doctors'),
      },
      {
        id: 'page-faq',
        category: 'page',
        titleEn: 'Patient FAQs & Visit Guidelines',
        titleHi: 'अक्सर पूछे जाने वाले प्रश्न (FAQ)',
        subtitleEn: 'Page · Confirmation rules, report uploads & cancellations',
        subtitleHi: 'पृष्ठ · पुष्टि नियम, रिपोर्ट अपलोड और अपॉइंटमेंट रद्दीकरण',
        keywords: 'faq questions answers help cancel reschedule प्रश्न उत्तर सहायता',
        action: () => navigate('/faq'),
      },
      {
        id: 'page-contact',
        category: 'page',
        titleEn: 'Contact Reception & Inquiry Form',
        titleHi: 'रिसेप्शन संपर्क एवं संदेश फॉर्म',
        subtitleEn: 'Page · Send a message, call desk, or open clinic directions',
        subtitleHi: 'पृष्ठ · संदेश भेजें, कॉल करें या क्लिनिक दिशा-निर्देश देखें',
        keywords: 'contact phone whatsapp email message inquiry संपर्क फ़ोन व्हाट्सएप',
        action: () => navigate('/contact'),
      },
      {
        id: 'page-about',
        category: 'page',
        titleEn: 'About Clinic & Clinical Standards',
        titleHi: 'क्लिनिक मानक एवं हमारे बारे में',
        subtitleEn: 'Page · Outpatient governance, facilities & bilingual support',
        subtitleHi: 'पृष्ठ · बाह्य रोगी मानक, सुविधाएं और द्विभाषी सेवा',
        keywords: 'about hospital clinic standards mission हमारे बारे में मानक',
        action: () => navigate('/about'),
      },
    ];

    const deptEntries: SearchEntry[] = specializations.map((spec) => ({
      id: `dept-${spec.id}`,
      category: 'department',
      titleEn: spec.name,
      titleHi: spec.nameHi,
      subtitleEn: spec.shortDescription,
      subtitleHi: spec.shortDescriptionHi,
      keywords: `${spec.name} ${spec.nameHi} ${spec.shortDescription} ${spec.commonConditions.join(' ')}`,
      action: () => navigate(`/doctors?specializationId=${encodeURIComponent(spec.id)}`),
    }));

    const doctorEntries: SearchEntry[] = doctors.map((doc) => ({
      id: `doc-${doc.id}`,
      category: 'doctor',
      titleEn: doc.name,
      titleHi: doc.nameHi,
      subtitleEn: `${doc.qualification} · ₹${doc.consultationFee}`,
      subtitleHi: `${doc.qualificationHi} · ₹${doc.consultationFee}`,
      keywords: `${doc.name} ${doc.nameHi} ${doc.qualification} ${doc.bio} ${doc.languages.join(' ')}`,
      action: () => navigate(`/doctors/${doc.slug}`),
    }));

    return [...sections, ...pages, ...deptEntries, ...doctorEntries];
  }, [doctors, navigate, scrollToSection, specializations]);

  const trimmedQuery = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!trimmedQuery) return [];
    const tokens = trimmedQuery.split(/\s+/).filter(Boolean);
    return allEntries
      .filter((entry) => {
        const haystack = [
          entry.titleEn,
          entry.titleHi,
          entry.subtitleEn,
          entry.subtitleHi,
          entry.keywords,
        ]
          .join(' ')
          .toLowerCase();
        return tokens.every((tok) => haystack.includes(tok));
      })
      .slice(0, 8);
  }, [allEntries, trimmedQuery]);

  const quickShortcuts = [
    {
      label: isHi ? 'विभाग' : 'Departments',
      icon: Stethoscope,
      onClick: () => scrollToSection('section-departments', '/'),
    },
    {
      label: isHi ? 'चिकित्सक' : 'Expert Doctors',
      icon: Compass,
      onClick: () => scrollToSection('section-doctors', '/'),
    },
    {
      label: isHi ? 'ऑनलाइन बुकिंग' : 'Quick Booking',
      icon: CalendarCheck2,
      onClick: () => scrollToSection('section-quick-book', '/'),
    },
    {
      label: isHi ? 'लोकेशन एवं मैप' : 'Location & Map',
      icon: MapPin,
      onClick: () => scrollToSection('section-location', '/'),
    },
    {
      label: isHi ? 'सवाल (FAQ)' : 'FAQs',
      icon: HelpCircle,
      onClick: () => navigate('/faq'),
    },
  ];

  const categoryLabel = (cat: SearchEntry['category']) => {
    if (cat === 'section') return isHi ? 'सेक्शन' : 'Section';
    if (cat === 'page') return isHi ? 'पृष्ठ' : 'Page';
    if (cat === 'department') return isHi ? 'विभाग' : 'Department';
    return isHi ? 'चिकित्सक' : 'Doctor';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedQuery) return;
    if (matches.length > 0) {
      matches[0].action();
      setQuery('');
      return;
    }
    navigate(`/doctors?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  return (
    <div className="no-print border-b border-white/10 bg-[#0B2544]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7DD3FC]">
              {isHi ? 'त्वरित सेक्शन एवं क्लिनिक खोज' : 'Quick Section & Clinic Search'}
            </p>
            <h2 className="font-display text-lg sm:text-xl font-bold text-white">
              {isHi
                ? 'वेबसाइट के किसी भी सेक्शन, विभाग या चिकित्सक पर सीधे जाएँ'
                : 'Find Any Clinic Section, Department, or Specialist'}
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
            role="search"
            aria-label={isHi ? 'वेबसाइट सेक्शन खोजें' : 'Search website sections'}
            className="w-full lg:max-w-xl flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setQuery('');
                }}
                placeholder={
                  isHi
                    ? 'सेक्शन, विभाग, डॉक्टर, मैप या FAQ खोजें...'
                    : 'Search sections, departments, doctors, reviews, map...'
                }
                aria-label={
                  isHi
                    ? 'सेक्शन, विभाग या चिकित्सक खोजें'
                    : 'Search sections, departments, or doctors'
                }
                className="w-full min-h-[44px] pl-10 pr-9 py-2 text-sm bg-white/10 text-white placeholder:text-slate-300 border border-white/20 focus:border-[#38BDF8] focus:bg-[#071A30] focus:outline-none rounded-xl transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={isHi ? 'खोज साफ़ करें' : 'Clear search'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-white rounded-md"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="min-h-[44px] px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isHi ? 'खोजें' : 'Search'}
            </button>
          </form>
        </div>

        {/* Live Matching Sections / Pages / Doctors */}
        {trimmedQuery ? (
          <div className="rounded-xl border border-white/15 bg-[#071A30] p-3 sm:p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 px-1">
              <span>
                {matches.length > 0
                  ? isHi
                    ? `"${query.trim()}" के लिए ${matches.length} परिणाम`
                    : `${matches.length} matching result${matches.length === 1 ? '' : 's'} for "${query.trim()}"`
                  : isHi
                    ? `"${query.trim()}" के लिए कोई सीधा सेक्शन नहीं मिला`
                    : `No exact section match for "${query.trim()}"`}
              </span>
            </div>

            {matches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {matches.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      item.action();
                      setQuery('');
                    }}
                    className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/12 border border-white/10 hover:border-[#38BDF8]/50 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded bg-[#1C7ED6]/25 text-[#7DD3FC] border border-[#38BDF8]/30 shrink-0">
                          {categoryLabel(item.category)}
                        </span>
                        <span className="text-sm font-semibold text-white truncate">
                          {isHi ? item.titleHi : item.titleEn}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate">
                        {isHi ? item.subtitleHi : item.subtitleEn}
                      </p>
                    </div>
                    <ArrowRight
                      className="w-4 h-4 text-slate-400 group-hover:text-[#7DD3FC] shrink-0 transition-colors"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2">
                <p className="text-xs text-slate-300">
                  {isHi
                    ? 'आप सीधे चिकित्सक निर्देशिका में इस शब्द से खोज कर सकते हैं।'
                    : 'Search our full specialist doctor directory for this term instead.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/doctors?q=${encodeURIComponent(query.trim())}`);
                    setQuery('');
                  }}
                  className="min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-lg cursor-pointer"
                >
                  <span>{isHi ? 'चिकित्सकों में खोजें' : 'Search Doctors Directory'}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300 mr-1">
              {isHi ? 'त्वरित सेक्शन:' : 'Jump to section:'}
            </span>
            {quickShortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <button
                  key={shortcut.label}
                  type="button"
                  onClick={shortcut.onClick}
                  className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-white/8 hover:bg-white/15 border border-white/15 rounded-lg transition-colors cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 text-[#7DD3FC]" aria-hidden="true" />
                  <span>{shortcut.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
