import React from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastHost } from './components/ToastHost';
import { FloatingContactButtons } from './components/FloatingContactButtons';
import { SeoHead } from './components/SeoHead';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { DoctorDetailPage } from './pages/DoctorDetailPage';
import { SpecializationsPage } from './pages/SpecializationsPage';
import { BookingPage } from './pages/BookingPage';
import { FaqPage } from './pages/FaqPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { PortalPage } from './pages/PortalPage';

function ClinicShell() {
  const { route } = useClinic();

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
        {renderPage()}
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
