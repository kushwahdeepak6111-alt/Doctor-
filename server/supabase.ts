import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ClinicDatabase, StoredUser } from './store.ts';
import type {
  Appointment,
  AppointmentWaitlistEntry,
  AuditLogEntry,
  ClinicNotification,
  ClinicSettings,
  ContactMessage,
  Doctor,
  PatientFeedback,
  Specialization,
  WaitlistNotificationLog,
} from '../src/types/clinic.ts';

let clientInstance: SupabaseClient | null = null;
let missingTableWarned = false;
let syncChain: Promise<void> = Promise.resolve();
let pendingSyncCount = 0;

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  if (!clientInstance) {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return clientInstance;
}

function handleSupabaseError(context: string, error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === 'PGRST205') {
    if (!missingTableWarned) {
      missingTableWarned = true;
      console.warn(
        '[Supabase] Connected to project, but clinic tables do not exist yet. Run supabase/schema.sql in your Supabase SQL Editor to enable cloud database persistence.'
      );
    }
    return;
  }
  console.warn(`[Supabase] ${context}: ${error.message || error.code || 'Unknown error'}`);
}

function toSpecializationRow(s: Specialization) {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    name_hi: s.nameHi,
    short_description: s.shortDescription,
    short_description_hi: s.shortDescriptionHi,
    overview: s.overview,
    overview_hi: s.overviewHi,
    icon_key: s.iconKey,
    common_conditions: s.commonConditions,
    common_conditions_hi: s.commonConditionsHi,
    active: s.active,
  };
}

function fromSpecializationRow(row: Record<string, any>): Specialization {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameHi: row.name_hi,
    shortDescription: row.short_description,
    shortDescriptionHi: row.short_description_hi,
    overview: row.overview,
    overviewHi: row.overview_hi,
    iconKey: row.icon_key,
    commonConditions: Array.isArray(row.common_conditions) ? row.common_conditions : [],
    commonConditionsHi: Array.isArray(row.common_conditions_hi) ? row.common_conditions_hi : [],
    active: Boolean(row.active),
  };
}

function toDoctorRow(d: Doctor) {
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    name_hi: d.nameHi,
    specialization_id: d.specializationId,
    qualification: d.qualification,
    qualification_hi: d.qualificationHi,
    experience_summary: d.experienceSummary,
    experience_summary_hi: d.experienceSummaryHi,
    bio: d.bio,
    bio_hi: d.bioHi,
    languages: d.languages,
    languages_hi: d.languagesHi,
    consultation_fee: d.consultationFee,
    image_key: d.imageKey,
    active: d.active,
    schedule: d.schedule,
    unavailable_dates: d.unavailableDates || [],
    blocked_slots: d.blockedSlots || {},
  };
}

function fromDoctorRow(row: Record<string, any>): Doctor {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameHi: row.name_hi,
    specializationId: row.specialization_id,
    qualification: row.qualification,
    qualificationHi: row.qualification_hi,
    experienceSummary: row.experience_summary,
    experienceSummaryHi: row.experience_summary_hi,
    bio: row.bio,
    bioHi: row.bio_hi,
    languages: Array.isArray(row.languages) ? row.languages : ['English', 'Hindi'],
    languagesHi: Array.isArray(row.languages_hi) ? row.languages_hi : ['अंग्रेज़ी', 'हिन्दी'],
    consultationFee: Number(row.consultation_fee) || 800,
    imageKey: row.image_key || 'doctor_cardiology',
    active: Boolean(row.active),
    schedule: row.schedule || {},
    unavailableDates: Array.isArray(row.unavailable_dates) ? row.unavailable_dates : [],
    blockedSlots: row.blocked_slots || {},
  };
}

function toUserRow(u: StoredUser) {
  return {
    id: u.id,
    email: u.email,
    password_hash: u.passwordHash,
    name: u.name,
    name_hi: u.nameHi || null,
    phone: u.phone,
    role: u.role,
    doctor_id: u.doctorId || null,
    preferred_language: u.preferredLanguage || 'en',
    created_at: u.createdAt,
  };
}

function fromUserRow(row: Record<string, any>): StoredUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    nameHi: row.name_hi || undefined,
    phone: row.phone,
    role: row.role,
    doctorId: row.doctor_id || undefined,
    preferredLanguage: row.preferred_language || 'en',
    createdAt: row.created_at,
  };
}

function toAppointmentRow(a: Appointment) {
  return {
    id: a.id,
    reference_code: a.referenceCode,
    patient_id: a.patientId,
    patient_name: a.patientName,
    patient_phone: a.patientPhone,
    patient_email: a.patientEmail,
    doctor_id: a.doctorId,
    specialization_id: a.specializationId,
    date: a.date,
    time_slot: a.timeSlot,
    reason: a.reason,
    status: a.status,
    documents: a.documents || [],
    clinic_notes: a.clinicNotes || null,
    created_by_role: a.createdByRole,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
    updated_by: a.updatedBy || null,
  };
}

function fromAppointmentRow(row: Record<string, any>): Appointment {
  return {
    id: row.id,
    referenceCode: row.reference_code,
    patientId: row.patient_id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    patientEmail: row.patient_email,
    doctorId: row.doctor_id,
    specializationId: row.specialization_id,
    date: row.date,
    timeSlot: row.time_slot,
    reason: row.reason,
    status: row.status,
    documents: Array.isArray(row.documents) ? row.documents : [],
    clinicNotes: row.clinic_notes || undefined,
    createdByRole: row.created_by_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by || undefined,
  };
}

function toNotificationRow(n: ClinicNotification) {
  return {
    id: n.id,
    user_id: n.userId,
    title: n.title,
    title_hi: n.titleHi,
    message: n.message,
    message_hi: n.messageHi,
    type: n.type,
    read: n.read,
    appointment_id: n.appointmentId || null,
    waitlist_id: n.waitlistId || null,
    created_at: n.createdAt,
  };
}

function fromNotificationRow(row: Record<string, any>): ClinicNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    titleHi: row.title_hi,
    message: row.message,
    messageHi: row.message_hi,
    type: row.type,
    read: Boolean(row.read),
    appointmentId: row.appointment_id || undefined,
    waitlistId: row.waitlist_id || undefined,
    createdAt: row.created_at,
  };
}

function toContactRow(c: ContactMessage) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || '',
    subject: c.subject,
    message: c.message,
    status: c.status,
    created_at: c.createdAt,
  };
}

function fromContactRow(row: Record<string, any>): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    subject: row.subject,
    message: row.message,
    status: row.status === 'reviewed' ? 'reviewed' : 'new',
    createdAt: row.created_at,
  };
}

function toFeedbackRow(f: PatientFeedback) {
  return {
    id: f.id,
    appointment_id: f.appointmentId,
    patient_id: f.patientId,
    doctor_id: f.doctorId,
    specialization_id: f.specializationId,
    rating: f.rating,
    comment: f.comment,
    doctor_feedback: f.doctorFeedback || null,
    public_consent: f.publicConsent,
    status: f.status,
    verified_visit: f.verifiedVisit,
    created_at: f.createdAt,
    moderated_at: f.moderatedAt || null,
    moderated_by: f.moderatedBy || null,
  };
}

function fromFeedbackRow(row: Record<string, any>): PatientFeedback {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    specializationId: row.specialization_id,
    rating: Number(row.rating),
    comment: row.comment,
    doctorFeedback: row.doctor_feedback || undefined,
    publicConsent: Boolean(row.public_consent),
    status: row.status,
    verifiedVisit: Boolean(row.verified_visit),
    createdAt: row.created_at,
    moderatedAt: row.moderated_at || undefined,
    moderatedBy: row.moderated_by || undefined,
  };
}

function toWaitlistRow(w: AppointmentWaitlistEntry) {
  return {
    id: w.id,
    patient_id: w.patientId,
    patient_name: w.patientName,
    patient_email: w.patientEmail,
    patient_phone: w.patientPhone,
    doctor_id: w.doctorId,
    specialization_id: w.specializationId,
    preferred_date: w.preferredDate,
    preferred_end_date: w.preferredEndDate || null,
    preferred_time_range: w.preferredTimeRange,
    notification_preference: w.notificationPreference,
    consent_to_notify: w.consentToNotify,
    status: w.status,
    notified_slot: w.notifiedSlot || null,
    created_at: w.createdAt,
    updated_at: w.updatedAt,
  };
}

function fromWaitlistRow(row: Record<string, any>): AppointmentWaitlistEntry {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    patientEmail: row.patient_email,
    patientPhone: row.patient_phone,
    doctorId: row.doctor_id,
    specializationId: row.specialization_id,
    preferredDate: row.preferred_date,
    preferredEndDate: row.preferred_end_date || undefined,
    preferredTimeRange: row.preferred_time_range,
    notificationPreference: row.notification_preference,
    consentToNotify: Boolean(row.consent_to_notify),
    status: row.status,
    notifiedSlot: row.notified_slot || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toWaitlistLogRow(l: WaitlistNotificationLog) {
  return {
    id: l.id,
    waitlist_id: l.waitlistId,
    patient_id: l.patientId,
    doctor_id: l.doctorId,
    date: l.date,
    time_slot: l.timeSlot,
    event_id: l.eventId,
    channel: l.channel,
    delivery_status: l.deliveryStatus,
    detail: l.detail,
    created_at: l.createdAt,
  };
}

function fromWaitlistLogRow(row: Record<string, any>): WaitlistNotificationLog {
  return {
    id: row.id,
    waitlistId: row.waitlist_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    date: row.date,
    timeSlot: row.time_slot,
    eventId: row.event_id,
    channel: row.channel,
    deliveryStatus: row.delivery_status,
    detail: row.detail,
    createdAt: row.created_at,
  };
}

function toSettingsRow(s: ClinicSettings) {
  return {
    id: 'default',
    clinic_name: s.clinicName,
    clinic_name_hi: s.clinicNameHi,
    phone: s.phone,
    email: s.email,
    address: s.address,
    address_hi: s.addressHi,
    hours: s.hours,
    hours_hi: s.hoursHi,
    booking_notice: s.bookingNotice,
    booking_notice_hi: s.bookingNoticeHi,
    emergency_notice: s.emergencyNotice,
    emergency_notice_hi: s.emergencyNoticeHi,
    seo: s.seo || {},
  };
}

function fromSettingsRow(row: Record<string, any>): ClinicSettings {
  return {
    clinicName: row.clinic_name,
    clinicNameHi: row.clinic_name_hi,
    phone: row.phone,
    email: row.email,
    address: row.address,
    addressHi: row.address_hi,
    hours: row.hours,
    hoursHi: row.hours_hi,
    bookingNotice: row.booking_notice,
    bookingNoticeHi: row.booking_notice_hi,
    emergencyNotice: row.emergency_notice,
    emergencyNoticeHi: row.emergency_notice_hi,
    seo: row.seo || undefined,
  };
}

function toAuditLogRow(a: AuditLogEntry) {
  return {
    id: a.id,
    actor_id: a.actorId,
    actor_email: a.actorEmail,
    actor_role: a.actorRole,
    action: a.action,
    details: a.details,
    created_at: a.createdAt,
  };
}

function fromAuditLogRow(row: Record<string, any>): AuditLogEntry {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    action: row.action,
    details: row.details,
    createdAt: row.created_at,
  };
}

export async function syncDatabaseToSupabase(db: ClinicDatabase): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const ops: Array<PromiseLike<{ error: { code?: string; message?: string } | null }>> = [];

    if (db.specializations.length > 0) {
      ops.push(
        client
          .from('specializations')
          .upsert(db.specializations.map(toSpecializationRow), { onConflict: 'id' })
      );
    }
    if (db.doctors.length > 0) {
      ops.push(
        client.from('doctors').upsert(db.doctors.map(toDoctorRow), { onConflict: 'id' })
      );
    }
    if (db.users.length > 0) {
      ops.push(
        client.from('clinic_users').upsert(db.users.map(toUserRow), { onConflict: 'id' })
      );
    }
    if (db.appointments.length > 0) {
      ops.push(
        client
          .from('appointments')
          .upsert(db.appointments.map(toAppointmentRow), { onConflict: 'id' })
      );
    }
    if (db.notifications.length > 0) {
      ops.push(
        client
          .from('notifications')
          .upsert(db.notifications.map(toNotificationRow), { onConflict: 'id' })
      );
    }
    if (db.contactMessages.length > 0) {
      ops.push(
        client
          .from('contact_messages')
          .upsert(db.contactMessages.map(toContactRow), { onConflict: 'id' })
      );
    }
    if (db.feedbacks.length > 0) {
      ops.push(
        client
          .from('patient_feedbacks')
          .upsert(db.feedbacks.map(toFeedbackRow), { onConflict: 'id' })
      );
    }
    if (db.waitlist.length > 0) {
      ops.push(
        client
          .from('appointment_waitlist')
          .upsert(db.waitlist.map(toWaitlistRow), { onConflict: 'id' })
      );
    }
    if (db.waitlistNotificationLogs.length > 0) {
      ops.push(
        client
          .from('waitlist_notification_logs')
          .upsert(db.waitlistNotificationLogs.map(toWaitlistLogRow), { onConflict: 'id' })
      );
    }
    if (db.settings) {
      ops.push(
        client
          .from('clinic_settings')
          .upsert(toSettingsRow(db.settings), { onConflict: 'id' })
      );
    }
    if (db.auditLogs.length > 0) {
      ops.push(
        client
          .from('audit_logs')
          .upsert(db.auditLogs.slice(0, 100).map(toAuditLogRow), { onConflict: 'id' })
      );
    }

    const results = await Promise.all(ops);
    for (const res of results) {
      if (res.error) {
        handleSupabaseError('Sync upsert failed', res.error);
        break;
      }
    }
  } catch (err) {
    console.warn('[Supabase] Sync exception:', err);
  }
}

export function scheduleSupabaseSync(db: ClinicDatabase): void {
  if (!isSupabaseConfigured()) return;
  const snapshot: ClinicDatabase = structuredClone(db);
  pendingSyncCount += 1;
  syncChain = syncChain
    .then(() => syncDatabaseToSupabase(snapshot))
    .catch((err) => {
      console.warn('[Supabase] Queued sync error:', err);
    })
    .finally(() => {
      pendingSyncCount = Math.max(0, pendingSyncCount - 1);
    });
}

export async function flushSupabaseSync(): Promise<void> {
  if (!isSupabaseConfigured() || pendingSyncCount === 0) return;
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3500));
  await Promise.race([syncChain, timeout]);
}

export async function hydrateDbFromSupabase(localDb: ClinicDatabase): Promise<{
  db: ClinicDatabase;
  hydratedFromCloud: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) return { db: localDb, hydratedFromCloud: false };

  try {
    const fetchWithTimeout = Promise.all([
      client.from('specializations').select('*'),
      client.from('doctors').select('*'),
      client.from('clinic_users').select('*').order('created_at', { ascending: true }),
      client.from('appointments').select('*').order('created_at', { ascending: false }),
      client.from('notifications').select('*').order('created_at', { ascending: false }),
      client.from('contact_messages').select('*').order('created_at', { ascending: false }),
      client.from('patient_feedbacks').select('*').order('created_at', { ascending: false }),
      client.from('appointment_waitlist').select('*').order('created_at', { ascending: false }),
      client.from('waitlist_notification_logs').select('*').order('created_at', { ascending: false }),
      client.from('clinic_settings').select('*').eq('id', 'default').maybeSingle(),
      client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
    ]);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase startup hydrate timeout')), 4500)
    );

    const [
      specRes,
      docRes,
      userRes,
      apptRes,
      notifRes,
      contactRes,
      feedbackRes,
      waitlistRes,
      wlogRes,
      settingsRes,
      auditRes,
    ] = await Promise.race([fetchWithTimeout, timeout]);

    if (specRes.error || docRes.error || userRes.error || apptRes.error) {
      handleSupabaseError(
        'Startup hydration',
        specRes.error || docRes.error || userRes.error || apptRes.error
      );
      return { db: localDb, hydratedFromCloud: false };
    }

    const hasRemoteRows =
      (specRes.data?.length || 0) > 0 ||
      (docRes.data?.length || 0) > 0 ||
      (userRes.data?.length || 0) > 0 ||
      (apptRes.data?.length || 0) > 0 ||
      (contactRes.data?.length || 0) > 0;

    if (!hasRemoteRows) {
      await syncDatabaseToSupabase(localDb);
      console.log('[Supabase] Seeded initial clinic data into Supabase backend.');
      return { db: localDb, hydratedFromCloud: true };
    }

    const hydrated: ClinicDatabase = {
      specializations:
        specRes.data && specRes.data.length > 0
          ? specRes.data.map(fromSpecializationRow)
          : localDb.specializations,
      doctors:
        docRes.data && docRes.data.length > 0 ? docRes.data.map(fromDoctorRow) : localDb.doctors,
      users:
        userRes.data && userRes.data.length > 0 ? userRes.data.map(fromUserRow) : localDb.users,
      appointments:
        apptRes.data ? apptRes.data.map(fromAppointmentRow) : localDb.appointments,
      notifications:
        notifRes.data ? notifRes.data.map(fromNotificationRow) : localDb.notifications,
      contactMessages:
        contactRes.data ? contactRes.data.map(fromContactRow) : localDb.contactMessages,
      feedbacks:
        feedbackRes.data ? feedbackRes.data.map(fromFeedbackRow) : localDb.feedbacks,
      waitlist:
        waitlistRes.data ? waitlistRes.data.map(fromWaitlistRow) : localDb.waitlist,
      waitlistNotificationLogs:
        wlogRes.data ? wlogRes.data.map(fromWaitlistLogRow) : localDb.waitlistNotificationLogs,
      settings: settingsRes.data ? fromSettingsRow(settingsRes.data) : localDb.settings,
      auditLogs: auditRes.data ? auditRes.data.map(fromAuditLogRow) : localDb.auditLogs,
    };

    console.log(
      `[Supabase] Connected and hydrated (${hydrated.users.length} users, ${hydrated.appointments.length} appointments, ${hydrated.contactMessages.length} inquiries).`
    );
    return { db: hydrated, hydratedFromCloud: true };
  } catch (err) {
    console.warn('[Supabase] Startup hydration skipped, using local store:', err);
    return { db: localDb, hydratedFromCloud: false };
  }
}
