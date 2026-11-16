import React, { useState } from 'react';
import {
  AlertCircle,
  CalendarCheck2,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useT } from '../i18n/translations';

export function LoginPage() {
  const { language, login, register, navigate, addToast } = useClinic();
  const t = useT(language);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!name.trim() || !phone.trim()) {
        setError(
          language === 'hi'
            ? 'कृपया अपना पूरा नाम और मोबाइल नंबर दर्ज करें।'
            : 'Please enter your full name and mobile number.'
        );
        return;
      }
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(
        language === 'hi'
          ? 'कृपया एक मान्य ईमेल पता दर्ज करें।'
          : 'Please enter a valid email address.'
      );
      return;
    }
    if (password.length < 6) {
      setError(
        language === 'hi'
          ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
          : 'Password must be at least 6 characters.'
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        });
      }
      addToast(
        language === 'hi' ? 'सफलतापूर्वक साइन इन हो गया।' : 'Signed in successfully.',
        'success'
      );
      navigate('/portal');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : language === 'hi'
            ? 'प्रमाणीकरण विफल रहा। कृपया विवरण जांचें।'
            : 'Authentication failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const portalHighlights =
    language === 'hi'
      ? [
          {
            icon: CalendarCheck2,
            title: 'अपॉइंटमेंट स्थिति ट्रैक करें',
            desc: 'लंबित अनुरोधों और रिसेप्शन द्वारा कन्फर्म किए गए समय स्लॉट कभी भी देखें।',
          },
          {
            icon: FileText,
            title: 'रिपोर्ट और क्लिनिक नोट्स',
            desc: 'बुकिंग के समय अपलोड किए गए दस्तावेज़ और चिकित्सक नोट्स सुरक्षित रूप से देखें।',
          },
          {
            icon: UserCheck,
            title: 'त्वरित रोगी पंजीकरण',
            desc: 'नए रोगी कुछ ही सेकंड में अपना खाता बना सकते हैं और विज़िट प्रबंधित कर सकते हैं।',
          },
          {
            icon: ShieldCheck,
            title: 'चिकित्सक एवं स्टाफ लॉगिन',
            desc: 'अधिकृत चिकित्सक, रिसेप्शन स्टाफ और प्रशासक अपने क्लिनिक क्रेडेंशियल से साइन इन करें।',
          },
        ]
      : [
          {
            icon: CalendarCheck2,
            title: 'Track Appointment Status',
            desc: 'View pending requests, confirmed consultation slots, and past clinic visits.',
          },
          {
            icon: FileText,
            title: 'Attached Reports & Notes',
            desc: 'Access uploaded prescriptions, laboratory reports, and doctor follow-up notes.',
          },
          {
            icon: UserCheck,
            title: 'Self-Service Patient Registration',
            desc: 'New patients can create a personal portal account in seconds to manage visits.',
          },
          {
            icon: ShieldCheck,
            title: 'Authorized Clinical Staff',
            desc: 'Doctors, reception staff, and administrators sign in using clinic-issued credentials.',
          },
        ];

  return (
    <div className="bg-[#F4F8FC] min-h-[82vh] py-10 sm:py-12 lg:py-16">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Form Card */}
        <div className="lg:col-span-7 bg-white border border-[#E2EAF2] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C7ED6]">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{language === 'hi' ? 'सुरक्षित पोर्टल' : 'Secure Clinic Portal'}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-[26px] font-bold text-[#0B2D52] tracking-tight">
              {t.auth.title}
            </h1>
            <p className="text-sm text-[#5C6F84] leading-relaxed">{t.auth.subtitle}</p>
          </div>

          <div
            role="tablist"
            aria-label={language === 'hi' ? 'प्रमाणीकरण विकल्प' : 'Authentication mode'}
            className="grid grid-cols-2 gap-1 p-1 bg-[#F4F8FC] border border-[#E2EAF2] rounded-xl"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`min-h-[42px] text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#0B2D52] shadow-xs border border-[#E2EAF2]/80'
                  : 'text-[#5C6F84] hover:text-[#0B2D52]'
              }`}
            >
              {t.auth.loginTab}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`min-h-[42px] text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-[#0B2D52] shadow-xs border border-[#E2EAF2]/80'
                  : 'text-[#5C6F84] hover:text-[#0B2D52]'
              }`}
            >
              {t.auth.registerTab}
            </button>
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
            {mode === 'register' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="auth-name" className="block text-xs font-semibold text-[#0B2D52]">
                    {t.auth.name} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder={language === 'hi' ? 'उदा. अनन्या वर्मा' : 'e.g. Ananya Verma'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#10233B] bg-white border border-[#E2EAF2] rounded-xl focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="auth-phone" className="block text-xs font-semibold text-[#0B2D52]">
                    {t.auth.phone} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="auth-phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="+91 98100 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#10233B] bg-white border border-[#E2EAF2] rounded-xl tabular-nums focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="block text-xs font-semibold text-[#0B2D52]">
                {t.auth.email} <span className="text-rose-600">*</span>
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#10233B] bg-white border border-[#E2EAF2] rounded-xl focus:border-[#1C7ED6] focus:ring-2 focus:ring-[#1C7ED6]/15 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="auth-password" className="block text-xs font-semibold text-[#0B2D52]">
                {t.auth.password} <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
                      ? language === 'hi'
                        ? 'पासवर्ड छिपाएं'
                        : 'Hide password'
                      : language === 'hi'
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
              {mode === 'register' && (
                <p className="text-[11px] text-[#5C6F84]">
                  {language === 'hi'
                    ? 'कम से कम 6 अक्षरों का पासवर्ड चुनें।'
                    : 'Use at least 6 characters for your patient account.'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] disabled:opacity-60 rounded-xl transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <span>{mode === 'login' ? t.auth.signInBtn : t.auth.registerBtn}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-[#E2EAF2] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C6F84]">
            <span>
              {language === 'hi'
                ? 'बिना खाता बनाए भी अपॉइंटमेंट अनुरोध भेजा जा सकता है।'
                : 'Prefer booking without registering first?'}
            </span>
            <button
              type="button"
              onClick={() => navigate('/book')}
              className="font-semibold text-[#1C7ED6] hover:text-[#1868B2] hover:underline py-1"
            >
              {t.nav.book} →
            </button>
          </div>
        </div>

        {/* Clinical Portal Overview Card (Zero Credentials / Zero Bypass) */}
        <aside className="lg:col-span-5 bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="space-y-1.5 pb-4 border-b border-[#E2EAF2]">
            <h2 className="font-display text-base font-bold text-[#0B2D52]">
              {t.auth.accessTitle}
            </h2>
            <p className="text-xs text-[#5C6F84] leading-relaxed">{t.auth.accessSubtitle}</p>
          </div>

          <div className="space-y-4">
            {portalHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF3FC] text-[#1C7ED6] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold text-[#0B2D52]">{item.title}</h3>
                    <p className="text-xs text-[#5C6F84] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-[#F4F8FC] border border-[#E2EAF2] p-4 space-y-2">
            <p className="text-xs font-semibold text-[#0B2D52]">
              {language === 'hi' ? 'साइन-इन सहायता चाहिए?' : 'Need sign-in or booking assistance?'}
            </p>
            <p className="text-xs text-[#5C6F84] leading-relaxed">
              {language === 'hi'
                ? 'खाते से जुड़ी सहायता के लिए कृपया हमारे रिसेप्शन डेस्क से संपर्क करें।'
                : 'Contact our clinic reception desk during outpatient hours for account or scheduling help.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/contact')}
              className="text-xs font-semibold text-[#1C7ED6] hover:text-[#1868B2] hover:underline pt-0.5"
            >
              {t.nav.contact} →
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
