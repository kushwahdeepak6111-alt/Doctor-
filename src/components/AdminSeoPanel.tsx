import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  FileCode2,
  Globe,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { apiFetch } from '../lib/authFetch';
import { buildRouteSeoMeta, DEFAULT_SEO_SETTINGS } from '../lib/seo';
import type { ClinicSettings, Doctor, SeoSettings, Specialization } from '../types/clinic';

interface SitemapEntry {
  path: string;
  url: string;
  priority: string;
  changefreq: string;
  lastmod: string;
  label: string;
}

interface SeoAuditPayload {
  origin: string;
  sitemapUrl: string;
  robotsUrl: string;
  allowIndexing: boolean;
  indexedRoutes: SitemapEntry[];
  excludedRoutes: string[];
  activeDoctorCount: number;
  activeSpecializationCount: number;
  approvedFeedbackCount: number;
  schemas: string[];
}

interface AdminSeoPanelProps {
  settingsForm: ClinicSettings | null;
  setSettingsForm: React.Dispatch<React.SetStateAction<ClinicSettings | null>>;
  doctors: Doctor[];
  specializations: Specialization[];
}

export function AdminSeoPanel({
  settingsForm,
  setSettingsForm,
  doctors,
  specializations,
}: AdminSeoPanelProps) {
  const { language, reviewSummary, refreshBootstrap, addToast } = useClinic();
  const isHi = language === 'hi';

  const [audit, setAudit] = useState<SeoAuditPayload | null>(null);
  const [auditLoading, setAuditLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewRoute, setPreviewRoute] = useState<string>('/');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showSchemaCode, setShowSchemaCode] = useState(false);

  const seo: SeoSettings = useMemo(
    () => ({
      ...DEFAULT_SEO_SETTINGS,
      ...(settingsForm?.seo || {}),
    }),
    [settingsForm]
  );

  const updateSeoField = <K extends keyof SeoSettings>(key: K, value: SeoSettings[K]) => {
    setSettingsForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        seo: {
          ...DEFAULT_SEO_SETTINGS,
          ...(prev.seo || {}),
          [key]: value,
        },
      };
    });
  };

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await apiFetch('/api/admin/seo-audit', { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as SeoAuditPayload;
        setAudit(data);
      }
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const previewOrigin =
    audit?.origin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://arogyaclinic.in');

  const routeOptions = useMemo(() => {
    const base = [
      { value: '/', label: isHi ? 'मुख्य पृष्ठ (/)' : 'Homepage (/)' },
      { value: '/specializations', label: isHi ? 'विभाग (/specializations)' : 'Departments (/specializations)' },
      { value: '/doctors', label: isHi ? 'चिकित्सक खोज (/doctors)' : 'Doctor Search (/doctors)' },
      { value: '/book', label: isHi ? 'ऑनलाइन बुकिंग (/book)' : 'Appointment Booking (/book)' },
      { value: '/faq', label: isHi ? 'सामान्य प्रश्न (/faq)' : 'Patient FAQs (/faq)' },
      { value: '/about', label: isHi ? 'हमारे बारे में (/about)' : 'About Clinic (/about)' },
      { value: '/contact', label: isHi ? 'संपर्क एवं मैप (/contact)' : 'Contact & Map (/contact)' },
      { value: '/portal', label: isHi ? 'रोगी पोर्टल (noindex)' : 'Patient Portal (noindex)' },
    ];
    const docOpts = doctors
      .filter((d) => d.active)
      .map((d) => ({
        value: `/doctors/${d.slug}`,
        label: `${d.name} (/doctors/${d.slug})`,
      }));
    return [...base, ...docOpts];
  }, [doctors, isHi]);

  const livePreview = useMemo(() => {
    const previewSettings: ClinicSettings | null = settingsForm
      ? { ...settingsForm, seo }
      : null;
    return buildRouteSeoMeta({
      route: previewRoute,
      origin: previewOrigin,
      language,
      settings: previewSettings,
      doctors,
      specializations,
      reviewSummary,
    });
  }, [previewRoute, previewOrigin, language, settingsForm, seo, doctors, specializations, reviewSummary]);

  const titleLen = seo.siteTitle.trim().length;
  const descLen = seo.defaultDescription.trim().length;

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ seo }),
      });
      if (!res.ok) {
        addToast(isHi ? 'SEO सेटिंग्स सहेजी नहीं जा सकीं।' : 'Unable to save SEO settings.', 'error');
        return;
      }
      await refreshBootstrap();
      await loadAudit();
      addToast(
        isHi
          ? 'SEO मेटाडेटा और सर्च इंजन सेटिंग्स अपडेट हो गई हैं।'
          : 'SEO metadata and search engine settings saved.',
        'success'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`${label} ${isHi ? 'कॉपी किया गया।' : 'copied to clipboard.'}`, 'info');
    } catch {
      addToast(isHi ? 'कॉपी करने में समस्या हुई।' : 'Could not copy to clipboard.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI / Readiness Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2EAF2] rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-[#5C6F84]">
            {isHi ? 'इंडेक्सिंग स्थिति' : 'Search Indexing'}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-bold ${
                seo.allowIndexing ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              {seo.allowIndexing
                ? isHi
                  ? 'सक्रिय (Index)'
                  : 'Enabled (Index)'
                : isHi
                  ? 'रोका गया (NoIndex)'
                  : 'Paused (NoIndex)'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E2EAF2] rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-[#5C6F84]">
            {isHi ? 'साइटमैप URL' : 'Sitemap URLs'}
          </div>
          <div className="font-mono text-2xl font-bold text-[#0B2D52] tabular-nums mt-1">
            {audit?.indexedRoutes.length ?? '—'}
          </div>
        </div>

        <div className="bg-white border border-[#E2EAF2] rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-[#5C6F84]">
            {isHi ? 'चिकित्सक प्रोफ़ाइल' : 'Doctor Profiles'}
          </div>
          <div className="font-mono text-2xl font-bold text-[#0B2D52] tabular-nums mt-1">
            {audit?.activeDoctorCount ?? doctors.filter((d) => d.active).length}
          </div>
        </div>

        <div className="bg-white border border-[#E2EAF2] rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-[#5C6F84]">
            {isHi ? 'सत्यापित रेटिंग स्निपेट' : 'Rich Review Snippets'}
          </div>
          <div className="font-mono text-2xl font-bold text-[#0B2D52] tabular-nums mt-1">
            {audit?.approvedFeedbackCount ?? reviewSummary?.count ?? 0}
          </div>
        </div>
      </div>

      {/* Live Google Search Snippet Preview */}
      <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0B2D52] flex items-center gap-2">
              <Search className="w-5 h-5 text-[#1C7ED6]" aria-hidden="true" />
              <span>
                {isHi
                  ? 'गूगल सर्च स्निपेट एवं स्ट्रक्चर्ड डेटा प्रीव्यू'
                  : 'Google Search Snippet & Schema Preview'}
              </span>
            </h2>
            <p className="text-xs text-[#5C6F84] mt-0.5">
              {isHi
                ? 'प्रत्येक क्लिनिक पेज का लाइव शीर्षक, विवरण, कैनोनिकल URL और JSON-LD जांचें।'
                : 'Inspect live page title, meta description, canonical URL, and Schema.org rich results per route.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label={isHi ? 'प्रीव्यू मार्ग चुनें' : 'Select route to preview'}
              value={previewRoute}
              onChange={(e) => setPreviewRoute(e.target.value)}
              className="min-h-[38px] px-3 py-1.5 text-xs font-medium bg-[#F8FBFF] border border-[#E2EAF2] rounded-xl text-[#0B2D52]"
            >
              {routeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="inline-flex rounded-xl border border-[#E2EAF2] bg-[#F8FBFF] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  previewDevice === 'desktop'
                    ? 'bg-[#0B2D52] text-white'
                    : 'text-[#5C6F84] hover:text-[#0B2D52]'
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  previewDevice === 'mobile'
                    ? 'bg-[#0B2D52] text-white'
                    : 'text-[#5C6F84] hover:text-[#0B2D52]'
                }`}
              >
                Mobile
              </button>
            </div>
          </div>
        </div>

        {/* Simulated Search Result Card */}
        <div
          className={`rounded-2xl border border-[#E2EAF2] bg-[#F8FBFF] p-5 ${
            previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-full bg-[#0B2D52] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                A
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#10233B] truncate">
                  {livePreview.siteName}
                </p>
                <p className="text-[11px] text-[#5C6F84] font-mono truncate">
                  {livePreview.canonicalUrl}
                </p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-mono font-semibold ${
                livePreview.robots === 'index, follow'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {livePreview.robots}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-[#1a0dab] leading-snug hover:underline">
            {livePreview.title}
          </h3>

          <p className="mt-1.5 text-sm text-[#4d5156] leading-relaxed">
            {livePreview.description}
          </p>

          {reviewSummary && reviewSummary.count > 0 && livePreview.robots === 'index, follow' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-[#5C6F84]">
              <span className="text-amber-500 font-semibold">
                ★★★★★ {reviewSummary.averageRating.toFixed(1)}
              </span>
              <span>·</span>
              <span>
                {reviewSummary.count} {isHi ? 'सत्यापित रोगी समीक्षाएं' : 'verified patient reviews'}
              </span>
            </div>
          )}
        </div>

        {/* Toggle JSON-LD Viewer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C6F84]">
            <Sparkles className="w-3.5 h-3.5 text-[#1C7ED6]" aria-hidden="true" />
            <span>
              {isHi ? 'सक्रिय Schema.org ग्राफ:' : 'Active Schema.org Graphs:'}{' '}
              <strong className="text-[#0B2D52]">
                {audit?.schemas.join(' · ') || 'MedicalClinic · WebSite · Physician · FAQPage · BreadcrumbList'}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {livePreview.jsonLd && (
              <button
                type="button"
                onClick={() =>
                  void handleCopyText(JSON.stringify(livePreview.jsonLd, null, 2), 'JSON-LD Schema')
                }
                className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#EAF3FC] border border-[#E2EAF2] rounded-lg"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isHi ? 'JSON-LD कॉपी करें' : 'Copy JSON-LD'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSchemaCode((prev) => !prev)}
              className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#1C7ED6] bg-[#F4F8FC] hover:bg-[#EAF3FC] border border-[#E2EAF2] rounded-lg"
            >
              <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {showSchemaCode
                  ? isHi
                    ? 'कोड छिपाएं'
                    : 'Hide Schema JSON'
                  : isHi
                    ? 'JSON-LD देखें'
                    : 'Inspect JSON-LD'}
              </span>
            </button>
          </div>
        </div>

        {showSchemaCode && (
          <pre className="p-4 rounded-xl bg-[#071A30] text-slate-100 text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
            {livePreview.jsonLd
              ? JSON.stringify(livePreview.jsonLd, null, 2)
              : '// Private portal routes omit public Schema.org structured data and emit noindex, nofollow.'}
          </pre>
        )}
      </div>

      {/* SEO Configuration Form */}
      {settingsForm && (
        <form
          onSubmit={handleSaveSeo}
          className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-[#0B2D52] flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#1C7ED6]" aria-hidden="true" />
                <span>
                  {isHi
                    ? 'सर्च इंजन मेटाडेटा एवं वेरिफिकेशन सेटिंग्स'
                    : 'Search Engine Metadata & Verification'}
                </span>
              </h2>
              <p className="text-xs text-[#5C6F84] mt-0.5">
                {isHi
                  ? 'शीर्षक, मेटा विवरण, कीवर्ड, सोशल शेयर इमेज और सर्च कंसोल कोड प्रबंधित करें।'
                  : 'Configure default titles, meta descriptions, keywords, social cards, and search console verification.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="seo-title" className="text-xs font-semibold text-[#0B2D52]">
                  {isHi ? 'मुख्य पृष्ठ SEO शीर्षक' : 'Homepage SEO Title'}
                </label>
                <span
                  className={`text-[11px] font-mono tabular-nums ${
                    titleLen >= 30 && titleLen <= 65 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {titleLen} chars (30–60 optimal)
                </span>
              </div>
              <input
                id="seo-title"
                type="text"
                value={seo.siteTitle}
                onChange={(e) => updateSeoField('siteTitle', e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 text-sm border border-[#E2EAF2] rounded-xl text-[#10233B]"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="seo-desc" className="text-xs font-semibold text-[#0B2D52]">
                  {isHi ? 'डिफ़ॉल्ट मेटा विवरण' : 'Default Meta Description'}
                </label>
                <span
                  className={`text-[11px] font-mono tabular-nums ${
                    descLen >= 110 && descLen <= 165 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {descLen} chars (120–160 optimal)
                </span>
              </div>
              <textarea
                id="seo-desc"
                rows={3}
                value={seo.defaultDescription}
                onChange={(e) => updateSeoField('defaultDescription', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-[#E2EAF2] rounded-xl text-[#10233B]"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="seo-keywords" className="text-xs font-semibold text-[#0B2D52]">
                {isHi ? 'लक्षित मेडिकल कीवर्ड (कॉमा से अलग)' : 'Target Search Keywords (comma-separated)'}
              </label>
              <input
                id="seo-keywords"
                type="text"
                value={seo.keywords}
                onChange={(e) => updateSeoField('keywords', e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 text-sm border border-[#E2EAF2] rounded-xl text-[#10233B]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="seo-og-image" className="text-xs font-semibold text-[#0B2D52]">
                {isHi ? 'सोशल शेयर इमेज (og:image)' : 'OpenGraph Social Share Image URL'}
              </label>
              <input
                id="seo-og-image"
                type="text"
                value={seo.ogImageUrl}
                onChange={(e) => updateSeoField('ogImageUrl', e.target.value)}
                placeholder="/og-clinic.jpg"
                className="w-full min-h-[42px] px-3.5 py-2 text-sm font-mono border border-[#E2EAF2] rounded-xl text-[#10233B]"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#0B2D52] block">
                {isHi ? 'सर्च इंजन क्रॉलिंग नीति' : 'Search Engine Crawling Policy'}
              </span>
              <label className="min-h-[42px] px-3.5 py-2 border border-[#E2EAF2] rounded-xl bg-[#F8FBFF] flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-xs font-medium text-[#10233B]">
                  {isHi
                    ? 'सार्वजनिक क्लिनिक पेजों को गूगल इंडेक्स में शामिल करें'
                    : 'Allow search engines to index public clinic pages'}
                </span>
                <input
                  type="checkbox"
                  checked={seo.allowIndexing}
                  onChange={(e) => updateSeoField('allowIndexing', e.target.checked)}
                  className="w-4 h-4 accent-[#1C7ED6]"
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="seo-google-verify" className="text-xs font-semibold text-[#0B2D52]">
                Google Search Console Verification Code
              </label>
              <input
                id="seo-google-verify"
                type="text"
                value={seo.googleVerificationCode}
                onChange={(e) => updateSeoField('googleVerificationCode', e.target.value)}
                placeholder="e.g. google-site-verification token"
                className="w-full min-h-[42px] px-3.5 py-2 text-sm font-mono border border-[#E2EAF2] rounded-xl text-[#10233B]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="seo-bing-verify" className="text-xs font-semibold text-[#0B2D52]">
                Bing Webmaster Verification Code
              </label>
              <input
                id="seo-bing-verify"
                type="text"
                value={seo.bingVerificationCode}
                onChange={(e) => updateSeoField('bingVerificationCode', e.target.value)}
                placeholder="e.g. msvalidate.01 token"
                className="w-full min-h-[42px] px-3.5 py-2 text-sm font-mono border border-[#E2EAF2] rounded-xl text-[#10233B]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-[#5C6F84]">
              {isHi
                ? 'रोगी पोर्टल (/portal) और लॉगिन (/login) सुरक्षा कारणों से हमेशा noindex रहते हैं।'
                : 'Private routes (/portal, /login, /api/*) remain protected with noindex and robots.txt Disallow.'}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
            >
              {saving
                ? isHi
                  ? 'सहेजा जा रहा है...'
                  : 'Saving...'
                : isHi
                  ? 'SEO सेटिंग्स सहेजें'
                  : 'Save SEO Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Dynamic XML Sitemap & Robots.txt Explorer */}
      <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0B2D52] flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-[#1C7ED6]" aria-hidden="true" />
              <span>
                {isHi
                  ? 'लाइव XML साइटमैप एवं Robots.txt'
                  : 'Live XML Sitemap & Robots.txt Endpoints'}
              </span>
            </h2>
            <p className="text-xs text-[#5C6F84] mt-0.5">
              {isHi
                ? 'नए चिकित्सक जोड़ने पर साइटमैप स्वतः अपडेट होता है।'
                : 'Automatically includes all active clinic pages and specialist profiles as doctors are added.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadAudit()}
              className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] border border-[#E2EAF2] rounded-xl cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isHi ? 'रीफ्रेश' : 'Refresh'}</span>
            </button>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-xl"
            >
              <span>/sitemap.xml</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#EAF3FC] border border-[#E2EAF2] rounded-xl"
            >
              <span>/robots.txt</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        {audit && (
          <div className="border border-[#E2EAF2] rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F4F8FC] border-b border-[#E2EAF2] font-semibold text-[#5C6F84]">
                  <th className="px-3.5 py-2.5">{isHi ? 'पृष्ठ' : 'Page'}</th>
                  <th className="px-3.5 py-2.5">{isHi ? 'कैनोनिकल URL' : 'Canonical URL'}</th>
                  <th className="px-3.5 py-2.5">{isHi ? 'प्राथमिकता' : 'Priority'}</th>
                  <th className="px-3.5 py-2.5">{isHi ? 'स्थिति' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2EAF2]">
                {audit.indexedRoutes.map((entry) => (
                  <tr key={entry.path} className="hover:bg-[#F8FBFF]">
                    <td className="px-3.5 py-2.5 font-semibold text-[#0B2D52]">{entry.label}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[#5C6F84]">{entry.url}</td>
                    <td className="px-3.5 py-2.5 font-mono tabular-nums">{entry.priority}</td>
                    <td className="px-3.5 py-2.5">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        {isHi ? 'साइटमैप में' : 'In Sitemap'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
