import React from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useT } from '../i18n/translations';
import { ClinicLogo } from './ClinicLogo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { WhatsAppIcon } from './WhatsAppIcon';
import { getPhoneCallHref, getWhatsAppHref } from '../lib/contactLinks';
import { prefetchRoute } from '../lib/routePrefetch';

export function Footer() {
  const { language, navigate, specializations, settings } = useClinic();
  const t = useT(language);

  return (
    <footer className="bg-[#071A30] text-white border-t border-[#0E2F54]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-3">
            <ClinicLogo label={t.brandShort} inverted />
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              {t.footer.tagline}
            </p>
            {settings && (
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm pt-2.5 border-t border-white/10">
                {language === 'hi' ? settings.emergencyNoticeHi : settings.emergencyNotice}
              </p>
            )}
          </div>

          {/* Quick Links & Departments side-by-side on mobile/tablet to keep footer compact */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-2.5">
              <h2 className="font-display text-sm font-semibold text-white">
                {t.footer.quickLinks}
              </h2>
              <ul className="space-y-1.5 text-sm text-slate-300">
                {[
                  { path: '/', label: t.nav.home },
                  { path: '/specializations', label: t.nav.specializations },
                  { path: '/doctors', label: t.nav.doctors },
                  { path: '/about', label: t.nav.about },
                  { path: '/faq', label: t.nav.faq },
                  { path: '/contact', label: t.nav.contact },
                  { path: '/admin', label: language === 'hi' ? 'एडमिन पैनल' : 'Admin Panel' },
                ].map((link) => (
                  <li key={link.path}>
                    <button
                      type="button"
                      onClick={() => navigate(link.path)}
                      onMouseEnter={() => prefetchRoute(link.path)}
                      onFocus={() => prefetchRoute(link.path)}
                      onTouchStart={() => prefetchRoute(link.path)}
                      className="py-1 text-left hover:text-white transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5">
              <h2 className="font-display text-sm font-semibold text-white">
                {t.footer.departments}
              </h2>
              <ul className="space-y-1.5 text-sm text-slate-300">
                {specializations.map((spec) => (
                  <li key={spec.id}>
                    <button
                      type="button"
                      onClick={() => navigate('/specializations')}
                      onMouseEnter={() => prefetchRoute('/specializations')}
                      onFocus={() => prefetchRoute('/specializations')}
                      onTouchStart={() => prefetchRoute('/specializations')}
                      className="py-1 text-left hover:text-white transition-colors"
                    >
                      {language === 'hi' ? spec.nameHi : spec.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-3 space-y-2.5">
            <h2 className="font-display text-sm font-semibold text-white">
              {t.footer.visitUs}
            </h2>
            {settings && (
              <div className="space-y-2.5 text-sm text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                  <a
                    href={`tel:${settings.phone}`}
                    className="hover:text-white tabular-nums transition-colors"
                  >
                    {settings.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                  <a
                    href={`mailto:${settings.email}`}
                    className="hover:text-white break-all transition-colors"
                  >
                    {settings.email}
                  </a>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-snug">
                    {language === 'hi' ? settings.addressHi : settings.address}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-snug">
                    {language === 'hi' ? settings.hoursHi : settings.hours}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href={getPhoneCallHref(settings.phone)}
                    className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{language === 'hi' ? 'कॉल करें' : 'Call Now'}</span>
                  </a>
                  <a
                    href={getWhatsAppHref(settings.phone, language)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#0F766A] rounded-xl transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    <span>{language === 'hi' ? 'व्हाट्सएप' : 'WhatsApp'}</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {t.footer.rights}</p>
          <div className="flex flex-wrap items-center gap-4">
            <ThemeSwitcher variant="labeled" />
            <p>
              {language === 'hi'
                ? 'द्विभाषी रोगी पोर्टल · अंग्रेज़ी एवं हिन्दी'
                : 'Bilingual Patient Portal · English & Hindi'}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
