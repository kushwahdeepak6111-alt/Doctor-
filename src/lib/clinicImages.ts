import heroLobby from '../assets/images/hero_clinic_lobby_1794668527153.jpg';
import facilityInterior from '../assets/images/clinic_facility_interior_1794668526783.jpg';
import doctorCardiology from '../assets/images/doctor_cardiology_portrait_1794668527039.jpg';
import doctorPediatrics from '../assets/images/doctor_pediatrics_portrait_1794668527417.jpg';
import doctorOrthopedics from '../assets/images/doctor_orthopedics_portrait_1794668527506.jpg';
import doctorDermatology from '../assets/images/doctor_dermatology_portrait_1794668528963.jpg';

export const CLINIC_IMAGES: Record<string, string> = {
  hero_lobby: heroLobby,
  facility_interior: facilityInterior,
  doctor_cardiology: doctorCardiology,
  doctor_pediatrics: doctorPediatrics,
  doctor_orthopedics: doctorOrthopedics,
  doctor_dermatology: doctorDermatology,
};

export function resolveClinicImage(imageKey?: string): string {
  if (!imageKey) return doctorCardiology;
  return CLINIC_IMAGES[imageKey] || doctorCardiology;
}
