import { CLINIC_DOCTORS, CLINIC_SPECIALIZATIONS } from './clinicCatalog';
import { resolveClinicImage } from './clinicImages';
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

/**
 * Validates HTTP status and Content-Type header BEFORE attempting JSON.parse()
 * so HTML fallback documents ("<!DOCTYPE html>...") never produce raw SyntaxErrors.
 */
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
      `${endpointLabel} returned HTML instead of JSON (HTTP ${response.status}). Ensure the API endpoint or Supabase REST URL is configured correctly.`,
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

function normalizeDoctorRow(raw: Record<string, unknown>): Doctor | null {
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

  return {
    id,
    slug: String(raw.slug || fallback?.slug || id),
    name,
    nameHi: String(raw.name_hi ?? raw.nameHi ?? fallback?.nameHi ?? name),
    speciality: String(raw.speciality ?? raw.specialty ?? fallback?.speciality ?? ''),
    specialityHi: String(raw.speciality_hi ?? raw.specialityHi ?? fallback?.specialityHi ?? ''),
    specializationId: String(
      raw.specialization_id ?? raw.specializationId ?? fallback?.specializationId ?? ''
    ),
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

export interface ClinicCatalogResult {
  specializations: Specialization[];
  doctors: Doctor[];
  source: 'supabase' | 'verified-fallback';
  warning?: string;
}

export async function fetchClinicCatalog(): Promise<ClinicCatalogResult> {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

  if (!supabaseUrl || !supabaseKey) {
    return {
      specializations: CLINIC_SPECIALIZATIONS,
      doctors: CLINIC_DOCTORS,
      source: 'verified-fallback',
    };
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    const [specRes, docRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/specializations?select=*&active=eq.true`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/doctors?select=*&active=eq.true`, { headers }),
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
      ? rawSpecs.map(normalizeSpecializationRow).filter((x): x is Specialization => Boolean(x))
      : [];
    const parsedDocs = Array.isArray(rawDocs)
      ? rawDocs.map(normalizeDoctorRow).filter((x): x is Doctor => Boolean(x))
      : [];

    if (parsedSpecs.length > 0 && parsedDocs.length > 0) {
      return {
        specializations: parsedSpecs,
        doctors: parsedDocs,
        source: 'supabase',
      };
    }

    return {
      specializations: parsedSpecs.length > 0 ? parsedSpecs : CLINIC_SPECIALIZATIONS,
      doctors: parsedDocs.length > 0 ? parsedDocs : CLINIC_DOCTORS,
      source: 'verified-fallback',
    };
  } catch (err) {
    // PGRST205 means Supabase project is reachable, but clinic tables are not yet created/seeded.
    if (err instanceof ClinicApiResponseError && err.code === 'PGRST205') {
      return {
        specializations: CLINIC_SPECIALIZATIONS,
        doctors: CLINIC_DOCTORS,
        source: 'verified-fallback',
        warning: 'Supabase schema tables (doctors/specializations) are not yet provisioned; loaded verified clinic catalog.',
      };
    }

    throw err;
  }
}
