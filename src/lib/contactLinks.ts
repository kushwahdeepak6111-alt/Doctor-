import type { Language } from '../types/clinic';

const DEFAULT_CLINIC_PHONE = '+91 11 4280 5400';
const DEFAULT_CLINIC_ADDRESS = '14, Gulmohar Enclave Medical Arcade, New Delhi 110049';
const DEFAULT_CLINIC_EMAIL = 'care@arogyaclinic.in';

export function getPhoneCallHref(phone?: string): string {
  const raw = (phone || DEFAULT_CLINIC_PHONE).trim();
  const normalized = raw.replace(/[^\d+]/g, '');
  return `tel:${normalized || '+911142805400'}`;
}

export function getEmailHref(email?: string): string {
  const clean = (email || DEFAULT_CLINIC_EMAIL).trim();
  return `mailto:${clean}`;
}

export function getWhatsAppHref(phone?: string, language: Language = 'en', customText?: string): string {
  const raw = (phone || DEFAULT_CLINIC_PHONE).trim();
  const digits = raw.replace(/\D/g, '') || '911142805400';
  const text =
    customText ||
    (language === 'hi'
      ? 'नमस्ते आरोग्य क्लिनिक, मुझे अपॉइंटमेंट या परामर्श के बारे में जानकारी चाहिए।'
      : 'Hello Arogya Clinic, I would like to inquire about an appointment.');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function buildBookingWhatsAppHref(params: {
  clinicPhone?: string;
  language: Language;
  referenceCode: string;
  doctorName: string;
  speciality: string;
  date: string;
  timeSlot: string;
  fees: number;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reason: string;
}): string {
  const {
    clinicPhone,
    language,
    referenceCode,
    doctorName,
    speciality,
    date,
    timeSlot,
    fees,
    patientName,
    patientPhone,
    patientEmail,
    reason,
  } = params;

  const lines =
    language === 'hi'
      ? [
          'नमस्ते आरोग्य मल्टी-स्पेशलिटी क्लिनिक,',
          'नया अपॉइंटमेंट अनुरोध विवरण:',
          `• बुकिंग संदर्भ: ${referenceCode}`,
          `• चिकित्सक: ${doctorName} (${speciality})`,
          `• तिथि एवं समय: ${date} | ${timeSlot}`,
          `• परामर्श शुल्क: ₹${fees}`,
          `• रोगी का नाम: ${patientName}`,
          `• मोबाइल: ${patientPhone}`,
          `• ईमेल: ${patientEmail}`,
          `• कारण: ${reason}`,
        ]
      : [
          'Hello Arogya Multi-Specialty Clinic,',
          'New Appointment Booking Request:',
          `• Reference: ${referenceCode}`,
          `• Doctor: ${doctorName} (${speciality})`,
          `• Date & Time: ${date} | ${timeSlot}`,
          `• Consultation Fee: ₹${fees}`,
          `• Patient Name: ${patientName}`,
          `• Phone: ${patientPhone}`,
          `• Email: ${patientEmail}`,
          `• Visit Reason: ${reason}`,
        ];

  return getWhatsAppHref(clinicPhone, language, lines.join('\n'));
}

export function getGoogleMapsDirectionsUrl(address?: string, clinicName?: string): string {
  const query = [clinicName, address || DEFAULT_CLINIC_ADDRESS].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function getGoogleMapsEmbedUrl(address?: string, clinicName?: string): string {
  const query = [clinicName, address || DEFAULT_CLINIC_ADDRESS].filter(Boolean).join(', ');
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}
