import React, { Suspense, lazy, useEffect } from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastHost } from './components/ToastHost';
import { FloatingContactButtons } from './components/FloatingContactButtons';
import { SeoHead } from './components/SeoHead';
import { HomePage } from './pages/HomePage';
import { routeLoaders, warmPrimaryRoutes } from './lib/routePrefetch';

const AboutPage = lazy(() => routeLoaders.about().then((m) => ({ default: m.AboutPage })));
const DoctorsPage = lazy(() => routeLoaders.doctors().then((m) => ({ default: m.DoctorsPage })));
const DoctorDetailPage = lazy(() =>
  routeLoaders.doctorDetail().then((m) => ({ default: m.DoctorDetailPage }))
);
const SpecializationsPage = lazy(() =>
  routeLoaders.specializations().then((m) => ({ default: m.SpecializationsPage }))
);
const BookingPage = lazy(() => routeLoaders.book().then((m) => ({ default: m.BookingPage })));
const FaqPage = lazy(() => routeLoaders.faq().then((m) => ({ default: m.FaqPage })));
const ContactPage = lazy(() => routeLoaders.contact().then((m) => ({ default: m.ContactPage })));
const LoginPage = lazy(() => routeLoaders.login().then((m) => ({ default: m.LoginPage })));
const PortalPage = lazy(() => routeLoaders.portal().then((m) => ({ default: m.PortalPage })));
const AdminPage = lazy(() => routeLoaders.admin().then((m) => ({ default: m.AdminPage })));

function PageLoadingFallback() {
  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-5 min-h-[60vh]">
      <div className="h-8 w-56 rounded-xl bg-[#F4F8FC] border border-[#E2EAF2] animate-pulse" />
      <div className="h-32 w-full rounded-2xl bg-[#F4F8FC] border border-[#E2EAF2] animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="h-44 rounded-2xl bg-[#F4F8FC] border border-[#E2EAF2] animate-pulse" />
        <div className="h-44 rounded-2xl bg-[#F4F8FC] border border-[#E2EAF2] animate-pulse" />
        <div className="h-44 rounded-2xl bg-[#F4F8FC] border border-[#E2EAF2] animate-pulse" />
      </div>
    </div>
  );
}

function ClinicShell() {
  const { route } = useClinic();

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(() => warmPrimaryRoutes(), { timeout: 1200 });
      return () => win.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(() => warmPrimaryRoutes(), 500);
    return () => window.clearTimeout(timer);
  }, []);

  const renderPage = () => {
    if (route === '/' || route === '') return <HomePage />;
    if (route === '/about') return <AboutPage />;
    if (route === '/specializations' || route === '/services') return <SpecializationsPage />;
    if (route === '/doctors') return <DoctorsPage />;
    if (route.startsWith('/doctors/')) {
      const slug = route.replace('/doctors/', '').split('/')[0];
      return <DoctorDetailPage slug={slug} />;
    }
    if (route === '/book') return <BookingPage />;
    if (route === '/faq') return <FaqPage />;
    if (route === '/contact') return <ContactPage />;
    if (route === '/login') return <LoginPage />;
    if (route === '/portal') return <PortalPage />;
    if (route === '/admin' || route.startsWith('/admin/')) return <AdminPage />;
    return <HomePage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#10233B]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0B2D52] focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>
          <div key={route} className="route-enter">
            {renderPage()}
          </div>
        </Suspense>
      </main>
      <Footer />
      <FloatingContactButtons />
      <ToastHost />
    </div>
  );
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected error' };
  }

  componentDidCatch(error: Error) {
    console.error('Clinic UI Error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F8FC] p-6">
          <div className="max-w-md w-full bg-white border border-[#E2EAF2] rounded-2xl p-6 text-center space-y-4">
            <h1 className="font-display text-xl font-bold text-[#0B2D52]">
              Arogya Multi-Specialty Clinic
            </h1>
            <p className="text-sm text-[#5C6F84]">
              Something interrupted the page display. Please reload to continue.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] rounded-xl"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <ClinicProvider>
        <SeoHead />
        <ClinicShell />
      </ClinicProvider>
    </AppErrorBoundary>
  );
}
