import React, { useEffect, useState } from 'react';
import { CalendarCheck2, Globe, Menu, Phone, User, X } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useT } from '../i18n/translations';
import { ClinicLogo } from './ClinicLogo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { WhatsAppIcon } from './WhatsAppIcon';
import { getPhoneCallHref, getWhatsAppHref } from '../lib/contactLinks';

export function Navbar() {
  const { language, setLanguage, route, navigate, user, specializations, setBookingDraft, settings } =
    useClinic();
  const t = useT(language);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/', label: t.nav.home },
    { path: '/specializations', label: t.nav.specializations },
    { path: '/doctors', label: t.nav.doctors },
    { path: '/about', label: t.nav.about },
    { path: '/faq', label: t.nav.faq },
    { path: '/contact', label: t.nav.contact },
  ];

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const handleNav = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const handleDepartmentNav = (specId: string) => {
    setMobileOpen(false);
    setBookingDraft((prev) => ({
      ...prev,
      specializationId: specId,
      doctorId: '',
      timeSlot: '',
      step: 2,
    }));
    navigate('/specializations');
  };

  const isActive = (path: string) => {
    if (path === '/') return route === '/';
    return route === path || route.startsWith(`${path}/`);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#082240]/95 backdrop-blur-md border-b border-white/10 text-white">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 lg:gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('/')}
          className="text-left focus-visible:outline-2 focus-visible:outline-[#60A5FA] rounded-lg py-1 shrink-0"
          aria-label={t.brandShort}
        >
          <ClinicLogo label={t.brandShort} inverted />
        </button>

        {/* Zone 2: Primary Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-4 xl:gap-6">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNav(item.path)}
                aria-current={active ? 'page' : undefined}
                className={`relative py-2 text-[14px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                  active ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 bottom-0 h-[2px] rounded-full transition-opacity ${
                    active ? 'bg-[#38BDF8] opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme, Language, Account, Primary Booking CTA */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <ThemeSwitcher variant="compact" />
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-full border border-white/15 whitespace-nowrap shrink-0 transition-colors"
            aria-label={language === 'en' ? 'Switch language to Hindi' : 'Switch language to English'}
          >
            <Globe className="w-3.5 h-3.5 text-[#60A5FA]" aria-hidden="true" />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleNav(user ? '/portal' : '/login')}
            className={`min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium rounded-full whitespace-nowrap shrink-0 transition-colors ${
              isActive('/portal') || isActive('/login')
                ? 'bg-white/15 text-white border border-white/25'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <User className="w-4 h-4 text-[#60A5FA]" aria-hidden="true" />
            <span>{user ? t.nav.portal : t.nav.login}</span>
          </button>

          <button
            type="button"
            onClick={() => handleNav('/book')}
            className="min-h-[40px] px-5 py-2 text-[13px] font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-full whitespace-nowrap shrink-0 transition-colors"
          >
            {t.nav.book}
          </button>
        </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="inline-flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-2.5 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 rounded-xl whitespace-nowrap transition-colors"
            aria-label={language === 'en' ? 'Switch language to Hindi' : 'Switch language to English'}
          >
            <Globe className="w-3.5 h-3.5 text-[#60A5FA]" aria-hidden="true" />
            <span>{language === 'en' ? 'हिं' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dark Navy Drawer */}
      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          className="lg:hidden border-t border-white/10 bg-[#071A30] text-white max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl"
        >
          <div className="px-4 py-4 space-y-5">
            {/* Drawer Header with explicit close label */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {t.footer.quickLinks}
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="min-h-[36px] inline-flex items-center gap-1 px-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>{language === 'hi' ? 'बंद करें' : 'Close'}</span>
              </button>
            </div>

            {/* Primary Links */}
            <nav aria-label="Mobile clinic navigation" className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNav(item.path)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full min-h-[44px] text-left px-3.5 py-2.5 rounded-xl text-[15px] font-medium flex items-center justify-between transition-colors ${
                      active
                        ? 'bg-[#1C7ED6]/25 text-white border border-[#38BDF8]/40 font-semibold'
                        : 'text-slate-200 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-[#38BDF8]" aria-hidden="true" />}
                  </button>
                );
              })}
            </nav>

            {/* Grouped Departments */}
            {specializations.length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t.footer.departments}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {specializations.map((spec) => (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => handleDepartmentNav(spec.id)}
                      className="min-h-[40px] px-3 py-2 text-left text-xs font-medium text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg truncate transition-colors"
                    >
                      {language === 'hi' ? spec.nameHi : spec.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prominent Actions */}
            <div className="pt-3 border-t border-white/10 grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => handleNav(user ? '/portal' : '/login')}
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-colors"
              >
                <User className="w-4 h-4 text-[#60A5FA]" aria-hidden="true" />
                <span>{user ? t.nav.portal : t.nav.login}</span>
              </button>
              <button
                type="button"
                onClick={() => handleNav('/book')}
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
              >
                <CalendarCheck2 className="w-4 h-4" aria-hidden="true" />
                <span>{t.nav.book}</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <a
                  href={getPhoneCallHref(settings?.phone)}
                  onClick={() => setMobileOpen(false)}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
                  <span>{language === 'hi' ? 'कॉल करें' : 'Call Clinic'}</span>
                </a>
                <a
                  href={getWhatsAppHref(settings?.phone, language)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#0F766A] rounded-xl transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>{language === 'hi' ? 'व्हाट्सएप' : 'WhatsApp'}</span>
                </a>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                <span className="text-xs font-medium text-slate-300">
                  {language === 'hi' ? 'थीम' : 'Theme'}
                </span>
                <ThemeSwitcher variant="labeled" />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
