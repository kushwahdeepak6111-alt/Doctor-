import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Bell,
  BriefcaseMedical,
  Calendar,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquareQuote,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Star,
  Stethoscope,
  UserCheck,
  Users,
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import {
  DEFAULT_CLINIC_SETTINGS,
  DEFAULT_PUBLIC_REVIEWS,
  DEMO_USERS,
  readLocalAppointments,
  saveLocalAppointment,
} from '../../lib/clinicCatalog';
import {
  checkSupabaseTablesHealth,
  fetchAllFeedbackFromSupabase,
  fetchAppointmentsFromSupabase,
  fetchContactMessagesFromSupabase,
  fetchWaitlistEntriesFromSupabase,
  updateAppointmentInSupabase,
  updateContactMessageStatusInSupabase,
  updateFeedbackStatusInSupabase,
  updateWaitlistStatusInSupabase,
} from '../../lib/clinicDb';
import { getSupabaseProjectHost } from '../../lib/supabase';
import { useT } from '../../i18n/translations';
import { AdminSeoPanel } from '../../components/AdminSeoPanel';
import { AppointmentSlipModal } from '../../components/AppointmentSlipModal';
import { StatusIndicator } from '../../components/StatusIndicator';
import type {
  Appointment,
  AppointmentStatus,
  AppointmentWaitlistEntry,
  AuditLogEntry,
  ClinicSettings,
  ContactMessage,
  Doctor,
  FeedbackStatus,
  NotificationChannel,
  PatientFeedback,
  ReportRow,
  Specialization,
  UserProfile,
  UserRole,
  WaitlistNotificationLog,
} from '../../types/clinic';

type AdminSection =
  | 'overview'
  | 'appointments'
  | 'doctors'
  | 'staff'
  | 'patients'
  | 'services'
  | 'schedules'
  | 'reports'
  | 'feedback'
  | 'waitlist'
  | 'inquiries'
  | 'seo'
  | 'settings';

export function AdminDashboard() {
  const {
    language,
    user,
    doctors: contextDoctors,
    specializations: contextSpecs,
    settings: contextSettings,
    updateLocalSettings,
    logout,
    addToast,
  } = useClinic();
  const t = useT(language);

  const [section, setSection] = useState<AdminSection>('overview');
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    readLocalAppointments()
  );
  const [doctors, setDoctors] = useState<Doctor[]>(contextDoctors);
  const [specializations, setSpecializations] = useState<Specialization[]>(contextSpecs);
  const [users, setUsers] = useState<UserProfile[]>(DEMO_USERS);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [auditLogs] = useState<AuditLogEntry[]>([]);
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'new' | 'reviewed'>('all');
  const [settingsForm, setSettingsForm] = useState<ClinicSettings | null>(
    contextSettings || DEFAULT_CLINIC_SETTINGS
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [dbHealth, setDbHealth] = useState<{
    configured: boolean;
    connected: boolean;
    tablesReady: boolean;
    missingTables: string[];
  } | null>(null);

  // Table state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'patient'>('date_desc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  // Quick creation forms
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpec, setNewDocSpec] = useState(contextSpecs[0]?.id || '');
  const [newDocQual, setNewDocQual] = useState('');
  const [newDocFee, setNewDocFee] = useState('800');

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('staff');
  const [newStaffPass, setNewStaffPass] = useState('');

  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecDesc, setNewSpecDesc] = useState('');
  const [slipAppointmentId, setSlipAppointmentId] = useState<string | null>(null);

  // Feature 4: Filtered Reports & Export State
  const [repStartDate, setRepStartDate] = useState('');
  const [repEndDate, setRepEndDate] = useState('');
  const [repDoctorId, setRepDoctorId] = useState('all');
  const [repSpecId, setRepSpecId] = useState('all');
  const [repStatus, setRepStatus] = useState<'all' | AppointmentStatus>('all');
  const [repSearch, setRepSearch] = useState('');
  const repLoading = false;
  const [repExporting, setRepExporting] = useState<'csv' | 'xlsx' | null>(null);

  // Feature 5: Feedback Moderation State
  type AdminFeedbackRow = PatientFeedback & {
    doctorName: string;
    specializationName: string;
    appointmentReference: string;
    patientName: string;
  };
  const [feedbackRows, setFeedbackRows] = useState<AdminFeedbackRow[]>(() =>
    DEFAULT_PUBLIC_REVIEWS.map((r, idx) => ({
      id: r.id,
      appointmentId: `appt-${1001 + idx}`,
      patientId: 'user-patient-1',
      doctorId: r.doctorId,
      specializationId: r.specializationId,
      rating: r.rating,
      comment: r.comment,
      doctorFeedback: r.doctorFeedback,
      publicConsent: true,
      status: 'approved',
      verifiedVisit: r.verifiedVisit,
      createdAt: r.createdAt,
      doctorName: r.doctorName,
      specializationName: r.specializationName,
      appointmentReference: `ARG-260${idx + 1}`,
      patientName: 'Verified Clinic Patient',
    }))
  );
  const feedbackLoading = false;

  // Feature 6: Admin Waitlist State
  type AdminWaitlistRow = AppointmentWaitlistEntry & {
    doctorName: string;
    specializationName: string;
  };
  const [waitlistRows, setWaitlistRows] = useState<AdminWaitlistRow[]>([]);
  const [waitlistLogs] = useState<WaitlistNotificationLog[]>([]);
  const [channelStatus] = useState<
    Record<NotificationChannel, { configured: boolean; note: string }> | null
  >({
    in_app: { configured: true, note: 'Active' },
    whatsapp: { configured: true, note: 'Direct WhatsApp link' },
    sms: { configured: false, note: 'WhatsApp & Supabase active' },
    email: { configured: false, note: 'WhatsApp & Supabase active' },
  });
  const [waitFilterDoc, setWaitFilterDoc] = useState('all');
  const [waitFilterStatus, setWaitFilterStatus] = useState('all');
  const [waitFilterDate, setWaitFilterDate] = useState('');
  const [waitFilterSearch, setWaitFilterSearch] = useState('');
  const waitLoading = false;

  const loadAdminData = useCallback(async (showToast = false) => {
    setLoading(true);
    setLoadError('');
    try {
      const [apptRes, msgRes, fbRes, waitRes, health] = await Promise.all([
        fetchAppointmentsFromSupabase(),
        fetchContactMessagesFromSupabase(),
        fetchAllFeedbackFromSupabase(),
        fetchWaitlistEntriesFromSupabase(),
        checkSupabaseTablesHealth(),
      ]);
      setAppointments(apptRes.appointments);
      setContactMessages(msgRes);
      setDbHealth(health);

      if (fbRes.length > 0) {
        setFeedbackRows(
          fbRes.map((f) => ({
            ...f,
            appointmentReference: f.appointmentId || f.id,
            patientName: f.patientId || 'Verified Patient',
          }))
        );
      }

      if (waitRes.length > 0) {
        setWaitlistRows(
          waitRes.map((w) => {
            const doc = contextDoctors.find((d) => d.id === w.doctorId);
            const spec = contextSpecs.find((s) => s.id === w.specializationId);
            return {
              ...w,
              doctorName: doc?.name || w.doctorId,
              specializationName: spec?.name || w.specializationId,
            };
          })
        );
      }

      if (showToast) {
        addToast(
          language === 'hi' ? 'Supabase डेटा रीफ़्रेश किया गया।' : 'Clinic & Supabase data refreshed.',
          'info'
        );
      }
    } catch (err) {
      setAppointments(readLocalAppointments());
      setLoadError(
        err instanceof Error && err.message ? err.message : 'Unable to load admin data.'
      );
    } finally {
      setLoading(false);
    }
  }, [addToast, contextDoctors, contextSpecs, language]);

  useEffect(() => {
    void loadAdminData(false);
  }, [loadAdminData]);

  const reportData = useMemo(() => {
    const q = repSearch.trim().toLowerCase();
    const filtered = appointments.filter((a) => {
      if (repStartDate && a.date < repStartDate) return false;
      if (repEndDate && a.date > repEndDate) return false;
      if (repDoctorId !== 'all' && a.doctorId !== repDoctorId) return false;
      if (repSpecId !== 'all' && a.specializationId !== repSpecId) return false;
      if (repStatus !== 'all' && a.status !== repStatus) return false;
      if (q) {
        const doc = doctors.find((d) => d.id === a.doctorId);
        const hay = `${a.referenceCode} ${a.patientName} ${doc?.name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const summary = {
      total: filtered.length,
      pending: filtered.filter((a) => a.status === 'pending').length,
      confirmed: filtered.filter((a) => a.status === 'confirmed').length,
      completed: filtered.filter((a) => a.status === 'completed').length,
      cancelled: filtered.filter((a) => a.status === 'cancelled').length,
      rejected: filtered.filter((a) => a.status === 'rejected').length,
      missed: filtered.filter((a) => a.status === 'missed').length,
    };

    const doctorDistribution = doctors.map((doc) => {
      const spec = specializations.find((s) => s.id === doc.specializationId);
      const list = filtered.filter((a) => a.doctorId === doc.id);
      return {
        doctorId: doc.id,
        doctorName: doc.name,
        doctorNameHi: doc.nameHi,
        specializationName: spec?.name || doc.speciality,
        total: list.length,
        pending: list.filter((a) => a.status === 'pending').length,
        confirmed: list.filter((a) => a.status === 'confirmed').length,
        completed: list.filter((a) => a.status === 'completed').length,
        cancelled: list.filter((a) => a.status === 'cancelled').length,
        rejected: list.filter((a) => a.status === 'rejected').length,
        missed: list.filter((a) => a.status === 'missed').length,
      };
    });

    const rows: ReportRow[] = filtered.map((a) => {
      const doc = doctors.find((d) => d.id === a.doctorId);
      const spec = specializations.find((s) => s.id === a.specializationId);
      return {
        id: a.id,
        referenceCode: a.referenceCode,
        patientName: a.patientName,
        doctorId: a.doctorId,
        doctorName: doc?.name || a.doctorId,
        specializationId: a.specializationId,
        specializationName: spec?.name || doc?.speciality || '',
        date: a.date,
        timeSlot: a.timeSlot,
        status: a.status,
        bookedAt: a.createdAt,
      };
    });

    return { summary, doctorDistribution, rows };
  }, [appointments, doctors, specializations, repStartDate, repEndDate, repDoctorId, repSpecId, repStatus, repSearch]);

  const loadAdminFeedback = async () => {
    await loadAdminData(true);
  };

  const loadAdminWaitlist = async () => {
    await loadAdminData(true);
  };

  // Real DB KPI Counts
  const kpi = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((a) => a.status === 'pending').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    };
  }, [appointments]);

  // Real Department Breakdown
  const deptBreakdown = useMemo(() => {
    return specializations.map((spec) => {
      const count = appointments.filter((a) => a.specializationId === spec.id).length;
      return {
        id: spec.id,
        label: language === 'hi' ? spec.nameHi : spec.name,
        count,
      };
    });
  }, [appointments, specializations, language]);

  const maxDeptCount = Math.max(1, ...deptBreakdown.map((d) => d.count));

  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = appointments.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        a.patientName.toLowerCase().includes(q) ||
        a.referenceCode.toLowerCase().includes(q) ||
        a.patientEmail.toLowerCase().includes(q)
      );
    });
    list.sort((a, b) => {
      if (sortBy === 'date_asc') return `${a.date} ${a.timeSlot}`.localeCompare(`${b.date} ${b.timeSlot}`);
      if (sortBy === 'patient') return a.patientName.localeCompare(b.patientName);
      return `${b.date} ${b.timeSlot}`.localeCompare(`${a.date} ${a.timeSlot}`);
    });
    return list;
  }, [appointments, search, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const pagedAppointments = filteredAppointments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const uniquePatients = useMemo(() => {
    const map = new Map<string, { name: string; email: string; phone: string; visits: number }>();
    for (const u of users.filter((usr) => usr.role === 'patient')) {
      map.set(u.email.toLowerCase(), { name: u.name, email: u.email, phone: u.phone, visits: 0 });
    }
    for (const a of appointments) {
      const key = a.patientEmail.toLowerCase();
      const existing = map.get(key) || {
        name: a.patientName,
        email: a.patientEmail,
        phone: a.patientPhone,
        visits: 0,
      };
      existing.visits += 1;
      map.set(key, existing);
    }
    return Array.from(map.values());
  }, [users, appointments]);

  const handleUpdateApptStatus = async (id: string, status: AppointmentStatus) => {
    const existing = appointments.find((a) => a.id === id);
    if (!existing) return;
    const updated: Appointment = { ...existing, status, updatedAt: new Date().toISOString() };
    setAppointments(saveLocalAppointment(updated));
    try {
      await updateAppointmentInSupabase(id, { status, updatedBy: user?.email });
      addToast(`Appointment updated to ${status}.`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    }
  };

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    const spec = specializations.find((s) => s.id === newDocSpec) || specializations[0];
    const baseDoc = doctors[0];
    const created: Doctor = {
      ...baseDoc,
      id: `doc-${Date.now()}`,
      slug: newDocName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: newDocName.trim(),
      nameHi: newDocName.trim(),
      speciality: spec?.name || 'Specialist',
      specializationId: spec?.id || newDocSpec,
      qualification: newDocQual.trim() || 'MBBS, MD',
      qualificationHi: newDocQual.trim() || 'एमबीबीएस, एमडी',
      fees: Number(newDocFee) || 800,
      consultationFee: Number(newDocFee) || 800,
      active: true,
    };
    setDoctors((prev) => [...prev, created]);
    setNewDocName('');
    setNewDocQual('');
    addToast('Doctor added to local preview.', 'success');
  };

  const handleToggleDoctorActive = (doc: Doctor) => {
    setDoctors((prev) => prev.map((d) => (d.id === doc.id ? { ...d, active: !d.active } : d)));
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const created: UserProfile = {
      id: `user-${Date.now()}`,
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      phone: newStaffPhone.trim(),
      role: newStaffRole,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, created]);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setNewStaffPass('');
    addToast('User account added locally.', 'success');
  };

  const handleAddSpec = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Specialization = {
      id: `spec-${Date.now()}`,
      slug: newSpecName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: newSpecName.trim(),
      nameHi: newSpecName.trim(),
      shortDescription: newSpecDesc.trim(),
      shortDescriptionHi: newSpecDesc.trim(),
      overview: newSpecDesc.trim(),
      overviewHi: newSpecDesc.trim(),
      iconKey: 'stethoscope',
      commonConditions: [],
      commonConditionsHi: [],
      active: true,
    };
    setSpecializations((prev) => [...prev, created]);
    setNewSpecName('');
    setNewSpecDesc('');
    addToast('Department added locally.', 'success');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    updateLocalSettings(settingsForm);
    addToast('Clinic settings updated locally.', 'success');
  };

  const handleServerExport = (format: 'csv' | 'xlsx') => {
    setRepExporting(format);
    try {
      const headers = ['Reference', 'Patient Name', 'Doctor', 'Specialization', 'Date', 'Time', 'Status'];
      const lines = [
        headers.join(','),
        ...reportData.rows.map((r) =>
          [r.referenceCode, r.patientName, r.doctorName, r.specializationName, r.date, r.timeSlot, r.status]
            .map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`)
            .join(',')
        ),
      ];
      const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `arogya-appointments-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      addToast('CSV report downloaded.', 'success');
    } catch {
      addToast('Failed to export report file.', 'error');
    } finally {
      setRepExporting(null);
    }
  };

  const handleModerateFeedback = async (id: string, status: FeedbackStatus) => {
    setFeedbackRows((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
    try {
      await updateFeedbackStatusInSupabase(id, status);
    } catch {
      // Keep optimistic state
    }
    addToast(`Feedback marked as ${status}.`, 'success');
  };

  const handleCancelWaitlistEntry = async (id: string) => {
    setWaitlistRows((prev) => prev.map((w) => (w.id === id ? { ...w, status: 'cancelled' } : w)));
    try {
      await updateWaitlistStatusInSupabase(id, 'cancelled');
    } catch {
      // Keep optimistic state
    }
    addToast('Waitlist entry cancelled.', 'info');
  };

  const handleToggleInquiryStatus = async (id: string, nextStatus: 'new' | 'reviewed') => {
    setContactMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: nextStatus } : m)));
    try {
      await updateContactMessageStatusInSupabase(id, nextStatus);
    } catch {
      // Keep optimistic state
    }
    addToast(
      nextStatus === 'reviewed'
        ? language === 'hi'
          ? 'संदेश समीक्षित चिह्नित किया गया।'
          : 'Inquiry marked as reviewed.'
        : language === 'hi'
          ? 'संदेश पुनः खोला गया।'
          : 'Inquiry reopened as new.',
      'success'
    );
  };

  const unreadInquiriesCount = useMemo(
    () => contactMessages.filter((m) => m.status === 'new').length,
    [contactMessages]
  );

  const filteredInquiries = useMemo(
    () =>
      inquiryFilter === 'all'
        ? contactMessages
        : contactMessages.filter((m) => m.status === inquiryFilter),
    [contactMessages, inquiryFilter]
  );

  const navItems: {
    id: AdminSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'overview', label: t.portal.admin.nav.overview, icon: LayoutDashboard },
    { id: 'appointments', label: t.portal.admin.nav.appointments, icon: Calendar },
    { id: 'doctors', label: t.portal.admin.nav.doctors, icon: Stethoscope },
    { id: 'staff', label: t.portal.admin.nav.staff, icon: Users },
    { id: 'patients', label: t.portal.admin.nav.patients, icon: UserCheck },
    { id: 'services', label: t.portal.admin.nav.services, icon: BriefcaseMedical },
    { id: 'schedules', label: t.portal.admin.nav.schedules, icon: Calendar },
    { id: 'reports', label: t.portal.admin.nav.reports, icon: BarChart3 },
    { id: 'feedback', label: t.portal.admin.nav.feedback, icon: MessageSquareQuote },
    { id: 'waitlist', label: t.portal.admin.nav.waitlist, icon: Bell },
    {
      id: 'inquiries',
      label: t.portal.admin.nav.inquiries,
      icon: Mail,
      badge: unreadInquiriesCount > 0 ? unreadInquiriesCount : undefined,
    },
    { id: 'seo', label: t.portal.admin.nav.seo, icon: Globe },
    { id: 'settings', label: t.portal.admin.nav.settings, icon: SettingsIcon },
  ];

  return (
    <div className="bg-[#F4F8FC] min-h-[85vh]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar */}
          <aside className="no-print lg:col-span-3 bg-white border border-[#E2EAF2] rounded-2xl p-4 shadow-xs space-y-4">
            <div className="px-2 pb-3 border-b border-[#E2EAF2]">
              <p className="text-xs font-semibold text-[#1C7ED6]">{t.portal.admin.welcome}</p>
              <p className="font-display text-base font-bold text-[#0B2D52] mt-0.5 truncate">
                {user?.name}
              </p>
              <p className="text-[11px] text-[#5C6F84] truncate">{user?.email}</p>
            </div>

            <nav aria-label="Admin sidebar" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors text-left ${
                      active
                        ? 'bg-[#0B2D52] text-white'
                        : 'text-[#10233B] hover:bg-[#F4F8FC]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate flex-1">{item.label}</span>
                    {typeof item.badge === 'number' && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md tabular-nums ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-[#1C7ED6] text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-2 border-t border-[#E2EAF2]">
              <button
                type="button"
                onClick={logout}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>{t.portal.signOut}</span>
              </button>
            </div>
          </aside>

          {/* Main Workspace */}
          <main className="lg:col-span-9 space-y-6">
            {loadError && (
              <div
                role="alert"
                className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-rose-900"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                  <span>{loadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void loadAdminData(true)}
                  className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white border border-rose-200 rounded-lg text-rose-800 hover:bg-rose-100"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}</span>
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 bg-white border border-[#E2EAF2] rounded-2xl animate-pulse" />
                  ))}
                </div>
                <div className="h-56 bg-white border border-[#E2EAF2] rounded-2xl animate-pulse" />
              </div>
            ) : (
              <>
                {section === 'overview' && (
                  <div className="space-y-6">
                    {/* Supabase Database Connection Status */}
                    <div className="bg-white border border-[#E2EAF2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#EAF3FC] text-[#1C7ED6] flex items-center justify-center shrink-0">
                          <Database className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display font-bold text-sm text-[#0B2D52]">
                              Supabase PostgreSQL
                            </span>
                            {dbHealth?.tablesReady ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                Connected &amp; Tables Active
                              </span>
                            ) : dbHealth?.configured ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                                Connected · Run supabase/schema.sql
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                                Not Configured
                              </span>
                            )}
                          </div>
                          <p className="text-[#5C6F84]">
                            {getSupabaseProjectHost()
                              ? `Project: ${getSupabaseProjectHost()}`
                              : 'Configure VITE_SUPABASE_URL & VITE_SUPABASE_PUBLISHABLE_KEY'}
                            {dbHealth && !dbHealth.tablesReady && dbHealth.missingTables.length > 0
                              ? ` · Missing tables: ${dbHealth.missingTables.join(', ')}`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void loadAdminData(true)}
                        className="self-start sm:self-center min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#EAF3FC] border border-[#E2EAF2] rounded-xl cursor-pointer shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{language === 'hi' ? 'कनेक्शन जांचें' : 'Verify Sync'}</span>
                      </button>
                    </div>

                    {/* KPI Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                      {[
                        { label: t.portal.admin.kpi.total, val: kpi.total },
                        { label: t.portal.admin.kpi.pending, val: kpi.pending },
                        { label: t.portal.admin.kpi.confirmed, val: kpi.confirmed },
                        { label: t.portal.admin.kpi.completed, val: kpi.completed },
                        { label: t.portal.admin.kpi.cancelled, val: kpi.cancelled },
                      ].map((card) => (
                        <div key={card.label} className="bg-white border border-[#E2EAF2] rounded-2xl p-4 shadow-xs">
                          <div className="text-xs text-[#5C6F84] truncate">{card.label}</div>
                          <div className="font-mono text-2xl font-bold text-[#0B2D52] tabular-nums mt-1">
                            {card.val}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Real Data Department Activity + Recent Requests */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-6 bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-4">
                        <h2 className="font-display text-base font-bold text-[#0B2D52]">
                          {language === 'hi' ? 'विभाग अनुसार अपॉइंटमेंट' : 'Appointments by Department'}
                        </h2>
                        <div className="space-y-3">
                          {deptBreakdown.map((item) => (
                            <div key={item.id} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium text-[#10233B]">{item.label}</span>
                                <span className="font-mono font-semibold text-[#0B2D52] tabular-nums">
                                  {item.count}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-[#F4F8FC] overflow-hidden border border-[#E2EAF2]">
                                <div
                                  className="h-full bg-[#1C7ED6] rounded-full transition-all"
                                  style={{ width: `${Math.round((item.count / maxDeptCount) * 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="lg:col-span-6 bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="font-display text-base font-bold text-[#0B2D52]">
                            {language === 'hi' ? 'हाल के लंबित अनुरोध' : 'Recent Pending Requests'}
                          </h2>
                          <button
                            type="button"
                            onClick={() => setSection('appointments')}
                            className="text-xs font-semibold text-[#1C7ED6] hover:underline"
                          >
                            {language === 'hi' ? 'सभी देखें' : 'View All'}
                          </button>
                        </div>
                        <div className="divide-y divide-[#E2EAF2]">
                          {appointments
                            .filter((a) => a.status === 'pending')
                            .slice(0, 4)
                            .map((a) => (
                              <div key={a.id} className="py-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[#0B2D52] truncate">
                                    {a.patientName}
                                  </p>
                                  <p className="text-xs text-[#5C6F84] font-mono tabular-nums">
                                    {a.date} · {a.timeSlot}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateApptStatus(a.id, 'confirmed')}
                                  className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-lg shrink-0 transition-colors"
                                >
                                  {t.portal.doctor.confirm}
                                </button>
                              </div>
                            ))}
                          {appointments.filter((a) => a.status === 'pending').length === 0 && (
                            <p className="text-sm text-[#5C6F84] py-4">
                              {language === 'hi' ? 'कोई लंबित अनुरोध नहीं।' : 'No pending requests.'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recent Admin & Clinic Audit Activity */}
                    <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#1C7ED6]" aria-hidden="true" />
                          <h2 className="font-display text-base font-bold text-[#0B2D52]">
                            {language === 'hi' ? 'हाल की क्लिनिक ऑडिट गतिविधियाँ' : 'Recent Clinic & Admin Audit Trail'}
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => void loadAdminData(true)}
                          className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#EAF3FC] border border-[#E2EAF2] rounded-lg transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{language === 'hi' ? 'रीफ़्रेश करें' : 'Refresh'}</span>
                        </button>
                      </div>
                      {auditLogs.length === 0 ? (
                        <p className="text-xs text-[#5C6F84]">
                          {language === 'hi' ? 'अभी तक कोई ऑडिट प्रविष्टि नहीं है।' : 'No recent audit events recorded.'}
                        </p>
                      ) : (
                        <div className="border border-[#E2EAF2] rounded-xl overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-[#F4F8FC] border-b border-[#E2EAF2] font-semibold text-[#5C6F84]">
                                <th className="px-3 py-2.5 whitespace-nowrap">
                                  {language === 'hi' ? 'समय' : 'Timestamp'}
                                </th>
                                <th className="px-3 py-2.5 whitespace-nowrap">
                                  {language === 'hi' ? 'उपयोगकर्ता' : 'Actor'}
                                </th>
                                <th className="px-3 py-2.5 whitespace-nowrap">
                                  {language === 'hi' ? 'गतिविधि' : 'Action'}
                                </th>
                                <th className="px-3 py-2.5">
                                  {language === 'hi' ? 'विवरण' : 'Details'}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2EAF2]">
                              {auditLogs.slice(0, 10).map((log) => (
                                <tr key={log.id}>
                                  <td className="px-3 py-2 font-mono tabular-nums whitespace-nowrap text-[#5C6F84]">
                                    {log.createdAt.slice(0, 19).replace('T', ' ')}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <span className="font-medium text-[#0B2D52]">{log.actorEmail}</span>{' '}
                                    <span className="text-[10px] uppercase text-[#5C6F84]">({log.actorRole})</span>
                                  </td>
                                  <td className="px-3 py-2 font-mono font-semibold text-[#1C7ED6] whitespace-nowrap">
                                    {log.action}
                                  </td>
                                  <td className="px-3 py-2 text-[#10233B] min-w-[240px]">{log.details}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {section === 'appointments' && (
                  <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                        {t.portal.admin.nav.appointments}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        <div className="relative flex-1 sm:flex-initial">
                          <Search className="w-4 h-4 text-[#5C6F84] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                          <input
                            type="search"
                            value={search}
                            onChange={(e) => {
                              setSearch(e.target.value);
                              setPage(1);
                            }}
                            placeholder="Search patient or ref..."
                            aria-label="Search appointments"
                            className="w-full min-h-[40px] pl-9 pr-3 py-1.5 text-xs border border-[#E2EAF2] rounded-xl"
                          />
                        </div>
                        <select
                          value={statusFilter}
                          onChange={(e) => {
                            setStatusFilter(e.target.value as typeof statusFilter);
                            setPage(1);
                          }}
                          aria-label="Filter by status"
                          className="min-h-[40px] px-3 py-1.5 text-xs border border-[#E2EAF2] rounded-xl"
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="rejected">Rejected</option>
                          <option value="missed">Missed / No-Show</option>
                        </select>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                          aria-label="Sort appointments"
                          className="min-h-[40px] px-3 py-1.5 text-xs border border-[#E2EAF2] rounded-xl"
                        >
                          <option value="date_desc">Newest Date</option>
                          <option value="date_asc">Earliest Date</option>
                          <option value="patient">Patient Name</option>
                        </select>
                      </div>
                    </div>

                    {pagedAppointments.length === 0 ? (
                      <div className="border border-[#E2EAF2] rounded-xl p-8 text-center space-y-2 bg-[#F4F8FC]">
                        <p className="text-sm text-[#5C6F84]">No matching appointments found.</p>
                        {(search || statusFilter !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearch('');
                              setStatusFilter('all');
                              setPage(1);
                            }}
                            className="text-xs font-semibold text-[#1C7ED6] hover:underline"
                          >
                            Reset filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Mobile Card List */}
                        <div className="md:hidden space-y-3">
                          {pagedAppointments.map((a) => {
                            const doc = doctors.find((d) => d.id === a.doctorId);
                            return (
                              <div key={a.id} className="border border-[#E2EAF2] rounded-xl p-4 space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <StatusIndicator status={a.status} language={language} />
                                  <span className="font-mono text-xs text-[#5C6F84] tabular-nums">
                                    {a.referenceCode}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-[#0B2D52]">{a.patientName}</p>
                                  <p className="text-xs text-[#5C6F84] font-mono tabular-nums">
                                    {a.patientPhone} · {a.date} {a.timeSlot}
                                  </p>
                                  <p className="text-xs text-[#1C7ED6] mt-0.5">
                                    {doc ? (language === 'hi' ? doc.nameHi : doc.name) : a.doctorId}
                                  </p>
                                </div>
                                {(a.status === 'pending' || a.status === 'confirmed' || a.status === 'completed') && (
                                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E2EAF2]">
                                    <button
                                      type="button"
                                      onClick={() => setSlipAppointmentId(a.id)}
                                      className="min-h-[36px] px-3 py-1 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] border border-[#E2EAF2] rounded-lg"
                                    >
                                      Slip / PDF
                                    </button>
                                    {a.status === 'pending' && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateApptStatus(a.id, 'confirmed')}
                                        className="min-h-[36px] px-3 py-1 text-xs font-semibold text-white bg-[#1C7ED6] rounded-lg"
                                      >
                                        Confirm
                                      </button>
                                    )}
                                    {(a.status === 'pending' || a.status === 'confirmed') && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateApptStatus(a.id, 'cancelled')}
                                        className="min-h-[36px] px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto border border-[#E2EAF2] rounded-xl">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-[#F4F8FC] border-b border-[#E2EAF2] text-xs font-semibold text-[#5C6F84]">
                                <th className="px-4 py-3">Ref</th>
                                <th className="px-4 py-3">Patient</th>
                                <th className="px-4 py-3">Doctor</th>
                                <th className="px-4 py-3">Date & Time</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2EAF2]">
                              {pagedAppointments.map((a) => {
                                const doc = doctors.find((d) => d.id === a.doctorId);
                                return (
                                  <tr key={a.id} className="hover:bg-[#F4F8FC]/60">
                                    <td className="px-4 py-3 font-mono text-xs tabular-nums">{a.referenceCode}</td>
                                    <td className="px-4 py-3">
                                      <div className="font-semibold text-[#0B2D52]">{a.patientName}</div>
                                      <div className="text-xs text-[#5C6F84]">{a.patientPhone}</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-[#10233B]">
                                      {doc ? (language === 'hi' ? doc.nameHi : doc.name) : a.doctorId}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs tabular-nums">
                                      {a.date} · {a.timeSlot}
                                    </td>
                                    <td className="px-4 py-3">
                                      <StatusIndicator status={a.status} language={language} />
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                                      {(a.status === 'pending' || a.status === 'confirmed' || a.status === 'completed') && (
                                        <button
                                          type="button"
                                          onClick={() => setSlipAppointmentId(a.id)}
                                          className="px-2.5 py-1 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#EAF3FC] border border-[#E2EAF2] rounded-md"
                                        >
                                          <FileText className="w-3 h-3 inline mr-1" aria-hidden="true" />
                                          Slip
                                        </button>
                                      )}
                                      {a.status === 'pending' && (
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateApptStatus(a.id, 'confirmed')}
                                          className="px-2.5 py-1 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-md"
                                        >
                                          Confirm
                                        </button>
                                      )}
                                      {(a.status === 'pending' || a.status === 'confirmed') && (
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateApptStatus(a.id, 'cancelled')}
                                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between text-xs text-[#5C6F84]">
                      <span className="tabular-nums">
                        Page {page} of {totalPages} ({filteredAppointments.length} records)
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                          className="min-h-[36px] px-3 py-1.5 border border-[#E2EAF2] rounded-lg disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => p + 1)}
                          className="min-h-[36px] px-3 py-1.5 border border-[#E2EAF2] rounded-lg disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {section === 'doctors' && (
                  <div className="space-y-6">
                    <form
                      onSubmit={handleAddDoctor}
                      className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-4"
                    >
                      <h2 className="font-display text-lg font-bold text-[#0B2D52] flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[#1C7ED6]" aria-hidden="true" />
                        <span>Add Specialist Doctor</span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#0B2D52]">Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="Doctor Full Name"
                            value={newDocName}
                            onChange={(e) => setNewDocName(e.target.value)}
                            className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#0B2D52]">Department *</label>
                          <select
                            value={newDocSpec}
                            onChange={(e) => setNewDocSpec(e.target.value)}
                            className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                          >
                            {specializations.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#0B2D52]">Qualification *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. MBBS, MD"
                            value={newDocQual}
                            onChange={(e) => setNewDocQual(e.target.value)}
                            className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[#0B2D52]">Fee (INR) *</label>
                          <input
                            type="number"
                            min="100"
                            placeholder="800"
                            value={newDocFee}
                            onChange={(e) => setNewDocFee(e.target.value)}
                            className="w-full min-h-[42px] px-3 py-2 text-sm font-mono border border-[#E2EAF2] rounded-xl"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
                      >
                        Add Doctor
                      </button>
                    </form>

                    <div className="bg-white border border-[#E2EAF2] rounded-2xl shadow-xs divide-y divide-[#E2EAF2]">
                      {doctors.map((d) => (
                        <div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="font-display text-sm font-bold text-[#0B2D52]">{d.name}</h3>
                            <p className="text-xs text-[#5C6F84]">
                              {d.qualification} · ₹{d.consultationFee}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleDoctorActive(d)}
                            className={`self-start sm:self-auto min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                              d.active
                                ? 'bg-[#EAF3FC] text-[#0B2D52] border-[#C5DDF8]'
                                : 'bg-slate-100 text-[#5C6F84] border-[#E2EAF2]'
                            }`}
                          >
                            {d.active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {section === 'staff' && (
                  <div className="space-y-6">
                    <form
                      onSubmit={handleAddStaff}
                      className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-4"
                    >
                      <h2 className="font-display text-lg font-bold text-[#0B2D52]">
                        Create Staff / Account User
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          aria-label="Full Name"
                          value={newStaffName}
                          onChange={(e) => setNewStaffName(e.target.value)}
                          className="min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                        />
                        <input
                          type="email"
                          required
                          placeholder="Email"
                          aria-label="Email"
                          value={newStaffEmail}
                          onChange={(e) => setNewStaffEmail(e.target.value)}
                          className="min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="Phone"
                          aria-label="Phone"
                          value={newStaffPhone}
                          onChange={(e) => setNewStaffPhone(e.target.value)}
                          className="min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                        />
                        <select
                          value={newStaffRole}
                          aria-label="User Role"
                          onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                          className="min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                        >
                          <option value="staff">Staff</option>
                          <option value="doctor">Doctor</option>
                          <option value="admin">Admin</option>
                          <option value="patient">Patient</option>
                        </select>
                        <input
                          type="password"
                          required
                          minLength={6}
                          placeholder="Password (min 6 chars)"
                          aria-label="Password"
                          value={newStaffPass}
                          onChange={(e) => setNewStaffPass(e.target.value)}
                          className="min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                        />
                      </div>
                      <button
                        type="submit"
                        className="min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] rounded-xl transition-colors"
                      >
                        Create User
                      </button>
                    </form>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-2.5">
                      {users.map((u) => (
                        <div key={u.id} className="bg-white border border-[#E2EAF2] rounded-xl p-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-[#0B2D52] truncate">{u.name}</p>
                            <p className="text-xs text-[#5C6F84] truncate">{u.email}</p>
                            <p className="text-xs font-mono text-[#5C6F84] tabular-nums">{u.phone}</p>
                          </div>
                          <span className="text-xs font-semibold uppercase text-[#1C7ED6] bg-[#EAF3FC] px-2.5 py-1 rounded-lg shrink-0">
                            {u.role}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white border border-[#E2EAF2] rounded-2xl overflow-x-auto shadow-xs">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-[#F4F8FC] border-b border-[#E2EAF2] text-xs font-semibold text-[#5C6F84]">
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2EAF2]">
                          {users.map((u) => (
                            <tr key={u.id}>
                              <td className="px-4 py-3 font-semibold text-[#0B2D52]">{u.name}</td>
                              <td className="px-4 py-3 text-xs text-[#5C6F84]">{u.email}</td>
                              <td className="px-4 py-3 font-mono text-xs tabular-nums">{u.phone}</td>
                              <td className="px-4 py-3 text-xs font-semibold uppercase text-[#1C7ED6]">{u.role}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {section === 'patients' && (
                  <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-4">
                    <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                      {t.portal.admin.nav.patients}
                    </h2>
                    {uniquePatients.length === 0 ? (
                      <p className="text-sm text-[#5C6F84]">No patient records found yet.</p>
                    ) : (
                      <>
                        <div className="md:hidden space-y-2.5">
                          {uniquePatients.map((p) => (
                            <div key={p.email} className="border border-[#E2EAF2] rounded-xl p-4 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-[#0B2D52] truncate">{p.name}</p>
                                <p className="text-xs text-[#5C6F84] truncate">{p.email}</p>
                                <p className="text-xs font-mono text-[#5C6F84] tabular-nums">{p.phone}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="block text-[11px] text-[#5C6F84]">Visits</span>
                                <span className="font-mono font-bold text-sm text-[#0B2D52] tabular-nums">
                                  {p.visits}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="hidden md:block overflow-x-auto border border-[#E2EAF2] rounded-xl">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-[#F4F8FC] border-b border-[#E2EAF2] text-xs font-semibold text-[#5C6F84]">
                                <th className="px-4 py-3">Patient</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Phone</th>
                                <th className="px-4 py-3 text-right">Appointments</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2EAF2]">
                              {uniquePatients.map((p) => (
                                <tr key={p.email}>
                                  <td className="px-4 py-3 font-semibold text-[#0B2D52]">{p.name}</td>
                                  <td className="px-4 py-3 text-xs text-[#5C6F84]">{p.email}</td>
                                  <td className="px-4 py-3 font-mono text-xs tabular-nums">{p.phone}</td>
                                  <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold">
                                    {p.visits}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {section === 'services' && (
                  <div className="space-y-6">
                    <form
                      onSubmit={handleAddSpec}
                      className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-4"
                    >
                      <h2 className="font-display text-lg font-bold text-[#0B2D52]">
                        Add Medical Specialization / Service
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Department Name"
                          aria-label="Department Name"
                          value={newSpecName}
                          onChange={(e) => setNewSpecName(e.target.value)}
                          className="min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Short Description"
                          aria-label="Short Description"
                          value={newSpecDesc}
                          onChange={(e) => setNewSpecDesc(e.target.value)}
                          className="min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                        />
                      </div>
                      <button
                        type="submit"
                        className="min-h-[42px] px-5 py-2 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
                      >
                        Add Service
                      </button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {specializations.map((s) => (
                        <div key={s.id} className="bg-white border border-[#E2EAF2] rounded-2xl p-5 shadow-xs space-y-1.5">
                          <h3 className="font-display text-base font-bold text-[#0B2D52]">{s.name}</h3>
                          <p className="text-xs text-[#5C6F84] leading-relaxed">{s.shortDescription}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {section === 'schedules' && (
                  <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-4">
                    <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                      {t.portal.admin.nav.schedules}
                    </h2>
                    <div className="divide-y divide-[#E2EAF2]">
                      {doctors.map((d) => (
                        <div key={d.id} className="py-4 space-y-2">
                          <h3 className="font-display text-sm font-bold text-[#0B2D52]">{d.name}</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                            {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((day) => {
                              const slot = d.schedule[day];
                              return (
                                <div key={day} className="border border-[#E2EAF2] rounded-lg p-2 bg-[#F4F8FC]">
                                  <div className="font-semibold uppercase text-[#5C6F84]">{day}</div>
                                  <div className="font-mono text-[#0B2D52] mt-0.5 tabular-nums">
                                    {slot.enabled ? `${slot.start}-${slot.end}` : 'Off'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {section === 'reports' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
                        <div>
                          <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                            {t.portal.admin.nav.reports}
                          </h2>
                          <p className="text-xs text-[#5C6F84]">
                            Real clinic database report with date, doctor, department, status filters & audit-logged exports.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0B2D52] bg-white hover:bg-[#F4F8FC] border border-[#CBD5E1] rounded-xl cursor-pointer"
                          >
                            <Printer className="w-4 h-4" aria-hidden="true" />
                            <span>Print Report</span>
                          </button>
                          <button
                            type="button"
                            disabled={repExporting !== null}
                            onClick={() => void handleServerExport('csv')}
                            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#071A30] disabled:opacity-60 rounded-xl cursor-pointer"
                          >
                            <Download className="w-4 h-4" aria-hidden="true" />
                            <span>{repExporting === 'csv' ? 'Exporting...' : 'Export CSV'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={repExporting !== null}
                            onClick={() => void handleServerExport('xlsx')}
                            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] disabled:opacity-60 rounded-xl cursor-pointer"
                          >
                            <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
                            <span>{repExporting === 'xlsx' ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Report Filter Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-[#F8FBFF] border border-[#E2EAF2] rounded-xl p-4 no-print">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#5C6F84]">Start Date</label>
                          <input
                            type="date"
                            value={repStartDate}
                            onChange={(e) => setRepStartDate(e.target.value)}
                            className="w-full min-h-[38px] px-2.5 py-1.5 text-xs font-mono bg-white border border-[#E2EAF2] rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#5C6F84]">End Date</label>
                          <input
                            type="date"
                            value={repEndDate}
                            onChange={(e) => setRepEndDate(e.target.value)}
                            className="w-full min-h-[38px] px-2.5 py-1.5 text-xs font-mono bg-white border border-[#E2EAF2] rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#5C6F84]">Doctor</label>
                          <select
                            value={repDoctorId}
                            onChange={(e) => setRepDoctorId(e.target.value)}
                            className="w-full min-h-[38px] px-2.5 py-1.5 text-xs bg-white border border-[#E2EAF2] rounded-lg"
                          >
                            <option value="all">All Doctors</option>
                            {doctors.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#5C6F84]">Specialization</label>
                          <select
                            value={repSpecId}
                            onChange={(e) => setRepSpecId(e.target.value)}
                            className="w-full min-h-[38px] px-2.5 py-1.5 text-xs bg-white border border-[#E2EAF2] rounded-lg"
                          >
                            <option value="all">All Departments</option>
                            {specializations.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#5C6F84]">Status</label>
                          <select
                            value={repStatus}
                            onChange={(e) => setRepStatus(e.target.value as 'all' | AppointmentStatus)}
                            className="w-full min-h-[38px] px-2.5 py-1.5 text-xs bg-white border border-[#E2EAF2] rounded-lg"
                          >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rejected">Rejected</option>
                            <option value="missed">Missed / No-Show</option>
                          </select>
                        </div>
                        <div className="space-y-1 flex flex-col justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setRepStartDate('');
                              setRepEndDate('');
                              setRepDoctorId('all');
                              setRepSpecId('all');
                              setRepStatus('all');
                              setRepSearch('');
                            }}
                            className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1C7ED6] bg-white border border-[#E2EAF2] hover:bg-[#EAF3FC] rounded-lg cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Clear Filters</span>
                          </button>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-6 relative">
                          <Search className="w-4 h-4 text-[#5C6F84] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                          <input
                            type="search"
                            value={repSearch}
                            onChange={(e) => setRepSearch(e.target.value)}
                            placeholder="Filter by reference code, patient name, or doctor name..."
                            className="w-full min-h-[38px] pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E2EAF2] rounded-lg"
                          />
                        </div>
                      </div>

                      {repLoading ? (
                        <div className="py-8 text-center text-sm text-[#5C6F84]">Loading live report metrics...</div>
                      ) : reportData ? (
                        <div className="space-y-6 print-area">
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                            {[
                              { label: 'Total', val: reportData.summary.total },
                              { label: 'Pending', val: reportData.summary.pending },
                              { label: 'Confirmed', val: reportData.summary.confirmed },
                              { label: 'Completed', val: reportData.summary.completed },
                              { label: 'Cancelled', val: reportData.summary.cancelled },
                              { label: 'Rejected', val: reportData.summary.rejected },
                              { label: 'Missed', val: reportData.summary.missed },
                            ].map((card) => (
                              <div
                                key={card.label}
                                className="rounded-xl border border-[#E2EAF2] bg-[#F8FBFF] p-3"
                              >
                                <div className="text-[11px] text-[#5C6F84]">{card.label}</div>
                                <div className="font-mono text-xl font-bold text-[#0B2D52] tabular-nums mt-0.5">
                                  {card.val}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Doctor-wise Distribution */}
                          <div className="border border-[#E2EAF2] rounded-xl overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[#F4F8FC] border-b border-[#E2EAF2] font-semibold text-[#5C6F84]">
                                  <th className="px-3.5 py-2.5">Doctor</th>
                                  <th className="px-3.5 py-2.5">Department</th>
                                  <th className="px-3.5 py-2.5 text-right">Total</th>
                                  <th className="px-3.5 py-2.5 text-right">Confirmed</th>
                                  <th className="px-3.5 py-2.5 text-right">Completed</th>
                                  <th className="px-3.5 py-2.5 text-right">Pending</th>
                                  <th className="px-3.5 py-2.5 text-right">Cancelled</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E2EAF2]">
                                {reportData.doctorDistribution.map((d) => (
                                  <tr key={d.doctorId}>
                                    <td className="px-3.5 py-2.5 font-semibold text-[#0B2D52]">
                                      {d.doctorName}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-[#5C6F84]">{d.specializationName}</td>
                                    <td className="px-3.5 py-2.5 text-right font-mono font-bold tabular-nums">
                                      {d.total}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                                      {d.confirmed}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                                      {d.completed}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                                      {d.pending}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                                      {d.cancelled}
                                    </td>
                                  </tr>
                                ))}
                                {reportData.doctorDistribution.length === 0 && (
                                  <tr>
                                    <td colSpan={7} className="px-4 py-6 text-center text-[#5C6F84]">
                                      No appointment records match the selected filters.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Filtered Appointment Rows */}
                          <div className="border border-[#E2EAF2] rounded-xl overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[#F4F8FC] border-b border-[#E2EAF2] font-semibold text-[#5C6F84]">
                                  <th className="px-3.5 py-2.5">Ref</th>
                                  <th className="px-3.5 py-2.5">Patient Name</th>
                                  <th className="px-3.5 py-2.5">Doctor</th>
                                  <th className="px-3.5 py-2.5">Specialization</th>
                                  <th className="px-3.5 py-2.5">Date & Time</th>
                                  <th className="px-3.5 py-2.5">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E2EAF2]">
                                {reportData.rows.map((r) => (
                                  <tr key={r.id}>
                                    <td className="px-3.5 py-2.5 font-mono tabular-nums">{r.referenceCode}</td>
                                    <td className="px-3.5 py-2.5 font-semibold text-[#0B2D52]">{r.patientName}</td>
                                    <td className="px-3.5 py-2.5">{r.doctorName}</td>
                                    <td className="px-3.5 py-2.5 text-[#5C6F84]">{r.specializationName}</td>
                                    <td className="px-3.5 py-2.5 font-mono tabular-nums">
                                      {r.date} · {r.timeSlot}
                                    </td>
                                    <td className="px-3.5 py-2.5">
                                      <StatusIndicator status={r.status} language={language} />
                                    </td>
                                  </tr>
                                ))}
                                {reportData.rows.length === 0 && (
                                  <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-[#5C6F84]">
                                      No appointment records match the selected filters.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {section === 'feedback' && (
                  <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                          Verified Patient Feedback Moderation
                        </h2>
                        <p className="text-xs text-[#5C6F84]">
                          Only verified completed-visit reviews with public consent appear on the website once approved.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void loadAdminFeedback()}
                        className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] border border-[#E2EAF2] rounded-xl cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {feedbackLoading ? (
                      <div className="py-8 text-center text-sm text-[#5C6F84]">Loading feedback submissions...</div>
                    ) : feedbackRows.length === 0 ? (
                      <div className="border border-[#E2EAF2] rounded-xl p-8 text-center text-sm text-[#5C6F84] bg-[#F8FBFF]">
                        No verified patient feedback submissions yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {feedbackRows.map((fb) => (
                          <div
                            key={fb.id}
                            className="border border-[#E2EAF2] rounded-xl p-4 bg-[#F8FBFF] flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                                  {Array.from({ length: fb.rating }).map((_, idx) => (
                                    <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  ))}
                                </span>
                                <span className="font-mono text-[#5C6F84]">{fb.appointmentReference}</span>
                                <span className="font-semibold text-[#0B2D52]">{fb.patientName}</span>
                                <span className="text-[#1C7ED6]">{fb.doctorName}</span>
                                <span
                                  className={`rounded px-2 py-0.5 font-semibold border ${
                                    fb.status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : fb.status === 'pending_review'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-slate-100 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  {fb.status}
                                </span>
                                <span className="text-[#5C6F84]">
                                  {fb.publicConsent ? 'Public consent: Yes' : 'Private only'}
                                </span>
                              </div>
                              <p className="text-sm text-[#10233B]">“{fb.comment}”</p>
                              {fb.doctorFeedback && (
                                <p className="text-xs text-[#5C6F84]">Doctor note: {fb.doctorFeedback}</p>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => void handleModerateFeedback(fb.id, 'approved')}
                                className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleModerateFeedback(fb.id, 'hidden')}
                                className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#0B2D52] bg-white border border-[#CBD5E1] hover:bg-slate-50 rounded-lg cursor-pointer"
                              >
                                Hide
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleModerateFeedback(fb.id, 'rejected')}
                                className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {section === 'waitlist' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                            Smart Appointment Waitlist Queue
                          </h2>
                          <p className="text-xs text-[#5C6F84]">
                            FIFO slot-opening notifications triggered only upon verified appointment cancellations/rejections.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void loadAdminWaitlist()}
                          className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B2D52] bg-[#F4F8FC] border border-[#E2EAF2] rounded-xl cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Refresh</span>
                        </button>
                      </div>

                      {channelStatus && (
                        <div className="rounded-xl border border-[#E2EAF2] bg-[#F8FBFF] p-3.5 text-xs flex flex-wrap gap-3">
                          <span className="font-semibold text-[#0B2D52]">Delivery Channels:</span>
                          <span className="text-emerald-800 font-medium">In-App Portal: Active</span>
                          <span className={channelStatus.whatsapp.configured ? 'text-emerald-800' : 'text-amber-800'}>
                            WhatsApp: {channelStatus.whatsapp.configured ? 'Configured' : 'Not configured (falls back to In-App)'}
                          </span>
                          <span className={channelStatus.sms.configured ? 'text-emerald-800' : 'text-amber-800'}>
                            SMS: {channelStatus.sms.configured ? 'Configured' : 'Not configured (falls back to In-App)'}
                          </span>
                          <span className={channelStatus.email.configured ? 'text-emerald-800' : 'text-amber-800'}>
                            Email: {channelStatus.email.configured ? 'Configured' : 'Not configured (falls back to In-App)'}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input
                          type="search"
                          value={waitFilterSearch}
                          onChange={(e) => setWaitFilterSearch(e.target.value)}
                          placeholder="Search patient or doctor..."
                          className="min-h-[38px] px-3 py-1.5 text-xs bg-[#F8FBFF] border border-[#E2EAF2] rounded-lg"
                        />
                        <select
                          value={waitFilterDoc}
                          onChange={(e) => setWaitFilterDoc(e.target.value)}
                          className="min-h-[38px] px-3 py-1.5 text-xs bg-[#F8FBFF] border border-[#E2EAF2] rounded-lg"
                        >
                          <option value="all">All Doctors</option>
                          {doctors.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={waitFilterStatus}
                          onChange={(e) => setWaitFilterStatus(e.target.value)}
                          className="min-h-[38px] px-3 py-1.5 text-xs bg-[#F8FBFF] border border-[#E2EAF2] rounded-lg"
                        >
                          <option value="all">All Waitlist Statuses</option>
                          <option value="active">Active</option>
                          <option value="notified">Notified</option>
                          <option value="booked">Booked</option>
                          <option value="withdrawn">Withdrawn</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <input
                          type="date"
                          value={waitFilterDate}
                          onChange={(e) => setWaitFilterDate(e.target.value)}
                          className="min-h-[38px] px-3 py-1.5 text-xs font-mono bg-[#F8FBFF] border border-[#E2EAF2] rounded-lg"
                        />
                      </div>

                      {waitLoading ? (
                        <div className="py-8 text-center text-sm text-[#5C6F84]">Loading waitlist entries...</div>
                      ) : waitlistRows.length === 0 ? (
                        <div className="border border-[#E2EAF2] rounded-xl p-8 text-center text-sm text-[#5C6F84] bg-[#F8FBFF]">
                          No waitlist entries match the current filters.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {waitlistRows.map((w) => (
                            <div
                              key={w.id}
                              className="border border-[#E2EAF2] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FBFF]"
                            >
                              <div className="space-y-1 text-xs">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-sm text-[#0B2D52]">{w.patientName}</span>
                                  <span className="font-mono text-[#5C6F84]">{w.patientPhone}</span>
                                  <span className="rounded border border-[#C5DDF8] bg-white px-2 py-0.5 font-semibold text-[#0B2D52]">
                                    {w.status}
                                  </span>
                                </div>
                                <p className="text-[#1C7ED6] font-medium">
                                  {w.doctorName} · {w.specializationName}
                                </p>
                                <p className="text-[#5C6F84] font-mono">
                                  Preferred: {w.preferredDate}
                                  {w.preferredEndDate ? ` → ${w.preferredEndDate}` : ''} · Range:{' '}
                                  {w.preferredTimeRange} · Channel: {w.notificationPreference}
                                </p>
                                {w.notifiedSlot && (
                                  <p className="text-emerald-800 font-medium">
                                    Notified for {w.notifiedSlot.date} · {w.notifiedSlot.timeSlot}
                                  </p>
                                )}
                              </div>
                              {(w.status === 'active' || w.status === 'notified') && (
                                <button
                                  type="button"
                                  onClick={() => void handleCancelWaitlistEntry(w.id)}
                                  className="self-start sm:self-center min-h-[36px] px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                                >
                                  Cancel Entry
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Waitlist Notification Delivery Logs */}
                    <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-3">
                      <h3 className="font-display text-base font-bold text-[#0B2D52]">
                        Waitlist Notification Logs
                      </h3>
                      {waitlistLogs.length === 0 ? (
                        <p className="text-xs text-[#5C6F84]">No waitlist notifications dispatched yet.</p>
                      ) : (
                        <div className="border border-[#E2EAF2] rounded-xl overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-[#F4F8FC] border-b border-[#E2EAF2] font-semibold text-[#5C6F84]">
                                <th className="px-3 py-2">Timestamp</th>
                                <th className="px-3 py-2">Slot</th>
                                <th className="px-3 py-2">Channel</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Detail</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2EAF2]">
                              {waitlistLogs.map((log) => (
                                <tr key={log.id}>
                                  <td className="px-3 py-2 font-mono tabular-nums">
                                    {log.createdAt.slice(0, 19).replace('T', ' ')}
                                  </td>
                                  <td className="px-3 py-2 font-mono tabular-nums">
                                    {log.date} · {log.timeSlot}
                                  </td>
                                  <td className="px-3 py-2 uppercase font-semibold">{log.channel}</td>
                                  <td className="px-3 py-2 font-semibold">{log.deliveryStatus}</td>
                                  <td className="px-3 py-2 text-[#5C6F84]">{log.detail}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {section === 'inquiries' && (
                  <div className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                          {t.portal.admin.nav.inquiries}
                        </h2>
                        <p className="text-xs text-[#5C6F84] mt-0.5">
                          {language === 'hi'
                            ? 'क्लिनिक संपर्क फ़ॉर्म से प्राप्त रोगी संदेश और स्थिति प्रबंधन।'
                            : 'Messages submitted from the public clinic contact desk form.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(['all', 'new', 'reviewed'] as const).map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setInquiryFilter(tab)}
                            className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                              inquiryFilter === tab
                                ? 'bg-[#0B2D52] text-white border-[#0B2D52]'
                                : 'bg-[#F4F8FC] text-[#10233B] border-[#E2EAF2] hover:bg-[#EAF3FC]'
                            }`}
                          >
                            {tab === 'all'
                              ? language === 'hi'
                                ? `सभी (${contactMessages.length})`
                                : `All (${contactMessages.length})`
                              : tab === 'new'
                                ? language === 'hi'
                                  ? `नए (${unreadInquiriesCount})`
                                  : `New (${unreadInquiriesCount})`
                                : language === 'hi'
                                  ? `समीक्षित (${contactMessages.length - unreadInquiriesCount})`
                                  : `Reviewed (${contactMessages.length - unreadInquiriesCount})`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {filteredInquiries.length === 0 ? (
                      <div className="border border-[#E2EAF2] rounded-xl p-8 text-center bg-[#F4F8FC]">
                        <p className="text-sm text-[#5C6F84]">
                          {language === 'hi' ? 'कोई संपर्क संदेश नहीं मिला।' : 'No contact inquiries match this filter.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredInquiries.map((msg) => (
                          <div
                            key={msg.id}
                            className="border border-[#E2EAF2] rounded-xl p-4 flex flex-col md:flex-row md:items-start justify-between gap-4"
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${
                                    msg.status === 'new'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {msg.status === 'new'
                                    ? language === 'hi'
                                      ? 'नया संदेश'
                                      : 'New'
                                    : language === 'hi'
                                      ? 'समीक्षित'
                                      : 'Reviewed'}
                                </span>
                                <span className="font-semibold text-sm text-[#0B2D52]">{msg.subject}</span>
                                <span className="font-mono text-[11px] text-[#5C6F84] tabular-nums">
                                  {msg.createdAt.slice(0, 16).replace('T', ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-[#5C6F84]">
                                <strong className="text-[#10233B]">{msg.name}</strong> · {msg.email}
                                {msg.phone ? ` · ${msg.phone}` : ''}
                              </p>
                              <p className="text-sm text-[#10233B] leading-relaxed">{msg.message}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                void handleToggleInquiryStatus(
                                  msg.id,
                                  msg.status === 'new' ? 'reviewed' : 'new'
                                )
                              }
                              className={`self-start min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-xl border shrink-0 transition-colors ${
                                msg.status === 'new'
                                  ? 'text-white bg-[#1C7ED6] hover:bg-[#1868B2] border-[#1C7ED6]'
                                  : 'text-[#0B2D52] bg-[#F4F8FC] hover:bg-[#EAF3FC] border-[#E2EAF2]'
                              }`}
                            >
                              {msg.status === 'new'
                                ? language === 'hi'
                                  ? 'समीक्षित चिह्नित करें'
                                  : 'Mark Reviewed'
                                : language === 'hi'
                                  ? 'पुनः खोलें'
                                  : 'Reopen'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {section === 'seo' && (
                  <AdminSeoPanel
                    settingsForm={settingsForm}
                    setSettingsForm={setSettingsForm}
                    doctors={doctors}
                    specializations={specializations}
                  />
                )}

                {section === 'settings' && settingsForm && (
                  <form
                    onSubmit={handleSaveSettings}
                    className="bg-white border border-[#E2EAF2] rounded-2xl p-6 shadow-xs space-y-4"
                  >
                    <h2 className="font-display text-xl font-bold text-[#0B2D52]">
                      {t.portal.admin.nav.settings}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="set-phone" className="text-xs font-semibold text-[#0B2D52]">Clinic Phone</label>
                        <input
                          id="set-phone"
                          type="text"
                          value={settingsForm.phone}
                          onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                          className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="set-email" className="text-xs font-semibold text-[#0B2D52]">Clinic Email</label>
                        <input
                          id="set-email"
                          type="email"
                          value={settingsForm.email}
                          onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                          className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label htmlFor="set-addr" className="text-xs font-semibold text-[#0B2D52]">Address (EN)</label>
                        <input
                          id="set-addr"
                          type="text"
                          value={settingsForm.address}
                          onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                          className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label htmlFor="set-hrs" className="text-xs font-semibold text-[#0B2D52]">OPD Hours (EN)</label>
                        <input
                          id="set-hrs"
                          type="text"
                          value={settingsForm.hours}
                          onChange={(e) => setSettingsForm({ ...settingsForm, hours: e.target.value })}
                          className="w-full min-h-[42px] px-3 py-2 text-sm border border-[#E2EAF2] rounded-xl"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-[#1C7ED6] hover:bg-[#1868B2] rounded-xl transition-colors"
                    >
                      Save Clinic Settings
                    </button>
                  </form>
                )}
              </>
            )}
          </main>
        </div>
      </div>
      <AppointmentSlipModal
        appointmentId={slipAppointmentId}
        onClose={() => setSlipAppointmentId(null)}
      />
    </div>
  );
}
