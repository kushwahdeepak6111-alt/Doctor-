import React from 'react';
import { useClinic } from '../context/ClinicContext';
import { LoginPage } from './LoginPage';
import { PatientDashboard } from './dashboards/PatientDashboard';
import { DoctorDashboard } from './dashboards/DoctorDashboard';
import { StaffDashboard } from './dashboards/StaffDashboard';
import { AdminDashboard } from './dashboards/AdminDashboard';

export function PortalPage() {
  const { user, authLoading } = useClinic();

  if (authLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-16 space-y-4">
        <div className="h-24 bg-[#F4F8FC] rounded-2xl animate-pulse border border-[#E2EAF2]" />
        <div className="h-48 bg-[#F4F8FC] rounded-2xl animate-pulse border border-[#E2EAF2]" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'staff':
      return <StaffDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'patient':
    default:
      return <PatientDashboard />;
  }
}
