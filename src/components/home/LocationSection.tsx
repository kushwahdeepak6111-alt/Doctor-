import React from 'react';
import { ClinicLocationSection } from '../ClinicLocationSection';

export function LocationSection() {
  return (
    <section id="section-location" className="scroll-mt-16 bg-[#F4F8FC] border-t border-[#E2EAF2]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <ClinicLocationSection compact />
      </div>
    </section>
  );
}
