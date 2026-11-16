import React from 'react';
import { Phone } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { getPhoneCallHref, getWhatsAppHref } from '../lib/contactLinks';
import { WhatsAppIcon } from './WhatsAppIcon';

export function FloatingContactButtons() {
  const { language, settings, route } = useClinic();

  // Keep staff/doctor/admin/patient portals clutter-free
  if (route === '/portal' || route === '/login') {
    return null;
  }

  const phoneHref = getPhoneCallHref(settings?.phone);
  const whatsappHref = getWhatsAppHref(settings?.phone, language);

  return (
    <div
      aria-label={language === 'hi' ? 'त्वरित संपर्क विकल्प' : 'Quick clinic contact actions'}
      className="no-print fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex flex-col items-end gap-2.5"
    >
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={language === 'hi' ? 'व्हाट्सएप पर संदेश भेजें' : 'Chat on WhatsApp'}
        className="min-h-[48px] inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-[#128C7E] hover:bg-[#0F766A] text-white shadow-lg border border-white/20 transition-all text-xs font-semibold"
      >
        <WhatsAppIcon className="w-5 h-5 shrink-0" />
        <span className="hidden sm:inline">
          {language === 'hi' ? 'व्हाट्सएप' : 'WhatsApp'}
        </span>
      </a>

      <a
        href={phoneHref}
        aria-label={
          language === 'hi'
            ? `क्लिनिक को कॉल करें (${settings?.phone || '+91 11 4280 5400'})`
            : `Call clinic (${settings?.phone || '+91 11 4280 5400'})`
        }
        className="min-h-[48px] inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-[#0B2D52] hover:bg-[#071A30] text-white shadow-lg border border-white/20 transition-all text-xs font-semibold"
      >
        <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">
          {language === 'hi' ? 'कॉल करें' : 'Call Clinic'}
        </span>
      </a>
    </div>
  );
}
