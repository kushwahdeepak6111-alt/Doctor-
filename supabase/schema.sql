-- Arogya Multi-Specialty Clinic — Supabase PostgreSQL Schema
-- Run this script once in your Supabase Dashboard -> SQL Editor:
-- https://supabase.com/dashboard/project/zbyigakhutukldmmvuen/sql/new

CREATE TABLE IF NOT EXISTS public.specializations (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  short_description TEXT NOT NULL,
  short_description_hi TEXT NOT NULL,
  overview TEXT NOT NULL,
  overview_hi TEXT NOT NULL,
  icon_key TEXT NOT NULL,
  common_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  common_conditions_hi JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.doctors (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  specialization_id TEXT NOT NULL,
  qualification TEXT NOT NULL,
  qualification_hi TEXT NOT NULL,
  experience_summary TEXT NOT NULL,
  experience_summary_hi TEXT NOT NULL,
  bio TEXT NOT NULL,
  bio_hi TEXT NOT NULL,
  languages JSONB NOT NULL DEFAULT '["English","Hindi"]'::jsonb,
  languages_hi JSONB NOT NULL DEFAULT '["अंग्रेज़ी","हिन्दी"]'::jsonb,
  consultation_fee INTEGER NOT NULL DEFAULT 800,
  image_key TEXT NOT NULL DEFAULT 'doctor_cardiology',
  active BOOLEAN NOT NULL DEFAULT true,
  schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  unavailable_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocked_slots JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.clinic_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  name_hi TEXT,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'staff', 'admin')),
  doctor_id TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  reference_code TEXT NOT NULL,
  patient_id TEXT,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  specialization_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'missed')),
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  clinic_notes TEXT,
  created_by_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  title_hi TEXT NOT NULL,
  message TEXT NOT NULL,
  message_hi TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  appointment_id TEXT,
  waitlist_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'reviewed')) DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patient_feedbacks (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  specialization_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  doctor_feedback TEXT,
  public_consent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('pending_review', 'approved', 'rejected', 'hidden')),
  verified_visit BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  moderated_at TIMESTAMPTZ,
  moderated_by TEXT
);

CREATE TABLE IF NOT EXISTS public.appointment_waitlist (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  specialization_id TEXT NOT NULL,
  preferred_date TEXT NOT NULL,
  preferred_end_date TEXT,
  preferred_time_range TEXT NOT NULL,
  notification_preference TEXT NOT NULL,
  consent_to_notify BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL,
  notified_slot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.waitlist_notification_logs (
  id TEXT PRIMARY KEY,
  waitlist_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  event_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  delivery_status TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  clinic_name TEXT NOT NULL,
  clinic_name_hi TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  address_hi TEXT NOT NULL,
  hours TEXT NOT NULL,
  hours_hi TEXT NOT NULL,
  booking_notice TEXT NOT NULL,
  booking_notice_hi TEXT NOT NULL,
  emergency_notice TEXT NOT NULL,
  emergency_notice_hi TEXT NOT NULL,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments (doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_clinic_users_email ON public.clinic_users (email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages (status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON public.patient_feedbacks (status);
CREATE INDEX IF NOT EXISTS idx_waitlist_doctor_status ON public.appointment_waitlist (doctor_id, status);

-- Enable Row Level Security across all tables
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies enabling server-side persistence with the configured Supabase key.
-- TIP: For stricter production isolation, add SUPABASE_SECRET_KEY (sb_secret_...) to your
-- server environment and restrict these policies to the service_role only.
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'specializations',
      'doctors',
      'clinic_users',
      'appointments',
      'notifications',
      'contact_messages',
      'patient_feedbacks',
      'appointment_waitlist',
      'waitlist_notification_logs',
      'clinic_settings',
      'audit_logs'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS clinic_backend_access ON public.%I', tbl);
    EXECUTE format('CREATE POLICY clinic_backend_access ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;
