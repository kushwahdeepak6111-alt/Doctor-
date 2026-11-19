import { DEFAULT_CLINIC_WEEKLY_SCHEDULE } from './clinicCatalog';
import { resolveClinicImage } from './clinicImages';
import { supabaseAnonKey, supabaseUrl } from './supabase';
import type { Doctor, Specialization } from '../types/clinic';

export class ClinicApiResponseError extends Error {
  status: number;
  contentType: string;
  code?: string;

  constructor(message: string, opts: { status: number; contentType: string; code?: string }) {
    super(message);
    this.name = 'ClinicApiResponseError';
    this.status = opts.status;
    this.contentType = opts.contentType;
    this.code = opts.code;
  }
}

export async function validateAndParseJsonResponse<T>(
  response: Response,
  endpointLabel: string
): Promise<T> {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const rawBody = await response.text();
  const trimmed = rawBody.trim();

  const looksLikeHtml =
    contentType.includes('text/html') ||
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<html') ||
    trimmed.startsWith('<');

  if (looksLikeHtml) {
    throw new ClinicApiResponseError(
      `${endpointLabel} returned HTML instead of JSON (HTTP ${response.status}).`,
      { status: response.status, contentType: contentType || 'text/html' }
    );
  }

  let parsed: unknown = null;
  if (trimmed) {
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new ClinicApiResponseError(
        `${endpointLabel} returned malformed JSON (HTTP ${response.status}).`,
        { status: response.status, contentType }
      );
    }
  }

  if (!response.ok) {
    const errObj = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;
    const errCode = typeof errObj.code === 'string' ? errObj.code : undefined;
    const errMsg =
      typeof errObj.message === 'string'
        ? errObj.message
        : `${endpointLabel} failed with HTTP ${response.status}.`;
    throw new ClinicApiResponseError(errMsg, {
      status: response.status,
      contentType,
      code: errCode,
    });
  }

  if (!contentType.includes('application/json') && !contentType.includes('+json')) {
    throw new ClinicApiResponseError(
      `${endpointLabel} returned unexpected content type "${contentType || 'unknown'}".`,
      { status: response.status, contentType }
    );
  }

  return parsed as T;
}

function normalizeSpecializationRow(raw: Record<string, unknown>): Specialization | null {
  const id = String(raw.id || '').trim();
  const name = String(raw.name || '').trim();
  if (!id || !name) return null;

  const shortDescription = String(raw.short_description ?? raw.shortDescription ?? '').trim();
  const shortDescriptionHi = String(
    raw.short_description_hi ?? raw.shortDescriptionHi ?? shortDescription
  ).trim();
  const overview = String(raw.overview ?? '').trim() || shortDescription;
  const overviewHi = String(raw.overview_hi ?? raw.overviewHi ?? '').trim() || shortDescriptionHi || overview;
  const rawConditions = raw.common_conditions ?? raw.commonConditions;
  const rawConditionsHi = raw.common_conditions_hi ?? raw.commonConditionsHi;

  return {
    id,
    slug: String(raw.slug || id),
    name,
    nameHi: String(raw.name_hi ?? raw.nameHi ?? name),
    shortDescription,
    shortDescriptionHi,
    overview,
    overviewHi,
    iconKey: (raw.icon_key ?? raw.iconKey ?? 'stethoscope') as Specialization['iconKey'],
    commonConditions: Array.isArray(rawConditions) ? (rawConditions as string[]) : [],
    commonConditionsHi: Array.isArray(rawConditionsHi) ? (rawConditionsHi as string[]) : [],
    active: raw.active !== false,
  };
}

function normalizeDoctorRow(raw: Record<string, unknown>): Doctor | null {
  const id = String(raw.id || '').trim();
  const name = String(raw.name || '').trim();
  if (!id || !name) return null;
  const imageKey = String(raw.image_key ?? raw.imageKey ?? 'doctor_general_physician');
  const rawPhoto = String(raw.photo || '').trim();
  const feeNum = Number(raw.fees ?? raw.consultation_fee ?? raw.consultationFee ?? 600);
  const scheduleObj =
    raw.schedule && typeof raw.schedule === 'object' && Object.keys(raw.schedule as object).length > 0
      ? (raw.schedule as Doctor['schedule'])
      : DEFAULT_CLINIC_WEEKLY_SCHEDULE;
  const speciality = String(raw.speciality ?? raw.specialty ?? '').trim();

  return {
    id,
    slug: String(raw.slug || id),
    name,
    nameHi: String(raw.name_hi ?? raw.nameHi ?? name),
    speciality,
    specialityHi: String(raw.speciality_hi ?? raw.specialityHi ?? speciality),
    specializationId: String(raw.specialization_id ?? raw.specializationId ?? ''),
    qualification: String(raw.qualification ?? ''),
    qualificationHi: String(raw.qualification_hi ?? raw.qualificationHi ?? raw.qualification ?? ''),
    experience: String(raw.experience ?? ''),
    experienceSummary: String(raw.experience_summary ?? raw.experienceSummary ?? raw.experience ?? ''),
    experienceSummaryHi: String(
      raw.experience_summary_hi ?? raw.experienceSummaryHi ?? raw.experience ?? ''
    ),
    rating: Number.isFinite(Number(raw.rating)) ? Number(raw.rating) : 4.8,
    photo: rawPhoto || resolveClinicImage(imageKey),
    timing: String(raw.timing ?? ''),
    timingHi: String(raw.timing_hi ?? raw.timingHi ?? raw.timing ?? ''),
    fees: Number.isFinite(feeNum) ? feeNum : 600,
    consultationFee: Number.isFinite(feeNum) ? feeNum : 600,
    imageKey,
    bio: String(raw.bio ?? ''),
    bioHi: String(raw.bio_hi ?? raw.bioHi ?? raw.bio ?? ''),
    languages: Array.isArray(raw.languages) ? (raw.languages as string[]) : ['English', 'Hindi'],
    languagesHi: Array.isArray(raw.languages_hi ?? raw.languagesHi)
      ? ((raw.languages_hi ?? raw.languagesHi) as string[])
      : ['अंग्रेज़ी', 'हिन्दी'],
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

export interface ClinicCatalogResult {
  specializations: Specialization[];
  doctors: Doctor[];
  source: 'supabase';
}

export async function fetchClinicCatalog(): Promise<ClinicCatalogResult> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  };

  const [specRes, docRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/specializations?select=*`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/doctors?select=*`, { headers }),
  ]);

  const rawSpecs = await validateAndParseJsonResponse<Record<string, unknown>[]>(
    specRes,
    'Supabase specializations endpoint'
  );
  const rawDocs = await validateAndParseJsonResponse<Record<string, unknown>[]>(
    docRes,
    'Supabase doctors endpoint'
  );

  const parsedSpecs = Array.isArray(rawSpecs)
    ? rawSpecs.map(normalizeSpecializationRow).filter((x): x is Specialization => Boolean(x && x.active !== false))
    : [];
  const parsedDocs = Array.isArray(rawDocs)
    ? rawDocs.map(normalizeDoctorRow).filter((x): x is Doctor => Boolean(x && x.active !== false))
    : [];

  return {
    specializations: parsedSpecs,
    doctors: parsedDocs,
    source: 'supabase',
  };
}
