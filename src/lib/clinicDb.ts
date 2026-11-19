import {
  CLINIC_DOCTORS,
  CLINIC_SPECIALIZATIONS,
  DEFAULT_PUBLIC_REVIEWS,
  readLocalAppointments,
  replaceLocalAppointmentsCache,
  saveLocalAppointment,
} from './clinicCatalog';
import { resolveClinicImage } from './clinicImages';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentWaitlistEntry,
  ContactMessage,
  Doctor,
  FeedbackStatus,
  PatientFeedback,
  PublicPatientFeedback,
  Specialization,
  UserProfile,
} from '../types/clinic';

function isMissingTableError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  return (
    err.code === 'PGRST205' ||
    err.code === '42P01' ||
    err.code === '42703' ||
    Boolean(err.message && err.message.includes('schema cache'))
  );
}

function normalizeSpecializationRow(raw: Record<string, unknown>): Specialization | null {
  const id = String(raw.id || '').trim();
  const name = String(raw.name || '').trim();
  if (!id || !name) return null;
  const fallback = CLINIC_SPECIALIZATIONS.find((s) => s.id === id);

  const rawShortDesc = String(raw.short_description ?? raw.shortDescription ?? '').trim();
  const rawShortDescHi = String(raw.short_description_hi ?? raw.shortDescriptionHi ?? '').trim();
  const rawOverview = String(raw.overview ?? '').trim();
  const rawOverviewHi = String(raw.overview_hi ?? raw.overviewHi ?? '').trim();
  const rawConditions = raw.common_conditions ?? raw.commonConditions;
  const rawConditionsHi = raw.common_conditions_hi ?? raw.commonConditionsHi;

  return {
    id,
    slug: String(raw.slug || fallback?.slug || id),
    name,
    nameHi: String(raw.name_hi ?? raw.nameHi ?? fallback?.nameHi ?? name),
    shortDescription: rawShortDesc || fallback?.shortDescription || '',
    shortDescriptionHi: rawShortDescHi || fallback?.shortDescriptionHi || '',
    overview: rawOverview || fallback?.overview || '',
    overviewHi: rawOverviewHi || fallback?.overviewHi || '',
    iconKey: (raw.icon_key ?? raw.iconKey ?? fallback?.iconKey ?? 'stethoscope') as Specialization['iconKey'],
    commonConditions:
      Array.isArray(rawConditions) && rawConditions.length > 0
        ? (rawConditions as string[])
        : fallback?.commonConditions || [],
    commonConditionsHi:
      Array.isArray(rawConditionsHi) && rawConditionsHi.length > 0
        ? (rawConditionsHi as string[])
        : fallback?.commonConditionsHi || [],
    active: raw.active !== false,
  };
}

function normalizeDoctorRow(
  raw: Record<string, unknown>,
  primarySpecByDoctor?: Map<string, string>
): Doctor | null {
  const id = String(raw.id || '').trim();
  const name = String(raw.name || '').trim();
  if (!id || !name) return null;
  const fallback = CLINIC_DOCTORS.find((d) => d.id === id || d.slug === raw.slug);
  const imageKey = String(raw.image_key ?? raw.imageKey ?? fallback?.imageKey ?? 'doctor_general_physician');
  const rawPhoto = String(raw.photo || '').trim();
  const feeNum = Number(raw.fees ?? raw.consultation_fee ?? raw.consultationFee ?? fallback?.fees ?? 600);
  const scheduleObj =
    raw.schedule && typeof raw.schedule === 'object' && Object.keys(raw.schedule as object).length > 0
      ? (raw.schedule as Doctor['schedule'])
      : fallback?.schedule || CLINIC_DOCTORS[0].schedule;
  const mappedSpecId =
    String(raw.specialization_id ?? raw.specializationId ?? '').trim() ||
    primarySpecByDoctor?.get(id) ||
    fallback?.specializationId ||
    '';

  return {
    id,
    slug: String(raw.slug || fallback?.slug || id),
    name,
    nameHi: String(raw.name_hi ?? raw.nameHi ?? fallback?.nameHi ?? name),
    speciality: String(raw.speciality ?? raw.specialty ?? fallback?.speciality ?? ''),
    specialityHi: String(raw.speciality_hi ?? raw.specialityHi ?? fallback?.specialityHi ?? ''),
    specializationId: mappedSpecId,
    qualification: String(raw.qualification ?? fallback?.qualification ?? ''),
    qualificationHi: String(
      raw.qualification_hi ?? raw.qualificationHi ?? fallback?.qualificationHi ?? ''
    ),
    experience: String(raw.experience ?? fallback?.experience ?? ''),
    experienceSummary: String(
      raw.experience_summary ?? raw.experienceSummary ?? fallback?.experienceSummary ?? ''
    ),
    experienceSummaryHi: String(
      raw.experience_summary_hi ?? raw.experienceSummaryHi ?? fallback?.experienceSummaryHi ?? ''
    ),
    rating: Number.isFinite(Number(raw.rating)) ? Number(raw.rating) : fallback?.rating ?? 4.8,
    photo: rawPhoto || resolveClinicImage(imageKey),
    timing: String(raw.timing ?? fallback?.timing ?? ''),
    timingHi: String(raw.timing_hi ?? raw.timingHi ?? fallback?.timingHi ?? ''),
    fees: Number.isFinite(feeNum) ? feeNum : 600,
    consultationFee: Number.isFinite(feeNum) ? feeNum : 600,
    imageKey,
    bio: String(raw.bio ?? fallback?.bio ?? ''),
    bioHi: String(raw.bio_hi ?? raw.bioHi ?? fallback?.bioHi ?? ''),
    languages: Array.isArray(raw.languages)
      ? (raw.languages as string[])
      : fallback?.languages || ['English', 'Hindi'],
    languagesHi: Array.isArray(raw.languages_hi ?? raw.languagesHi)
      ? ((raw.languages_hi ?? raw.languagesHi) as string[])
      : fallback?.languagesHi || ['अंग्रेज़ी', 'हिन्दी'],
    active: raw.active !== false,
    schedule: scheduleObj,
    unavailableDates: Array.isArray(raw.unavailable_dates ?? raw.unavailableDates)
      ? ((raw.unavailable_dates ?? raw.unavailableDates) as string[])
      : undefined,
    blockedSlots:
      (raw.blocked_slots ?? raw.blockedSlots) && typeof (raw.blocked_slots ?? raw.blockedSlots) === 'object'
        ? ((raw.blocked_slots ?? raw.blockedSlots) as Record<string, string[]>)
        : undefined,
  };
}

function normalizeAppointmentRow(raw: Record<string, unknown>): Appointment {
  return {
    id: String(raw.id || ''),
    referenceCode: String(raw.reference_code ?? raw.referenceCode ?? ''),
    patientId: (raw.patient_id ?? raw.patientId ?? null) as string | null,
    patientName: String(raw.patient_name ?? raw.patientName ?? ''),
    patientPhone: String(raw.patient_phone ?? raw.patientPhone ?? ''),
    patientEmail: String(raw.patient_email ?? raw.patientEmail ?? ''),
    doctorId: String(raw.doctor_id ?? raw.doctorId ?? ''),
    specializationId: String(raw.specialization_id ?? raw.specializationId ?? ''),
    date: String(raw.date || ''),
    timeSlot: String(raw.time_slot ?? raw.timeSlot ?? ''),
    reason: String(raw.reason || ''),
    status: String(raw.status || 'confirmed') as AppointmentStatus,
    documents: Array.isArray(raw.documents) ? (raw.documents as Appointment['documents']) : [],
    clinicNotes: String(raw.clinic_notes ?? raw.clinicNotes ?? ''),
    createdByRole: String(raw.created_by_role ?? raw.createdByRole ?? 'guest') as Appointment['createdByRole'],
    createdAt: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updated_at ?? raw.updatedAt ?? new Date().toISOString()),
    updatedBy: (raw.updated_by ?? raw.updatedBy) as string | undefined,
  };
}

export interface SupabaseCatalogStatus {
  specializations: Specialization[];
  doctors: Doctor[];
  source: 'supabase' | 'verified-fallback';
  schemaMissing: boolean;
}

export async function fetchClinicCatalogFromSupabase(): Promise<SupabaseCatalogStatus> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      specializations: CLINIC_SPECIALIZATIONS,
      doctors: CLINIC_DOCTORS,
      source: 'verified-fallback',
      schemaMissing: false,
    };
  }

  const [specResult, docResult, linkResult] = await Promise.all([
    client.from('specializations').select('*').eq('active', true).order('created_at', { ascending: true }),
    client.from('doctors').select('*').eq('active', true).order('created_at', { ascending: true }),
    client.from('doctor_specializations').select('doctor_id, specialization_id, is_primary'),
  ]);

  if (isMissingTableError(specResult.error) || isMissingTableError(docResult.error)) {
    return {
      specializations: CLINIC_SPECIALIZATIONS,
      doctors: CLINIC_DOCTORS,
      source: 'verified-fallback',
      schemaMissing: true,
    };
  }

  if (specResult.error) throw new Error(specResult.error.message);
  if (docResult.error) throw new Error(docResult.error.message);

  const primarySpecByDoctor = new Map<string, string>();
  if (!linkResult.error && Array.isArray(linkResult.data)) {
    for (const link of linkResult.data as Array<{
      doctor_id?: string;
      specialization_id?: string;
      is_primary?: boolean;
    }>) {
      if (!link.doctor_id || !link.specialization_id) continue;
      if (link.is_primary || !primarySpecByDoctor.has(link.doctor_id)) {
        primarySpecByDoctor.set(link.doctor_id, link.specialization_id);
      }
    }
  }

  const specs = (specResult.data || [])
    .map((row) => normalizeSpecializationRow(row as Record<string, unknown>))
    .filter((s): s is Specialization => Boolean(s));

  const docs = (docResult.data || [])
    .map((row) => normalizeDoctorRow(row as Record<string, unknown>, primarySpecByDoctor))
    .filter((d): d is Doctor => Boolean(d));

  return {
    specializations: specs.length > 0 ? specs : CLINIC_SPECIALIZATIONS,
    doctors: docs.length > 0 ? docs : CLINIC_DOCTORS,
    source: specs.length > 0 && docs.length > 0 ? 'supabase' : 'verified-fallback',
    schemaMissing: false,
  };
}

export interface DbWriteResult<T> {
  data: T;
  persistedInSupabase: boolean;
  schemaMissing?: boolean;
  warning?: string;
}

export async function createAppointmentInSupabase(
  appt: Appointment
): Promise<DbWriteResult<Appointment>> {
  saveLocalAppointment(appt);

  const client = getSupabaseClient();
  if (!client) {
    return { data: appt, persistedInSupabase: false };
  }

  const row = {
    id: appt.id,
    reference_code: appt.referenceCode,
    patient_id: appt.patientId,
    patient_name: appt.patientName,
    patient_phone: appt.patientPhone,
    patient_email: appt.patientEmail,
    doctor_id: appt.doctorId,
    specialization_id: appt.specializationId,
    date: appt.date,
    time_slot: appt.timeSlot,
    reason: appt.reason,
    status: appt.status,
    documents: appt.documents,
    clinic_notes: appt.clinicNotes || '',
    created_by_role: appt.createdByRole,
    updated_by: appt.updatedBy || null,
    created_at: appt.createdAt,
    updated_at: appt.updatedAt,
  };

  const { data, error } = await client.from('appointments').insert([row]).select().single();

  if (error) {
    if (isMissingTableError(error)) {
      return {
        data: appt,
        persistedInSupabase: false,
        schemaMissing: true,
        warning:
          'Supabase table "public.appointments" is not created yet. Run supabase/schema.sql in Supabase SQL Editor.',
      };
    }
    throw new Error(error.message);
  }

  const saved = data ? normalizeAppointmentRow(data as Record<string, unknown>) : appt;
  saveLocalAppointment(saved);
  return { data: saved, persistedInSupabase: true };
}

export async function fetchAppointmentsFromSupabase(): Promise<{
  appointments: Appointment[];
  fromSupabase: boolean;
  schemaMissing: boolean;
}> {
  const client = getSupabaseClient();
  const local = readLocalAppointments();
  if (!client) {
    return { appointments: local, fromSupabase: false, schemaMissing: false };
  }

  const { data, error } = await client
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return { appointments: local, fromSupabase: false, schemaMissing: true };
    }
    throw new Error(error.message);
  }

  const remote = (data || []).map((r) => normalizeAppointmentRow(r as Record<string, unknown>));
  if (remote.length > 0) {
    replaceLocalAppointmentsCache(remote);
    return { appointments: remote, fromSupabase: true, schemaMissing: false };
  }
  return { appointments: local, fromSupabase: true, schemaMissing: false };
}

export async function updateAppointmentInSupabase(
  id: string,
  patch: { status?: AppointmentStatus; clinicNotes?: string; updatedBy?: string }
): Promise<{ persistedInSupabase: boolean }> {
  const local = readLocalAppointments();
  const existing = local.find((a) => a.id === id);
  const nowIso = new Date().toISOString();
  if (existing) {
    saveLocalAppointment({
      ...existing,
      status: patch.status ?? existing.status,
      clinicNotes: patch.clinicNotes ?? existing.clinicNotes,
      updatedBy: patch.updatedBy ?? existing.updatedBy,
      updatedAt: nowIso,
    });
  }

  const client = getSupabaseClient();
  if (!client) return { persistedInSupabase: false };

  const dbPatch: Record<string, unknown> = { updated_at: nowIso };
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.clinicNotes !== undefined) dbPatch.clinic_notes = patch.clinicNotes;
  if (patch.updatedBy !== undefined) dbPatch.updated_by = patch.updatedBy;

  const { error } = await client.from('appointments').update(dbPatch).eq('id', id);
  if (error) {
    if (isMissingTableError(error)) return { persistedInSupabase: false };
    throw new Error(error.message);
  }
  return { persistedInSupabase: true };
}

export async function createContactMessageInSupabase(
  msg: ContactMessage
): Promise<DbWriteResult<ContactMessage>> {
  const client = getSupabaseClient();
  if (!client) return { data: msg, persistedInSupabase: false };

  const { error } = await client.from('contact_messages').insert([
    {
      id: msg.id,
      name: msg.name,
      email: msg.email,
      phone: msg.phone,
      subject: msg.subject,
      message: msg.message,
      status: msg.status,
      created_at: msg.createdAt,
    },
  ]);

  if (error) {
    if (isMissingTableError(error)) {
      return {
        data: msg,
        persistedInSupabase: false,
        schemaMissing: true,
        warning:
          'Supabase table "public.contact_messages" is not created yet. Run supabase/schema.sql in Supabase SQL Editor.',
      };
    }
    throw new Error(error.message);
  }
  return { data: msg, persistedInSupabase: true };
}

export async function fetchContactMessagesFromSupabase(): Promise<ContactMessage[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }

  return (data || []).map((r) => ({
    id: String(r.id),
    name: String(r.name || ''),
    email: String(r.email || ''),
    phone: String(r.phone || ''),
    subject: String(r.subject || ''),
    message: String(r.message || ''),
    status: (r.status === 'reviewed' ? 'reviewed' : 'new') as 'new' | 'reviewed',
    createdAt: String(r.created_at || new Date().toISOString()),
  }));
}

export async function updateContactMessageStatusInSupabase(
  id: string,
  status: 'new' | 'reviewed'
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from('contact_messages').update({ status }).eq('id', id);
  if (error && !isMissingTableError(error)) {
    throw new Error(error.message);
  }
}

export async function createWaitlistEntryInSupabase(
  entry: AppointmentWaitlistEntry
): Promise<DbWriteResult<AppointmentWaitlistEntry>> {
  const client = getSupabaseClient();
  if (!client) return { data: entry, persistedInSupabase: false };

  const { error } = await client.from('waitlist_entries').insert([
    {
      id: entry.id,
      patient_id: entry.patientId,
      patient_name: entry.patientName,
      patient_email: entry.patientEmail,
      patient_phone: entry.patientPhone,
      doctor_id: entry.doctorId,
      specialization_id: entry.specializationId,
      preferred_date: entry.preferredDate,
      preferred_end_date: entry.preferredEndDate || null,
      preferred_time_range: entry.preferredTimeRange,
      notification_preference: entry.notificationPreference,
      consent_to_notify: entry.consentToNotify,
      status: entry.status,
      created_at: entry.createdAt,
      updated_at: entry.updatedAt,
    },
  ]);

  if (error) {
    if (isMissingTableError(error)) {
      return { data: entry, persistedInSupabase: false, schemaMissing: true };
    }
    throw new Error(error.message);
  }
  return { data: entry, persistedInSupabase: true };
}

export async function fetchWaitlistEntriesFromSupabase(
  patientId?: string
): Promise<AppointmentWaitlistEntry[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  let query = client
    .from('waitlist_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }

  return (data || []).map((r) => ({
    id: String(r.id),
    patientId: String(r.patient_id || ''),
    patientName: String(r.patient_name || ''),
    patientEmail: String(r.patient_email || ''),
    patientPhone: String(r.patient_phone || ''),
    doctorId: String(r.doctor_id || ''),
    specializationId: String(r.specialization_id || ''),
    preferredDate: String(r.preferred_date || ''),
    preferredEndDate: r.preferred_end_date ? String(r.preferred_end_date) : undefined,
    preferredTimeRange: String(r.preferred_time_range || 'any') as AppointmentWaitlistEntry['preferredTimeRange'],
    notificationPreference: String(
      r.notification_preference || 'whatsapp'
    ) as AppointmentWaitlistEntry['notificationPreference'],
    consentToNotify: Boolean(r.consent_to_notify ?? true),
    status: String(r.status || 'active') as AppointmentWaitlistEntry['status'],
    createdAt: String(r.created_at || new Date().toISOString()),
    updatedAt: String(r.updated_at || new Date().toISOString()),
  }));
}

export async function updateWaitlistStatusInSupabase(
  id: string,
  status: AppointmentWaitlistEntry['status']
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from('waitlist_entries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error && !isMissingTableError(error)) {
    throw new Error(error.message);
  }
}

export async function createPatientFeedbackInSupabase(params: {
  feedback: PatientFeedback;
  doctorName: string;
  doctorNameHi: string;
  specializationName: string;
  specializationNameHi: string;
}): Promise<DbWriteResult<PatientFeedback>> {
  const { feedback } = params;
  const client = getSupabaseClient();
  if (!client) return { data: feedback, persistedInSupabase: false };

  const { error } = await client.from('patient_feedback').insert([
    {
      id: feedback.id,
      appointment_id: feedback.appointmentId,
      patient_id: feedback.patientId,
      doctor_id: feedback.doctorId,
      doctor_name: params.doctorName,
      doctor_name_hi: params.doctorNameHi,
      specialization_id: feedback.specializationId,
      specialization_name: params.specializationName,
      specialization_name_hi: params.specializationNameHi,
      rating: feedback.rating,
      comment: feedback.comment,
      doctor_feedback: feedback.doctorFeedback || null,
      public_consent: feedback.publicConsent,
      status: feedback.status,
      verified_visit: feedback.verifiedVisit,
      created_at: feedback.createdAt,
    },
  ]);

  if (error) {
    if (isMissingTableError(error)) {
      return { data: feedback, persistedInSupabase: false, schemaMissing: true };
    }
    throw new Error(error.message);
  }
  return { data: feedback, persistedInSupabase: true };
}

export async function fetchPublicReviewsFromSupabase(): Promise<PublicPatientFeedback[]> {
  const client = getSupabaseClient();
  if (!client) return DEFAULT_PUBLIC_REVIEWS;

  const { data, error } = await client
    .from('patient_feedback')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    if (isMissingTableError(error)) return DEFAULT_PUBLIC_REVIEWS;
    return DEFAULT_PUBLIC_REVIEWS;
  }

  if (!data || data.length === 0) return DEFAULT_PUBLIC_REVIEWS;

  return data.map((r) => ({
    id: String(r.id),
    doctorId: String(r.doctor_id || ''),
    doctorName: String(r.doctor_name || ''),
    doctorNameHi: String(r.doctor_name_hi || r.doctor_name || ''),
    specializationId: String(r.specialization_id || ''),
    specializationName: String(r.specialization_name || ''),
    specializationNameHi: String(r.specialization_name_hi || r.specialization_name || ''),
    rating: Number(r.rating || 5),
    comment: String(r.comment || ''),
    doctorFeedback: r.doctor_feedback ? String(r.doctor_feedback) : undefined,
    verifiedVisit: Boolean(r.verified_visit ?? true),
    createdAt: String(r.created_at || new Date().toISOString()),
  }));
}

export async function fetchAllFeedbackFromSupabase(
  patientId?: string
): Promise<
  Array<
    PatientFeedback & {
      doctorName: string;
      specializationName: string;
    }
  >
> {
  const client = getSupabaseClient();
  if (!client) return [];

  let query = client
    .from('patient_feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }

  return (data || []).map((r) => ({
    id: String(r.id),
    appointmentId: String(r.appointment_id || ''),
    patientId: String(r.patient_id || ''),
    doctorId: String(r.doctor_id || ''),
    specializationId: String(r.specialization_id || ''),
    rating: Number(r.rating || 5),
    comment: String(r.comment || ''),
    doctorFeedback: r.doctor_feedback ? String(r.doctor_feedback) : undefined,
    publicConsent: Boolean(r.public_consent ?? true),
    status: String(r.status || 'pending_review') as FeedbackStatus,
    verifiedVisit: Boolean(r.verified_visit ?? true),
    createdAt: String(r.created_at || new Date().toISOString()),
    doctorName: String(r.doctor_name || r.doctor_id || ''),
    specializationName: String(r.specialization_name || r.specialization_id || ''),
  }));
}

export async function updateFeedbackStatusInSupabase(
  id: string,
  status: FeedbackStatus
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from('patient_feedback').update({ status }).eq('id', id);
  if (error && !isMissingTableError(error)) {
    throw new Error(error.message);
  }
}

export async function savePatientProfileInSupabase(profile: UserProfile): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from('clinic_patients').upsert(
    [
      {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        preferred_language: profile.preferredLanguage || 'en',
        created_at: profile.createdAt,
      },
    ],
    { onConflict: 'email' }
  );
  if (error && !isMissingTableError(error)) {
    throw new Error(error.message);
  }
}

export async function checkSupabaseTablesHealth(): Promise<{
  configured: boolean;
  connected: boolean;
  tablesReady: boolean;
  missingTables: string[];
}> {
  if (!isSupabaseConfigured()) {
    return { configured: false, connected: false, tablesReady: false, missingTables: [] };
  }
  const client = getSupabaseClient()!;
  const tables = [
    'specializations',
    'doctors',
    'doctor_specializations',
    'appointments',
    'contact_messages',
  ] as const;
  const missingTables: string[] = [];

  for (const tbl of tables) {
    const { error } = await client.from(tbl).select('id').limit(1);
    if (error && isMissingTableError(error)) {
      missingTables.push(tbl);
    }
  }

  return {
    configured: true,
    connected: true,
    tablesReady: missingTables.length === 0,
    missingTables,
  };
}
