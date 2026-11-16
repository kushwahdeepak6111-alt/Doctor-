import React, { useState } from 'react';
import { Clock, ExternalLink, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import {
  getEmailHref,
  getGoogleMapsDirectionsUrl,
  getGoogleMapsEmbedUrl,
  getPhoneCallHref,
  getWhatsAppHref,
} from '../lib/contactLinks';
import { WhatsAppIcon } from './WhatsAppIcon';

interface ClinicLocationSectionProps {
  compact?: boolean;
}

export function ClinicLocationSection({ compact = false }: ClinicLocationSectionProps) {
  const { language, settings } = useClinic();
  const isHi = language === 'hi';
  const [showMapPreview, setShowMapPreview] = useState(!compact);

  const clinicName = isHi
    ? settings?.clinicNameHi || 'आरोग्य मल्टी-स्पेशलिटी क्लिनिक'
    : settings?.clinicName || 'Arogya Multi-Specialty Clinic';
  const clinicAddress = isHi
    ? settings?.addressHi || '14, गुलमोहर एन्क्लेव मेडिकल आर्केड, नई दिल्ली 110049'
    : settings?.address || '14, Gulmohar Enclave Medical Arcade, New Delhi 110049';
  const clinicAddressRaw =
    settings?.address || '14, Gulmohar Enclave Medical Arcade, New Delhi 110049';
  const clinicPhone = settings?.phone || '+91 11 4280 5400';
  const clinicEmail = settings?.email || 'care@arogyaclinic.in';
  const clinicHours = isHi
    ? settings?.hoursHi || 'सोमवार – शनिवार, सुबह 08:30 – रात 08:00 बजे'
    : settings?.hours || 'Monday – Saturday, 08:30 AM – 08:00 PM';

  const mapsUrl = getGoogleMapsDirectionsUrl(clinicAddressRaw, settings?.clinicName);
  const mapEmbedUrl = getGoogleMapsEmbedUrl(clinicAddressRaw, settings?.clinicName);

  return (
    <div className="rounded-xl border border-[#E2EAF2] bg-white overflow-hidden shadow-xs">
      <div className={`grid grid-cols-1 ${compact ? 'lg:grid-cols-12' : 'lg:grid-cols-12'}`}>
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#1C7ED6]">
              <MapPin className="w-3.5 h-3.5" />
              {isHi ? 'क्लिनिक लोकेशन और दिशा-निर्देश' : 'Clinic Location & Directions'}
            </span>
            <h3 className="mt-2 font-display text-xl sm:text-2xl font-semibold text-[#0B2D52]">
              {clinicName}
            </h3>

            <div className="mt-5 space-y-3.5 text-sm text-[#10233B]">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#1C7ED6] shrink-0 mt-1" />
                <div>
                  <span className="block text-xs font-medium text-[#5C6F84]">
                    {isHi ? 'पता' : 'Verified Clinic Address'}
                  </span>
                  <span>{clinicAddress}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#1C7ED6] shrink-0 mt-1" />
                <div>
                  <span className="block text-xs font-medium text-[#5C6F84]">
                    {isHi ? 'क्लिनिक समय' : 'Operating Hours'}
                  </span>
                  <span>{clinicHours}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#1C7ED6] shrink-0 mt-1" />
                <div>
                  <span className="block text-xs font-medium text-[#5C6F84]">
                    {isHi ? 'फ़ोन सहायता' : 'Phone Desk'}
                  </span>
                  <span className="tabular-nums font-medium">{clinicPhone}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#1C7ED6] shrink-0 mt-1" />
                <div>
                  <span className="block text-xs font-medium text-[#5C6F84]">
                    {isHi ? 'ईमेल' : 'Email'}
                  </span>
                  <span>{clinicEmail}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#E2EAF2] flex flex-wrap gap-2.5">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0B2D52] px-4 py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-[#10233B] transition-colors"
            >
              <Navigation className="w-4 h-4" />
              <span>{isHi ? 'Google Maps दिशा देखें' : 'Get Directions'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <a
              href={getPhoneCallHref(clinicPhone)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#0B2D52] hover:bg-[#F4F8FC] transition-colors"
            >
              <Phone className="w-4 h-4 text-[#1C7ED6]" />
              <span>{isHi ? 'कॉल करें' : 'Call Clinic'}</span>
            </a>

            <a
              href={getEmailHref(clinicEmail)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#0B2D52] hover:bg-[#F4F8FC] transition-colors"
            >
              <Mail className="w-4 h-4 text-[#1C7ED6]" />
              <span>{isHi ? 'ईमेल करें' : 'Email'}</span>
            </a>

            <a
              href={getWhatsAppHref(clinicPhone, language)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-emerald-900 hover:bg-emerald-100 transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4 text-emerald-700" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-[#E2EAF2] bg-[#F4F8FC] min-h-[260px] flex flex-col">
          {showMapPreview ? (
            <div className="relative flex-1 min-h-[260px] flex flex-col">
              <iframe
                title={isHi ? 'आरोग्य क्लिनिक मानचित्र' : 'Arogya Clinic Google Map Location'}
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full flex-1 min-h-[260px] border-0"
              />
              <div className="bg-white/95 border-t border-[#E2EAF2] px-4 py-2 text-[11px] text-[#5C6F84] flex items-center justify-between gap-2">
                <span>
                  {isHi
                    ? 'गूगल मैप्स में लाइव दिशा देखने के लिए "Google Maps दिशा देखें" पर क्लिक करें।'
                    : 'Click "Get Directions" to open turn-by-turn navigation in Google Maps.'}
                </span>
                {compact && (
                  <button
                    type="button"
                    onClick={() => setShowMapPreview(false)}
                    className="text-[#1C7ED6] font-medium hover:underline cursor-pointer shrink-0"
                  >
                    {isHi ? 'छुपाएँ' : 'Hide map'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MapPin className="w-8 h-8 text-[#1C7ED6] mb-3" />
              <p className="text-sm font-semibold text-[#0B2D52]">{clinicAddress}</p>
              <p className="mt-1 text-xs text-[#5C6F84] max-w-sm">
                {isHi
                  ? 'मानचित्र पूर्वावलोकन देखें या सीधे Google Maps पर रास्ता खोलें।'
                  : 'Preview the interactive clinic location map or open Google Maps directly.'}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowMapPreview(true)}
                  className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-medium text-[#0B2D52] hover:bg-slate-50 cursor-pointer"
                >
                  {isHi ? 'मैप प्रीव्यू लोड करें' : 'Load Map Preview'}
                </button>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1C7ED6] px-4 py-2 text-xs font-medium text-white hover:bg-[#1868B2]"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isHi ? 'Google Maps खोलें' : 'Open in Google Maps'}</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
