import React from 'react';
import { ClinicalPrecisionSection } from '../components/home/ClinicalPrecisionSection';
import { DepartmentsSection } from '../components/home/DepartmentsSection';
import { ExpertDoctorsSection } from '../components/home/ExpertDoctorsSection';
import { HealthCommitmentSection } from '../components/home/HealthCommitmentSection';
import { HeroSection } from '../components/home/HeroSection';
import { LocationSection } from '../components/home/LocationSection';
import { ModernClinicSection } from '../components/home/ModernClinicSection';
import { PatientGuidesSection } from '../components/home/PatientGuidesSection';
import { PatientReviewsSection } from '../components/home/PatientReviewsSection';
import { QuickBookingSection } from '../components/home/QuickBookingSection';
import { WhyChooseSection } from '../components/home/WhyChooseSection';
import { BottomSectionSearch } from '../components/BottomSectionSearch';
import { HomeSeoSection } from '../components/HomeSeoSection';

export function HomePage() {
  return (
    <div className="bg-white">
      {/* 1. CLEAN DEEP OCEAN NAVY HERO */}
      <HeroSection />

      {/* 2. SPECIALIZED CARE ACROSS KEY DEPARTMENTS (5 / 7 SPLIT) */}
      <DepartmentsSection />

      {/* 3. YOUR HEALTH IS OUR PRIORITY BANNER + 4-ITEM ICON BAR */}
      <HealthCommitmentSection />

      {/* 4. MEET OUR EXPERT DOCTORS */}
      <ExpertDoctorsSection />

      {/* 5. A MODERN CLINIC BUILT FOR BETTER HEALTH BANNER */}
      <ModernClinicSection />

      {/* 6. CLINICAL PRECISION SPLIT CARD */}
      <ClinicalPrecisionSection />

      {/* 7. WHY CHOOSE AROGYA CLINIC? */}
      <WhyChooseSection />

      {/* 8. BOOK AN APPOINTMENT TODAY, ONLINE (LIVE INTERACTIVE SPLIT CARD) */}
      <QuickBookingSection />

      {/* 9. PATIENT GUIDES & PREPARATION INSIGHTS */}
      <PatientGuidesSection />

      {/* 10. VERIFIED PATIENT FEEDBACK & REVIEWS */}
      <PatientReviewsSection />

      {/* 11. CLINIC LOCATION, MAPS & DIRECT CONTACT */}
      <LocationSection />

      {/* 12. HEALTHCARE DIRECTORY & SEO SEARCH DISCOVERY */}
      <HomeSeoSection />

      {/* 13. QUICK SECTION & CLINIC SEARCH BAR (HOME PAGE BOTTOM) */}
      <BottomSectionSearch />
    </div>
  );
}
