import heroLobby from '../assets/images/hero_clinic_lobby_1794668527153.jpg';
import heroSpecialistCare from '../assets/images/hero_specialist_care_1794876376787.jpg';
import facilityInterior from '../assets/images/clinic_facility_interior_1794668526783.jpg';
import consultationSuite from '../assets/images/consultation_care_suite_1794876380942.jpg';
import guideDiagnosticsPrep from '../assets/images/guide_diagnostics_prep_1794876381253.jpg';
import doctorGeneralPhysician from '../assets/images/doctor_cardiology_v2_1794876377868.jpg';
import doctorCardiology from '../assets/images/doctor_dermatology_v2_1794876378578.jpg';
import doctorOrthopedics from '../assets/images/doctor_orthopedics_v2_1794876378502.jpg';
import doctorPediatrics from '../assets/images/doctor_pediatrics_portrait_1794668527417.jpg';
import doctorNeurology from '../assets/images/doctor_neurologist_portrait_1794908326641.jpg';
import doctorGynecology from '../assets/images/doctor_gynecologist_portrait_1794908327157.jpg';

export const CLINIC_IMAGES: Record<string, string> = {
  hero_lobby: heroLobby,
  hero_specialist_care: heroSpecialistCare,
  facility_interior: facilityInterior,
  consultation_suite: consultationSuite,
  guide_diagnostics_prep: guideDiagnosticsPrep,
  doctor_general_physician: doctorGeneralPhysician,
  doctor_cardiology: doctorCardiology,
  doctor_orthopedics: doctorOrthopedics,
  doctor_pediatrics: doctorPediatrics,
  doctor_neurology: doctorNeurology,
  doctor_gynecology: doctorGynecology,
  doctor_dermatology: doctorCardiology,
};

export function resolveClinicImage(imageKey?: string): string {
  if (!imageKey) return doctorGeneralPhysician;
  if (imageKey.startsWith('/') || imageKey.startsWith('http') || imageKey.startsWith('data:')) {
    return imageKey;
  }
  return CLINIC_IMAGES[imageKey] || doctorGeneralPhysician;
}
