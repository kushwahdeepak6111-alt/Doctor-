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

export const DEFAULT_CLINIC_WEEKLY_SCHEDULE: WeeklySchedule = {
  mon: { enabled: true, start: '09:00', end: '13:30', slotMinutes: 30 },
  tue: { enabled: true, start: '09:00', end: '13:30', slotMinutes: 30 },
  wed: { enabled: true, start: '09:00', end: '13:30', slotMinutes: 30 },
  thu: { enabled: true, start: '09:00', end: '13:30', slotMinutes: 30 },
  fri: { enabled: true, start: '09:00', end: '13:30', slotMinutes: 30 },
  sat: { enabled: true, start: '09:30', end: '13:00', slotMinutes: 30 },
  sun: { enabled: false, start: '10:00', end: '13:00', slotMinutes: 30 },
};

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
  const allDoctors = params.doctors || [];
  const allSpecs = params.specializations || [];
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
