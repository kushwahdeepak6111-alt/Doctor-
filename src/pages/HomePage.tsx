import React from 'react';
import { MotionConfig, motion } from 'framer-motion';
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

const REVEAL_INITIAL = { opacity: 0, y: 20 } as const;
const REVEAL_VISIBLE = { opacity: 1, y: 0 } as const;
const REVEAL_VIEWPORT = { once: true, amount: 0.06 } as const;
const REVEAL_TRANSITION = {
  duration: 0.48,
  ease: [0.16, 1, 0.3, 1],
} as const;

function ScrollRevealSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={REVEAL_INITIAL}
      whileInView={REVEAL_VISIBLE}
      viewport={REVEAL_VIEWPORT}
      transition={{ ...REVEAL_TRANSITION, delay }}
    >
      {children}
    </motion.div>
  );
}

export function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-white overflow-x-clip">
        {/* 1. CLEAN DEEP OCEAN NAVY HERO */}
        <HeroSection />

        {/* 2. SPECIALIZED CARE ACROSS KEY DEPARTMENTS (5 / 7 SPLIT) */}
        <ScrollRevealSection>
          <DepartmentsSection />
        </ScrollRevealSection>

        {/* 3. YOUR HEALTH IS OUR PRIORITY BANNER + 4-ITEM ICON BAR */}
        <ScrollRevealSection>
          <HealthCommitmentSection />
        </ScrollRevealSection>

        {/* 4. MEET OUR EXPERT DOCTORS */}
        <ScrollRevealSection>
          <ExpertDoctorsSection />
        </ScrollRevealSection>

        {/* 5. A MODERN CLINIC BUILT FOR BETTER HEALTH BANNER */}
        <ScrollRevealSection>
          <ModernClinicSection />
        </ScrollRevealSection>

        {/* 6. CLINICAL PRECISION SPLIT CARD */}
        <ScrollRevealSection>
          <ClinicalPrecisionSection />
        </ScrollRevealSection>

        {/* 7. WHY CHOOSE AROGYA CLINIC? */}
        <ScrollRevealSection>
          <WhyChooseSection />
        </ScrollRevealSection>

        {/* 8. BOOK AN APPOINTMENT TODAY, ONLINE (LIVE INTERACTIVE SPLIT CARD) */}
        <ScrollRevealSection>
          <QuickBookingSection />
        </ScrollRevealSection>

        {/* 9. PATIENT GUIDES & PREPARATION INSIGHTS */}
        <ScrollRevealSection>
          <PatientGuidesSection />
        </ScrollRevealSection>

        {/* 10. VERIFIED PATIENT FEEDBACK & REVIEWS */}
        <ScrollRevealSection>
          <PatientReviewsSection />
        </ScrollRevealSection>

        {/* 11. CLINIC LOCATION, MAPS & DIRECT CONTACT */}
        <ScrollRevealSection>
          <LocationSection />
        </ScrollRevealSection>

        {/* 12. HEALTHCARE DIRECTORY & SEO SEARCH DISCOVERY */}
        <ScrollRevealSection>
          <HomeSeoSection />
        </ScrollRevealSection>

        {/* 13. QUICK SECTION & CLINIC SEARCH BAR (HOME PAGE BOTTOM) */}
        <ScrollRevealSection>
          <BottomSectionSearch />
        </ScrollRevealSection>
      </div>
    </MotionConfig>
  );
}
