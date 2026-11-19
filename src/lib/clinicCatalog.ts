import { CLINIC_IMAGES } from './clinicImages';
import type {
  Appointment,
  AvailabilitySlot,
  ClinicSettings,
  Doctor,
  DoctorSearchResult,
  PublicPatientFeedback,
  ReviewSummary,
  Specialization,
  UserProfile,
  WeekdayKey,
  WeeklySchedule,
} from '../types/clinic';

export interface FaqItem {
  qEn: string;
  qHi: string;
  aEn: string;
  aHi: string;
}

export const CLINIC_FAQ_ITEMS: FaqItem[] = [
  {
    qEn: 'How do I book an appointment with a specialist at Arogya Clinic?',
    qHi: 'आरोग्य क्लिनिक में विशेषज्ञ चिकित्सक के साथ अपॉइंटमेंट कैसे बुक करें?',
    aEn: 'Open the Book Appointment page, select your medical department and specialist, choose a convenient date and time slot, enter patient details, and submit to save your booking and receive a confirmation reference and WhatsApp summary.',
    aHi: 'अपॉइंटमेंट बुक करें पृष्ठ पर जाएं, अपना चिकित्सा विभाग और विशेषज्ञ चुनें, उपलब्ध तिथि व समय स्लॉट चुनें, रोगी का विवरण भरें और सबमिट करें। तुरंत संदर्भ कोड और व्हाट्सएप बुकिंग सारांश प्राप्त होगा।',
  },
  {
    qEn: 'Can I attach previous lab reports or prescriptions before my visit?',
    qHi: 'क्या मैं परामर्श से पहले पिछली जांच रिपोर्ट या पर्चे संलग्न कर सकता हूँ?',
    aEn: 'Yes. Step 6 of the online booking flow allows attaching up to 3 PDF, PNG, or JPG medical documents (up to 2 MB each) so your physician has helpful clinical context ahead of the visit.',
    aHi: 'हाँ। ऑनलाइन बुकिंग के चरण 6 में आप अधिकतम 3 PDF, PNG या JPG मेडिकल दस्तावेज़ (प्रत्येक अधिकतम 2 MB) संलग्न कर सकते हैं।',
  },
  {
    qEn: 'What are the clinic consultation hours and weekly schedule?',
    qHi: 'क्लिनिक के परामर्श समय और साप्ताहिक कार्यदिवस क्या हैं?',
    aEn: 'Arogya Multi-Specialty Clinic operates Monday through Saturday from 08:30 AM to 08:00 PM. Individual specialists maintain dedicated morning, afternoon, or evening OPD hours shown on their profile cards.',
    aHi: 'आरोग्य मल्टी-स्पेशलिटी क्लिनिक सोमवार से शनिवार सुबह 08:30 से रात 08:00 बजे तक खुला रहता है। प्रत्येक विशेषज्ञ का सटीक ओपीडी समय उनकी प्रोफ़ाइल पर दिया गया है।',
  },
  {
    qEn: 'Is bilingual support available in both English and Hindi?',
    qHi: 'क्या क्लिनिक और वेबसाइट पर अंग्रेज़ी और हिन्दी दोनों भाषाओं में सहायता उपलब्ध है?',
    aEn: 'Yes. Both our online booking portal and all specialist physicians support consultations and printed confirmation slips in English and Hindi.',
    aHi: 'हाँ। हमारा ऑनलाइन पोर्टल और सभी विशेषज्ञ चिकित्सक अंग्रेज़ी और हिन्दी दोनों भाषाओं में परामर्श और अपॉइंटमेंट सहायता प्रदान करते हैं।',
  },
  {
    qEn: 'How early should I arrive for my scheduled outpatient consultation?',
    qHi: 'निर्धारित अपॉइंटमेंट समय से कितनी देर पहले क्लिनिक पहुँचना चाहिए?',
    aEn: 'Please arrive 10–15 minutes before your booked slot with a valid photo ID and any recent diagnostic reports or ongoing medication list.',
    aHi: 'कृपया अपने निर्धारित समय से 10–15 मिनट पहले वैध पहचान पत्र तथा पिछली जांच रिपोर्ट या वर्तमान दवाइयों की सूची के साथ क्लिनिक पहुँचें।',
  },
  {
    qEn: 'Does Arogya Clinic handle critical medical emergencies?',
    qHi: 'क्या आरोग्य क्लिनिक गंभीर आपातकालीन सेवाएं प्रदान करता है?',
    aEn: 'Arogya Multi-Specialty Clinic is a scheduled outpatient specialist clinic. For life-threatening emergencies, chest trauma, or acute critical care, please proceed immediately to the nearest emergency hospital.',
    aHi: 'आरोग्य क्लिनिक एक बाह्य रोगी (ओपीडी) विशेषज्ञ केंद्र है। गंभीर या जीवन-संकटकालीन आपात स्थिति में कृपया तुरंत निकटतम आपातकालीन अस्पताल जाएं।',
  },
];

const MORNING_WEEKDAY_SCHEDULE: WeeklySchedule = {
  mon: { enabled: true, start: '09:00', end: '13:30', slotMinutes: 30 },
  tue: { enabled: true, start: '09:00', end: '13:30', slotMinutes: 30 },
  wed: { enabled: true, start: '09:00', end: '13:30', slotMinutes: 30 },
  thu: { enabled: true, start: '09:00', end: '13:30', slotMinutes: 30 },
  fri: { enabled: true, start: '09:00', end: '13:30', slotMinutes: 30 },
  sat: { enabled: true, start: '09:30', end: '13:00', slotMinutes: 30 },
  sun: { enabled: false, start: '10:00', end: '13:00', slotMinutes: 30 },
};

const EVENING_SPLIT_SCHEDULE: WeeklySchedule = {
  mon: { enabled: true, start: '10:00', end: '14:00', slotMinutes: 30 },
  tue: { enabled: true, start: '15:00', end: '19:00', slotMinutes: 30 },
  wed: { enabled: true, start: '10:00', end: '14:00', slotMinutes: 30 },
  thu: { enabled: true, start: '15:00', end: '19:00', slotMinutes: 30 },
  fri: { enabled: true, start: '10:00', end: '14:00', slotMinutes: 30 },
  sat: { enabled: true, start: '10:00', end: '13:30', slotMinutes: 30 },
  sun: { enabled: false, start: '10:00', end: '13:00', slotMinutes: 30 },
};

const FULL_OPD_SCHEDULE: WeeklySchedule = {
  mon: { enabled: true, start: '09:30', end: '14:00', slotMinutes: 30 },
  tue: { enabled: true, start: '09:30', end: '14:00', slotMinutes: 30 },
  wed: { enabled: true, start: '14:30', end: '18:30', slotMinutes: 30 },
  thu: { enabled: true, start: '09:30', end: '14:00', slotMinutes: 30 },
  fri: { enabled: true, start: '14:30', end: '18:30', slotMinutes: 30 },
  sat: { enabled: true, start: '10:00', end: '13:30', slotMinutes: 30 },
  sun: { enabled: false, start: '10:00', end: '13:00', slotMinutes: 30 },
};

export const CLINIC_SPECIALIZATIONS: Specialization[] = [
  {
    id: 'spec-general-physician',
    slug: 'general-physician',
    name: 'General Physician',
    nameHi: 'सामान्य चिकित्सा (जनरल फिजिशियन)',
    shortDescription:
      'Primary adult consultations, fever & infection care, diabetes & thyroid management, and preventive health checks.',
    shortDescriptionHi:
      'वयस्क सामान्य परामर्श, बुखार उपचार, मधुमेह व थायरॉइड प्रबंधन और निवारक स्वास्थ्य जांच।',
    overview:
      'Our General Physician department serves as your primary point of care for acute fevers, metabolic health, blood pressure, and preventive annual checkups under one roof.',
    overviewHi:
      'हमारा सामान्य चिकित्सा विभाग मौसमी बुखार, मधुमेह, थायरॉइड और वार्षिक स्वास्थ्य जांच के लिए एक ही स्थान पर प्राथमिक देखभाल प्रदान करता है।',
    iconKey: 'stethoscope',
    commonConditions: [
      'Acute Fever & Viral Illness Care',
      'Diabetes & Thyroid Monitoring',
      'Hypertension & Metabolic Checkups',
      'Preventive Annual Health Screening',
    ],
    commonConditionsHi: [
      'बुखार और वायरल संक्रमण का इलाज',
      'मधुमेह और थायरॉइड की नियमित जांच',
      'उच्च रक्तचाप एवं मेटाबॉलिक परामर्श',
      'वार्षिक निवारक स्वास्थ्य जांच',
    ],
    active: true,
  },
  {
    id: 'spec-cardiology',
    slug: 'cardiology',
    name: 'Cardiologist',
    nameHi: 'हृदय रोग विज्ञान (कार्डियोलॉजी)',
    shortDescription:
      'Preventive heart screening, hypertension management, ECG interpretation, and long-term cardiac follow-up.',
    shortDescriptionHi:
      'निवारक हृदय जांच, उच्च रक्तचाप प्रबंधन, ईसीजी मूल्यांकन और नियमित हृदय देखभाल।',
    overview:
      'Our Cardiology department focuses on thorough outpatient cardiovascular evaluation, blood pressure and lipid management, ECG diagnostics, and coordinated follow-up care.',
    overviewHi:
      'हमारा हृदय रोग विभाग बाह्य रोगी हृदय मूल्यांकन, रक्तचाप और कोलेस्ट्रॉल प्रबंधन, ईसीजी जांच और नियमित फॉलो-अप पर केंद्रित है।',
    iconKey: 'heart',
    commonConditions: [
      'Hypertension & Blood Pressure Review',
      'Preventive Cardiac Risk Assessment',
      'Chest Discomfort & Palpitation Check',
      'Post-Hospital Cardiac Follow-up',
    ],
    commonConditionsHi: [
      'उच्च रक्तचाप (बीपी) प्रबंधन',
      'निवारक हृदय जोखिम मूल्यांकन',
      'सीने में जकड़न या धड़कन की जांच',
      'उपचार के बाद नियमित फॉलो-अप',
    ],
    active: true,
  },
  {
    id: 'spec-orthopedics',
    slug: 'orthopedics',
    name: 'Orthopaedic',
    nameHi: 'हड्डी एवं जोड़ रोग (ऑर्थोपेडिक्स)',
    shortDescription:
      'Joint pain evaluation, spine and posture care, sports injury recovery, and non-surgical musculoskeletal treatment.',
    shortDescriptionHi:
      'जोड़ों के दर्द की जांच, रीढ़ और मुद्रा देखभाल, खेल चोट पुनर्वास और अस्थि परामर्श।',
    overview:
      'From chronic knee and back stiffness to acute sprains and fracture follow-ups, our Orthopaedic clinic prioritizes accurate diagnosis, mobility preservation, and structured rehab plans.',
    overviewHi:
      'घुटने और कमर के पुराने दर्द से लेकर मोच और फ्रैक्चर के बाद की देखभाल तक, हमारा ऑर्थोपेडिक्स विभाग सटीक निदान और गतिशीलता सुधार पर ध्यान देता है।',
    iconKey: 'bone',
    commonConditions: [
      'Knee, Hip & Shoulder Joint Pain',
      'Neck & Lower Back Stiffness',
      'Ligament Sprains & Sports Injuries',
      'Bone Density & Arthritis Care',
    ],
    commonConditionsHi: [
      'घुटने, कूल्हे और कंधे के जोड़ों का दर्द',
      'गर्दन और कमर की जकड़न',
      'लिगामेंट मोच और खेल चोटें',
      'हड्डी की मजबूती और गठिया देखभाल',
    ],
    active: true,
  },
  {
    id: 'spec-pediatrics',
    slug: 'pediatrics',
    name: 'Pediatrician',
    nameHi: 'बाल रोग विशेषज्ञ (पीडियाट्रिक्स)',
    shortDescription:
      'Infant growth monitoring, childhood immunization guidance, acute fever care, and adolescent health visits.',
    shortDescriptionHi:
      'शिशु विकास निगरानी, टीकाकरण परामर्श, मौसमी बुखार उपचार और किशोर स्वास्थ्य देखभाल।',
    overview:
      'Our Pediatrics unit provides calm, unhurried consultations for newborns, children, and adolescents—supporting parents with clear guidance on nutrition and immunization schedules.',
    overviewHi:
      'हमारी बाल रोग इकाई नवजात शिशुओं, बच्चों और किशोरों के लिए शांत और संवेदनशील परामर्श प्रदान करती है।',
    iconKey: 'baby',
    commonConditions: [
      'Routine Growth & Developmental Checks',
      'Childhood Vaccination Counseling',
      'Respiratory & Seasonal Infections',
      'Pediatric Nutrition & Allergy Care',
    ],
    commonConditionsHi: [
      'नियमित विकास और स्वास्थ्य जांच',
      'बच्चों के टीकाकरण का मार्गदर्शन',
      'श्वसन और मौसमी संक्रमण उपचार',
      'बाल पोषण एवं एलर्जी परामर्श',
    ],
    active: true,
  },
  {
    id: 'spec-neurology',
    slug: 'neurology',
    name: 'Neurologist',
    nameHi: 'मस्तिष्क एवं तंत्रिका रोग (न्यूरोलॉजी)',
    shortDescription:
      'Migraine and headache clinics, nerve pain evaluation, vertigo balance care, and neurological follow-ups.',
    shortDescriptionHi:
      'माइग्रेन एवं सिरदर्द उपचार, नसों के दर्द की जांच, चक्कर और न्यूरोलॉजिकल परामर्श।',
    overview:
      'Our Neurology outpatient unit delivers detailed clinical workups for recurring headaches, peripheral neuropathy, dizziness, sleep disturbances, and long-term nerve care.',
    overviewHi:
      'हमारा न्यूरोलॉजी विभाग माइग्रेन, नसों की कमजोरी, चक्कर आने और मस्तिष्क संबंधी विकारों के लिए गहन नैदानिक मूल्यांकन प्रदान करता है।',
    iconKey: 'brain',
    commonConditions: [
      'Migraine & Chronic Headache Care',
      'Peripheral Neuropathy & Nerve Pain',
      'Vertigo, Dizziness & Balance Issues',
      'Epilepsy & Post-Stroke Follow-up',
    ],
    commonConditionsHi: [
      'माइग्रेन और पुराने सिरदर्द का उपचार',
      'नसों में झुनझुनी और न्यूरोपैथी देखभाल',
      'चक्कर और संतुलन संबंधी समस्याएं',
      'मिर्गी एवं स्ट्रोक के बाद फॉलो-अप',
    ],
    active: true,
  },
  {
    id: 'spec-gynecology',
    slug: 'gynecology',
    name: 'Gynecologist',
    nameHi: 'स्त्री एवं प्रसूति रोग (गायनेकोलॉजी)',
    shortDescription:
      'Antenatal checkups, PCOS & hormonal care, menstrual wellness, and preventive women’s health consultations.',
    shortDescriptionHi:
      'गर्भावस्था जांच, पीसीओएस एवं हार्मोनल देखभाल, मासिक धर्म स्वास्थ्य और महिला कल्याण परामर्श।',
    overview:
      'Our Gynecology clinic offers private, respectful, and evidence-based outpatient care tailored to women across adolescence, pregnancy planning, antenatal monitoring, and menopause.',
    overviewHi:
      'हमारा स्त्री रोग विभाग महिलाओं के लिए गोपनीय, संवेदनशील और प्रमाण-आधारित प्रसवपूर्व, हार्मोनल एवं निवारक स्वास्थ्य देखभाल प्रदान करता है।',
    iconKey: 'female',
    commonConditions: [
      'Antenatal & Pregnancy Monitoring',
      'PCOS & Hormonal Balance Care',
      'Menstrual & Pelvic Health Consults',
      'Preventive Women Wellness Screening',
    ],
    commonConditionsHi: [
      'गर्भावस्था एवं प्रसवपूर्व नियमित जांच',
      'पीसीओएस और हार्मोनल संतुलन उपचार',
      'मासिक धर्म एवं महिला स्वास्थ्य परामर्श',
      'महिला निवारक स्वास्थ्य जांच',
    ],
    active: true,
  },
];

export const CLINIC_DOCTORS: Doctor[] = [
  {
    id: 'doc-sharma',
    slug: 'dr-sharma',
    name: 'Dr. Sharma',
    nameHi: 'डॉ. शर्मा',
    speciality: 'General Physician',
    specialityHi: 'जनरल फिजिशियन (सामान्य चिकित्सा)',
    specializationId: 'spec-general-physician',
    qualification: 'MBBS, MD (Internal Medicine)',
    qualificationHi: 'एमबीबीएस, एमडी (आंतरिक चिकित्सा)',
    experience: '15+ Years Experience',
    experienceSummary: '15+ Years · General Physician & Primary Care',
    experienceSummaryHi: '15+ वर्ष अनुभव · जनरल फिजिशियन एवं प्राथमिक देखभाल',
    rating: 4.9,
    photo: CLINIC_IMAGES.doctor_general_physician,
    timing: 'Mon – Sat · 09:00 AM – 01:30 PM',
    timingHi: 'सोम – शनि · सुबह 09:00 – दोपहर 01:30',
    fees: 600,
    consultationFee: 600,
    imageKey: 'doctor_general_physician',
    bio: 'Dr. Sharma specializes in acute viral fevers, diabetes, hypertension, thyroid management, and comprehensive preventive adult health evaluations with unhurried diagnostic guidance.',
    bioHi: 'डॉ. शर्मा मौसमी बुखार, मधुमेह, रक्तचाप, थायरॉइड और वयस्क निवारक स्वास्थ्य जांच में 15+ वर्षों का गहन नैदानिक अनुभव रखते हैं।',
    languages: ['English', 'Hindi'],
    languagesHi: ['अंग्रेज़ी', 'हिन्दी'],
    active: true,
    schedule: MORNING_WEEKDAY_SCHEDULE,
  },
  {
    id: 'doc-priya',
    slug: 'dr-priya',
    name: 'Dr. Priya',
    nameHi: 'डॉ. प्रिया',
    speciality: 'Cardiologist',
    specialityHi: 'कार्डियोलॉजिस्ट (हृदय रोग विशेषज्ञ)',
    specializationId: 'spec-cardiology',
    qualification: 'MBBS, MD (Medicine), DM (Cardiology)',
    qualificationHi: 'एमबीबीएस, एमडी, डीएम (कार्डियोलॉजी)',
    experience: '12+ Years Experience',
    experienceSummary: '12+ Years · Preventive Cardiology & ECG Care',
    experienceSummaryHi: '12+ वर्ष अनुभव · निवारक हृदय देखभाल एवं ईसीजी',
    rating: 4.9,
    photo: CLINIC_IMAGES.doctor_cardiology,
    timing: 'Mon – Sat · 10:00 AM – 07:00 PM',
    timingHi: 'सोम – शनि · सुबह 10:00 – शाम 07:00',
    fees: 1000,
    consultationFee: 1000,
    imageKey: 'doctor_cardiology',
    bio: 'Dr. Priya leads outpatient cardiology consultations covering blood pressure optimization, lipid management, ECG interpretation, and long-term preventive heart care.',
    bioHi: 'डॉ. प्रिया उच्च रक्तचाप नियंत्रण, कोलेस्ट्रॉल प्रबंधन, ईसीजी समीक्षा और दीर्घकालिक हृदय स्वास्थ्य परामर्श में विशेषज्ञ हैं।',
    languages: ['English', 'Hindi'],
    languagesHi: ['अंग्रेज़ी', 'हिन्दी'],
    active: true,
    schedule: EVENING_SPLIT_SCHEDULE,
  },
  {
    id: 'doc-rohan',
    slug: 'dr-rohan',
    name: 'Dr. Rohan',
    nameHi: 'डॉ. रोहन',
    speciality: 'Orthopaedic',
    specialityHi: 'ऑर्थोपेडिक (हड्डी एवं जोड़ रोग विशेषज्ञ)',
    specializationId: 'spec-orthopedics',
    qualification: 'MBBS, MS (Orthopedics)',
    qualificationHi: 'एमबीबीएस, एमएस (ऑर्थोपेडिक्स)',
    experience: '11+ Years Experience',
    experienceSummary: '11+ Years · Joint, Spine & Sports Injury Care',
    experienceSummaryHi: '11+ वर्ष अनुभव · जोड़, रीढ़ एवं खेल चोट देखभाल',
    rating: 4.8,
    photo: CLINIC_IMAGES.doctor_orthopedics,
    timing: 'Mon – Sat · 09:00 AM – 01:30 PM',
    timingHi: 'सोम – शनि · सुबह 09:00 – दोपहर 01:30',
    fees: 850,
    consultationFee: 850,
    imageKey: 'doctor_orthopedics',
    bio: 'Dr. Rohan evaluates knee, shoulder, and spine stiffness, sports ligament sprains, and fracture follow-ups with structured non-surgical rehabilitation protocols.',
    bioHi: 'डॉ. रोहन घुटने, कंधे व कमर दर्द, खेल चोटों और अस्थि पुनर्वास का सटीक मूल्यांकन एवं गैर-शल्य उपचार प्रदान करते हैं।',
    languages: ['English', 'Hindi'],
    languagesHi: ['अंग्रेज़ी', 'हिन्दी'],
    active: true,
    schedule: MORNING_WEEKDAY_SCHEDULE,
  },
  {
    id: 'doc-anjali',
    slug: 'dr-anjali',
    name: 'Dr. Anjali',
    nameHi: 'डॉ. अंजलि',
    speciality: 'Pediatrician',
    specialityHi: 'पीडियाट्रिशियन (बाल रोग विशेषज्ञ)',
    specializationId: 'spec-pediatrics',
    qualification: 'MBBS, MD (Pediatrics)',
    qualificationHi: 'एमबीबीएस, एमडी (पीडियाट्रिक्स)',
    experience: '10+ Years Experience',
    experienceSummary: '10+ Years · Child & Adolescent Healthcare',
    experienceSummaryHi: '10+ वर्ष अनुभव · शिशु एवं बाल स्वास्थ्य देखभाल',
    rating: 4.9,
    photo: CLINIC_IMAGES.doctor_pediatrics,
    timing: 'Mon – Sat · 09:30 AM – 06:30 PM',
    timingHi: 'सोम – शनि · सुबह 09:30 – शाम 06:30',
    fees: 750,
    consultationFee: 750,
    imageKey: 'doctor_pediatrics',
    bio: 'Dr. Anjali offers gentle, reassuring consultations for newborns, toddlers, and adolescents including growth tracking, vaccination counseling, and seasonal pediatric illnesses.',
    bioHi: 'डॉ. अंजलि नवजात शिशुओं और बच्चों के पोषण, टीकाकरण मार्गदर्शन तथा मौसमी संक्रमणों के लिए संवेदनशील परामर्श देती हैं।',
    languages: ['English', 'Hindi'],
    languagesHi: ['अंग्रेज़ी', 'हिन्दी'],
    active: true,
    schedule: FULL_OPD_SCHEDULE,
  },
  {
    id: 'doc-vikram',
    slug: 'dr-vikram',
    name: 'Dr. Vikram',
    nameHi: 'डॉ. विक्रम',
    speciality: 'Neurologist',
    specialityHi: 'न्यूरोलॉजिस्ट (मस्तिष्क एवं तंत्रिका रोग विशेषज्ञ)',
    specializationId: 'spec-neurology',
    qualification: 'MBBS, MD (Medicine), DM (Neurology)',
    qualificationHi: 'एमबीबीएस, एमडी, डीएम (न्यूरोलॉजी)',
    experience: '13+ Years Experience',
    experienceSummary: '13+ Years · Migraine, Nerve & Stroke Care',
    experienceSummaryHi: '13+ वर्ष अनुभव · माइग्रेन, नसों एवं मस्तिष्क रोग',
    rating: 4.8,
    photo: CLINIC_IMAGES.doctor_neurology,
    timing: 'Mon – Sat · 10:00 AM – 07:00 PM',
    timingHi: 'सोम – शनि · सुबह 10:00 – शाम 07:00',
    fees: 1100,
    consultationFee: 1100,
    imageKey: 'doctor_neurology',
    bio: 'Dr. Vikram treats chronic migraines, vertigo, peripheral neuropathy, epilepsy follow-up, and sleep-related neurological conditions with clear diagnostic workups.',
    bioHi: 'डॉ. विक्रम माइग्रेन, चक्कर, नसों की कमजोरी, मिर्गी फॉलो-अप और न्यूरोलॉजिकल विकारों का आधुनिक नैदानिक उपचार करते हैं।',
    languages: ['English', 'Hindi'],
    languagesHi: ['अंग्रेज़ी', 'हिन्दी'],
    active: true,
    schedule: EVENING_SPLIT_SCHEDULE,
  },
  {
    id: 'doc-neha',
    slug: 'dr-neha',
    name: 'Dr. Neha',
    nameHi: 'डॉ. नेहा',
    speciality: 'Gynecologist',
    specialityHi: 'गायनेकोलॉजिस्ट (स्त्री एवं प्रसूति रोग विशेषज्ञ)',
    specializationId: 'spec-gynecology',
    qualification: 'MBBS, MS (Obstetrics & Gynecology)',
    qualificationHi: 'एमबीबीएस, एमएस (स्त्री एवं प्रसूति रोग)',
    experience: '12+ Years Experience',
    experienceSummary: '12+ Years · Women Wellness & Antenatal Care',
    experienceSummaryHi: '12+ वर्ष अनुभव · महिला स्वास्थ्य एवं प्रसवपूर्व देखभाल',
    rating: 4.9,
    photo: CLINIC_IMAGES.doctor_gynecology,
    timing: 'Mon – Sat · 09:30 AM – 06:30 PM',
    timingHi: 'सोम – शनि · सुबह 09:30 – शाम 06:30',
    fees: 850,
    consultationFee: 850,
    imageKey: 'doctor_gynecology',
    bio: 'Dr. Neha provides confidential, patient-first care across antenatal checkups, PCOS and hormonal balance, menstrual health, and preventive women’s wellness.',
    bioHi: 'डॉ. नेहा गर्भावस्था जांच, पीसीओएस, हार्मोनल संतुलन और महिलाओं के संपूर्ण स्वास्थ्य के लिए संवेदनशील परामर्श प्रदान करती हैं।',
    languages: ['English', 'Hindi'],
    languagesHi: ['अंग्रेज़ी', 'हिन्दी'],
    active: true,
    schedule: FULL_OPD_SCHEDULE,
  },
];

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  clinicName: 'Arogya Multi-Specialty Clinic',
  clinicNameHi: 'आरोग्य मल्टी-स्पेशलिटी क्लिनिक',
  phone: '+91 11 4280 5400',
  email: 'care@arogyaclinic.in',
  address: '14, Gulmohar Enclave Medical Arcade, New Delhi 110049',
  addressHi: '14, गुलमोहर एन्क्लेव मेडिकल आर्केड, नई दिल्ली 110049',
  hours: 'Monday – Saturday, 08:30 AM – 08:00 PM',
  hoursHi: 'सोमवार – शनिवार, सुबह 08:30 – रात 08:00 बजे',
  bookingNotice:
    'Online appointment details are saved to the clinic database and formatted for WhatsApp desk confirmation.',
  bookingNoticeHi:
    'ऑनलाइन बुकिंग विवरण क्लिनिक डेटाबेस में सुरक्षित किए जाते हैं और व्हाट्सएप डेस्क पर भेजे जाते हैं।',
  emergencyNotice:
    'Outpatient Clinic Only: For life-threatening emergencies, please proceed immediately to the nearest emergency hospital.',
  emergencyNoticeHi:
    'केवल बाह्य रोगी क्लिनिक: गंभीर आपातकालीन स्थिति में कृपया तुरंत निकटतम आपातकालीन अस्पताल जाएं।',
  seo: {
    siteTitle: 'Arogya Multi-Specialty Clinic – Specialist Care & Appointments',
    defaultDescription:
      'Book specialist consultations with Dr. Sharma, Dr. Priya, Dr. Rohan, Dr. Anjali, Dr. Vikram, and Dr. Neha at Arogya Multi-Specialty Clinic.',
    keywords:
      'Arogya Multi-Specialty Clinic, New Delhi Clinic, General Physician, Cardiologist, Orthopaedic, Pediatrician, Neurologist, Gynecologist',
    ogImageUrl: '/og-clinic.jpg',
    allowIndexing: true,
    googleVerificationCode: '',
    bingVerificationCode: '',
  },
};

export const DEFAULT_PUBLIC_REVIEWS: PublicPatientFeedback[] = [
  {
    id: 'rev-1',
    doctorId: 'doc-sharma',
    doctorName: 'Dr. Sharma',
    doctorNameHi: 'डॉ. शर्मा',
    specializationId: 'spec-general-physician',
    specializationName: 'General Physician',
    specializationNameHi: 'सामान्य चिकित्सा',
    rating: 5,
    comment:
      'Dr. Sharma listened patiently to my fever and sugar history, explained every test clearly, and kept follow-up instructions simple.',
    doctorFeedback: 'Very calm diagnosis and practical lifestyle advice.',
    verifiedVisit: true,
    createdAt: '2026-03-10T10:15:00.000Z',
  },
  {
    id: 'rev-2',
    doctorId: 'doc-priya',
    doctorName: 'Dr. Priya',
    doctorNameHi: 'डॉ. प्रिया',
    specializationId: 'spec-cardiology',
    specializationName: 'Cardiologist',
    specializationNameHi: 'कार्डियोलॉजिस्ट',
    rating: 5,
    comment:
      'Clean clinic, punctual slot, and Dr. Priya explained my ECG and blood pressure chart without rushing.',
    doctorFeedback: 'Thorough preventive heart checkup.',
    verifiedVisit: true,
    createdAt: '2026-03-14T11:30:00.000Z',
  },
  {
    id: 'rev-3',
    doctorId: 'doc-anjali',
    doctorName: 'Dr. Anjali',
    doctorNameHi: 'डॉ. अंजलि',
    specializationId: 'spec-pediatrics',
    specializationName: 'Pediatrician',
    specializationNameHi: 'बाल रोग विशेषज्ञ',
    rating: 5,
    comment:
      'My 5-year-old was completely comfortable during the checkup. Dr. Anjali answered all our vaccination and diet questions kindly.',
    doctorFeedback: 'Warm and reassuring with young children.',
    verifiedVisit: true,
    createdAt: '2026-03-18T16:00:00.000Z',
  },
];

export const DEFAULT_REVIEW_SUMMARY: ReviewSummary = {
  count: DEFAULT_PUBLIC_REVIEWS.length,
  averageRating: 4.9,
};

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'user-patient-1',
    email: 'patient@arogyaclinic.in',
    name: 'Ananya Verma',
    nameHi: 'अनन्या वर्मा',
    phone: '+91 98104 22190',
    role: 'patient',
    preferredLanguage: 'en',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'user-doctor-1',
    email: 'doctor@arogyaclinic.in',
    name: 'Dr. Sharma',
    nameHi: 'डॉ. शर्मा',
    phone: '+91 98104 11002',
    role: 'doctor',
    doctorId: 'doc-sharma',
    preferredLanguage: 'en',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'user-staff-1',
    email: 'staff@arogyaclinic.in',
    name: 'Kavita Deshmukh',
    nameHi: 'कविता देशमुख',
    phone: '+91 98104 33015',
    role: 'staff',
    preferredLanguage: 'en',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'user-admin-1',
    email: 'admin@arogyaclinic.in',
    name: 'Vikramaditya Rao',
    nameHi: 'विक्रमादित्य राव',
    phone: '+91 98104 00100',
    role: 'admin',
    preferredLanguage: 'en',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
];

function getRelativeDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const INITIAL_DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-1001',
    referenceCode: 'ARG-2601',
    patientId: 'user-patient-1',
    patientName: 'Ananya Verma',
    patientPhone: '+91 98104 22190',
    patientEmail: 'patient@arogyaclinic.in',
    doctorId: 'doc-priya',
    specializationId: 'spec-cardiology',
    date: getRelativeDateStr(1),
    timeSlot: '10:00',
    reason: 'Annual blood pressure review and preventive ECG consultation.',
    status: 'confirmed',
    documents: [],
    clinicNotes: 'Please bring your previous morning BP log.',
    createdByRole: 'patient',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'staff@arogyaclinic.in',
  },
  {
    id: 'appt-1002',
    referenceCode: 'ARG-2602',
    patientId: 'user-patient-1',
    patientName: 'Ananya Verma',
    patientPhone: '+91 98104 22190',
    patientEmail: 'patient@arogyaclinic.in',
    doctorId: 'doc-rohan',
    specializationId: 'spec-orthopedics',
    date: getRelativeDateStr(-2),
    timeSlot: '10:00',
    reason: 'Posture and upper shoulder stiffness evaluation.',
    status: 'completed',
    documents: [],
    clinicNotes: 'Recommended ergonomic setup and 15-minute daily mobility exercises.',
    createdByRole: 'patient',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'doctor@arogyaclinic.in',
  },
];

const LOCAL_APPOINTMENTS_KEY = 'arogya_local_appointments_v1';

export function readLocalAppointments(): Appointment[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return INITIAL_DEMO_APPOINTMENTS;
    }
    const raw = window.localStorage.getItem(LOCAL_APPOINTMENTS_KEY);
    if (!raw) return INITIAL_DEMO_APPOINTMENTS;
    const parsed = JSON.parse(raw) as Appointment[];
    return Array.isArray(parsed) ? parsed : INITIAL_DEMO_APPOINTMENTS;
  } catch {
    return INITIAL_DEMO_APPOINTMENTS;
  }
}

export function saveLocalAppointment(appt: Appointment): Appointment[] {
  const existing = readLocalAppointments();
  const next = [appt, ...existing.filter((a) => a.id !== appt.id)];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage restriction
  }
  return next;
}

export function replaceLocalAppointmentsCache(list: Appointment[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore
  }
}

export function getWeekdayKey(dateStr: string): WeekdayKey | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const d = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(d.getTime())) return null;
  const keys: WeekdayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return keys[d.getUTCDay()];
}

function addDaysToDateStr(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return dt.toISOString().slice(0, 10);
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(total: number): string {
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function computeDoctorSlots(
  doctor: Doctor,
  dateStr: string,
  appointments: Appointment[] = readLocalAppointments()
): AvailabilitySlot[] {
  if (!doctor.active) return [];
  if (Array.isArray(doctor.unavailableDates) && doctor.unavailableDates.includes(dateStr)) {
    return [];
  }

  const weekday = getWeekdayKey(dateStr);
  if (!weekday) return [];
  const daySchedule = doctor.schedule[weekday];
  if (!daySchedule || !daySchedule.enabled) return [];

  const startMin = timeToMinutes(daySchedule.start);
  const endMin = timeToMinutes(daySchedule.end);
  const step = Math.max(15, daySchedule.slotMinutes || 30);

  const blockedSet = new Set(doctor.blockedSlots?.[dateStr] || []);
  const occupiedSlots = new Set(
    appointments
      .filter(
        (a) =>
          a.doctorId === doctor.id &&
          a.date === dateStr &&
          (a.status === 'pending' || a.status === 'confirmed')
      )
      .map((a) => a.timeSlot)
  );

  const slots: AvailabilitySlot[] = [];
  for (let current = startMin; current + step <= endMin; current += step) {
    const label = minutesToTime(current);
    if (blockedSet.has(label)) continue;
    slots.push({
      time: label,
      status: occupiedSlots.has(label) ? 'booked' : 'available',
    });
  }
  return slots;
}

const WEEK_ORDER: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function searchDoctors(params: {
  doctors?: Doctor[];
  specializations?: Specialization[];
  q?: string;
  specializationId?: string;
  day?: WeekdayKey | '';
  date?: string;
}): DoctorSearchResult[] {
  const allDoctors = params.doctors || CLINIC_DOCTORS;
  const allSpecs = params.specializations || CLINIC_SPECIALIZATIONS;
  const q = (params.q || '').trim().toLowerCase();
  const specFilter = params.specializationId && params.specializationId !== 'all' ? params.specializationId : '';
  const dayFilter = params.day || '';
  const dateFilter = params.date || '';

  const specById = new Map(allSpecs.map((s) => [s.id, s]));
  const todayStr = new Date().toISOString().slice(0, 10);
  const appointments = readLocalAppointments();

  const results: DoctorSearchResult[] = [];

  for (const doc of allDoctors) {
    if (!doc.active) continue;
    if (specFilter && doc.specializationId !== specFilter) continue;

    const spec = specById.get(doc.specializationId);
    const workingDays = WEEK_ORDER.filter((wk) => doc.schedule[wk]?.enabled);

    if (dayFilter && !workingDays.includes(dayFilter)) continue;

    if (q) {
      const haystack = [
        doc.name,
        doc.nameHi,
        doc.speciality,
        doc.specialityHi || '',
        doc.qualification,
        doc.qualificationHi,
        doc.experience,
        doc.experienceSummary,
        doc.experienceSummaryHi,
        doc.bio,
        spec?.name || '',
        spec?.nameHi || '',
        ...(spec?.commonConditions || []),
        ...(spec?.commonConditionsHi || []),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) continue;
    }

    let availableCount = 0;
    let nextAvailableSlot: string | null = null;
    let nextAvailableDate: string | null = null;

    if (dateFilter) {
      const daySlots = computeDoctorSlots(doc, dateFilter, appointments).filter(
        (s) => s.status === 'available'
      );
      if (daySlots.length === 0) continue;
      availableCount = daySlots.length;
      nextAvailableSlot = daySlots[0].time;
      nextAvailableDate = dateFilter;
    } else {
      for (let offset = 0; offset < 7; offset++) {
        const candidateDate = addDaysToDateStr(todayStr, offset);
        if (dayFilter && getWeekdayKey(candidateDate) !== dayFilter) continue;
        const openSlots = computeDoctorSlots(doc, candidateDate, appointments).filter(
          (s) => s.status === 'available'
        );
        if (openSlots.length > 0) {
          availableCount = openSlots.length;
          nextAvailableSlot = openSlots[0].time;
          nextAvailableDate = candidateDate;
          break;
        }
      }
    }

    results.push({
      doctor: doc,
      availableCount,
      nextAvailableSlot,
      nextAvailableDate,
      workingDays,
    });
  }

  return results;
}
