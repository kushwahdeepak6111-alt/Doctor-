import { CLINIC_FAQ_ITEMS } from '../data/faqItems';
import type {
  ClinicSettings,
  Doctor,
  Language,
  ReviewSummary,
  SeoSettings,
  Specialization,
} from '../types/clinic';

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  siteTitle: 'Arogya Multi-Specialty Clinic – Specialist Care & Appointments',
  defaultDescription:
    'Book verified specialist consultations across Cardiology, Pediatrics, Orthopedics, Dermatology, and Internal Medicine at Arogya Multi-Specialty Clinic.',
  keywords:
    'Arogya Multi-Specialty Clinic, New Delhi Clinic, Cardiology, Pediatrics, Orthopedics, Dermatology, Internal Medicine, OPD Appointment Booking',
  ogImageUrl: '/og-clinic.jpg',
  allowIndexing: true,
  googleVerificationCode: '',
  bingVerificationCode: '',
};

export interface RouteSeoMetadata {
  title: string;
  description: string;
  keywords: string;
  robots: 'index, follow' | 'noindex, nofollow';
  canonicalUrl: string;
  ogType: 'website' | 'profile';
  ogImage: string;
  ogLocale: 'en_IN' | 'hi_IN';
  siteName: string;
  googleVerificationCode: string;
  bingVerificationCode: string;
  jsonLd: Record<string, unknown> | null;
}

export function resolveAbsoluteUrl(origin: string, pathOrUrl: string): string {
  const trimmed = (pathOrUrl || '').trim();
  if (!trimmed) return `${origin}/og-clinic.jpg`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${normalized}`;
}

export function buildRouteSeoMeta(params: {
  route: string;
  origin: string;
  language: Language;
  settings: ClinicSettings | null;
  doctors: Doctor[];
  specializations: Specialization[];
  reviewSummary?: ReviewSummary | null;
}): RouteSeoMetadata {
  const { route, origin, language, settings, doctors, specializations, reviewSummary } = params;
  const isHi = language === 'hi';
  const seo: SeoSettings = {
    ...DEFAULT_SEO_SETTINGS,
    ...(settings?.seo || {}),
  };

  const normalizedRoute = route === '' ? '/' : route.split('?')[0] || '/';
  const canonicalUrl = `${origin}${normalizedRoute}`;
  const clinicName = isHi
    ? settings?.clinicNameHi || 'आरोग्य मल्टी-स्पेशलिटी क्लिनिक'
    : settings?.clinicName || 'Arogya Multi-Specialty Clinic';
  const brandShort = isHi ? 'आरोग्य क्लिनिक' : 'Arogya Clinic';
  const ogImage = resolveAbsoluteUrl(origin, seo.ogImageUrl || '/og-clinic.jpg');
  const allowIndex = seo.allowIndexing !== false;

  const isPrivateRoute =
    normalizedRoute === '/portal' ||
    normalizedRoute.startsWith('/portal/') ||
    normalizedRoute === '/login';

  const robots: 'index, follow' | 'noindex, nofollow' =
    isPrivateRoute || !allowIndex ? 'noindex, nofollow' : 'index, follow';

  let title = seo.siteTitle || DEFAULT_SEO_SETTINGS.siteTitle;
  let description = seo.defaultDescription || DEFAULT_SEO_SETTINGS.defaultDescription;
  let ogType: 'website' | 'profile' = 'website';
  let routeKeywords = seo.keywords;

  const breadcrumbs: Array<{ name: string; item: string }> = [
    { name: isHi ? 'मुख्य पृष्ठ' : 'Home', item: `${origin}/` },
  ];

  let matchedDoctor: Doctor | undefined;
  let matchedSpec: Specialization | undefined;

  if (normalizedRoute === '/') {
    title = isHi
      ? 'आरोग्य क्लिनिक – विशेषज्ञ चिकित्सक एवं ऑनलाइन अपॉइंटमेंट'
      : seo.siteTitle || 'Arogya Multi-Specialty Clinic – Specialist Care & OPD Booking';
    description = isHi
      ? 'हृदय रोग, बाल रोग, हड्डी रोग, त्वचा रोग और आंतरिक चिकित्सा के विशेषज्ञों से परामर्श हेतु आरोग्य क्लिनिक में ऑनलाइन अपॉइंटमेंट बुक करें।'
      : seo.defaultDescription;
  } else if (normalizedRoute === '/about') {
    title = isHi
      ? `हमारे बारे में – ${brandShort}`
      : `About Our Clinic & Medical Standards – ${brandShort}`;
    description = isHi
      ? 'आरोग्य मल्टी-स्पेशलिटी क्लिनिक के नैदानिक मानकों, आधुनिक सुविधाओं और रोगी-केंद्रित बाह्य रोगी देखभाल के बारे में जानें।'
      : 'Learn about Arogya Multi-Specialty Clinic in New Delhi, our outpatient facilities, clinical governance, and bilingual patient care standards.';
    breadcrumbs.push({ name: isHi ? 'हमारे बारे में' : 'About', item: `${origin}/about` });
  } else if (normalizedRoute === '/specializations' || normalizedRoute === '/services') {
    title = isHi
      ? `चिकित्सा विभाग एवं सेवाएं – ${brandShort}`
      : `Medical Specialties & Departments – ${brandShort}`;
    description = isHi
      ? 'कार्डियोलॉजी, पीडियाट्रिक्स, ऑर्थोपेडिक्स, डर्मेटोलॉजी और जनरल मेडिसिन विभागों की विस्तृत जांच एवं परामर्श सेवाओं की जानकारी प्राप्त करें।'
      : 'Explore Cardiology, Pediatrics, Orthopedics, Dermatology, and Internal Medicine outpatient departments and book specialist visits online.';
    breadcrumbs.push({
      name: isHi ? 'विभाग' : 'Specializations',
      item: `${origin}/specializations`,
    });
  } else if (normalizedRoute === '/doctors') {
    title = isHi
      ? `विशेषज्ञ चिकित्सक सूची – ${brandShort}`
      : `Find Specialist Doctors & OPD Hours – ${brandShort}`;
    description = isHi
      ? 'आरोग्य क्लिनिक के अनुभवी MD, MS और DM विशेषज्ञों की योग्यता, परामर्श शुल्क और लाइव ओपीडी स्लॉट खोजें व तुलना करें।'
      : 'Search verified specialist doctors by department, weekday, or live date availability and schedule your outpatient consultation online.';
    breadcrumbs.push({ name: isHi ? 'चिकित्सक' : 'Doctors', item: `${origin}/doctors` });
  } else if (normalizedRoute.startsWith('/doctors/')) {
    const slug = normalizedRoute.replace('/doctors/', '').split('/')[0];
    matchedDoctor = doctors.find((d) => d.slug === slug);
    if (matchedDoctor) {
      matchedSpec = specializations.find((s) => s.id === matchedDoctor!.specializationId);
      const docName = isHi ? matchedDoctor.nameHi : matchedDoctor.name;
      const specName = matchedSpec ? (isHi ? matchedSpec.nameHi : matchedSpec.name) : '';
      ogType = 'profile';
      title = `${docName}${specName ? ` – ${specName}` : ''} | ${brandShort}`;
      description = isHi
        ? `${docName} (${matchedDoctor.qualificationHi}) से ${brandShort} में परामर्श लें। शुल्क ₹${matchedDoctor.consultationFee}, साप्ताहिक ओपीडी समय देखें और स्लॉट बुक करें।`
        : `Consult ${matchedDoctor.name} (${matchedDoctor.qualification})${specName ? ` in ${specName}` : ''} at ${brandShort}. View weekly OPD hours, fee ₹${matchedDoctor.consultationFee}, and book online.`;
      routeKeywords = `${matchedDoctor.name}, ${specName}, ${matchedDoctor.qualification}, ${seo.keywords}`;
      breadcrumbs.push({ name: isHi ? 'चिकित्सक' : 'Doctors', item: `${origin}/doctors` });
      breadcrumbs.push({ name: docName, item: canonicalUrl });
    } else {
      title = isHi ? `चिकित्सक प्रोफ़ाइल – ${brandShort}` : `Specialist Profile – ${brandShort}`;
    }
  } else if (normalizedRoute === '/book') {
    title = isHi
      ? `ऑनलाइन अपॉइंटमेंट बुक करें – ${brandShort}`
      : `Book Outpatient Appointment Online – ${brandShort}`;
    description = isHi
      ? 'विभाग, विशेषज्ञ चिकित्सक, तिथि और उपलब्ध समय स्लॉट चुनकर आरोग्य क्लिनिक में अपना ओपीडी अपॉइंटमेंट तुरंत बुक करें।'
      : 'Schedule your specialist consultation online in minutes. Choose department, doctor, date, and real-time OPD slot with instant request receipt.';
    breadcrumbs.push({ name: isHi ? 'बुकिंग' : 'Book Appointment', item: `${origin}/book` });
  } else if (normalizedRoute === '/faq') {
    title = isHi
      ? `अक्सर पूछे जाने वाले प्रश्न – ${brandShort}`
      : `Patient FAQs & Visit Guidelines – ${brandShort}`;
    description = isHi
      ? 'अपॉइंटमेंट पुष्टि, मेडिकल रिपोर्ट अपलोड, समय परिवर्तन, और द्विभाषी परामर्श से जुड़े सामान्य प्रश्नों के स्पष्ट उत्तर।'
      : 'Find clear answers on appointment confirmation, medical report uploads, cancellations, bilingual consultations, and clinic visit policies.';
    breadcrumbs.push({ name: isHi ? 'सामान्य प्रश्न' : 'FAQ', item: `${origin}/faq` });
  } else if (normalizedRoute === '/contact') {
    title = isHi
      ? `संपर्क एवं क्लिनिक लोकेशन – ${brandShort}`
      : `Contact Clinic Desk, Hours & Directions – ${brandShort}`;
    description = isHi
      ? 'गुलमोहर एन्क्लेव, नई दिल्ली स्थित आरोग्य क्लिनिक का पता, फ़ोन नंबर, गूगल मैप्स लोकेशन और रिसेप्शन संपर्क फॉर्म प्राप्त करें।'
      : 'Reach Arogya Multi-Specialty Clinic reception in New Delhi. View clinic hours, phone desk, Google Maps directions, and send inquiries online.';
    breadcrumbs.push({ name: isHi ? 'संपर्क' : 'Contact', item: `${origin}/contact` });
  } else if (normalizedRoute === '/login') {
    title = isHi ? `रोगी एवं स्टाफ पोर्टल लॉगिन – ${brandShort}` : `Clinic Portal Sign In – ${brandShort}`;
    description = isHi
      ? 'रोगी, चिकित्सक, स्टाफ और क्लिनिक प्रशासन के लिए सुरक्षित पोर्टल लॉगिन।'
      : 'Secure sign-in for patients, doctors, reception staff, and clinic administrators.';
  } else if (normalizedRoute === '/portal') {
    title = isHi ? `क्लिनिक पोर्टल – ${brandShort}` : `Clinic Dashboard Portal – ${brandShort}`;
    description = isHi
      ? 'अपने अपॉइंटमेंट, रिपोर्ट और क्लिनिक कार्यप्रवाह प्रबंधित करें।'
      : 'Manage your appointments, medical documents, and clinic operations.';
  }

  let jsonLd: Record<string, unknown> | null = null;

  if (!isPrivateRoute) {
    const graph: Array<Record<string, unknown>> = [];

    const medicalClinicNode: Record<string, unknown> = {
      '@type': 'MedicalClinic',
      '@id': `${origin}/#clinic`,
      name: settings?.clinicName || 'Arogya Multi-Specialty Clinic',
      alternateName: settings?.clinicNameHi || 'आरोग्य मल्टी-स्पेशलिटी क्लिनिक',
      url: `${origin}/`,
      image: ogImage,
      telephone: settings?.phone || '+91 11 4280 5400',
      email: settings?.email || 'care@arogyaclinic.in',
      description: seo.defaultDescription,
      address: {
        '@type': 'PostalAddress',
        streetAddress: '14, Gulmohar Enclave Medical Arcade',
        addressLocality: 'New Delhi',
        addressRegion: 'DL',
        postalCode: '110049',
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 28.5562,
        longitude: 77.2116,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '08:30',
          closes: '20:00',
        },
      ],
      medicalSpecialty: specializations.map((s) => s.name),
      availableLanguage: ['English', 'Hindi'],
    };

    if (reviewSummary && reviewSummary.count > 0 && reviewSummary.averageRating > 0) {
      medicalClinicNode.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: Number(reviewSummary.averageRating.toFixed(1)),
        reviewCount: reviewSummary.count,
        bestRating: 5,
        worstRating: 1,
      };
    }

    graph.push(medicalClinicNode);

    if (normalizedRoute === '/') {
      graph.push({
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: `${origin}/`,
        name: clinicName,
        inLanguage: isHi ? 'hi-IN' : 'en-IN',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${origin}/doctors?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      });
    }

    if (matchedDoctor) {
      graph.push({
        '@type': 'Physician',
        '@id': `${canonicalUrl}#physician`,
        name: matchedDoctor.name,
        alternateName: matchedDoctor.nameHi,
        description: matchedDoctor.bio,
        medicalSpecialty: matchedSpec?.name || 'Outpatient Specialist',
        url: canonicalUrl,
        availableLanguage: matchedDoctor.languages,
        priceRange: `₹${matchedDoctor.consultationFee}`,
        worksFor: { '@id': `${origin}/#clinic` },
      });
    }

    if (normalizedRoute === '/faq') {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: CLINIC_FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: isHi ? item.qHi : item.qEn,
          acceptedAnswer: {
            '@type': 'Answer',
            text: isHi ? item.aHi : item.aEn,
          },
        })),
      });
    }

    if (breadcrumbs.length > 1) {
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: b.name,
          item: b.item,
        })),
      });
    }

    jsonLd = {
      '@context': 'https://schema.org',
      '@graph': graph,
    };
  }

  return {
    title,
    description,
    keywords: routeKeywords,
    robots,
    canonicalUrl,
    ogType,
    ogImage,
    ogLocale: isHi ? 'hi_IN' : 'en_IN',
    siteName: clinicName,
    googleVerificationCode: seo.googleVerificationCode || '',
    bingVerificationCode: seo.bingVerificationCode || '',
    jsonLd,
  };
}
