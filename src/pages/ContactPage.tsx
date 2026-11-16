import React, { useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useT } from '../i18n/translations';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ClinicLocationSection } from '../components/ClinicLocationSection';
import { getPhoneCallHref, getWhatsAppHref } from '../lib/contactLinks';

export function ContactPage() {
  const { language, settings, addToast } = useClinic();
  const t = useT(language);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || !message.trim()) {
      setError(
        language === 'hi'
          ? 'कृपया नाम, मान्य ईमेल और संदेश भरें।'
          : 'Please provide your name, a valid email address, and your message.'
      );
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      setSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      addToast(t.contactSection.success, 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white">
      <section className="bg-[#F4F8FC] border-b border-[#E2EAF2]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-3">
          <p className="text-xs font-semibold text-[#1C7ED6]">{t.contactSection.eyebrow}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0B2D52]">
            {t.contactSection.title}
          </h1>
          <p className="text-[15px] text-[#5C6F84] max-w-2xl">{t.contactSection.subtitle}</p>
        </div>
      </section>

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Clinic Info */}
          <div className="lg:col-span-5 space-y-6">
            {settings && (
              <div className="border border-[#E2EAF2] rounded-2xl p-6 bg-[#F4F8FC] space-y-5">
                <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                  {language === 'hi' ? settings.clinicNameHi : settings.clinicName}
                </h2>
                <div className="space-y-4 text-sm text-[#10233B]">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#1C7ED6] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{language === 'hi' ? settings.addressHi : settings.address}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#1C7ED6] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{language === 'hi' ? settings.hoursHi : settings.hours}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[#1C7ED6] shrink-0" aria-hidden="true" />
                    <a href={`tel:${settings.phone}`} className="font-mono font-medium tabular-nums hover:text-[#1C7ED6]">
                      {settings.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#1C7ED6] shrink-0" aria-hidden="true" />
                    <a href={`mailto:${settings.email}`} className="hover:text-[#1C7ED6]">
                      {settings.email}
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <a
                    href={getPhoneCallHref(settings.phone)}
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-xl transition-colors"
                  >
                    <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{language === 'hi' ? 'क्लिनिक को कॉल करें' : 'Call Clinic'}</span>
                  </a>
                  <a
                    href={getWhatsAppHref(settings.phone, language)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#128C7E] hover:bg-[#0F766A] rounded-xl transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    <span>{language === 'hi' ? 'व्हाट्सएप चैट' : 'Chat on WhatsApp'}</span>
                  </a>
                </div>
                <p className="text-xs text-[#5C6F84] pt-4 border-t border-[#E2EAF2] leading-relaxed">
                  {language === 'hi' ? settings.emergencyNoticeHi : settings.emergencyNotice}
                </p>
              </div>
            )}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="border border-[#E2EAF2] rounded-2xl p-6 sm:p-8 bg-white space-y-5"
            >
              <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                {t.contactSection.formTitle}
              </h2>

              {sent && (
                <div className="flex items-center gap-2.5 rounded-xl border border-[#C5DDF8] bg-[#EAF3FC] px-4 py-3 text-sm text-[#0B2D52]">
                  <CheckCircle2 className="w-4 h-4 text-[#1C7ED6] shrink-0" aria-hidden="true" />
                  <span>{t.contactSection.success}</span>
                </div>
              )}

              {error && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="c-name" className="block text-xs font-semibold text-[#0B2D52]">
                    {t.contactSection.name} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="c-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-[#E2EAF2] rounded-xl focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="c-email" className="block text-xs font-semibold text-[#0B2D52]">
                    {t.contactSection.email} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-[#E2EAF2] rounded-xl focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="c-phone" className="block text-xs font-semibold text-[#0B2D52]">
                    {t.contactSection.phone}
                  </label>
                  <input
                    id="c-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-[#E2EAF2] rounded-xl tabular-nums focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="c-subject" className="block text-xs font-semibold text-[#0B2D52]">
                    {t.contactSection.subject}
                  </label>
                  <input
                    id="c-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-[#E2EAF2] rounded-xl focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="c-msg" className="block text-xs font-semibold text-[#0B2D52]">
                    {t.contactSection.message} <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="c-msg"
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#E2EAF2] rounded-xl focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="min-h-[46px] px-6 py-3 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] disabled:opacity-60 rounded-xl transition-colors"
              >
                {sending ? t.contactSection.sending : t.contactSection.send}
              </button>
            </form>
          </div>
        </div>

        {/* Dedicated Clinic Location, Google Maps & Directions Section */}
        <ClinicLocationSection />
      </section>
    </div>
  );
}
