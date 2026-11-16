export type Language = 'en' | 'hi';

export type ThemeMode = 'light' | 'system' | 'dark';

export type UserRole = 'patient' | 'doctor' | 'staff' | 'admin';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'missed';

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DaySchedule {
  enabled: boolean;
  start: string; // HH:mm
  end: string;   // HH:mm
  slotMinutes: number;
}

export type WeeklySchedule = Record<WeekdayKey, DaySchedule>;

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  nameHi?: string;
  phone: string;
  role: UserRole;
  doctorId?: string;
  preferredLanguage?: Language;
  createdAt: string;
}

export interface Specialization {
  id: string;
  slug: string;
  name: string;
  nameHi: string;
  shortDescription: string;
  shortDescriptionHi: string;
  overview: string;
  overviewHi: string;
  iconKey: 'heart' | 'baby' | 'bone' | 'sparkles' | 'stethoscope';
  commonConditions: string[];
  commonConditionsHi: string[];
  active: boolean;
}

export interface Doctor {
  id: string;
  slug: string;
  name: string;
  nameHi: string;
  specializationId: string;
  qualification: string;
  qualificationHi: string;
  experienceSummary: string;
  experienceSummaryHi: string;
  bio: string;
  bioHi: string;
  languages: string[];
  languagesHi: string[];
  consultationFee: number;
  imageKey: string;
  active: boolean;
  schedule: WeeklySchedule;
  unavailableDates?: string[];
  blockedSlots?: Record<string, string[]>;
}

export interface AppointmentDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface Appointment {
  id: string;
  referenceCode: string;
  patientId: string | null;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  specializationId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  reason: string;
  status: AppointmentStatus;
  documents: AppointmentDocument[];
  clinicNotes?: string;
  createdByRole: UserRole | 'guest';
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface ClinicNotification {
  id: string;
  userId: string;
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  type: 'info' | 'confirmation' | 'update' | 'cancellation' | 'waitlist';
  read: boolean;
  appointmentId?: string;
  waitlistId?: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'reviewed';
  createdAt: string;
}

export interface SeoSettings {
  siteTitle: string;
  defaultDescription: string;
  keywords: string;
  ogImageUrl: string;
  allowIndexing: boolean;
  googleVerificationCode: string;
  bingVerificationCode: string;
}

export interface ReviewSummary {
  count: number;
  averageRating: number;
}

export interface ClinicSettings {
  clinicName: string;
  clinicNameHi: string;
  phone: string;
  email: string;
  address: string;
  addressHi: string;
  hours: string;
  hoursHi: string;
  bookingNotice: string;
  bookingNoticeHi: string;
  emergencyNotice: string;
  emergencyNoticeHi: string;
  seo?: SeoSettings;
}

export interface AvailabilitySlot {
  time: string;
  status: 'available' | 'booked';
}

export interface DoctorSearchResult {
  doctor: Doctor;
  availableCount: number;
  nextAvailableSlot: string | null;
  nextAvailableDate: string | null;
  workingDays: WeekdayKey[];
}

export interface AppointmentSlipData {
  documentType: 'request_receipt' | 'confirmation_slip';
  referenceCode: string;
  status: AppointmentStatus;
  patientName: string;
  doctorName: string;
  doctorNameHi: string;
  doctorQualification: string;
  specializationName: string;
  specializationNameHi: string;
  date: string;
  timeSlot: string;
  bookedAt: string;
  clinicName: string;
  clinicNameHi: string;
  clinicAddress: string;
  clinicAddressHi: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicHours: string;
  clinicHoursHi: string;
  clinicNotice: string;
  clinicNoticeHi: string;
}

export type FeedbackStatus = 'pending_review' | 'approved' | 'rejected' | 'hidden';

export interface PatientFeedback {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  specializationId: string;
  rating: number;
  comment: string;
  doctorFeedback?: string;
  publicConsent: boolean;
  status: FeedbackStatus;
  verifiedVisit: boolean;
  createdAt: string;
  moderatedAt?: string;
  moderatedBy?: string;
}

export interface PublicPatientFeedback {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorNameHi: string;
  specializationId: string;
  specializationName: string;
  specializationNameHi: string;
  rating: number;
  comment: string;
  doctorFeedback?: string;
  verifiedVisit: boolean;
  createdAt: string;
}

export type WaitlistTimeRange = 'morning' | 'afternoon' | 'evening' | 'any';
export type WaitlistStatus = 'active' | 'notified' | 'booked' | 'withdrawn' | 'cancelled' | 'expired';
export type NotificationChannel = 'in_app' | 'whatsapp' | 'sms' | 'email';

export interface AppointmentWaitlistEntry {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: string;
  specializationId: string;
  preferredDate: string;
  preferredEndDate?: string;
  preferredTimeRange: WaitlistTimeRange;
  notificationPreference: NotificationChannel;
  consentToNotify: boolean;
  status: WaitlistStatus;
  notifiedSlot?: {
    date: string;
    timeSlot: string;
    offeredAt: string;
    eventId: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WaitlistNotificationLog {
  id: string;
  waitlistId: string;
  patientId: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  eventId: string;
  channel: NotificationChannel;
  deliveryStatus: 'delivered' | 'provider_not_configured' | 'failed';
  detail: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  details: string;
  createdAt: string;
}

export interface ReportRow {
  id: string;
  referenceCode: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specializationId: string;
  specializationName: string;
  date: string;
  timeSlot: string;
  status: AppointmentStatus;
  bookedAt: string;
}
