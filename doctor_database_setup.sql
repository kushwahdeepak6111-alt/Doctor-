-- ============================================================================
-- Arogya Multi-Specialty Clinic — Doctors & Specializations Migration Script
-- File: doctor_database_setup.sql
--
-- Purpose:
--   Safely initializes and upgrades the Doctors, Specializations, and
--   Doctor-Specialization relationship schema on an existing Supabase project
--   WITHOUT deleting or overwriting existing records or touching existing
--   appointments, contact_messages, waitlist_entries, patient_feedback, or
--   clinic_patients tables.
--
-- How to execute:
--   1. Open your Supabase Dashboard -> SQL Editor -> New query
--   2. Paste the entire contents of this file and click "Run"
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Shared Trigger & Security Helper Functions
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_clinic_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    auth.role() = 'service_role'
    or (
      auth.role() = 'authenticated'
      and coalesce(
        auth.jwt() -> 'app_metadata' ->> 'role',
        auth.jwt() -> 'user_metadata' ->> 'role',
        auth.jwt() ->> 'user_role',
        ''
      ) = 'admin'
    )
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Medical Specializations Table (public.specializations)
-- ----------------------------------------------------------------------------

create table if not exists public.specializations (
  id text primary key,
  slug text unique not null,
  name text not null,
  name_hi text not null default '',
  short_description text not null default '',
  short_description_hi text not null default '',
  overview text not null default '',
  overview_hi text not null default '',
  icon_key text not null default 'stethoscope',
  common_conditions jsonb not null default '[]'::jsonb,
  common_conditions_hi jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.specializations add column if not exists slug text;
alter table public.specializations add column if not exists name_hi text not null default '';
alter table public.specializations add column if not exists short_description text not null default '';
alter table public.specializations add column if not exists short_description_hi text not null default '';
alter table public.specializations add column if not exists overview text not null default '';
alter table public.specializations add column if not exists overview_hi text not null default '';
alter table public.specializations add column if not exists icon_key text not null default 'stethoscope';
alter table public.specializations add column if not exists common_conditions jsonb not null default '[]'::jsonb;
alter table public.specializations add column if not exists common_conditions_hi jsonb not null default '[]'::jsonb;
alter table public.specializations add column if not exists active boolean not null default true;
alter table public.specializations add column if not exists created_at timestamptz not null default now();
alter table public.specializations add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'chk_specializations_name_nonempty'
      and conrelid = 'public.specializations'::regclass
  ) then
    alter table public.specializations
      add constraint chk_specializations_name_nonempty
      check (char_length(trim(name)) > 0);
  end if;
end $$;

drop trigger if exists trg_specializations_updated_at on public.specializations;
create trigger trg_specializations_updated_at
  before update on public.specializations
  for each row
  execute function public.set_updated_at();

create index if not exists idx_specializations_active
  on public.specializations (active);

create index if not exists idx_specializations_slug
  on public.specializations (slug);

-- ----------------------------------------------------------------------------
-- 3. Doctors Roster Table (public.doctors)
-- ----------------------------------------------------------------------------

create table if not exists public.doctors (
  id text primary key,
  slug text unique not null,
  name text not null,
  name_hi text not null default '',
  speciality text not null default '',
  speciality_hi text not null default '',
  specialization_id text references public.specializations(id) on update cascade on delete restrict,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
alter table public.doctors add column if not exists created_at timestamptz not null default now();
alter table public.doctors add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'chk_doctors_name_nonempty'
      and conrelid = 'public.doctors'::regclass
  ) then
    alter table public.doctors
      add constraint chk_doctors_name_nonempty
      check (char_length(trim(name)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'chk_doctors_rating_range'
      and conrelid = 'public.doctors'::regclass
  ) then
    alter table public.doctors
      add constraint chk_doctors_rating_range
      check (rating >= 0 and rating <= 5);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'chk_doctors_fees_nonneg'
      and conrelid = 'public.doctors'::regclass
  ) then
    alter table public.doctors
      add constraint chk_doctors_fees_nonneg
      check (fees >= 0 and consultation_fee >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where contype = 'f'
      and conrelid = 'public.doctors'::regclass
      and confrelid = 'public.specializations'::regclass
  ) then
    alter table public.doctors
      add constraint fk_doctors_specialization
      foreign key (specialization_id)
      references public.specializations(id)
      on update cascade
      on delete restrict;
  end if;
end $$;

drop trigger if exists trg_doctors_updated_at on public.doctors;
create trigger trg_doctors_updated_at
  before update on public.doctors
  for each row
  execute function public.set_updated_at();

create index if not exists idx_doctors_active
  on public.doctors (active);

create index if not exists idx_doctors_specialization_id
  on public.doctors (specialization_id);

create index if not exists idx_doctors_slug
  on public.doctors (slug);

create index if not exists idx_doctors_active_specialization
  on public.doctors (active, specialization_id);

-- ----------------------------------------------------------------------------
-- 4. Doctor-Specialization Relationship Table (public.doctor_specializations)
-- ----------------------------------------------------------------------------

create table if not exists public.doctor_specializations (
  id uuid primary key default gen_random_uuid(),
  doctor_id text not null references public.doctors(id) on update cascade on delete cascade,
  specialization_id text not null references public.specializations(id) on update cascade on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_doctor_specialization unique (doctor_id, specialization_id)
);

drop trigger if exists trg_doctor_specializations_updated_at on public.doctor_specializations;
create trigger trg_doctor_specializations_updated_at
  before update on public.doctor_specializations
  for each row
  execute function public.set_updated_at();

create index if not exists idx_doctor_specializations_doctor_id
  on public.doctor_specializations (doctor_id);

create index if not exists idx_doctor_specializations_specialization_id
  on public.doctor_specializations (specialization_id);

create unique index if not exists uq_doctor_primary_specialization
  on public.doctor_specializations (doctor_id)
  where is_primary = true;

-- ----------------------------------------------------------------------------
-- 5. Row Level Security (RLS) & Access Policies
-- ----------------------------------------------------------------------------

alter table public.specializations enable row level security;
alter table public.doctors enable row level security;
alter table public.doctor_specializations enable row level security;

-- Remove overly broad legacy read policies if present
drop policy if exists "Public read specializations" on public.specializations;
drop policy if exists "Public read active specializations" on public.specializations;
drop policy if exists "Admin read all specializations" on public.specializations;
drop policy if exists "Admin insert specializations" on public.specializations;
drop policy if exists "Admin update specializations" on public.specializations;
drop policy if exists "Admin delete specializations" on public.specializations;

drop policy if exists "Public read doctors" on public.doctors;
drop policy if exists "Public read active doctors" on public.doctors;
drop policy if exists "Admin read all doctors" on public.doctors;
drop policy if exists "Admin insert doctors" on public.doctors;
drop policy if exists "Admin update doctors" on public.doctors;
drop policy if exists "Admin delete doctors" on public.doctors;

drop policy if exists "Public read active doctor_specializations" on public.doctor_specializations;
drop policy if exists "Admin read all doctor_specializations" on public.doctor_specializations;
drop policy if exists "Admin insert doctor_specializations" on public.doctor_specializations;
drop policy if exists "Admin update doctor_specializations" on public.doctor_specializations;
drop policy if exists "Admin delete doctor_specializations" on public.doctor_specializations;

-- Public visitors: read ONLY active specializations
create policy "Public read active specializations"
  on public.specializations
  for select
  to anon, authenticated
  using (active = true);

-- Administrators: full CRUD on specializations
create policy "Admin read all specializations"
  on public.specializations
  for select
  to authenticated
  using (public.is_clinic_admin());

create policy "Admin insert specializations"
  on public.specializations
  for insert
  to authenticated
  with check (public.is_clinic_admin());

create policy "Admin update specializations"
  on public.specializations
  for update
  to authenticated
  using (public.is_clinic_admin())
  with check (public.is_clinic_admin());

create policy "Admin delete specializations"
  on public.specializations
  for delete
  to authenticated
  using (public.is_clinic_admin());

-- Public visitors: read ONLY active doctors
create policy "Public read active doctors"
  on public.doctors
  for select
  to anon, authenticated
  using (active = true);

-- Administrators: full CRUD on doctors
create policy "Admin read all doctors"
  on public.doctors
  for select
  to authenticated
  using (public.is_clinic_admin());

create policy "Admin insert doctors"
  on public.doctors
  for insert
  to authenticated
  with check (public.is_clinic_admin());

create policy "Admin update doctors"
  on public.doctors
  for update
  to authenticated
  using (public.is_clinic_admin())
  with check (public.is_clinic_admin());

create policy "Admin delete doctors"
  on public.doctors
  for delete
  to authenticated
  using (public.is_clinic_admin());

-- Public visitors: read doctor-specialization links ONLY when both doctor & specialization are active
create policy "Public read active doctor_specializations"
  on public.doctor_specializations
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.doctors d
      join public.specializations s on s.id = doctor_specializations.specialization_id
      where d.id = doctor_specializations.doctor_id
        and d.active = true
        and s.active = true
    )
  );

-- Administrators: full CRUD on doctor_specializations
create policy "Admin read all doctor_specializations"
  on public.doctor_specializations
  for select
  to authenticated
  using (public.is_clinic_admin());

create policy "Admin insert doctor_specializations"
  on public.doctor_specializations
  for insert
  to authenticated
  with check (public.is_clinic_admin());

create policy "Admin update doctor_specializations"
  on public.doctor_specializations
  for update
  to authenticated
  using (public.is_clinic_admin())
  with check (public.is_clinic_admin());

create policy "Admin delete doctor_specializations"
  on public.doctor_specializations
  for delete
  to authenticated
  using (public.is_clinic_admin());

grant usage on schema public to anon, authenticated;
grant select on public.specializations, public.doctors, public.doctor_specializations to anon, authenticated;
grant insert, update, delete on public.specializations, public.doctors, public.doctor_specializations to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Non-Destructive Seed & Backfill (Preserves Existing Data)
-- ----------------------------------------------------------------------------

insert into public.specializations (
  id, slug, name, name_hi,
  short_description, short_description_hi,
  overview, overview_hi,
  icon_key, common_conditions, common_conditions_hi, active
)
values
  (
    'spec-general-physician',
    'general-physician',
    'General Physician',
    'सामान्य चिकित्सा (जनरल फिजिशियन)',
    'Primary adult consultations, fever & infection care, diabetes & thyroid management, and preventive health checks.',
    'वयस्क सामान्य परामर्श, बुखार उपचार, मधुमेह व थायरॉइड प्रबंधन और निवारक स्वास्थ्य जांच।',
    'Our General Physician department serves as your primary point of care for acute fevers, metabolic health, blood pressure, and preventive annual checkups under one roof.',
    'हमारा सामान्य चिकित्सा विभाग मौसमी बुखार, मधुमेह, थायरॉइड और वार्षिक स्वास्थ्य जांच के लिए एक ही स्थान पर प्राथमिक देखभाल प्रदान करता है।',
    'stethoscope',
    '["Acute Fever & Viral Illness Care","Diabetes & Thyroid Monitoring","Hypertension & Metabolic Checkups","Preventive Annual Health Screening"]'::jsonb,
    '["बुखार और वायरल संक्रमण का इलाज","मधुमेह और थायरॉइड की नियमित जांच","उच्च रक्तचाप एवं मेटाबॉलिक परामर्श","वार्षिक निवारक स्वास्थ्य जांच"]'::jsonb,
    true
  ),
  (
    'spec-cardiology',
    'cardiology',
    'Cardiologist',
    'हृदय रोग विज्ञान (कार्डियोलॉजी)',
    'Preventive heart screening, hypertension management, ECG interpretation, and long-term cardiac follow-up.',
    'निवारक हृदय जांच, उच्च रक्तचाप प्रबंधन, ईसीजी मूल्यांकन और नियमित हृदय देखभाल।',
    'Our Cardiology department focuses on thorough outpatient cardiovascular evaluation, blood pressure and lipid management, ECG diagnostics, and coordinated follow-up care.',
    'हमारा हृदय रोग विभाग बाह्य रोगी हृदय मूल्यांकन, रक्तचाप और कोलेस्ट्रॉल प्रबंधन, ईसीजी जांच और नियमित फॉलो-अप पर केंद्रित है।',
    'heart',
    '["Hypertension & Blood Pressure Review","Preventive Cardiac Risk Assessment","Chest Discomfort & Palpitation Check","Post-Hospital Cardiac Follow-up"]'::jsonb,
    '["उच्च रक्तचाप (बीपी) प्रबंधन","निवारक हृदय जोखिम मूल्यांकन","सीने में जकड़न या धड़कन की जांच","उपचार के बाद नियमित फॉलो-अप"]'::jsonb,
    true
  ),
  (
    'spec-orthopedics',
    'orthopedics',
    'Orthopaedic',
    'हड्डी एवं जोड़ रोग (ऑर्थोपेडिक्स)',
    'Joint pain evaluation, spine and posture care, sports injury recovery, and non-surgical musculoskeletal treatment.',
    'जोड़ों के दर्द की जांच, रीढ़ और मुद्रा देखभाल, खेल चोट पुनर्वास और अस्थि परामर्श।',
    'From chronic knee and back stiffness to acute sprains and fracture follow-ups, our Orthopaedic clinic prioritizes accurate diagnosis, mobility preservation, and structured rehab plans.',
    'घुटने और कमर के पुराने दर्द से लेकर मोच और फ्रैक्चर के बाद की देखभाल तक, हमारा ऑर्थोपेडिक्स विभाग सटीक निदान और गतिशीलता सुधार पर ध्यान देता है।',
    'bone',
    '["Knee, Hip & Shoulder Joint Pain","Neck & Lower Back Stiffness","Ligament Sprains & Sports Injuries","Bone Density & Arthritis Care"]'::jsonb,
    '["घुटने, कूल्हे और कंधे के जोड़ों का दर्द","गर्दन और कमर की जकड़न","लिगामेंट मोच और खेल चोटें","हड्डी की मजबूती और गठिया देखभाल"]'::jsonb,
    true
  ),
  (
    'spec-pediatrics',
    'pediatrics',
    'Pediatrician',
    'बाल रोग विशेषज्ञ (पीडियाट्रिक्स)',
    'Infant growth monitoring, childhood immunization guidance, acute fever care, and adolescent health visits.',
    'शिशु विकास निगरानी, टीकाकरण परामर्श, मौसमी बुखार उपचार और किशोर स्वास्थ्य देखभाल।',
    'Our Pediatrics unit provides calm, unhurried consultations for newborns, toddlers, and adolescents—supporting parents with clear guidance on nutrition and immunization schedules.',
    'हमारी बाल रोग इकाई नवजात शिशुओं, बच्चों और किशोरों के लिए शांत और संवेदनशील परामर्श प्रदान करती है।',
    'baby',
    '["Routine Growth & Developmental Checks","Childhood Vaccination Counseling","Respiratory & Seasonal Infections","Pediatric Nutrition & Allergy Care"]'::jsonb,
    '["नियमित विकास और स्वास्थ्य जांच","बच्चों के टीकाकरण का मार्गदर्शन","श्वसन और मौसमी संक्रमण उपचार","बाल पोषण एवं एलर्जी परामर्श"]'::jsonb,
    true
  ),
  (
    'spec-neurology',
    'neurology',
    'Neurologist',
    'मस्तिष्क एवं तंत्रिका रोग (न्यूरोलॉजी)',
    'Migraine and headache clinics, nerve pain evaluation, vertigo balance care, and neurological follow-ups.',
    'माइग्रेन एवं सिरदर्द उपचार, नसों के दर्द की जांच, चक्कर और न्यूरोलॉजिकल परामर्श।',
    'Our Neurology outpatient unit delivers detailed clinical workups for recurring headaches, peripheral neuropathy, dizziness, sleep disturbances, and long-term nerve care.',
    'हमारा न्यूरोलॉजी विभाग माइग्रेन, नसों की कमजोरी, चक्कर आने और मस्तिष्क संबंधी विकारों के लिए गहन नैदानिक मूल्यांकन प्रदान करता है।',
    'brain',
    '["Migraine & Chronic Headache Care","Peripheral Neuropathy & Nerve Pain","Vertigo, Dizziness & Balance Issues","Epilepsy & Post-Stroke Follow-up"]'::jsonb,
    '["माइग्रेन और पुराने सिरदर्द का उपचार","नसों में झुनझुनी और न्यूरोपैथी देखभाल","चक्कर और संतुलन संबंधी समस्याएं","मिर्गी एवं स्ट्रोक के बाद फॉलो-अप"]'::jsonb,
    true
  ),
  (
    'spec-gynecology',
    'gynecology',
    'Gynecologist',
    'स्त्री एवं प्रसूति रोग (गायनेकोलॉजी)',
    'Antenatal checkups, PCOS & hormonal care, menstrual wellness, and preventive women’s health consultations.',
    'गर्भावस्था जांच, पीसीओएस एवं हार्मोनल देखभाल, मासिक धर्म स्वास्थ्य और महिला कल्याण परामर्श।',
    'Our Gynecology clinic offers private, respectful, and evidence-based outpatient care tailored to women across adolescence, pregnancy planning, antenatal monitoring, and menopause.',
    'हमारा स्त्री रोग विभाग महिलाओं के लिए गोपनीय, संवेदनशील और प्रमाण-आधारित प्रसवपूर्व, हार्मोनल एवं निवारक स्वास्थ्य देखभाल प्रदान करता है।',
    'female',
    '["Antenatal & Pregnancy Monitoring","PCOS & Hormonal Balance Care","Menstrual & Pelvic Health Consults","Preventive Women Wellness Screening"]'::jsonb,
    '["गर्भावस्था एवं प्रसवपूर्व नियमित जांच","पीसीओएस और हार्मोनल संतुलन उपचार","मासिक धर्म एवं महिला स्वास्थ्य परामर्श","महिला निवारक स्वास्थ्य जांच"]'::jsonb,
    true
  )
on conflict (id) do nothing;

-- Fill missing overview / common_conditions ONLY if currently blank (never overwrites existing content)
update public.specializations as s
set
  overview = case when nullif(trim(s.overview), '') is null then v.overview else s.overview end,
  overview_hi = case when nullif(trim(s.overview_hi), '') is null then v.overview_hi else s.overview_hi end,
  common_conditions = case when s.common_conditions is null or jsonb_array_length(s.common_conditions) = 0 then v.common_conditions else s.common_conditions end,
  common_conditions_hi = case when s.common_conditions_hi is null or jsonb_array_length(s.common_conditions_hi) = 0 then v.common_conditions_hi else s.common_conditions_hi end
from (
  values
    (
      'spec-general-physician',
      'Our General Physician department serves as your primary point of care for acute fevers, metabolic health, blood pressure, and preventive annual checkups under one roof.',
      'हमारा सामान्य चिकित्सा विभाग मौसमी बुखार, मधुमेह, थायरॉइड और वार्षिक स्वास्थ्य जांच के लिए एक ही स्थान पर प्राथमिक देखभाल प्रदान करता है।',
      '["Acute Fever & Viral Illness Care","Diabetes & Thyroid Monitoring","Hypertension & Metabolic Checkups","Preventive Annual Health Screening"]'::jsonb,
      '["बुखार और वायरल संक्रमण का इलाज","मधुमेह और थायरॉइड की नियमित जांच","उच्च रक्तचाप एवं मेटाबॉलिक परामर्श","वार्षिक निवारक स्वास्थ्य जांच"]'::jsonb
    ),
    (
      'spec-cardiology',
      'Our Cardiology department focuses on thorough outpatient cardiovascular evaluation, blood pressure and lipid management, ECG diagnostics, and coordinated follow-up care.',
      'हमारा हृदय रोग विभाग बाह्य रोगी हृदय मूल्यांकन, रक्तचाप और कोलेस्ट्रॉल प्रबंधन, ईसीजी जांच और नियमित फॉलो-अप पर केंद्रित है।',
      '["Hypertension & Blood Pressure Review","Preventive Cardiac Risk Assessment","Chest Discomfort & Palpitation Check","Post-Hospital Cardiac Follow-up"]'::jsonb,
      '["उच्च रक्तचाप (बीपी) प्रबंधन","निवारक हृदय जोखिम मूल्यांकन","सीने में जकड़न या धड़कन की जांच","उपचार के बाद नियमित फॉलो-अप"]'::jsonb
    ),
    (
      'spec-orthopedics',
      'From chronic knee and back stiffness to acute sprains and fracture follow-ups, our Orthopaedic clinic prioritizes accurate diagnosis, mobility preservation, and structured rehab plans.',
      'घुटने और कमर के पुराने दर्द से लेकर मोच और फ्रैक्चर के बाद की देखभाल तक, हमारा ऑर्थोपेडिक्स विभाग सटीक निदान और गतिशीलता सुधार पर ध्यान देता है।',
      '["Knee, Hip & Shoulder Joint Pain","Neck & Lower Back Stiffness","Ligament Sprains & Sports Injuries","Bone Density & Arthritis Care"]'::jsonb,
      '["घुटने, कूल्हे और कंधे के जोड़ों का दर्द","गर्दन और कमर की जकड़न","लिगामेंट मोच और खेल चोटें","हड्डी की मजबूती और गठिया देखभाल"]'::jsonb
    ),
    (
      'spec-pediatrics',
      'Our Pediatrics unit provides calm, unhurried consultations for newborns, toddlers, and adolescents—supporting parents with clear guidance on nutrition and immunization schedules.',
      'हमारी बाल रोग इकाई नवजात शिशुओं, बच्चों और किशोरों के लिए शांत और संवेदनशील परामर्श प्रदान करती है।',
      '["Routine Growth & Developmental Checks","Childhood Vaccination Counseling","Respiratory & Seasonal Infections","Pediatric Nutrition & Allergy Care"]'::jsonb,
      '["नियमित विकास और स्वास्थ्य जांच","बच्चों के टीकाकरण का मार्गदर्शन","श्वसन और मौसमी संक्रमण उपचार","बाल पोषण एवं एलर्जी परामर्श"]'::jsonb
    ),
    (
      'spec-neurology',
      'Our Neurology outpatient unit delivers detailed clinical workups for recurring headaches, peripheral neuropathy, dizziness, sleep disturbances, and long-term nerve care.',
      'हमारा न्यूरोलॉजी विभाग माइग्रेन, नसों की कमजोरी, चक्कर आने और मस्तिष्क संबंधी विकारों के लिए गहन नैदानिक मूल्यांकन प्रदान करता है।',
      '["Migraine & Chronic Headache Care","Peripheral Neuropathy & Nerve Pain","Vertigo, Dizziness & Balance Issues","Epilepsy & Post-Stroke Follow-up"]'::jsonb,
      '["माइग्रेन और पुराने सिरदर्द का उपचार","नसों में झुनझुनी और न्यूरोपैथी देखभाल","चक्कर और संतुलन संबंधी समस्याएं","मिर्गी एवं स्ट्रोक के बाद फॉलो-अप"]'::jsonb
    ),
    (
      'spec-gynecology',
      'Our Gynecology clinic offers private, respectful, and evidence-based outpatient care tailored to women across adolescence, pregnancy planning, antenatal monitoring, and menopause.',
      'हमारा स्त्री रोग विभाग महिलाओं के लिए गोपनीय, संवेदनशील और प्रमाण-आधारित प्रसवपूर्व, हार्मोनल एवं निवारक स्वास्थ्य देखभाल प्रदान करता है।',
      '["Antenatal & Pregnancy Monitoring","PCOS & Hormonal Balance Care","Menstrual & Pelvic Health Consults","Preventive Women Wellness Screening"]'::jsonb,
      '["गर्भावस्था एवं प्रसवपूर्व नियमित जांच","पीसीओएस और हार्मोनल संतुलन उपचार","मासिक धर्म एवं महिला स्वास्थ्य परामर्श","महिला निवारक स्वास्थ्य जांच"]'::jsonb
    )
) as v(id, overview, overview_hi, common_conditions, common_conditions_hi)
where s.id = v.id
  and (
    nullif(trim(s.overview), '') is null
    or nullif(trim(s.overview_hi), '') is null
    or s.common_conditions is null
    or jsonb_array_length(s.common_conditions) = 0
    or s.common_conditions_hi is null
    or jsonb_array_length(s.common_conditions_hi) = 0
  );

insert into public.doctors (
  id, slug, name, name_hi, speciality, speciality_hi, specialization_id,
  qualification, qualification_hi, experience, experience_summary, experience_summary_hi,
  rating, timing, timing_hi, fees, consultation_fee, image_key, bio, bio_hi, active, schedule
)
values
  (
    'doc-sharma', 'dr-sharma', 'Dr. Sharma', 'डॉ. शर्मा',
    'General Physician', 'जनरल फिजिशियन (सामान्य चिकित्सा)', 'spec-general-physician',
    'MBBS, MD (Internal Medicine)', 'एमबीबीएस, एमडी (आंतरिक चिकित्सा)',
    '15+ Years Experience', '15+ Years · General Physician & Primary Care', '15+ वर्ष अनुभव · जनरल फिजिशियन एवं प्राथमिक देखभाल',
    4.9, 'Mon – Sat · 09:00 AM – 01:30 PM', 'सोम – शनि · सुबह 09:00 – दोपहर 01:30',
    600, 600, 'doctor_general_physician',
    'Dr. Sharma specializes in acute viral fevers, diabetes, hypertension, thyroid management, and comprehensive preventive adult health evaluations.',
    'डॉ. शर्मा मौसमी बुखार, मधुमेह, रक्तचाप, थायरॉइड और वयस्क निवारक स्वास्थ्य जांच में 15+ वर्षों का अनुभव रखते हैं।',
    true,
    '{"mon":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"tue":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"wed":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"thu":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"fri":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"sat":{"enabled":true,"start":"09:30","end":"13:00","slotMinutes":30},"sun":{"enabled":false,"start":"10:00","end":"13:00","slotMinutes":30}}'::jsonb
  ),
  (
    'doc-priya', 'dr-priya', 'Dr. Priya', 'डॉ. प्रिया',
    'Cardiologist', 'कार्डियोलॉजिस्ट (हृदय रोग विशेषज्ञ)', 'spec-cardiology',
    'MBBS, MD (Medicine), DM (Cardiology)', 'एमबीबीएस, एमडी, डीएम (कार्डियोलॉजी)',
    '12+ Years Experience', '12+ Years · Preventive Cardiology & ECG Care', '12+ वर्ष अनुभव · निवारक हृदय देखभाल एवं ईसीजी',
    4.9, 'Mon – Sat · 10:00 AM – 07:00 PM', 'सोम – शनि · सुबह 10:00 – शाम 07:00',
    1000, 1000, 'doctor_cardiology',
    'Dr. Priya leads outpatient cardiology consultations covering blood pressure optimization, lipid management, and ECG interpretation.',
    'डॉ. प्रिया उच्च रक्तचाप नियंत्रण, कोलेस्ट्रॉल प्रबंधन और ईसीजी समीक्षा में विशेषज्ञ हैं।',
    true,
    '{"mon":{"enabled":true,"start":"10:00","end":"14:00","slotMinutes":30},"tue":{"enabled":true,"start":"15:00","end":"19:00","slotMinutes":30},"wed":{"enabled":true,"start":"10:00","end":"14:00","slotMinutes":30},"thu":{"enabled":true,"start":"15:00","end":"19:00","slotMinutes":30},"fri":{"enabled":true,"start":"10:00","end":"14:00","slotMinutes":30},"sat":{"enabled":true,"start":"10:00","end":"13:30","slotMinutes":30},"sun":{"enabled":false,"start":"10:00","end":"13:00","slotMinutes":30}}'::jsonb
  ),
  (
    'doc-rohan', 'dr-rohan', 'Dr. Rohan', 'डॉ. रोहन',
    'Orthopaedic', 'ऑर्थोपेडिक (हड्डी एवं जोड़ रोग विशेषज्ञ)', 'spec-orthopedics',
    'MBBS, MS (Orthopedics)', 'एमबीबीएस, एमएस (ऑर्थोपेडिक्स)',
    '11+ Years Experience', '11+ Years · Joint, Spine & Sports Injury Care', '11+ वर्ष अनुभव · जोड़, रीढ़ एवं खेल चोट देखभाल',
    4.8, 'Mon – Sat · 09:00 AM – 01:30 PM', 'सोम – शनि · सुबह 09:00 – दोपहर 01:30',
    850, 850, 'doctor_orthopedics',
    'Dr. Rohan evaluates knee, shoulder, and spine stiffness, sports ligament sprains, and fracture follow-ups.',
    'डॉ. रोहन घुटने, कंधे व कमर दर्द, खेल चोटों और अस्थि पुनर्वास का सटीक मूल्यांकन प्रदान करते हैं।',
    true,
    '{"mon":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"tue":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"wed":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"thu":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"fri":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"sat":{"enabled":true,"start":"09:30","end":"13:00","slotMinutes":30},"sun":{"enabled":false,"start":"10:00","end":"13:00","slotMinutes":30}}'::jsonb
  ),
  (
    'doc-anjali', 'dr-anjali', 'Dr. Anjali', 'डॉ. अंजलि',
    'Pediatrician', 'पीडियाट्रिशियन (बाल रोग विशेषज्ञ)', 'spec-pediatrics',
    'MBBS, MD (Pediatrics)', 'एमबीबीएस, एमडी (पीडियाट्रिक्स)',
    '10+ Years Experience', '10+ Years · Child & Adolescent Healthcare', '10+ वर्ष अनुभव · शिशु एवं बाल स्वास्थ्य देखभाल',
    4.9, 'Mon – Sat · 09:30 AM – 06:30 PM', 'सोम – शनि · सुबह 09:30 – शाम 06:30',
    750, 750, 'doctor_pediatrics',
    'Dr. Anjali offers gentle consultations for newborns, toddlers, and adolescents including growth tracking and vaccination guidance.',
    'डॉ. अंजलि नवजात शिशुओं और बच्चों के पोषण, टीकाकरण मार्गदर्शन तथा मौसमी संक्रमणों के लिए परामर्श देती हैं।',
    true,
    '{"mon":{"enabled":true,"start":"09:30","end":"14:00","slotMinutes":30},"tue":{"enabled":true,"start":"09:30","end":"14:00","slotMinutes":30},"wed":{"enabled":true,"start":"14:30","end":"18:30","slotMinutes":30},"thu":{"enabled":true,"start":"09:30","end":"14:00","slotMinutes":30},"fri":{"enabled":true,"start":"14:30","end":"18:30","slotMinutes":30},"sat":{"enabled":true,"start":"10:00","end":"13:30","slotMinutes":30},"sun":{"enabled":false,"start":"10:00","end":"13:00","slotMinutes":30}}'::jsonb
  ),
  (
    'doc-vikram', 'dr-vikram', 'Dr. Vikram', 'डॉ. विक्रम',
    'Neurologist', 'न्यूरोलॉजिस्ट (मस्तिष्क एवं तंत्रिका रोग विशेषज्ञ)', 'spec-neurology',
    'MBBS, MD (Medicine), DM (Neurology)', 'एमबीबीएस, एमडी, डीएम (न्यूरोलॉजी)',
    '13+ Years Experience', '13+ Years · Migraine, Nerve & Stroke Care', '13+ वर्ष अनुभव · माइग्रेन, नसों एवं मस्तिष्क रोग',
    4.8, 'Mon – Sat · 10:00 AM – 07:00 PM', 'सोम – शनि · सुबह 10:00 – शाम 07:00',
    1100, 1100, 'doctor_neurology',
    'Dr. Vikram treats chronic migraines, vertigo, peripheral neuropathy, and neurological follow-up conditions.',
    'डॉ. विक्रम माइग्रेन, चक्कर, नसों की कमजोरी और न्यूरोलॉजिकल विकारों का आधुनिक नैदानिक उपचार करते हैं।',
    true,
    '{"mon":{"enabled":true,"start":"10:00","end":"14:00","slotMinutes":30},"tue":{"enabled":true,"start":"15:00","end":"19:00","slotMinutes":30},"wed":{"enabled":true,"start":"10:00","end":"14:00","slotMinutes":30},"thu":{"enabled":true,"start":"15:00","end":"19:00","slotMinutes":30},"fri":{"enabled":true,"start":"10:00","end":"14:00","slotMinutes":30},"sat":{"enabled":true,"start":"10:00","end":"13:30","slotMinutes":30},"sun":{"enabled":false,"start":"10:00","end":"13:00","slotMinutes":30}}'::jsonb
  ),
  (
    'doc-neha', 'dr-neha', 'Dr. Neha', 'डॉ. नेहा',
    'Gynecologist', 'गायनेकोलॉजिस्ट (स्त्री एवं प्रसूति रोग विशेषज्ञ)', 'spec-gynecology',
    'MBBS, MS (Obstetrics & Gynecology)', 'एमबीबीएस, एमएस (स्त्री एवं प्रसूति रोग)',
    '12+ Years Experience', '12+ Years · Women Wellness & Antenatal Care', '12+ वर्ष अनुभव · महिला स्वास्थ्य एवं प्रसवपूर्व देखभाल',
    4.9, 'Mon – Sat · 09:30 AM – 06:30 PM', 'सोम – शनि · सुबह 09:30 – शाम 06:30',
    850, 850, 'doctor_gynecology',
    'Dr. Neha provides confidential care across antenatal checkups, PCOS and hormonal balance, and women’s wellness.',
    'डॉ. नेहा गर्भावस्था जांच, पीसीओएस, हार्मोनल संतुलन और महिला स्वास्थ्य के लिए संवेदनशील परामर्श प्रदान करती हैं।',
    true,
    '{"mon":{"enabled":true,"start":"09:30","end":"14:00","slotMinutes":30},"tue":{"enabled":true,"start":"09:30","end":"14:00","slotMinutes":30},"wed":{"enabled":true,"start":"14:30","end":"18:30","slotMinutes":30},"thu":{"enabled":true,"start":"09:30","end":"14:00","slotMinutes":30},"fri":{"enabled":true,"start":"14:30","end":"18:30","slotMinutes":30},"sat":{"enabled":true,"start":"10:00","end":"13:30","slotMinutes":30},"sun":{"enabled":false,"start":"10:00","end":"13:00","slotMinutes":30}}'::jsonb
  )
on conflict (id) do nothing;

-- Fill empty doctor weekly schedules ONLY where currently empty (never overwrites existing schedules)
update public.doctors as d
set schedule = v.schedule
from (
  values
    ('doc-sharma', '{"mon":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"tue":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"wed":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"thu":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"fri":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"sat":{"enabled":true,"start":"09:30","end":"13:00","slotMinutes":30},"sun":{"enabled":false,"start":"10:00","end":"13:00","slotMinutes":30}}'::jsonb),
    ('doc-priya', '{"mon":{"enabled":true,"start":"10:00","end":"14:00","slotMinutes":30},"tue":{"enabled":true,"start":"15:00","end":"19:00","slotMinutes":30},"wed":{"enabled":true,"start":"10:00","end":"14:00","slotMinutes":30},"thu":{"enabled":true,"start":"15:00","end":"19:00","slotMinutes":30},"fri":{"enabled":true,"start":"10:00","end":"14:00","slotMinutes":30},"sat":{"enabled":true,"start":"10:00","end":"13:30","slotMinutes":30},"sun":{"enabled":false,"start":"10:00","end":"13:00","slotMinutes":30}}'::jsonb),
    ('doc-rohan', '{"mon":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"tue":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"wed":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"thu":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"fri":{"enabled":true,"start":"09:00","end":"13:30","slotMinutes":30},"sat":{"enabled":true,"start":"09:30","end":"13:00","slotMinutes":30},"sun":{"enabled":false,"start":"10:00","end":"13:00","slotMinutes":30}}'::jsonb),
    ('doc-anjali', '{"mon":{"enabled":true,"start":"09:30","end":"14:00","slotMinutes":30},"tue":{"enabled":true,"start":"09:30","end":"14:00","slotMinutes":30},"wed":{"enabled":true,"start":"14:30","end":"18:30","slotMinutes":30},"thu":{"enabled":true,"start":"09:30","end":"14:00","slotMinutes":30},"fri":{"enabled":true,"start":"14:30","end":"18:30","slotMinutes":30},"sat":{"enabled":true,"start":"10:00","end":"13:30","slotMinutes":30},"sun":{"enabled":false,"start":"10:00","end":"13:00","slotMinutes":30}}'::jsonb),
    ('doc-vikram', '{"mon":{"enabled":true,"start":"10:00","end":"14:00","slotMinutes":30},"tue":{"enabled":true,"start":"15:00","end":"19:00","slotMinutes":30},"wed":{"enabled":true,"start":"10:00","end":"14:00","slotMinutes":30},"thu":{"enabled":true,"start":"15:00","end":"19:00","slotMinutes":30},"fri":{"enabled":true,"start":"10:00","end":"14:00","slotMinutes":30},"sat":{"enabled":true,"start":"10:00","end":"13:30","slotMinutes":30},"sun":{"enabled":false,"start":"10:00","end":"13:00","slotMinutes":30}}'::jsonb),
    ('doc-neha', '{"mon":{"enabled":true,"start":"09:30","end":"14:00","slotMinutes":30},"tue":{"enabled":true,"start":"09:30","end":"14:00","slotMinutes":30},"wed":{"enabled":true,"start":"14:30","end":"18:30","slotMinutes":30},"thu":{"enabled":true,"start":"09:30","end":"14:00","slotMinutes":30},"fri":{"enabled":true,"start":"14:30","end":"18:30","slotMinutes":30},"sat":{"enabled":true,"start":"10:00","end":"13:30","slotMinutes":30},"sun":{"enabled":false,"start":"10:00","end":"13:00","slotMinutes":30}}'::jsonb)
) as v(id, schedule)
where d.id = v.id
  and (d.schedule is null or d.schedule = '{}'::jsonb);

-- Populate Doctor-Specialization junction table from existing doctors
insert into public.doctor_specializations (doctor_id, specialization_id, is_primary)
select d.id, d.specialization_id, true
from public.doctors d
join public.specializations s on s.id = d.specialization_id
where d.specialization_id is not null
  and trim(d.specialization_id) <> ''
on conflict (doctor_id, specialization_id) do nothing;
