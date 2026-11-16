import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  AppointmentDocument,
  ClinicSettings,
  Doctor,
  Language,
  ReviewSummary,
  Specialization,
  ThemeMode,
  UserProfile,
} from '../types/clinic';
import { apiFetch, clearSessionToken, saveSessionToken } from '../lib/authFetch';

export interface BookingDraft {
  step: number;
  specializationId: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reason: string;
  documents: AppointmentDocument[];
  waitlistId?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  tone: 'success' | 'error' | 'info';
}

export interface BookingPreselect {
  specializationId?: string;
  doctorId?: string;
  date?: string;
  timeSlot?: string;
  waitlistId?: string;
}

interface ClinicContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  route: string;
  navigate: (path: string) => void;
  scrollToSection: (sectionId: string, path?: string) => void;
  user: UserProfile | null;
  authLoading: boolean;
  specializations: Specialization[];
  doctors: Doctor[];
  settings: ClinicSettings | null;
  reviewSummary: ReviewSummary | null;
  bootstrapLoading: boolean;
  bookingDraft: BookingDraft;
  setBookingDraft: React.Dispatch<React.SetStateAction<BookingDraft>>;
  resetBookingDraft: (preselect?: BookingPreselect) => void;
  startBookingWith: (opts: BookingPreselect) => void;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (payload: { name: string; email: string; phone: string; password: string }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  refreshBootstrap: () => Promise<void>;
  addToast: (message: string, tone?: ToastItem['tone']) => void;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
}

function getDefaultFutureDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const INITIAL_DRAFT: BookingDraft = {
  step: 1,
  specializationId: '',
  doctorId: '',
  date: getDefaultFutureDate(),
  timeSlot: '',
  patientName: '',
  patientPhone: '',
  patientEmail: '',
  reason: '',
  documents: [],
};

const ClinicContext = createContext<ClinicContextValue | undefined>(undefined);

function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Ignore storage access errors in restricted iframes
  }
  return null;
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage access errors in restricted iframes
  }
}

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = safeGetStorage('arogya_lang');
    return saved === 'hi' ? 'hi' : 'en';
  });

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = safeGetStorage('arogya_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    try {
      return (
        typeof window !== 'undefined' &&
        Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)
      );
    } catch {
      return false;
    }
  });

  const resolvedTheme: 'light' | 'dark' =
    themeMode === 'dark' || (themeMode === 'system' && systemPrefersDark) ? 'dark' : 'light';

  const [route, setRoute] = useState<string>(() => {
    try {
      if (typeof window === 'undefined') return '/';
      return window.location.pathname || '/';
    } catch {
      return '/';
    }
  });

  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>(INITIAL_DRAFT);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, tone: ToastItem['tone'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    safeSetStorage('arogya_lang', lang);
    try {
      document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
    } catch {
      // Ignore
    }
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    safeSetStorage('arogya_theme', mode);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    setSystemPrefersDark(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    try {
      const root = document.documentElement;
      const isDark = resolvedTheme === 'dark';
      root.classList.toggle('dark', isDark);
      root.dataset.theme = resolvedTheme;
      root.style.colorScheme = resolvedTheme;
    } catch {
      // Ignore
    }
  }, [resolvedTheme]);

  useEffect(() => {
    try {
      document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
    } catch {
      // Ignore
    }
  }, [language]);

  const navigate = useCallback((nextPath: string) => {
    const normalized = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
    const pathnameOnly = normalized.split('?')[0] || '/';
    try {
      const currentFull = `${window.location.pathname}${window.location.search}`;
      if (currentFull !== normalized) {
        window.history.pushState({}, '', normalized);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Fallback for restricted history contexts
    }
    setRoute(pathnameOnly);
  }, []);

  const scrollToSection = useCallback(
    (sectionId: string, targetPath = '/') => {
      const normalizedTarget = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
      const doScroll = () => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };

      if (route === normalizedTarget) {
        doScroll();
        return;
      }

      try {
        window.history.pushState({}, '', normalizedTarget);
      } catch {
        // Fallback for restricted history contexts
      }
      setRoute(normalizedTarget);
      setTimeout(() => {
        requestAnimationFrame(doScroll);
      }, 90);
    },
    [route]
  );

  useEffect(() => {
    const onPopState = () => {
      try {
        setRoute(window.location.pathname || '/');
      } catch {
        setRoute('/');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const refreshBootstrap = useCallback(async () => {
    try {
      setBootstrapLoading(true);
      const res = await apiFetch('/api/clinic/bootstrap');
      if (!res.ok) throw new Error('Failed to load clinic directory');
      const data = (await res.json()) as {
        settings?: ClinicSettings;
        specializations?: Specialization[];
        doctors?: Doctor[];
        reviewSummary?: ReviewSummary;
      };
      setSettings(data.settings || null);
      setSpecializations(Array.isArray(data.specializations) ? data.specializations : []);
      setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
      setReviewSummary(data.reviewSummary || null);
    } catch (err) {
      console.error(err);
    } finally {
      setBootstrapLoading(false);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      setAuthLoading(true);
      const res = await apiFetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: UserProfile | null };
      if (!data.user) {
        clearSessionToken();
      }
      setUser(data.user);
      if (data.user) {
        setBookingDraft((prev) => ({
          ...prev,
          patientName: prev.patientName || data.user!.name,
          patientPhone: prev.patientPhone || data.user!.phone,
          patientEmail: prev.patientEmail || data.user!.email,
        }));
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshBootstrap();
    void refreshAuth();
  }, [refreshBootstrap, refreshAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      saveSessionToken(data.token);
      setUser(data.user);
      setBookingDraft((prev) => ({
        ...prev,
        patientName: prev.patientName || data.user.name,
        patientPhone: prev.patientPhone || data.user.phone,
        patientEmail: prev.patientEmail || data.user.email,
      }));
      return data.user as UserProfile;
    },
    []
  );

  const register = useCallback(
    async (payload: { name: string; email: string; phone: string; password: string }) => {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      saveSessionToken(data.token);
      setUser(data.user);
      return data.user as UserProfile;
    },
    []
  );

  const logout = useCallback(async () => {
    clearSessionToken();
    await apiFetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setUser(null);
    navigate('/');
    addToast(language === 'hi' ? 'आप सफलतापूर्वक लॉगआउट हो गए हैं।' : 'Signed out successfully.', 'info');
  }, [addToast, language, navigate]);

  const resetBookingDraft = useCallback(
    (preselect?: BookingPreselect) => {
      const doc = preselect?.doctorId ? doctors.find((d) => d.id === preselect.doctorId) : undefined;
      const specId = doc?.specializationId || preselect?.specializationId || '';
      const startStep =
        doc && preselect?.date && preselect?.timeSlot
          ? 5
          : doc
            ? 3
            : specId
              ? 2
              : 1;
      setBookingDraft({
        step: startStep,
        specializationId: specId,
        doctorId: doc?.id || '',
        date: preselect?.date || getDefaultFutureDate(),
        timeSlot: preselect?.timeSlot || '',
        patientName: user?.name || '',
        patientPhone: user?.phone || '',
        patientEmail: user?.email || '',
        reason: '',
        documents: [],
        waitlistId: preselect?.waitlistId,
      });
    },
    [doctors, user]
  );

  const startBookingWith = useCallback(
    (opts: BookingPreselect) => {
      resetBookingDraft(opts);
      navigate('/book');
    },
    [navigate, resetBookingDraft]
  );

  return (
    <ClinicContext.Provider
      value={{
        language,
        setLanguage,
        themeMode,
        resolvedTheme,
        setThemeMode,
        route,
        navigate,
        scrollToSection,
        user,
        authLoading,
        specializations,
        doctors,
        settings,
        reviewSummary,
        bootstrapLoading,
        bookingDraft,
        setBookingDraft,
        resetBookingDraft,
        startBookingWith,
        login,
        register,
        logout,
        refreshAuth,
        refreshBootstrap,
        addToast,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error('useClinic must be used within ClinicProvider');
  return ctx;
}
