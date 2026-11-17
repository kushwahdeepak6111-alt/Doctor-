import React, { Suspense, lazy, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

const AdminDashboard = lazy(() =>
  import('./dashboards/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

function AdminLoadingSkeleton() {
  return (
    <div className="bg-[#F4F8FC] min-h-[85vh]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-3 h-96 bg-white border border-[#E2EAF2] rounded-2xl animate-pulse" />
          <div className="lg:col-span-9 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-white border border-[#E2EAF2] rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-white border border-[#E2EAF2] rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminPage() {
  const { language, user, authLoading, login, logout, navigate, addToast } = useClinic();
  const isHi = language === 'hi';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) {
    return <AdminLoadingSkeleton />;
  }

  if (user?.role === 'admin') {
    return (
      <Suspense fallback={<AdminLoadingSkeleton />}>
        <AdminDashboard />
      </Suspense>
    );
  }

  if (user) {
    const roleLabels: Record<string, { en: string; hi: string }> = {
      patient: { en: 'Patient', hi: 'रोगी' },
      doctor: { en: 'Doctor', hi: 'चिकित्सक' },
      staff: { en: 'Reception Staff', hi: 'रिसेप्शन स्टाफ' },
    };
    const activeRole = roleLabels[user.role] || { en: user.role, hi: user.role };

    return (
      <div className="bg-[#F4F8FC] min-h-[82vh] py-12 sm:py-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold text-[#0B2D52]">
                {isHi ? 'प्रशासक अनुमति आवश्यक है' : 'Administrator Access Required'}
              </h1>
              <p className="text-sm text-[#5C6F84] leading-relaxed">
                {isHi
                  ? `आप वर्तमान में "${user.name}" (${activeRole.hi}) के रूप में साइन इन हैं। क्लिनिक एडमिन पैनल केवल अधिकृत क्लिनिक प्रशासकों के लिए है।`
                  : `You are currently signed in as ${user.name} (${activeRole.en}). The Clinic Admin Panel is restricted to authorized clinic administrators.`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/portal')}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                <span>{isHi ? 'मेरा पोर्टल खोलें' : 'Open My Portal'}</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setError('');
                }}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#EAF3FC] border border-[#E2EAF2] rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>{isHi ? 'खाता बदलें' : 'Switch Account'}</span>
              </button>
            </div>

            <div className="pt-3 border-t border-[#E2EAF2]">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C6F84] hover:text-[#0B2D52] py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isHi ? 'मुख्य पृष्ठ पर लौटें' : 'Back to Home'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(isHi ? 'कृपया मान्य एडमिन ईमेल दर्ज करें।' : 'Please enter a valid admin email address.');
      return;
    }
    if (password.length < 6) {
      setError(
        isHi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const signedIn = await login(email.trim(), password);
      if (signedIn.role !== 'admin') {
        addToast(
          isHi
            ? 'यह खाता प्रशासक नहीं है — आपको आपके पोर्टल पर भेजा जा सकता है।'
            : 'Signed in account does not have administrator privileges.',
          'info'
        );
        return;
      }
      addToast(
        isHi ? 'क्लिनिक एडमिन पैनल में स्वागत है।' : 'Signed in to Clinic Admin Panel.',
        'success'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isHi
            ? 'प्रमाणीकरण विफल रहा। कृपया अपना ईमेल और पासवर्ड जांचें।'
            : 'Authentication failed. Please verify your administrator credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F4F8FC] min-h-[82vh] py-10 sm:py-14 lg:py-16">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-7 bg-white border border-[#E2EAF2] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C7ED6]">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>{isHi ? 'क्लिनिक प्रशासन पैनल' : 'Clinic Administration Panel'}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-[26px] font-bold text-[#0B2D52] tracking-tight">
              {isHi ? 'एडमिन पैनल साइन इन' : 'Admin Panel Sign In'}
            </h1>
            <p className="text-sm text-[#5C6F84] leading-relaxed">
              {isHi
                ? 'डॉक्टर, स्टाफ, अपॉइंटमेंट, रिपोर्ट, प्रतीक्षा सूची, SEO और क्लिनिक सेटिंग्स प्रबंधित करने के लिए अपने क्लिनिक प्रशासक खाते से साइन इन करें।'
                : 'Sign in with an authorized clinic administrator account to manage doctors, staff, appointments, reports, waitlist, inquiries, SEO, and clinic settings.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-semibold text-[#0B2D52]">
                {isHi ? 'प्रशासक ईमेल' : 'Administrator Email'} <span className="text-rose-600">*</span>
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@clinic.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#10233B] bg-white border border-[#E2EAF2] rounded-xl focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-semibold text-[#0B2D52]">
                {isHi ? 'पासवर्ड' : 'Password'} <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[44px] pl-3.5 pr-11 py-2 text-sm text-[#10233B] bg-white border border-[#E2EAF2] rounded-xl focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#5C6F84] hover:text-[#0B2D52] hover:bg-[#F4F8FC] transition-colors"
                  aria-label={
                    showPassword
                      ? isHi
                        ? 'पासवर्ड छिपाएं'
                        : 'Hide password'
                      : isHi
                        ? 'पासवर्ड दिखाएं'
                        : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] disabled:opacity-60 rounded-xl transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Lock className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{isHi ? 'एडमिन पैनल खोलें' : 'Sign In to Admin Panel'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-[#E2EAF2] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C6F84]">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-semibold text-[#1C7ED6] hover:underline py-1"
            >
              {isHi ? '← रोगी एवं स्टाफ पोर्टल लॉगिन' : '← Patient & Staff Portal Login'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="font-semibold text-[#5C6F84] hover:text-[#0B2D52] py-1"
            >
              {isHi ? 'क्लिनिक होमपेज' : 'Clinic Home'}
            </button>
          </div>
        </div>

        <aside className="lg:col-span-5 bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="font-display text-base font-bold text-[#0B2D52]">
            {isHi ? 'एडमिन पैनल क्षमताएं' : 'Admin Panel Capabilities'}
          </h2>
          <ul className="space-y-2.5 text-xs text-[#5C6F84] leading-relaxed">
            {(isHi
              ? [
                  'रियल-टाइम अपॉइंटमेंट KPI, विभाग विश्लेषण और स्थिति प्रबंधन',
                  'विशेषज्ञ चिकित्सक प्रोफ़ाइल, साप्ताहिक OPD समय और ब्लॉक स्लॉट',
                  'स्टाफ, चिकित्सक और रोगी उपयोगकर्ता खाते एवं भूमिका नियंत्रण',
                  'संपर्क पूछताछ, रोगी समीक्षा मॉडरेशन और प्रतीक्षा सूची नियंत्रण',
                  'फ़िल्टर की गई CSV / Excel रिपोर्ट निर्यात और ऑडिट लॉग',
                  'SEO मेटाडेटा, साइटमैप ऑडिट और क्लिनिक संपर्क सेटिंग्स',
                ]
              : [
                  'Real-time appointment KPIs, department analytics & status controls',
                  'Specialist doctor profiles, weekly OPD schedules & slot blocking',
                  'Staff, doctor & patient user accounts with role-based access',
                  'Contact inquiry inbox, feedback moderation & waitlist dispatch logs',
                  'Filtered CSV / Excel report exports & security audit trail',
                  'SEO metadata manager, sitemap audit & clinic desk settings',
                ]
            ).map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1C7ED6] mt-1.5 shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
