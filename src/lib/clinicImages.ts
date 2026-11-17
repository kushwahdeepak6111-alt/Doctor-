import heroLobby from '../assets/images/hero_clinic_lobby_1794668527153.jpg';
import heroSpecialistCare from '../assets/images/hero_specialist_care_1794876376787.jpg';
import facilityInterior from '../assets/images/clinic_facility_interior_1794668526783.jpg';
import consultationSuite from '../assets/images/consultation_care_suite_1794876380942.jpg';
import guideDiagnosticsPrep from '../assets/images/guide_diagnostics_prep_1794876381253.jpg';
import doctorCardiology from '../assets/images/doctor_cardiology_v2_1794876377868.jpg';
import doctorPediatrics from '../assets/images/doctor_pediatrics_portrait_1794668527417.jpg';
import doctorOrthopedics from '../assets/images/doctor_orthopedics_v2_1794876378502.jpg';
import doctorDermatology from '../assets/images/doctor_dermatology_v2_1794876378578.jpg';

export const CLINIC_IMAGES: Record<string, string> = {
  hero_lobby: heroLobby,
  hero_specialist_care: heroSpecialistCare,
  facility_interior: facilityInterior,
  consultation_suite: consultationSuite,
  guide_diagnostics_prep: guideDiagnosticsPrep,
  doctor_cardiology: doctorCardiology,
  doctor_pediatrics: doctorPediatrics,
  doctor_orthopedics: doctorOrthopedics,
  doctor_dermatology: doctorDermatology,
};

export function resolveClinicImage(imageKey?: string): string {
  if (!imageKey) return doctorCardiology;
  return CLINIC_IMAGES[imageKey] || doctorCardiology;
}
