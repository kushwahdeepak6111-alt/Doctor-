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

export function getWhatsAppHref(phone?: string, language: Language = 'en'): string {
  const raw = (phone || DEFAULT_CLINIC_PHONE).trim();
  const digits = raw.replace(/\D/g, '') || '911142805400';
  const text =
    language === 'hi'
      ? 'नमस्ते आरोग्य क्लिनिक, मुझे अपॉइंटमेंट या परामर्श के बारे में जानकारी चाहिए।'
      : 'Hello Arogya Clinic, I would like to inquire about an appointment.';
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function getGoogleMapsDirectionsUrl(address?: string, clinicName?: string): string {
  const query = [clinicName, address || DEFAULT_CLINIC_ADDRESS].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function getGoogleMapsEmbedUrl(address?: string, clinicName?: string): string {
  const query = [clinicName, address || DEFAULT_CLINIC_ADDRESS].filter(Boolean).join(', ');
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

