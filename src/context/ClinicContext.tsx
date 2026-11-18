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
import { STATIC_DOCTORS } from '../data/doctors';
import {
  STATIC_CLINIC_SETTINGS,
  STATIC_DEMO_USERS,
  STATIC_REVIEW_SUMMARY,
  STATIC_SPECIALIZATIONS,
} from '../data/clinicData';
import { fetchClinicCatalog } from '../lib/clinicApi';

const DEMO_USER_STORAGE_KEY = 'arogya_demo_user_v1';

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
  bootstrapError: string | null;
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
  updateLocalSettings: (next: ClinicSettings) => void;
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

function safeRemoveStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore
  }
}

function readStoredDemoUser(): UserProfile | null {
  const raw = safeGetStorage(DEMO_USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function normalizeRoutePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const clean = pathname.replace(/\/+$/, '');
  return clean || '/';
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
      return normalizeRoutePath(window.location.pathname || '/');
    } catch {
      return '/';
    }
  });

  const [user, setUser] = useState<UserProfile | null>(() => readStoredDemoUser());
  const [authLoading] = useState(false);
  const [specializations, setSpecializations] = useState<Specialization[]>(STATIC_SPECIALIZATIONS);
  const [doctors, setDoctors] = useState<Doctor[]>(STATIC_DOCTORS);
  const [settings, setSettings] = useState<ClinicSettings | null>(STATIC_CLINIC_SETTINGS);
  const [reviewSummary] = useState<ReviewSummary | null>(STATIC_REVIEW_SUMMARY);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>(() => {
    const storedUser = readStoredDemoUser();
    if (!storedUser) return INITIAL_DRAFT;
    return {
      ...INITIAL_DRAFT,
      patientName: storedUser.name || '',
      patientPhone: storedUser.phone || '',
      patientEmail: storedUser.email || '',
    };
  });
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
    const pathnameOnly = normalizeRoutePath(normalized.split('?')[0] || '/');
    try {
      const currentFull = `${window.location.pathname}${window.location.search}`;
      if (currentFull !== normalized) {
        const currentState =
          window.history.state && typeof window.history.state === 'object'
            ? window.history.state
            : {};
        window.history.replaceState({ ...currentState, scrollY: window.scrollY }, '');
        window.history.pushState({ scrollY: 0 }, '', normalized);
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
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
        const currentState =
          window.history.state && typeof window.history.state === 'object'
            ? window.history.state
            : {};
        window.history.replaceState({ ...currentState, scrollY: window.scrollY }, '');
        window.history.pushState({ scrollY: 0 }, '', normalizedTarget);
      } catch {
        // Fallback for restricted history contexts
      }
      setRoute(normalizedTarget);
      requestAnimationFrame(() => {
        requestAnimationFrame(doScroll);
      });
    },
    [route]
  );

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      try {
        setRoute(normalizeRoutePath(window.location.pathname || '/'));
        const savedY =
          event.state && typeof event.state === 'object' && typeof event.state.scrollY === 'number'
            ? event.state.scrollY
            : 0;
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedY, behavior: 'auto' });
        });
      } catch {
        setRoute('/');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const refreshBootstrap = useCallback(async () => {
    setBootstrapLoading(true);
    setBootstrapError(null);
    try {
      const catalog = await fetchClinicCatalog();
      setSpecializations(catalog.specializations);
      setDoctors(catalog.doctors);
    } catch (err) {
      setBootstrapError(
        err instanceof Error && err.message
          ? err.message
          : 'Unable to load clinic departments and specialists.'
      );
    } finally {
      setBootstrapLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSupabaseEnv = Boolean(
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    );
    if (hasSupabaseEnv) {
      void refreshBootstrap();
    }
  }, [refreshBootstrap]);

  const refreshAuth = useCallback(async () => {
    setUser(readStoredDemoUser());
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || password.length < 6) {
      throw new Error('Invalid email or password.');
    }
    const matched = STATIC_DEMO_USERS.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!matched || password !== 'ClinicDemo#2026') {
      throw new Error('Invalid demo credentials. Use password ClinicDemo#2026 for demo accounts.');
    }
    safeSetStorage(DEMO_USER_STORAGE_KEY, JSON.stringify(matched));
    setUser(matched);
    setBookingDraft((prev) => ({
      ...prev,
      patientName: prev.patientName || matched.name,
      patientPhone: prev.patientPhone || matched.phone,
      patientEmail: prev.patientEmail || matched.email,
    }));
    return matched;
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; phone: string; password: string }) => {
      const created: UserProfile = {
        id: `demo-patient-${Date.now()}`,
        email: payload.email.trim(),
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        role: 'patient',
        preferredLanguage: language,
        createdAt: new Date().toISOString(),
      };
      safeSetStorage(DEMO_USER_STORAGE_KEY, JSON.stringify(created));
      setUser(created);
      setBookingDraft((prev) => ({
        ...prev,
        patientName: created.name,
        patientPhone: created.phone,
        patientEmail: created.email,
      }));
      return created;
    },
    [language]
  );

  const logout = useCallback(async () => {
    safeRemoveStorage(DEMO_USER_STORAGE_KEY);
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

  const updateLocalSettings = useCallback((next: ClinicSettings) => {
    setSettings(next);
  }, []);

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
        bootstrapError,
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
        updateLocalSettings,
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
