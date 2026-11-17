import React, { Suspense, lazy } from 'react';
import { useClinic } from '../context/ClinicContext';
import { LoginPage } from './LoginPage';

const PatientDashboard = lazy(() =>
  import('./dashboards/PatientDashboard').then((m) => ({ default: m.PatientDashboard }))
);
const DoctorDashboard = lazy(() =>
  import('./dashboards/DoctorDashboard').then((m) => ({ default: m.DoctorDashboard }))
);
const StaffDashboard = lazy(() =>
  import('./dashboards/StaffDashboard').then((m) => ({ default: m.StaffDashboard }))
);
const AdminDashboard = lazy(() =>
  import('./dashboards/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

function DashboardSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12 space-y-4">
      <div className="h-24 bg-[#F4F8FC] rounded-2xl animate-pulse border border-[#E2EAF2]" />
      <div className="h-48 bg-[#F4F8FC] rounded-2xl animate-pulse border border-[#E2EAF2]" />
    </div>
  );
}

export function PortalPage() {
  const { user, authLoading } = useClinic();

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderRoleDashboard = () => {
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
  };

  return <Suspense fallback={<DashboardSkeleton />}>{renderRoleDashboard()}</Suspense>;
}
