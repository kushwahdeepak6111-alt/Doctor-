import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  Appointment,
  AppointmentWaitlistEntry,
  AuditLogEntry,
  ClinicNotification,
  ClinicSettings,
  ContactMessage,
  Doctor,
  PatientFeedback,
  SeoSettings,
  Specialization,
  UserProfile,
  WaitlistNotificationLog,
  WeeklySchedule,
} from '../src/types/clinic.ts';

export interface StoredUser extends UserProfile {
  passwordHash: string;
}

export interface ClinicDatabase {
  users: StoredUser[];
  specializations: Specialization[];
  doctors: Doctor[];
  appointments: Appointment[];
  notifications: ClinicNotification[];
  contactMessages: ContactMessage[];
  settings: ClinicSettings;
  feedbacks: PatientFeedback[];
  waitlist: AppointmentWaitlistEntry[];
  waitlistNotificationLogs: WaitlistNotificationLog[];
  auditLogs: AuditLogEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'clinic-db.json');

export function hashPassword(password: string, salt?: string): string {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return `${usedSalt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

function getRelativeDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_SCHEDULE_WEEKDAY: WeeklySchedule = {
  mon: { enabled: true, start: '09:30', end: '13:30', slotMinutes: 30 },
  tue: { enabled: true, start: '09:30', end: '13:30', slotMinutes: 30 },
  wed: { enabled: true, start: '09:30', end: '13:30', slotMinutes: 30 },
  thu: { enabled: true, start: '10:00', end: '14:00', slotMinutes: 30 },
  fri: { enabled: true, start: '09:30', end: '13:30', slotMinutes: 30 },
  sat: { enabled: true, start: '10:00', end: '13:00', slotMinutes: 30 },
  sun: { enabled: false, start: '10:00', end: '13:00', slotMinutes: 30 },
};

const AFTERNOON_SCHEDULE: WeeklySchedule = {
  mon: { enabled: true, start: '10:00', end: '14:00', slotMinutes: 30 },
  tue: { enabled: true, start: '14:00', end: '18:00', slotMinutes: 30 },
  wed: { enabled: true, start: '10:00', end: '14:00', slotMinutes: 30 },
  thu: { enabled: true, start: '14:00', end: '18:00', slotMinutes: 30 },
  fri: { enabled: true, start: '10:00', end: '14:00', slotMinutes: 30 },
  sat: { enabled: true, start: '10:00', end: '13:00', slotMinutes: 30 },
  sun: { enabled: false, start: '10:00', end: '13:00', slotMinutes: 30 },
};

function createInitialDatabase(): ClinicDatabase {
  const nowIso = new Date().toISOString();
  const today = getRelativeDate(0);
  const tomorrow = getRelativeDate(1);
  const nextWeek = getRelativeDate(3);
  const yesterday = getRelativeDate(-1);
  const twoDaysAgo = getRelativeDate(-2);

  const specializations: Specialization[] = [
    {
      id: 'spec-cardiology',
      slug: 'cardiology',
      name: 'Cardiology',
      nameHi: 'हृदय रोग विज्ञान (कार्डियोलॉजी)',
      shortDescription:
        'Preventive heart screening, hypertension management, ECG interpretation, and long-term cardiac follow-up.',
      shortDescriptionHi:
        'निवारक हृदय जांच, उच्च रक्तचाप प्रबंधन, ईसीजी मूल्यांकन और नियमित हृदय देखभाल।',
      overview:
        'Our Cardiology department focuses on thorough outpatient cardiovascular evaluation, blood pressure and lipid management, ECG diagnostics, and coordinated follow-up plans tailored to each patient.',
      overviewHi:
        'हमारा हृदय रोग विभाग बाह्य रोगी हृदय मूल्यांकन, रक्तचाप और कोलेस्ट्रॉल प्रबंधन, ईसीजी जांच और प्रत्येक रोगी के लिए व्यक्तिगत उपचार योजना पर केंद्रित है।',
      iconKey: 'heart',
      commonConditions: [
        'Hypertension & Blood Pressure Review',
        'Preventive Cardiac Risk Assessment',
        'Chest Discomfort & Palpitation Evaluation',
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
      id: 'spec-pediatrics',
      slug: 'pediatrics',
      name: 'Pediatrics',
      nameHi: 'बाल रोग विशेषज्ञ (पीडियाट्रिक्स)',
      shortDescription:
        'Infant growth monitoring, childhood immunization guidance, acute fever care, and adolescent health visits.',
      shortDescriptionHi:
        'शिशु विकास निगरानी, टीकाकरण परामर्श, मौसमी बुखार उपचार और किशोर स्वास्थ्य देखभाल।',
      overview:
        'Our Pediatrics unit provides calm, unhurried consultations for newborns, children, and adolescents—supporting parents with clear guidance on nutrition, immunization schedules, and seasonal illnesses.',
      overviewHi:
        'हमारी बाल रोग इकाई नवजात शिशुओं, बच्चों और किशोरों के लिए शांत और संवेदनशील परामर्श प्रदान करती है, जिसमें पोषण, टीकाकरण और मौसमी बीमारियों पर स्पष्ट मार्गदर्शन शामिल है।',
      iconKey: 'baby',
      commonConditions: [
        'Routine Growth & Developmental Checks',
        'Childhood Vaccination Counseling',
        'Respiratory & Seasonal Infections',
        'Pediatric Nutrition & Allergy Guidance',
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
      id: 'spec-orthopedics',
      slug: 'orthopedics',
      name: 'Orthopedics',
      nameHi: 'हड्डी एवं जोड़ रोग (ऑर्थोपेडिक्स)',
      shortDescription:
        'Joint pain evaluation, spine and posture care, sports injury recovery, and non-surgical musculoskeletal treatment.',
      shortDescriptionHi:
        'जोड़ों के दर्द की जांच, रीढ़ और मुद्रा देखभाल, खेल चोट पुनर्वास और अस्थि परामर्श।',
      overview:
        'From chronic knee and back stiffness to acute sprains and fracture follow-ups, our Orthopedics clinic prioritizes accurate diagnosis, mobility preservation, and structured rehabilitation plans.',
      overviewHi:
        'घुटने और कमर के पुराने दर्द से लेकर मोच और फ्रैक्चर के बाद की देखभाल तक, हमारा ऑर्थोपेडिक्स विभाग सटीक निदान और गतिशीलता सुधार पर ध्यान देता है।',
      iconKey: 'bone',
      commonConditions: [
        'Knee, Hip & Shoulder Joint Pain',
        'Neck & Lower Back Stiffness',
        'Ligament Sprains & Sports Injuries',
        'Bone Density & Osteoarthritis Care',
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
      id: 'spec-dermatology',
      slug: 'dermatology',
      name: 'Dermatology',
      nameHi: 'त्वचा रोग विज्ञान (डर्मेटोलॉजी)',
      shortDescription:
        'Evidence-based medical skin care for eczema, acne, allergies, hair loss, and chronic dermatological conditions.',
      shortDescriptionHi:
        'एक्जिमा, मुंहासे, त्वचा एलर्जी, बालों के झड़ने और पुरानी त्वचा समस्याओं का वैज्ञानिक उपचार।',
      overview:
        'Our Dermatology consultations focus on clinical diagnosis and gentle, sustainable treatment regimens for skin, scalp, and nail disorders across all age groups.',
      overviewHi:
        'हमारा त्वचा रोग विभाग सभी आयु वर्गों के लिए त्वचा, सिर की त्वचा और नाखूनों से जुड़ी समस्याओं का सटीक नैदानिक परीक्षण और सुरक्षित उपचार प्रदान करता है।',
      iconKey: 'sparkles',
      commonConditions: [
        'Acne, Rosacea & Pigmentation',
        'Eczema, Psoriasis & Contact Dermatitis',
        'Hair & Scalp Disorder Evaluation',
        'Fungal & Bacterial Skin Infections',
      ],
      commonConditionsHi: [
        'मुंहासे और त्वचा रंग असमानता',
        'एक्जिमा, सोरायसिस और एलर्जी',
        'बालों और स्कैल्प की समस्याएं',
        'फंगल एवं त्वचा संक्रमण उपचार',
      ],
      active: true,
    },
    {
      id: 'spec-general-medicine',
      slug: 'general-medicine',
      name: 'Internal Medicine',
      nameHi: 'सामान्य एवं आंतरिक चिकित्सा',
      shortDescription:
        'Primary adult consultations, diabetes and thyroid management, preventive health checks, and coordinated referrals.',
      shortDescriptionHi:
        'वयस्क सामान्य परामर्श, मधुमेह और थायरॉइड प्रबंधन, निवारक जांच और समन्वित देखभाल।',
      overview:
        'Internal Medicine serves as your primary point of continuity for acute fevers, metabolic health, chronic condition monitoring, and coordinated specialist care under one roof.',
      overviewHi:
        'आंतरिक चिकित्सा विभाग मौसमी बुखार, मधुमेह, थायरॉइड और दीर्घकालिक स्वास्थ्य निगरानी के लिए एक ही छत के नीचे प्राथमिक और समन्वित देखभाल प्रदान करता है।',
      iconKey: 'stethoscope',
      commonConditions: [
        'Diabetes & Thyroid Monitoring',
        'Acute Fever & Viral Illness Care',
        'Annual Preventive Health Evaluation',
        'Digestive & Metabolic Consultations',
      ],
      commonConditionsHi: [
        'मधुमेह और थायरॉइड की नियमित जांच',
        'बुखार और वायरल संक्रमण का इलाज',
        'वार्षिक निवारक स्वास्थ्य जांच',
        'पाचन और मेटाबॉलिक परामर्श',
      ],
      active: true,
    },
  ];

  const doctors: Doctor[] = [
    {
      id: 'doc-aris-sharma',
      slug: 'dr-aris-sharma',
      name: 'Dr. Aris Sharma',
      nameHi: 'डॉ. आरिस शर्मा',
      specializationId: 'spec-cardiology',
      qualification: 'MBBS, MD (Medicine), DM (Cardiology)',
      qualificationHi: 'एमबीबीएस, एमडी (मेडिसिन), डीएम (कार्डियोलॉजी)',
      experienceSummary: 'Consultant Cardiologist · Outpatient Cardiac Care',
      experienceSummaryHi: 'कंसल्टेंट कार्डियोलॉजिस्ट · बाह्य रोगी हृदय देखभाल',
      bio: 'Dr. Aris Sharma leads outpatient preventive cardiology and hypertension management, focusing on clear patient communication, diagnostic precision, and long-term cardiovascular wellness.',
      bioHi: 'डॉ. आरिस शर्मा निवारक हृदय देखभाल और उच्च रक्तचाप प्रबंधन में विशेषज्ञ हैं। वे स्पष्ट संवाद, सटीक जांच और दीर्घकालिक हृदय स्वास्थ्य पर ध्यान केंद्रित करते हैं।',
      languages: ['English', 'Hindi'],
      languagesHi: ['अंग्रेज़ी', 'हिन्दी'],
      consultationFee: 900,
      imageKey: 'doctor_cardiology',
      active: true,
      schedule: DEFAULT_SCHEDULE_WEEKDAY,
    },
    {
      id: 'doc-meera-iyer',
      slug: 'dr-meera-iyer',
      name: 'Dr. Meera Iyer',
      nameHi: 'डॉ. मीरा अय्यर',
      specializationId: 'spec-pediatrics',
      qualification: 'MBBS, MD (Pediatrics)',
      qualificationHi: 'एमबीबीएस, एमडी (पीडियाट्रिक्स)',
      experienceSummary: 'Consultant Pediatrician · Child & Adolescent Care',
      experienceSummaryHi: 'कंसल्टेंट बाल रोग विशेषज्ञ · शिशु एवं किशोर देखभाल',
      bio: 'Dr. Meera Iyer provides thorough pediatric consultations covering infant nutrition, developmental milestones, immunization schedules, and acute childhood illnesses in a calm, reassuring setting.',
      bioHi: 'डॉ. मीरा अय्यर शिशु पोषण, विकास निगरानी, टीकाकरण और बच्चों की मौसमी बीमारियों के लिए शांत एवं संवेदनशील वातावरण में परामर्श प्रदान करती हैं।',
      languages: ['English', 'Hindi'],
      languagesHi: ['अंग्रेज़ी', 'हिन्दी'],
      consultationFee: 750,
      imageKey: 'doctor_pediatrics',
      active: true,
      schedule: AFTERNOON_SCHEDULE,
    },
    {
      id: 'doc-rohan-singh',
      slug: 'dr-rohan-singh',
      name: 'Dr. Rohan Singh',
      nameHi: 'डॉ. रोहन सिंह',
      specializationId: 'spec-orthopedics',
      qualification: 'MBBS, MS (Orthopedics)',
      qualificationHi: 'एमबीबीएस, एमएस (ऑर्थोपेडिक्स)',
      experienceSummary: 'Consultant Orthopedic Specialist · Joint & Spine Care',
      experienceSummaryHi: 'कंसल्टेंट अस्थि रोग विशेषज्ञ · जोड़ एवं रीढ़ देखभाल',
      bio: 'Dr. Rohan Singh evaluates acute musculoskeletal injuries, chronic joint discomfort, and posture-related back conditions with a strong emphasis on conservative care and guided physiotherapy.',
      bioHi: 'डॉ. रोहन सिंह जोड़ों के दर्द, खेल चोटों और रीढ़ की समस्याओं का मूल्यांकन करते हैं और सुरक्षित गैर-शल्य चिकित्सा व फिजियोथेरेपी पर जोर देते हैं।',
      languages: ['English', 'Hindi'],
      languagesHi: ['अंग्रेज़ी', 'हिन्दी'],
      consultationFee: 850,
      imageKey: 'doctor_orthopedics',
      active: true,
      schedule: DEFAULT_SCHEDULE_WEEKDAY,
    },
    {
      id: 'doc-amara-khan',
      slug: 'dr-amara-khan',
      name: 'Dr. Amara Khan',
      nameHi: 'डॉ. अमारा खान',
      specializationId: 'spec-dermatology',
      qualification: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
      qualificationHi: 'एमबीबीएस, एमडी (त्वचा रोग विज्ञान)',
      experienceSummary: 'Consultant Dermatologist · Clinical Skin & Hair Care',
      experienceSummaryHi: 'कंसल्टेंट त्वचा रोग विशेषज्ञ · त्वचा एवं केश चिकित्सा',
      bio: 'Dr. Amara Khan diagnoses and manages medical skin, scalp, and allergy conditions using evidence-based clinical protocols tailored to individual skin health needs.',
      bioHi: 'डॉ. अमारा खान त्वचा, एलर्जी और बालों से जुड़ी समस्याओं का प्रमाण-आधारित और व्यक्तिगत नैदानिक उपचार प्रदान करती हैं।',
      languages: ['English', 'Hindi'],
      languagesHi: ['अंग्रेज़ी', 'हिन्दी'],
      consultationFee: 800,
      imageKey: 'doctor_dermatology',
      active: true,
      schedule: AFTERNOON_SCHEDULE,
    },
  ];

  const users: StoredUser[] = [
    {
      id: 'user-patient-1',
      email: 'patient@arogyaclinic.in',
      passwordHash: hashPassword('ClinicDemo#2026'),
      name: 'Ananya Verma',
      nameHi: 'अनन्या वर्मा',
      phone: '+91 98104 22190',
      role: 'patient',
      preferredLanguage: 'en',
      createdAt: nowIso,
    },
    {
      id: 'user-doctor-1',
      email: 'doctor@arogyaclinic.in',
      passwordHash: hashPassword('ClinicDemo#2026'),
      name: 'Dr. Aris Sharma',
      nameHi: 'डॉ. आरिस शर्मा',
      phone: '+91 98104 11002',
      role: 'doctor',
      doctorId: 'doc-aris-sharma',
      preferredLanguage: 'en',
      createdAt: nowIso,
    },
    {
      id: 'user-staff-1',
      email: 'staff@arogyaclinic.in',
      passwordHash: hashPassword('ClinicDemo#2026'),
      name: 'Kavita Deshmukh',
      nameHi: 'कविता देशमुख',
      phone: '+91 98104 33015',
      role: 'staff',
      preferredLanguage: 'en',
      createdAt: nowIso,
    },
    {
      id: 'user-admin-1',
      email: 'admin@arogyaclinic.in',
      passwordHash: hashPassword('ClinicDemo#2026'),
      name: 'Vikramaditya Rao',
      nameHi: 'विक्रमादित्य राव',
      phone: '+91 98104 00100',
      role: 'admin',
      preferredLanguage: 'en',
      createdAt: nowIso,
    },
  ];

  const appointments: Appointment[] = [
    {
      id: 'appt-1001',
      referenceCode: 'ARG-2601',
      patientId: 'user-patient-1',
      patientName: 'Ananya Verma',
      patientPhone: '+91 98104 22190',
      patientEmail: 'patient@arogyaclinic.in',
      doctorId: 'doc-aris-sharma',
      specializationId: 'spec-cardiology',
      date: tomorrow,
      timeSlot: '10:00',
      reason: 'Annual blood pressure check and ECG review prior to travel.',
      status: 'confirmed',
      documents: [],
      clinicNotes: 'Please bring your previous morning BP log.',
      createdByRole: 'patient',
      createdAt: nowIso,
      updatedAt: nowIso,
      updatedBy: 'staff@arogyaclinic.in',
    },
    {
      id: 'appt-1002',
      referenceCode: 'ARG-2602',
      patientId: 'user-patient-1',
      patientName: 'Ananya Verma',
      patientPhone: '+91 98104 22190',
      patientEmail: 'patient@arogyaclinic.in',
      doctorId: 'doc-amara-khan',
      specializationId: 'spec-dermatology',
      date: nextWeek,
      timeSlot: '11:00',
      reason: 'Persistent seasonal skin dryness and mild allergy rash on forearm.',
      status: 'pending',
      documents: [],
      createdByRole: 'patient',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'appt-1003',
      referenceCode: 'ARG-2603',
      patientId: null,
      patientName: 'Rajeshwari Kulkarni',
      patientPhone: '+91 98211 45012',
      patientEmail: 'r.kulkarni@example.in',
      doctorId: 'doc-aris-sharma',
      specializationId: 'spec-cardiology',
      date: today,
      timeSlot: '10:30',
      reason: 'Follow-up consultation for lipid profile and medication dosage.',
      status: 'confirmed',
      documents: [],
      createdByRole: 'staff',
      createdAt: yesterday,
      updatedAt: nowIso,
      updatedBy: 'staff@arogyaclinic.in',
    },
    {
      id: 'appt-1004',
      referenceCode: 'ARG-2604',
      patientId: null,
      patientName: 'Siddharth Malhotra',
      patientPhone: '+91 98711 78120',
      patientEmail: 'siddharth.m@example.in',
      doctorId: 'doc-rohan-singh',
      specializationId: 'spec-orthopedics',
      date: today,
      timeSlot: '11:30',
      reason: 'Right knee stiffness while climbing stairs over the last two weeks.',
      status: 'pending',
      documents: [],
      createdByRole: 'guest',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'appt-1005',
      referenceCode: 'ARG-2605',
      patientId: 'user-patient-1',
      patientName: 'Ananya Verma',
      patientPhone: '+91 98104 22190',
      patientEmail: 'patient@arogyaclinic.in',
      doctorId: 'doc-rohan-singh',
      specializationId: 'spec-orthopedics',
      date: yesterday,
      timeSlot: '10:00',
      reason: 'Posture and upper shoulder strain assessment.',
      status: 'completed',
      documents: [],
      clinicNotes: 'Recommended ergonomic adjustments and 15-minute daily mobility exercises.',
      createdByRole: 'patient',
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      updatedBy: 'doctor@arogyaclinic.in',
    },
    {
      id: 'appt-1006',
      referenceCode: 'ARG-2606',
      patientId: null,
      patientName: 'Neha & Aarav Joshi',
      patientPhone: '+91 98180 65432',
      patientEmail: 'neha.joshi@example.in',
      doctorId: 'doc-meera-iyer',
      specializationId: 'spec-pediatrics',
      date: twoDaysAgo,
      timeSlot: '14:30',
      reason: 'Routine 4-year pediatric wellness check and growth charting.',
      status: 'cancelled',
      documents: [],
      clinicNotes: 'Rescheduled at family request.',
      createdByRole: 'staff',
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      updatedBy: 'staff@arogyaclinic.in',
    },
  ];

  const notifications: ClinicNotification[] = [
    {
      id: 'notif-1',
      userId: 'user-patient-1',
      title: 'Appointment Confirmed',
      titleHi: 'अपॉइंटमेंट की पुष्टि हो गई है',
      message: `Your cardiology consultation with Dr. Aris Sharma on ${tomorrow} at 10:00 is confirmed.`,
      messageHi: `डॉ. आरिस शर्मा के साथ ${tomorrow} को 10:00 बजे आपका हृदय रोग परामर्श कन्फर्म हो गया है।`,
      type: 'confirmation',
      read: false,
      appointmentId: 'appt-1001',
      createdAt: nowIso,
    },
    {
      id: 'notif-2',
      userId: 'user-patient-1',
      title: 'Request Awaiting Confirmation',
      titleHi: 'अनुरोध क्लिनिक की पुष्टि की प्रतीक्षा में है',
      message: `Your request with Dr. Amara Khan on ${nextWeek} at 11:00 has been received and is awaiting clinic confirmation.`,
      messageHi: `डॉ. अमारा खान के साथ ${nextWeek} को 11:00 बजे का आपका अनुरोध प्राप्त हो गया है और क्लिनिक की पुष्टि की प्रतीक्षा में है।`,
      type: 'info',
      read: false,
      appointmentId: 'appt-1002',
      createdAt: nowIso,
    },
  ];

  const DEFAULT_SEO: SeoSettings = {
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

  const settings: ClinicSettings = {
    clinicName: 'Arogya Multi-Specialty Clinic',
    clinicNameHi: 'आरोग्य मल्टी-स्पेशलिटी क्लिनिक',
    phone: '+91 11 4280 5400',
    email: 'care@arogyaclinic.in',
    address: '14, Gulmohar Enclave Medical Arcade, New Delhi 110049',
    addressHi: '14, गुलमोहर एन्क्लेव मेडिकल आर्केड, नई दिल्ली 110049',
    hours: 'Monday – Saturday, 08:30 AM – 08:00 PM',
    hoursHi: 'सोमवार – शनिवार, सुबह 08:30 – रात 08:00 बजे',
    bookingNotice:
      'All online appointment submissions are received as requests and confirmed by clinic reception after schedule verification.',
    bookingNoticeHi:
      'सभी ऑनलाइन अपॉइंटमेंट अनुरोध क्लिनिक रिसेप्शन द्वारा समय की जांच के बाद कन्फर्म किए जाते हैं।',
    emergencyNotice:
      'Outpatient Clinic Only: For life-threatening emergencies, please proceed immediately to the nearest emergency hospital.',
    emergencyNoticeHi:
      'केवल बाह्य रोगी क्लिनिक: गंभीर आपातकालीन स्थिति में कृपया तुरंत निकटतम आपातकालीन अस्पताल जाएं।',
    seo: DEFAULT_SEO,
  };

  return {
    users,
    specializations,
    doctors,
    appointments,
    notifications,
    contactMessages: [],
    settings,
    feedbacks: [],
    waitlist: [],
    waitlistNotificationLogs: [],
    auditLogs: [],
  };
}

let cachedDb: ClinicDatabase | null = null;

function ensureCollections(db: ClinicDatabase): ClinicDatabase {
  db.feedbacks = Array.isArray(db.feedbacks) ? db.feedbacks : [];
  db.waitlist = Array.isArray(db.waitlist) ? db.waitlist : [];
  db.waitlistNotificationLogs = Array.isArray(db.waitlistNotificationLogs)
    ? db.waitlistNotificationLogs
    : [];
  db.auditLogs = Array.isArray(db.auditLogs) ? db.auditLogs : [];
  db.contactMessages = Array.isArray(db.contactMessages) ? db.contactMessages : [];
  db.notifications = Array.isArray(db.notifications) ? db.notifications : [];
  if (db.settings && !db.settings.seo) {
    db.settings.seo = {
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
  }
  return db;
}

export function readDb(): ClinicDatabase {
  if (cachedDb) return cachedDb;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = createInitialDatabase();
      writeDb(initial);
      cachedDb = initial;
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    cachedDb = ensureCollections(JSON.parse(raw) as ClinicDatabase);
    return cachedDb;
  } catch (err) {
    console.warn('Using in-memory clinic database fallback:', err);
    const initial = createInitialDatabase();
    cachedDb = initial;
    return initial;
  }
}

export function writeDb(db: ClinicDatabase): void {
  cachedDb = db;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempPath = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.warn('Could not persist clinic DB to disk; keeping in-memory state:', err);
  }
}

export function sanitizeUser(user: StoredUser): UserProfile {
  const { passwordHash: _ignored, ...safe } = user;
  return safe;
}
