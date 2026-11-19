-- Arogya Multi-Specialty Clinic — Supabase PostgreSQL Schema & RLS Setup
-- Run this script once in your Supabase Dashboard:
--   SQL Editor -> New query -> Paste & Run

create extension if not exists pgcrypto;

-- 1. Medical Specializations / Departments
create table if not exists public.specializations (
  id text primary key,
  slug text unique not null,
  name text not null,
  name_hi text not null,
  short_description text not null default '',
  short_description_hi text not null default '',
  overview text not null default '',
  overview_hi text not null default '',
  icon_key text not null default 'stethoscope',
  common_conditions jsonb not null default '[]'::jsonb,
  common_conditions_hi jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Doctors Roster
do $$
declare
  v_id_type text;
  v_count bigint;
begin
  select data_type into v_id_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'doctors' and column_name = 'id';

  if v_id_type is not null and v_id_type <> 'text' then
    execute 'select count(*) from public.doctors' into v_count;
    if coalesce(v_count, 0) = 0 then
      execute 'drop table public.doctors cascade';
    end if;
  end if;
end $$;

create table if not exists public.doctors (
  id text primary key,
  slug text unique not null,
  name text not null,
  name_hi text not null,
  speciality text not null,
  speciality_hi text not null default '',
  specialization_id text not null references public.specializations(id) on update cascade,
  qualification text not null default '',
  qualification_hi text not null default '',
  experience text not null default '',
  experience_summary text not null default '',
  experience_summary_hi text not null default '',
  rating numeric(2,1) not null default 4.9,
  photo text not null default '',
  timing text not null default '',
  timing_hi text not null default '',
  fees integer not null default 600,
  consultation_fee integer not null default 600,
  image_key text not null default 'doctor_general_physician',
  bio text not null default '',
  bio_hi text not null default '',
  languages jsonb not null default '["English","Hindi"]'::jsonb,
  languages_hi jsonb not null default '["अंग्रेज़ी","हिन्दी"]'::jsonb,
  active boolean not null default true,
  schedule jsonb not null default '{}'::jsonb,
  unavailable_dates jsonb not null default '[]'::jsonb,
  blocked_slots jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Ensure columns exist if public.doctors was created earlier
alter table public.doctors add column if not exists slug text;
alter table public.doctors add column if not exists name_hi text not null default '';
alter table public.doctors add column if not exists speciality text not null default '';
alter table public.doctors add column if not exists speciality_hi text not null default '';
alter table public.doctors add column if not exists specialization_id text;
alter table public.doctors add column if not exists qualification text not null default '';
alter table public.doctors add column if not exists qualification_hi text not null default '';
alter table public.doctors add column if not exists experience text not null default '';
alter table public.doctors add column if not exists experience_summary text not null default '';
alter table public.doctors add column if not exists experience_summary_hi text not null default '';
alter table public.doctors add column if not exists rating numeric(2,1) not null default 4.9;
alter table public.doctors add column if not exists photo text not null default '';
alter table public.doctors add column if not exists timing text not null default '';
alter table public.doctors add column if not exists timing_hi text not null default '';
alter table public.doctors add column if not exists fees integer not null default 600;
alter table public.doctors add column if not exists consultation_fee integer not null default 600;
alter table public.doctors add column if not exists image_key text not null default 'doctor_general_physician';
alter table public.doctors add column if not exists bio text not null default '';
alter table public.doctors add column if not exists bio_hi text not null default '';
alter table public.doctors add column if not exists languages jsonb not null default '["English","Hindi"]'::jsonb;
alter table public.doctors add column if not exists languages_hi jsonb not null default '["अंग्रेज़ी","हिन्दी"]'::jsonb;
alter table public.doctors add column if not exists active boolean not null default true;
alter table public.doctors add column if not exists schedule jsonb not null default '{}'::jsonb;
alter table public.doctors add column if not exists unavailable_dates jsonb not null default '[]'::jsonb;
alter table public.doctors add column if not exists blocked_slots jsonb not null default '{}'::jsonb;

-- 3. Patient Appointments (Booking Form Submissions)
create table if not exists public.appointments (
  id text primary key,
  reference_code text unique not null,
  patient_id text null,
  patient_name text not null,
  patient_phone text not null,
  patient_email text not null,
  doctor_id text not null,
  specialization_id text not null,
  date text not null,
  time_slot text not null,
  reason text not null,
  status text not null default 'confirmed',
  documents jsonb not null default '[]'::jsonb,
  clinic_notes text not null default '',
  created_by_role text not null default 'guest',
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Contact Inquiries
create table if not exists public.contact_messages (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null default '',
  subject text not null default '',
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

-- 5. Appointment Waitlist Requests
create table if not exists public.waitlist_entries (
  id text primary key,
  patient_id text not null,
  patient_name text not null,
  patient_email text not null,
  patient_phone text not null,
  doctor_id text not null,
  specialization_id text not null,
  preferred_date text not null,
  preferred_end_date text null,
  preferred_time_range text not null default 'any',
  notification_preference text not null default 'whatsapp',
  consent_to_notify boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Patient Feedback & Reviews
create table if not exists public.patient_feedback (
  id text primary key,
  appointment_id text null,
  patient_id text null,
  doctor_id text not null,
  doctor_name text not null default '',
  doctor_name_hi text not null default '',
  specialization_id text not null,
  specialization_name text not null default '',
  specialization_name_hi text not null default '',
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  doctor_feedback text null,
  public_consent boolean not null default true,
  status text not null default 'approved',
  verified_visit boolean not null default true,
  created_at timestamptz not null default now()
);

-- 7. Registered Clinic Patients
create table if not exists public.clinic_patients (
  id text primary key,
  email text unique not null,
  name text not null,
  phone text not null,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.specializations enable row level security;
alter table public.doctors enable row level security;
alter table public.appointments enable row level security;
alter table public.contact_messages enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.patient_feedback enable row level security;
alter table public.clinic_patients enable row level security;

-- Public & Clinic Portal Policies (for publishable anon client access)
drop policy if exists "Public read specializations" on public.specializations;
create policy "Public read specializations" on public.specializations for select using (true);

drop policy if exists "Public read doctors" on public.doctors;
create policy "Public read doctors" on public.doctors for select using (true);

drop policy if exists "Clinic appointments select" on public.appointments;
create policy "Clinic appointments select" on public.appointments for select using (true);

drop policy if exists "Patient insert appointments" on public.appointments;
create policy "Patient insert appointments" on public.appointments for insert with check (true);

drop policy if exists "Clinic update appointments" on public.appointments;
create policy "Clinic update appointments" on public.appointments for update using (true) with check (true);

drop policy if exists "Public insert contact_messages" on public.contact_messages;
create policy "Public insert contact_messages" on public.contact_messages for insert with check (true);

drop policy if exists "Clinic read contact_messages" on public.contact_messages;
create policy "Clinic read contact_messages" on public.contact_messages for select using (true);

drop policy if exists "Clinic update contact_messages" on public.contact_messages;
create policy "Clinic update contact_messages" on public.contact_messages for update using (true) with check (true);

drop policy if exists "Public waitlist select" on public.waitlist_entries;
create policy "Public waitlist select" on public.waitlist_entries for select using (true);

drop policy if exists "Patient insert waitlist" on public.waitlist_entries;
create policy "Patient insert waitlist" on public.waitlist_entries for insert with check (true);

drop policy if exists "Clinic update waitlist" on public.waitlist_entries;
create policy "Clinic update waitlist" on public.waitlist_entries for update using (true) with check (true);

drop policy if exists "Public read patient_feedback" on public.patient_feedback;
create policy "Public read patient_feedback" on public.patient_feedback for select using (true);

drop policy if exists "Patient insert feedback" on public.patient_feedback;
create policy "Patient insert feedback" on public.patient_feedback for insert with check (true);

drop policy if exists "Clinic update feedback" on public.patient_feedback;
create policy "Clinic update feedback" on public.patient_feedback for update using (true) with check (true);

drop policy if exists "Patient register profile" on public.clinic_patients;
create policy "Patient register profile" on public.clinic_patients for insert with check (true);

drop policy if exists "Clinic read patients" on public.clinic_patients;
create policy "Clinic read patients" on public.clinic_patients for select using (true);

-- Seed 6 Medical Departments
insert into public.specializations (id, slug, name, name_hi, short_description, short_description_hi, icon_key, active)
values
  ('spec-general-physician', 'general-physician', 'General Physician', 'सामान्य चिकित्सा (जनरल फिजिशियन)', 'Primary adult consultations, fever & infection care, diabetes & thyroid management, and preventive health checks.', 'वयस्क सामान्य परामर्श, बुखार उपचार, मधुमेह व थायरॉइड प्रबंधन और निवारक स्वास्थ्य जांच।', 'stethoscope', true),
  ('spec-cardiology', 'cardiology', 'Cardiologist', 'हृदय रोग विज्ञान (कार्डियोलॉजी)', 'Preventive heart screening, hypertension management, ECG interpretation, and long-term cardiac follow-up.', 'निवारक हृदय जांच, उच्च रक्तचाप प्रबंधन, ईसीजी मूल्यांकन और नियमित हृदय देखभाल।', 'heart', true),
  ('spec-orthopedics', 'orthopedics', 'Orthopaedic', 'हड्डी एवं जोड़ रोग (ऑर्थोपेडिक्स)', 'Joint pain evaluation, spine and posture care, sports injury recovery, and non-surgical musculoskeletal treatment.', 'जोड़ों के दर्द की जांच, रीढ़ और मुद्रा देखभाल, खेल चोट पुनर्वास और अस्थि परामर्श।', 'bone', true),
  ('spec-pediatrics', 'pediatrics', 'Pediatrician', 'बाल रोग विशेषज्ञ (पीडियाट्रिक्स)', 'Infant growth monitoring, childhood immunization guidance, acute fever care, and adolescent health visits.', 'शिशु विकास निगरानी, टीकाकरण परामर्श, मौसमी बुखार उपचार और किशोर स्वास्थ्य देखभाल।', 'baby', true),
  ('spec-neurology', 'neurology', 'Neurologist', 'मस्तिष्क एवं तंत्रिका रोग (न्यूरोलॉजी)', 'Migraine and headache clinics, nerve pain evaluation, vertigo balance care, and neurological follow-ups.', 'माइग्रेन एवं सिरदर्द उपचार, नसों के दर्द की जांच, चक्कर और न्यूरोलॉजिकल परामर्श।', 'brain', true),
  ('spec-gynecology', 'gynecology', 'Gynecologist', 'स्त्री एवं प्रसूति रोग (गायनेकोलॉजी)', 'Antenatal checkups, PCOS & hormonal care, menstrual wellness, and preventive women’s health consultations.', 'गर्भावस्था जांच, पीसीओएस एवं हार्मोनल देखभाल, मासिक धर्म स्वास्थ्य और महिला कल्याण परामर्श।', 'female', true)
on conflict (id) do nothing;

-- Seed 6 Verified Clinic Specialists
insert into public.doctors (id, slug, name, name_hi, speciality, speciality_hi, specialization_id, qualification, qualification_hi, experience, experience_summary, experience_summary_hi, rating, timing, timing_hi, fees, consultation_fee, image_key, bio, bio_hi, active)
values
  ('doc-sharma', 'dr-sharma', 'Dr. Sharma', 'डॉ. शर्मा', 'General Physician', 'जनरल फिजिशियन (सामान्य चिकित्सा)', 'spec-general-physician', 'MBBS, MD (Internal Medicine)', 'एमबीबीएस, एमडी (आंतरिक चिकित्सा)', '15+ Years Experience', '15+ Years · General Physician & Primary Care', '15+ वर्ष अनुभव · जनरल फिजिशियन एवं प्राथमिक देखभाल', 4.9, 'Mon – Sat · 09:00 AM – 01:30 PM', 'सोम – शनि · सुबह 09:00 – दोपहर 01:30', 600, 600, 'doctor_general_physician', 'Dr. Sharma specializes in acute viral fevers, diabetes, hypertension, thyroid management, and comprehensive preventive adult health evaluations.', 'डॉ. शर्मा मौसमी बुखार, मधुमेह, रक्तचाप, थायरॉइड और वयस्क निवारक स्वास्थ्य जांच में 15+ वर्षों का अनुभव रखते हैं।', true),
  ('doc-priya', 'dr-priya', 'Dr. Priya', 'डॉ. प्रिया', 'Cardiologist', 'कार्डियोलॉजिस्ट (हृदय रोग विशेषज्ञ)', 'spec-cardiology', 'MBBS, MD (Medicine), DM (Cardiology)', 'एमबीबीएस, एमडी, डीएम (कार्डियोलॉजी)', '12+ Years Experience', '12+ Years · Preventive Cardiology & ECG Care', '12+ वर्ष अनुभव · निवारक हृदय देखभाल एवं ईसीजी', 4.9, 'Mon – Sat · 10:00 AM – 07:00 PM', 'सोम – शनि · सुबह 10:00 – शाम 07:00', 1000, 1000, 'doctor_cardiology', 'Dr. Priya leads outpatient cardiology consultations covering blood pressure optimization, lipid management, and ECG interpretation.', 'डॉ. प्रिया उच्च रक्तचाप नियंत्रण, कोलेस्ट्रॉल प्रबंधन और ईसीजी समीक्षा में विशेषज्ञ हैं।', true),
  ('doc-rohan', 'dr-rohan', 'Dr. Rohan', 'डॉ. रोहन', 'Orthopaedic', 'ऑर्थोपेडिक (हड्डी एवं जोड़ रोग विशेषज्ञ)', 'spec-orthopedics', 'MBBS, MS (Orthopedics)', 'एमबीबीएस, एमएस (ऑर्थोपेडिक्स)', '11+ Years Experience', '11+ Years · Joint, Spine & Sports Injury Care', '11+ वर्ष अनुभव · जोड़, रीढ़ एवं खेल चोट देखभाल', 4.8, 'Mon – Sat · 09:00 AM – 01:30 PM', 'सोम – शनि · सुबह 09:00 – दोपहर 01:30', 850, 850, 'doctor_orthopedics', 'Dr. Rohan evaluates knee, shoulder, and spine stiffness, sports ligament sprains, and fracture follow-ups.', 'डॉ. रोहन घुटने, कंधे व कमर दर्द, खेल चोटों और अस्थि पुनर्वास का सटीक मूल्यांकन प्रदान करते हैं।', true),
  ('doc-anjali', 'dr-anjali', 'Dr. Anjali', 'डॉ. अंजलि', 'Pediatrician', 'पीडियाट्रिशियन (बाल रोग विशेषज्ञ)', 'spec-pediatrics', 'MBBS, MD (Pediatrics)', 'एमबीबीएस, एमडी (पीडियाट्रिक्स)', '10+ Years Experience', '10+ Years · Child & Adolescent Healthcare', '10+ वर्ष अनुभव · शिशु एवं बाल स्वास्थ्य देखभाल', 4.9, 'Mon – Sat · 09:30 AM – 06:30 PM', 'सोम – शनि · सुबह 09:30 – शाम 06:30', 750, 750, 'doctor_pediatrics', 'Dr. Anjali offers gentle consultations for newborns, toddlers, and adolescents including growth tracking and vaccination guidance.', 'डॉ. अंजलि नवजात शिशुओं और बच्चों के पोषण, टीकाकरण मार्गदर्शन तथा मौसमी संक्रमणों के लिए परामर्श देती हैं।', true),
  ('doc-vikram', 'dr-vikram', 'Dr. Vikram', 'डॉ. विक्रम', 'Neurologist', 'न्यूरोलॉजिस्ट (मस्तिष्क एवं तंत्रिका रोग विशेषज्ञ)', 'spec-neurology', 'MBBS, MD (Medicine), DM (Neurology)', 'एमबीबीएस, एमडी, डीएम (न्यूरोलॉजी)', '13+ Years Experience', '13+ Years · Migraine, Nerve & Stroke Care', '13+ वर्ष अनुभव · माइग्रेन, नसों एवं मस्तिष्क रोग', 4.8, 'Mon – Sat · 10:00 AM – 07:00 PM', 'सोम – शनि · सुबह 10:00 – शाम 07:00', 1100, 1100, 'doctor_neurology', 'Dr. Vikram treats chronic migraines, vertigo, peripheral neuropathy, and neurological follow-up conditions.', 'डॉ. विक्रम माइग्रेन, चक्कर, नसों की कमजोरी और न्यूरोलॉजिकल विकारों का आधुनिक नैदानिक उपचार करते हैं।', true),
  ('doc-neha', 'dr-neha', 'Dr. Neha', 'डॉ. नेहा', 'Gynecologist', 'गायनेकोलॉजिस्ट (स्त्री एवं प्रसूति रोग विशेषज्ञ)', 'spec-gynecology', 'MBBS, MS (Obstetrics & Gynecology)', 'एमबीबीएस, एमएस (स्त्री एवं प्रसूति रोग)', '12+ Years Experience', '12+ Years · Women Wellness & Antenatal Care', '12+ वर्ष अनुभव · महिला स्वास्थ्य एवं प्रसवपूर्व देखभाल', 4.9, 'Mon – Sat · 09:30 AM – 06:30 PM', 'सोम – शनि · सुबह 09:30 – शाम 06:30', 850, 850, 'doctor_gynecology', 'Dr. Neha provides confidential care across antenatal checkups, PCOS and hormonal balance, and women’s wellness.', 'डॉ. नेहा गर्भावस्था जांच, पीसीओएस, हार्मोनल संतुलन और महिला स्वास्थ्य के लिए संवेदनशील परामर्श प्रदान करती हैं।', true)
on conflict (id) do nothing;
