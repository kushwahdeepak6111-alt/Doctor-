import crypto from 'node:crypto';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import * as XLSX from 'xlsx';
import {
  hashPassword,
  readDb,
  sanitizeUser,
  verifyPassword,
  writeDb,
  type ClinicDatabase,
  type StoredUser,
} from './server/store.ts';
import type {
  Appointment,
  AppointmentDocument,
  AppointmentSlipData,
  AppointmentStatus,
  AppointmentWaitlistEntry,
  AvailabilitySlot,
  ClinicNotification,
  Doctor,
  DoctorSearchResult,
  FeedbackStatus,
  NotificationChannel,
  PatientFeedback,
  PublicPatientFeedback,
  ReportRow,
  Specialization,
  UserRole,
  WaitlistNotificationLog,
  WaitlistTimeRange,
  WeekdayKey,
} from './src/types/clinic.ts';

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'arogya-clinic-dev-session-secret-change-in-production';
const SESSION_COOKIE_NAME = 'arogya_session';

interface AuthenticatedRequest extends Request {
  user?: StoredUser;
}

function signToken(payload: { userId: string; exp: number }): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): { userId: string; exp: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as {
      userId: string;
      exp: number;
    };
    if (!parsed.userId || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    out[key] = val;
  }
  return out;
}

function getRequestUser(req: Request): StoredUser | undefined {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies[SESSION_COOKIE_NAME];
  }
  if (!token) return undefined;
  const verified = verifyToken(token);
  if (!verified) return undefined;
  const db = readDb();
  return db.users.find((u) => u.id === verified.userId);
}

function attachUser(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  req.user = getRequestUser(req);
  next();
}

function requireAuth(roles?: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (roles && !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this action' });
      return;
    }
    next();
  };
}

function isSecureRequest(req: Request): boolean {
  const fwd = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  return req.secure || fwd.includes('https') || process.env.NODE_ENV === 'production';
}

function setSessionCookie(req: Request, res: Response, userId: string): string {
  const token = signToken({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const isHttps = isSecureRequest(req);
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  return token;
}

function getWeekdayKey(dateStr: string): WeekdayKey | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const d = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(d.getTime())) return null;
  const keys: WeekdayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return keys[d.getUTCDay()];
}

function addDaysToDateStr(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return dt.toISOString().slice(0, 10);
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(total: number): string {
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function computeDoctorSlots(doctor: Doctor, dateStr: string, appointments: Appointment[]): AvailabilitySlot[] {
  if (!doctor.active) return [];
  if (Array.isArray(doctor.unavailableDates) && doctor.unavailableDates.includes(dateStr)) {
    return [];
  }

  const weekday = getWeekdayKey(dateStr);
  if (!weekday) return [];
  const daySchedule = doctor.schedule[weekday];
  if (!daySchedule || !daySchedule.enabled) return [];

  const startMin = timeToMinutes(daySchedule.start);
  const endMin = timeToMinutes(daySchedule.end);
  const step = Math.max(15, daySchedule.slotMinutes || 30);

  const blockedSet = new Set(doctor.blockedSlots?.[dateStr] || []);

  const occupiedSlots = new Set(
    appointments
      .filter(
        (a) =>
          a.doctorId === doctor.id &&
          a.date === dateStr &&
          (a.status === 'pending' || a.status === 'confirmed')
      )
      .map((a) => a.timeSlot)
  );

  const slots: AvailabilitySlot[] = [];
  for (let current = startMin; current + step <= endMin; current += step) {
    const label = minutesToTime(current);
    if (blockedSet.has(label)) continue;
    slots.push({
      time: label,
      status: occupiedSlots.has(label) ? 'booked' : 'available',
    });
  }
  return slots;
}

function pushNotification(
  db: ClinicDatabase,
  notif: Omit<ClinicNotification, 'id' | 'createdAt' | 'read'>
) {
  db.notifications.unshift({
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...notif,
  });
}

function writeAuditLog(
  db: ClinicDatabase,
  actor: StoredUser,
  action: string,
  details: string
) {
  db.auditLogs.unshift({
    id: `audit-${crypto.randomUUID().slice(0, 8)}`,
    actorId: actor.id,
    actorEmail: actor.email,
    actorRole: actor.role,
    action,
    details,
    createdAt: new Date().toISOString(),
  });
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
}

function getNotificationChannelStatus(): Record<NotificationChannel, { configured: boolean; note: string }> {
  return {
    in_app: { configured: true, note: 'Active in-app clinic portal notifications' },
    whatsapp: {
      configured: Boolean(process.env.WHATSAPP_API_KEY && process.env.WHATSAPP_PHONE_ID),
      note: 'External WhatsApp Business API credentials not configured',
    },
    sms: {
      configured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      note: 'External SMS gateway credentials not configured',
    },
    email: {
      configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
      note: 'External SMTP email server credentials not configured',
    },
  };
}

function matchesTimeRange(timeSlot: string, range: WaitlistTimeRange): boolean {
  if (range === 'any') return true;
  const mins = timeToMinutes(timeSlot);
  if (range === 'morning') return mins < 12 * 60;
  if (range === 'afternoon') return mins >= 12 * 60 && mins < 16 * 60;
  if (range === 'evening') return mins >= 16 * 60;
  return true;
}

function processWaitlistForFreedSlot(
  db: ClinicDatabase,
  doctorId: string,
  date: string,
  timeSlot: string,
  sourceAppointmentId: string
) {
  const doctor = db.doctors.find((d) => d.id === doctorId && d.active);
  if (!doctor) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  if (date < todayStr) return;

  const liveSlots = computeDoctorSlots(doctor, date, db.appointments);
  const targetSlot = liveSlots.find((s) => s.time === timeSlot);
  if (!targetSlot || targetSlot.status !== 'available') return;

  const eventId = `${sourceAppointmentId}:${date}:${timeSlot}`;
  if (db.waitlistNotificationLogs.some((log) => log.eventId === eventId)) {
    return; // Idempotency protection
  }

  const eligibleEntries = db.waitlist
    .filter((entry) => {
      if (entry.status !== 'active') return false;
      if (entry.doctorId !== doctorId) return false;
      if (!entry.consentToNotify) return false;
      const endDate = entry.preferredEndDate || entry.preferredDate;
      if (date < entry.preferredDate || date > endDate) return false;
      return matchesTimeRange(timeSlot, entry.preferredTimeRange);
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (eligibleEntries.length === 0) return;

  const winner = eligibleEntries[0];
  const nowIso = new Date().toISOString();
  winner.status = 'notified';
  winner.notifiedSlot = {
    date,
    timeSlot,
    offeredAt: nowIso,
    eventId,
  };
  winner.updatedAt = nowIso;

  pushNotification(db, {
    userId: winner.patientId,
    title: 'Waitlist Slot Available — Action Required',
    titleHi: 'प्रतीक्षा सूची स्लॉट उपलब्ध — बुकिंग आवश्यक',
    message: `A slot with ${doctor.name} on ${date} at ${timeSlot} has opened. This is not a confirmed booking yet — please open your Patient Portal to confirm booking before another patient reserves it.`,
    messageHi: `${doctor.nameHi} के साथ ${date} को ${timeSlot} बजे एक स्लॉट उपलब्ध हुआ है। यह अभी कन्फर्म बुकिंग नहीं है — कृपया किसी अन्य रोगी से पहले अपने पोर्टल से बुकिंग पूरी करें।`,
    type: 'waitlist',
    waitlistId: winner.id,
  });

  const channelStatus = getNotificationChannelStatus();

  const inAppLog: WaitlistNotificationLog = {
    id: `wlog-${crypto.randomUUID().slice(0, 8)}`,
    waitlistId: winner.id,
    patientId: winner.patientId,
    doctorId,
    date,
    timeSlot,
    eventId,
    channel: 'in_app',
    deliveryStatus: 'delivered',
    detail: 'In-app portal waitlist alert delivered.',
    createdAt: nowIso,
  };
  db.waitlistNotificationLogs.unshift(inAppLog);

  if (winner.notificationPreference !== 'in_app') {
    const ch = winner.notificationPreference;
    const chState = channelStatus[ch];
    db.waitlistNotificationLogs.unshift({
      id: `wlog-${crypto.randomUUID().slice(0, 8)}`,
      waitlistId: winner.id,
      patientId: winner.patientId,
      doctorId,
      date,
      timeSlot,
      eventId,
      channel: ch,
      deliveryStatus: chState.configured ? 'delivered' : 'provider_not_configured',
      detail: chState.configured
        ? `External ${ch} notification dispatched.`
        : `${chState.note}; patient notified in-app instead.`,
      createdAt: nowIso,
    });
  }
}

interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  specializationId?: string;
  status?: string;
  q?: string;
}

function buildFilteredReport(db: ClinicDatabase, filters: ReportFilterParams) {
  const doctorMap = new Map(db.doctors.map((d) => [d.id, d]));
  const specMap = new Map(db.specializations.map((s) => [s.id, s]));

  const filtered = db.appointments.filter((appt) => {
    if (filters.startDate && appt.date < filters.startDate) return false;
    if (filters.endDate && appt.date > filters.endDate) return false;
    if (filters.doctorId && filters.doctorId !== 'all' && appt.doctorId !== filters.doctorId) {
      return false;
    }
    if (
      filters.specializationId &&
      filters.specializationId !== 'all' &&
      appt.specializationId !== filters.specializationId
    ) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && appt.status !== filters.status) {
      return false;
    }
    if (filters.q?.trim()) {
      const needle = filters.q.trim().toLowerCase();
      const doc = doctorMap.get(appt.doctorId);
      const hit =
        appt.referenceCode.toLowerCase().includes(needle) ||
        appt.patientName.toLowerCase().includes(needle) ||
        (doc?.name.toLowerCase().includes(needle) ?? false);
      if (!hit) return false;
    }
    return true;
  });

  filtered.sort((a, b) => `${b.date} ${b.timeSlot}`.localeCompare(`${a.date} ${a.timeSlot}`));

  const summary = {
    total: filtered.length,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    missed: 0,
  };

  const docAgg = new Map<
    string,
    {
      doctorId: string;
      doctorName: string;
      doctorNameHi: string;
      specializationName: string;
      total: number;
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
      rejected: number;
      missed: number;
    }
  >();

  const rows: ReportRow[] = filtered.map((appt) => {
    summary[appt.status] = (summary[appt.status] || 0) + 1;

    const doc = doctorMap.get(appt.doctorId);
    const spec = specMap.get(appt.specializationId);
    const doctorName = doc?.name || appt.doctorId;
    const doctorNameHi = doc?.nameHi || doctorName;
    const specializationName = spec?.name || appt.specializationId;

    if (!docAgg.has(appt.doctorId)) {
      docAgg.set(appt.doctorId, {
        doctorId: appt.doctorId,
        doctorName,
        doctorNameHi,
        specializationName,
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        rejected: 0,
        missed: 0,
      });
    }
    const entry = docAgg.get(appt.doctorId)!;
    entry.total += 1;
    entry[appt.status] += 1;

    return {
      id: appt.id,
      referenceCode: appt.referenceCode,
      patientName: appt.patientName,
      doctorId: appt.doctorId,
      doctorName,
      specializationId: appt.specializationId,
      specializationName,
      date: appt.date,
      timeSlot: appt.timeSlot,
      status: appt.status,
      bookedAt: appt.createdAt,
    };
  });

  return {
    summary,
    doctorDistribution: Array.from(docAgg.values()).sort((a, b) => b.total - a.total),
    rows,
  };
}

function resolveRequestOrigin(req: Request): string {
  const envUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (envUrl && /^https?:\/\//i.test(envUrl) && !envUrl.includes('MY_APP_URL')) {
    return envUrl;
  }
  const host = req.get('x-forwarded-host') || req.get('host') || `localhost:${PORT}`;
  const proto = isSecureRequest(req) ? 'https' : req.protocol || 'http';
  return `${proto}://${host}`;
}

function escapeXml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSitemapEntries(db: ClinicDatabase, origin: string) {
  const today = new Date().toISOString().slice(0, 10);
  const baseRoutes = [
    { path: '/', priority: '1.0', changefreq: 'daily', label: 'Homepage' },
    { path: '/specializations', priority: '0.9', changefreq: 'weekly', label: 'Departments & Specializations' },
    { path: '/doctors', priority: '0.9', changefreq: 'daily', label: 'Specialist Doctor Directory' },
    { path: '/book', priority: '0.9', changefreq: 'daily', label: 'Online Appointment Booking' },
    { path: '/about', priority: '0.8', changefreq: 'monthly', label: 'About Clinic' },
    { path: '/contact', priority: '0.8', changefreq: 'monthly', label: 'Contact & Directions' },
    { path: '/faq', priority: '0.7', changefreq: 'monthly', label: 'Patient FAQs' },
  ];

  const doctorRoutes = db.doctors
    .filter((d) => d.active)
    .map((d) => ({
      path: `/doctors/${d.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
      label: d.name,
    }));

  return [...baseRoutes, ...doctorRoutes].map((entry) => ({
    ...entry,
    url: `${origin}${entry.path}`,
    lastmod: today,
  }));
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '6mb' }));
  app.use('/api', attachUser);
  app.use(['/favicon.svg', '/og-clinic.jpg'], (_req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    next();
  });

  // Dynamic Search Engine Sitemap & Robots.txt
  app.get('/sitemap.xml', (req, res) => {
    const db = readDb();
    const origin = resolveRequestOrigin(req);
    const entries = buildSitemapEntries(db, origin);
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries.map(
        (item) =>
          `  <url>\n    <loc>${escapeXml(item.url)}</loc>\n    <lastmod>${item.lastmod}</lastmod>\n    <changefreq>${item.changefreq}</changefreq>\n    <priority>${item.priority}</priority>\n  </url>`
      ),
      '</urlset>',
    ].join('\n');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  });

  app.get('/robots.txt', (req, res) => {
    const db = readDb();
    const origin = resolveRequestOrigin(req);
    const allowIndexing = db.settings.seo?.allowIndexing !== false;

    const lines = allowIndexing
      ? [
          'User-agent: *',
          'Allow: /',
          'Disallow: /portal',
          'Disallow: /admin',
          'Disallow: /login',
          'Disallow: /api/',
          `Sitemap: ${origin}/sitemap.xml`,
        ]
      : [
          'User-agent: *',
          'Disallow: /',
          `Sitemap: ${origin}/sitemap.xml`,
        ];

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(lines.join('\n') + '\n');
  });

  // Public bootstrap data
  app.get('/api/clinic/bootstrap', (_req, res) => {
    const db = readDb();
    const approvedFeedbacks = db.feedbacks.filter(
      (f) => f.status === 'approved' && f.publicConsent === true
    );
    const count = approvedFeedbacks.length;
    const averageRating =
      count > 0
        ? Number(
            (
              approvedFeedbacks.reduce((sum, item) => sum + item.rating, 0) / count
            ).toFixed(2)
          )
        : 0;

    res.json({
      settings: db.settings,
      specializations: db.specializations.filter((s) => s.active),
      doctors: db.doctors.filter((d) => d.active),
      reviewSummary: {
        count,
        averageRating,
      },
    });
  });

  // Feature 1: Smart Doctor Search & Filter System
  app.get('/api/doctors/search', (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    const specializationId = String(req.query.specializationId || '').trim();
    const dateParam = String(req.query.date || '').trim();
    const dayParam = String(req.query.day || '').trim() as WeekdayKey | '';

    if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
      return;
    }

    const db = readDb();
    const specMap = new Map(db.specializations.map((s) => [s.id, s]));
    const todayStr = new Date().toISOString().slice(0, 10);

    const results: DoctorSearchResult[] = [];
    const weekdayKeys: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    for (const doctor of db.doctors) {
      if (!doctor.active) continue;

      if (specializationId && specializationId !== 'all' && doctor.specializationId !== specializationId) {
        continue;
      }

      const spec = specMap.get(doctor.specializationId);
      if (q) {
        const haystack = [
          doctor.name,
          doctor.nameHi,
          doctor.qualification,
          doctor.qualificationHi,
          doctor.experienceSummary,
          doctor.bio,
          spec?.name || '',
          spec?.nameHi || '',
          spec?.shortDescription || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) continue;
      }

      const workingDays = weekdayKeys.filter((wk) => doctor.schedule[wk]?.enabled);

      if (dayParam && weekdayKeys.includes(dayParam)) {
        if (!doctor.schedule[dayParam]?.enabled) continue;
      }

      if (dateParam) {
        if (dayParam && getWeekdayKey(dateParam) !== dayParam) {
          continue;
        }
        const slots = computeDoctorSlots(doctor, dateParam, db.appointments);
        const available = slots.filter((s) => s.status === 'available');
        if (available.length === 0) continue;

        results.push({
          doctor,
          availableCount: available.length,
          nextAvailableSlot: available[0].time,
          nextAvailableDate: dateParam,
          workingDays,
        });
      } else {
        let nextAvailableDate: string | null = null;
        let nextAvailableSlot: string | null = null;
        let availableCount = 0;

        for (let offset = 0; offset < 14; offset += 1) {
          const checkDate = addDaysToDateStr(todayStr, offset);
          if (dayParam && getWeekdayKey(checkDate) !== dayParam) continue;
          const slots = computeDoctorSlots(doctor, checkDate, db.appointments);
          const available = slots.filter((s) => s.status === 'available');
          if (available.length > 0) {
            nextAvailableDate = checkDate;
            nextAvailableSlot = available[0].time;
            availableCount = available.length;
            break;
          }
        }

        results.push({
          doctor,
          availableCount,
          nextAvailableSlot,
          nextAvailableDate,
          workingDays,
        });
      }
    }

    res.json({ results });
  });

  // Auth routes
  app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      res.json({ user: null });
      return;
    }
    res.json({ user: sanitizeUser(req.user) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const token = setSessionCookie(req, res, user.id);
    res.json({ user: sanitizeUser(user), token });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, phone, password } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    };
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password || password.length < 6) {
      res.status(400).json({
        error: 'Name, valid email, phone number, and a password of at least 6 characters are required',
      });
      return;
    }
    const db = readDb();
    const exists = db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }
    const newUser: StoredUser = {
      id: `user-${crypto.randomUUID().slice(0, 8)}`,
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      name: name.trim(),
      phone: phone.trim(),
      role: 'patient',
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    writeDb(db);
    const token = setSessionCookie(req, res, newUser.id);
    res.status(201).json({ user: sanitizeUser(newUser), token });
  });

  app.post('/api/auth/logout', (req, res) => {
    const isHttps = isSecureRequest(req);
    res.clearCookie(SESSION_COOKIE_NAME, {
      path: '/',
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
    });
    res.json({ ok: true });
  });

  app.patch('/api/profile', requireAuth(), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const target = db.users.find((u) => u.id === req.user!.id);
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { name, phone, preferredLanguage } = req.body as {
      name?: string;
      phone?: string;
      preferredLanguage?: 'en' | 'hi';
    };
    if (name?.trim()) target.name = name.trim();
    if (phone?.trim()) target.phone = phone.trim();
    if (preferredLanguage === 'en' || preferredLanguage === 'hi') {
      target.preferredLanguage = preferredLanguage;
    }
    writeDb(db);
    res.json({ user: sanitizeUser(target) });
  });

  // Availability endpoint
  app.get('/api/availability', (req, res) => {
    const doctorId = String(req.query.doctorId || '');
    const date = String(req.query.date || '');
    if (!doctorId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Valid doctorId and YYYY-MM-DD date are required' });
      return;
    }
    const db = readDb();
    const doctor = db.doctors.find((d) => d.id === doctorId && d.active);
    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    const slots = computeDoctorSlots(doctor, date, db.appointments);
    res.json({ doctorId, date, slots });
  });

  // Appointments - List (RBAC filtered)
  app.get('/api/appointments', requireAuth(), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const user = req.user!;
    let list = [...db.appointments];

    if (user.role === 'patient') {
      list = list.filter(
        (a) =>
          a.patientId === user.id ||
          a.patientEmail.toLowerCase() === user.email.toLowerCase()
      );
    } else if (user.role === 'doctor') {
      if (!user.doctorId) {
        res.json({ appointments: [] });
        return;
      }
      list = list.filter((a) => a.doctorId === user.doctorId);
    }

    list.sort((a, b) => `${b.date} ${b.timeSlot}`.localeCompare(`${a.date} ${a.timeSlot}`));
    res.json({ appointments: list });
  });

  // Feature 3: Appointment Confirmation Slip & Receipt Data
  app.get('/api/appointments/:id/slip', requireAuth(), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const user = req.user!;
    const appointment = db.appointments.find((a) => a.id === req.params.id);
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    if (user.role === 'patient') {
      const owns =
        appointment.patientId === user.id ||
        appointment.patientEmail.toLowerCase() === user.email.toLowerCase();
      if (!owns) {
        res.status(403).json({ error: 'Access denied for this appointment slip' });
        return;
      }
    } else if (user.role === 'doctor') {
      if (appointment.doctorId !== user.doctorId) {
        res.status(403).json({ error: 'Access denied for another doctor appointment' });
        return;
      }
    }

    if (
      appointment.status === 'cancelled' ||
      appointment.status === 'rejected' ||
      appointment.status === 'missed'
    ) {
      res.status(400).json({
        error:
          'Cancelled, rejected, or missed appointments are not eligible for a confirmation slip or request receipt.',
      });
      return;
    }

    const doctor = db.doctors.find((d) => d.id === appointment.doctorId);
    const spec = db.specializations.find((s) => s.id === appointment.specializationId);

    const documentType =
      appointment.status === 'pending' ? 'request_receipt' : 'confirmation_slip';

    const slip: AppointmentSlipData = {
      documentType,
      referenceCode: appointment.referenceCode,
      status: appointment.status,
      patientName: appointment.patientName,
      doctorName: doctor?.name || 'Clinic Specialist',
      doctorNameHi: doctor?.nameHi || 'विशेषज्ञ चिकित्सक',
      doctorQualification: doctor?.qualification || '',
      specializationName: spec?.name || 'Outpatient Department',
      specializationNameHi: spec?.nameHi || 'बाह्य रोगी विभाग',
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      bookedAt: appointment.createdAt,
      clinicName: db.settings.clinicName,
      clinicNameHi: db.settings.clinicNameHi,
      clinicAddress: db.settings.address,
      clinicAddressHi: db.settings.addressHi,
      clinicPhone: db.settings.phone,
      clinicEmail: db.settings.email,
      clinicHours: db.settings.hours,
      clinicHoursHi: db.settings.hoursHi,
      clinicNotice:
        documentType === 'request_receipt'
          ? db.settings.bookingNotice
          : 'Please arrive 15 minutes prior to your scheduled consultation with a valid photo ID and prior medical reports if applicable.',
      clinicNoticeHi:
        documentType === 'request_receipt'
          ? db.settings.bookingNoticeHi
          : 'कृपया अपने निर्धारित समय से 15 मिनट पहले वैध पहचान पत्र और पिछली मेडिकल रिपोर्ट के साथ क्लिनिक पहुँचें।',
    };

    writeAuditLog(
      db,
      user,
      'APPOINTMENT_SLIP_ACCESSED',
      `Accessed ${documentType} for ${appointment.referenceCode}`
    );
    writeDb(db);

    res.json({ slip });
  });

  // Appointments - Create (Public booking or authenticated patient/staff)
  app.post('/api/appointments', (req: AuthenticatedRequest, res) => {
    const {
      doctorId,
      specializationId,
      date,
      timeSlot,
      patientName,
      patientPhone,
      patientEmail,
      reason,
      documents,
      autoConfirmByStaff,
      waitlistId,
    } = req.body as {
      doctorId?: string;
      specializationId?: string;
      date?: string;
      timeSlot?: string;
      patientName?: string;
      patientPhone?: string;
      patientEmail?: string;
      reason?: string;
      documents?: AppointmentDocument[];
      autoConfirmByStaff?: boolean;
      waitlistId?: string;
    };

    if (
      !doctorId ||
      !specializationId ||
      !date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !timeSlot ||
      !patientName?.trim() ||
      !patientPhone?.trim() ||
      !patientEmail?.trim() ||
      !reason?.trim()
    ) {
      res.status(400).json({ error: 'Please complete all required booking fields.' });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (date < todayStr) {
      res.status(400).json({ error: 'Cannot schedule an appointment for a past date.' });
      return;
    }

    const db = readDb();
    const doctor = db.doctors.find((d) => d.id === doctorId && d.active);
    if (!doctor) {
      res.status(404).json({ error: 'Selected doctor is unavailable.' });
      return;
    }

    const slots = computeDoctorSlots(doctor, date, db.appointments);
    const matchingSlot = slots.find((s) => s.time === timeSlot);
    if (!matchingSlot) {
      res.status(400).json({ error: 'Selected time slot is outside the doctor working hours.' });
      return;
    }
    if (matchingSlot.status === 'booked') {
      res.status(409).json({
        error: 'This time slot was just reserved. Please select another available slot.',
      });
      return;
    }

    const safeDocuments: AppointmentDocument[] = Array.isArray(documents)
      ? documents.slice(0, 3).map((doc) => ({
          id: `doc-${crypto.randomUUID().slice(0, 8)}`,
          name: String(doc.name || 'document').slice(0, 120),
          mimeType: String(doc.mimeType || 'application/octet-stream'),
          size: Number(doc.size || 0),
          dataUrl: String(doc.dataUrl || ''),
          uploadedAt: new Date().toISOString(),
        }))
      : [];

    const canStaffAutoConfirm =
      Boolean(autoConfirmByStaff) &&
      (req.user?.role === 'staff' || req.user?.role === 'admin');

    const initialStatus: AppointmentStatus = canStaffAutoConfirm ? 'confirmed' : 'pending';
    const nowIso = new Date().toISOString();
    const refNumber = `ARG-${Math.floor(2600 + Math.random() * 7399)}`;

    const matchedPatient =
      req.user?.role === 'patient'
        ? req.user
        : db.users.find((u) => u.email.toLowerCase() === patientEmail.trim().toLowerCase());

    const appointment: Appointment = {
      id: `appt-${crypto.randomUUID().slice(0, 8)}`,
      referenceCode: refNumber,
      patientId: matchedPatient ? matchedPatient.id : null,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientEmail: patientEmail.trim().toLowerCase(),
      doctorId: doctor.id,
      specializationId,
      date,
      timeSlot,
      reason: reason.trim(),
      status: initialStatus,
      documents: safeDocuments,
      createdByRole: req.user?.role || 'guest',
      createdAt: nowIso,
      updatedAt: nowIso,
      updatedBy: req.user?.email,
    };

    db.appointments.unshift(appointment);

    if (waitlistId && req.user) {
      const wEntry = db.waitlist.find(
        (w) => w.id === waitlistId && w.patientId === req.user!.id
      );
      if (wEntry && (wEntry.status === 'active' || wEntry.status === 'notified')) {
        wEntry.status = 'booked';
        wEntry.updatedAt = nowIso;
      }
    }

    if (matchedPatient) {
      pushNotification(db, {
        userId: matchedPatient.id,
        title:
          initialStatus === 'confirmed'
            ? 'Appointment Confirmed'
            : 'Appointment Request Received',
        titleHi:
          initialStatus === 'confirmed'
            ? 'अपॉइंटमेंट कन्फर्म हो गया'
            : 'अपॉइंटमेंट अनुरोध प्राप्त हुआ',
        message:
          initialStatus === 'confirmed'
            ? `Your appointment (${refNumber}) with ${doctor.name} on ${date} at ${timeSlot} is confirmed.`
            : `Your appointment request (${refNumber}) with ${doctor.name} on ${date} at ${timeSlot} has been received and is awaiting clinic confirmation.`,
        messageHi:
          initialStatus === 'confirmed'
            ? `${doctor.nameHi} के साथ ${date} को ${timeSlot} बजे आपका अपॉइंटमेंट (${refNumber}) कन्फर्म है।`
            : `${doctor.nameHi} के साथ ${date} को ${timeSlot} बजे का आपका अनुरोध (${refNumber}) प्राप्त हो गया है और क्लिनिक की पुष्टि की प्रतीक्षा में है।`,
        type: initialStatus === 'confirmed' ? 'confirmation' : 'info',
        appointmentId: appointment.id,
      });
    }

    const doctorAccount = db.users.find((u) => u.role === 'doctor' && u.doctorId === doctor.id);
    if (doctorAccount) {
      pushNotification(db, {
        userId: doctorAccount.id,
        title: 'New Appointment Request',
        titleHi: 'नया अपॉइंटमेंट अनुरोध',
        message: `${appointment.patientName} requested a consultation on ${date} at ${timeSlot}.`,
        messageHi: `${appointment.patientName} ने ${date} को ${timeSlot} बजे परामर्श के लिए अनुरोध किया है।`,
        type: 'info',
        appointmentId: appointment.id,
      });
    }

    writeDb(db);
    res.status(201).json({ appointment });
  });

  // Appointments - Update Status / Notes (+ Waitlist trigger on cancellation/rejection)
  app.patch('/api/appointments/:id', requireAuth(), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const user = req.user!;
    const appointment = db.appointments.find((a) => a.id === req.params.id);
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    const { status, clinicNotes } = req.body as {
      status?: AppointmentStatus;
      clinicNotes?: string;
    };

    const allowedStatuses: AppointmentStatus[] = [
      'pending',
      'confirmed',
      'completed',
      'cancelled',
      'rejected',
      'missed',
    ];
    if (status && !allowedStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid appointment status' });
      return;
    }

    const previousStatus = appointment.status;

    if (user.role === 'patient') {
      const owns =
        appointment.patientId === user.id ||
        appointment.patientEmail.toLowerCase() === user.email.toLowerCase();
      if (!owns) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      if (status && status !== 'cancelled') {
        res.status(403).json({ error: 'Patients may only cancel their own appointments' });
        return;
      }
      if (status === 'cancelled') {
        appointment.status = 'cancelled';
      }
    } else if (user.role === 'doctor') {
      if (appointment.doctorId !== user.doctorId) {
        res.status(403).json({ error: 'Access denied for another doctor appointment' });
        return;
      }
      if (status) appointment.status = status;
      if (typeof clinicNotes === 'string') appointment.clinicNotes = clinicNotes.trim();
    } else if (user.role === 'staff' || user.role === 'admin') {
      if (status) appointment.status = status;
      if (typeof clinicNotes === 'string') appointment.clinicNotes = clinicNotes.trim();
    }

    appointment.updatedAt = new Date().toISOString();
    appointment.updatedBy = user.email;

    if (appointment.patientId && status) {
      const doc = db.doctors.find((d) => d.id === appointment.doctorId);
      const docName = doc?.name || 'your specialist';
      const docNameHi = doc?.nameHi || 'विशेषज्ञ चिकित्सक';
      pushNotification(db, {
        userId: appointment.patientId,
        title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        titleHi:
          status === 'confirmed'
            ? 'अपॉइंटमेंट की पुष्टि हुई'
            : status === 'completed'
              ? 'परामर्श पूर्ण हुआ'
              : status === 'cancelled'
                ? 'अपॉइंटमेंट रद्द किया गया'
                : status === 'rejected'
                  ? 'अपॉइंटमेंट अस्वीकृत किया गया'
                  : status === 'missed'
                    ? 'अपॉइंटमेंट छूटा हुआ चिह्नित'
                    : 'अपॉइंटमेंट स्थिति अपडेट',
        message: `Appointment ${appointment.referenceCode} with ${docName} on ${appointment.date} at ${appointment.timeSlot} is now ${status}.`,
        messageHi: `${docNameHi} के साथ ${appointment.date} (${appointment.timeSlot}) का अपॉइंटमेंट ${appointment.referenceCode} अब अपडेट हो गया है।`,
        type:
          status === 'confirmed'
            ? 'confirmation'
            : status === 'cancelled' || status === 'rejected'
              ? 'cancellation'
              : 'update',
        appointmentId: appointment.id,
      });
    }

    // Trigger Smart Waitlist notification if a previously held slot was freed
    if (
      (previousStatus === 'pending' || previousStatus === 'confirmed') &&
      (appointment.status === 'cancelled' || appointment.status === 'rejected')
    ) {
      processWaitlistForFreedSlot(
        db,
        appointment.doctorId,
        appointment.date,
        appointment.timeSlot,
        appointment.id
      );
    }

    writeDb(db);
    res.json({ appointment });
  });

  // Notifications
  app.get('/api/notifications', requireAuth(), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const list = db.notifications.filter((n) => n.userId === req.user!.id).slice(0, 30);
    res.json({ notifications: list });
  });

  app.post('/api/notifications/read-all', requireAuth(), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    for (const n of db.notifications) {
      if (n.userId === req.user!.id) n.read = true;
    }
    writeDb(db);
    res.json({ ok: true });
  });

  // Doctor schedule update (doctor for own profile, or admin)
  app.patch('/api/doctors/:id/schedule', requireAuth(['doctor', 'admin']), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const user = req.user!;
    const doctor = db.doctors.find((d) => d.id === req.params.id);
    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    if (user.role === 'doctor' && user.doctorId !== doctor.id) {
      res.status(403).json({ error: 'You can only manage your own schedule' });
      return;
    }
    const { schedule, unavailableDates, blockedSlots } = req.body as {
      schedule?: Doctor['schedule'];
      unavailableDates?: string[];
      blockedSlots?: Record<string, string[]>;
    };
    if (!schedule && !unavailableDates && !blockedSlots) {
      res.status(400).json({ error: 'Schedule payload required' });
      return;
    }
    if (schedule) doctor.schedule = schedule;
    if (Array.isArray(unavailableDates)) doctor.unavailableDates = unavailableDates;
    if (blockedSlots && typeof blockedSlots === 'object') doctor.blockedSlots = blockedSlots;
    writeDb(db);
    res.json({ doctor });
  });

  // Feature 4: Admin Appointment Reports & CSV / Excel Export
  app.get('/api/admin/reports', requireAuth(['admin', 'staff']), (req, res) => {
    const db = readDb();
    const report = buildFilteredReport(db, {
      startDate: req.query.startDate ? String(req.query.startDate) : undefined,
      endDate: req.query.endDate ? String(req.query.endDate) : undefined,
      doctorId: req.query.doctorId ? String(req.query.doctorId) : undefined,
      specializationId: req.query.specializationId ? String(req.query.specializationId) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      q: req.query.q ? String(req.query.q) : undefined,
    });
    res.json(report);
  });

  app.get('/api/admin/reports/export', requireAuth(['admin']), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const format = String(req.query.format || 'csv').toLowerCase();
    if (format !== 'csv' && format !== 'xlsx') {
      res.status(400).json({ error: 'Supported export formats are csv and xlsx' });
      return;
    }

    const filters: ReportFilterParams = {
      startDate: req.query.startDate ? String(req.query.startDate) : undefined,
      endDate: req.query.endDate ? String(req.query.endDate) : undefined,
      doctorId: req.query.doctorId ? String(req.query.doctorId) : undefined,
      specializationId: req.query.specializationId ? String(req.query.specializationId) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      q: req.query.q ? String(req.query.q) : undefined,
    };

    const report = buildFilteredReport(db, filters);
    const sheetRows = report.rows.map((r) => ({
      'Reference Code': r.referenceCode,
      'Patient Name': r.patientName,
      Doctor: r.doctorName,
      Specialization: r.specializationName,
      'Appointment Date': r.date,
      'Appointment Time': r.timeSlot,
      Status: r.status,
      'Booked Timestamp': r.bookedAt,
    }));

    writeAuditLog(
      db,
      req.user!,
      format === 'xlsx' ? 'REPORT_EXPORT_XLSX' : 'REPORT_EXPORT_CSV',
      `Exported ${report.rows.length} rows (filters: ${JSON.stringify(filters)})`
    );
    writeDb(db);

    const dateTag = new Date().toISOString().slice(0, 10);

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(
        sheetRows.length > 0
          ? sheetRows
          : [
              {
                'Reference Code': '',
                'Patient Name': 'No records matched the selected filters',
                Doctor: '',
                Specialization: '',
                'Appointment Date': '',
                'Appointment Time': '',
                Status: '',
                'Booked Timestamp': '',
              },
            ]
      );
      XLSX.utils.book_append_sheet(wb, ws, 'Appointments');

      const summarySheet = XLSX.utils.json_to_sheet([
        {
          'Clinic Name': db.settings.clinicName,
          'Total Appointments': report.summary.total,
          Pending: report.summary.pending,
          Confirmed: report.summary.confirmed,
          Completed: report.summary.completed,
          Cancelled: report.summary.cancelled,
          Rejected: report.summary.rejected,
          Missed: report.summary.missed,
        },
      ]);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="arogya-appointments-report-${dateTag}.xlsx"`
      );
      res.send(buffer);
      return;
    }

    const headers = [
      'Reference Code',
      'Patient Name',
      'Doctor',
      'Specialization',
      'Appointment Date',
      'Appointment Time',
      'Status',
      'Booked Timestamp',
    ];
    const escapeCsv = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`;
    const csvLines = [
      headers.map(escapeCsv).join(','),
      ...sheetRows.map((row) =>
        headers.map((h) => escapeCsv(String(row[h as keyof typeof row] ?? ''))).join(',')
      ),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="arogya-appointments-report-${dateTag}.csv"`
    );
    res.send('\uFEFF' + csvLines.join('\n'));
  });

  // Feature 5: Verified Patient Feedback & Reviews
  app.get('/api/feedback/public', (_req, res) => {
    const db = readDb();
    const doctorMap = new Map(db.doctors.map((d) => [d.id, d]));
    const specMap = new Map(db.specializations.map((s) => [s.id, s]));

    const approved: PublicPatientFeedback[] = db.feedbacks
      .filter((f) => f.status === 'approved' && f.publicConsent === true)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((f) => {
        const doc = doctorMap.get(f.doctorId);
        const spec = specMap.get(f.specializationId);
        return {
          id: f.id,
          doctorId: f.doctorId,
          doctorName: doc?.name || 'Clinic Specialist',
          doctorNameHi: doc?.nameHi || 'विशेषज्ञ चिकित्सक',
          specializationId: f.specializationId,
          specializationName: spec?.name || 'Outpatient Department',
          specializationNameHi: spec?.nameHi || 'बाह्य रोगी विभाग',
          rating: f.rating,
          comment: f.comment,
          doctorFeedback: f.doctorFeedback,
          verifiedVisit: f.verifiedVisit,
          createdAt: f.createdAt,
        };
      });

    res.json({ feedbacks: approved });
  });

  app.get('/api/feedback/my', requireAuth(['patient']), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const list = db.feedbacks
      .filter((f) => f.patientId === req.user!.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ feedbacks: list });
  });

  app.post('/api/feedback', requireAuth(['patient']), (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { appointmentId, rating, comment, doctorFeedback, publicConsent } = req.body as {
      appointmentId?: string;
      rating?: number;
      comment?: string;
      doctorFeedback?: string;
      publicConsent?: boolean;
    };

    const numericRating = Number(rating);
    if (!appointmentId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      res.status(400).json({ error: 'Valid appointment and rating between 1 and 5 are required.' });
      return;
    }
    if (!comment?.trim() || comment.trim().length < 5 || comment.trim().length > 1000) {
      res.status(400).json({ error: 'Please enter feedback between 5 and 1000 characters.' });
      return;
    }

    const db = readDb();
    const appointment = db.appointments.find((a) => a.id === appointmentId);
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    const owns =
      appointment.patientId === user.id ||
      appointment.patientEmail.toLowerCase() === user.email.toLowerCase();
    if (!owns) {
      res.status(403).json({ error: 'You may only review your own completed appointments.' });
      return;
    }

    if (appointment.status !== 'completed') {
      res.status(400).json({ error: 'Feedback is only permitted after an appointment is completed.' });
      return;
    }

    if (db.feedbacks.some((f) => f.appointmentId === appointment.id)) {
      res.status(409).json({ error: 'Feedback has already been submitted for this completed appointment.' });
      return;
    }

    const record: PatientFeedback = {
      id: `fb-${crypto.randomUUID().slice(0, 8)}`,
      appointmentId: appointment.id,
      patientId: user.id,
      doctorId: appointment.doctorId,
      specializationId: appointment.specializationId,
      rating: numericRating,
      comment: comment.trim(),
      doctorFeedback: doctorFeedback?.trim() ? doctorFeedback.trim().slice(0, 500) : undefined,
      publicConsent: Boolean(publicConsent),
      status: 'pending_review',
      verifiedVisit: true,
      createdAt: new Date().toISOString(),
    };

    db.feedbacks.unshift(record);
    pushNotification(db, {
      userId: user.id,
      title: 'Feedback Received',
      titleHi: 'प्रतिक्रिया प्राप्त हुई',
      message: `Thank you for submitting feedback for appointment ${appointment.referenceCode}. It is now pending clinic moderation.`,
      messageHi: `अपॉइंटमेंट ${appointment.referenceCode} के लिए आपकी प्रतिक्रिया प्राप्त हो गई है और समीक्षा के लिए लंबित है।`,
      type: 'info',
      appointmentId: appointment.id,
    });
    writeDb(db);
    res.status(201).json({ feedback: record });
  });

  app.get('/api/admin/feedback', requireAuth(['admin']), (_req, res) => {
    const db = readDb();
    const doctorMap = new Map(db.doctors.map((d) => [d.id, d]));
    const specMap = new Map(db.specializations.map((s) => [s.id, s]));
    const apptMap = new Map(db.appointments.map((a) => [a.id, a]));
    const userMap = new Map(db.users.map((u) => [u.id, u]));

    const feedbacks = db.feedbacks
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((f) => {
        const doc = doctorMap.get(f.doctorId);
        const spec = specMap.get(f.specializationId);
        const appt = apptMap.get(f.appointmentId);
        const patient = userMap.get(f.patientId);
        return {
          ...f,
          doctorName: doc?.name || f.doctorId,
          specializationName: spec?.name || f.specializationId,
          appointmentReference: appt?.referenceCode || f.appointmentId,
          patientName: patient?.name || appt?.patientName || 'Verified Patient',
        };
      });

    res.json({ feedbacks });
  });

  app.patch('/api/admin/feedback/:id', requireAuth(['admin']), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const record = db.feedbacks.find((f) => f.id === req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Feedback entry not found' });
      return;
    }
    const { status } = req.body as { status?: FeedbackStatus };
    if (status !== 'approved' && status !== 'rejected' && status !== 'hidden' && status !== 'pending_review') {
      res.status(400).json({ error: 'Invalid feedback moderation status' });
      return;
    }

    record.status = status;
    record.moderatedAt = new Date().toISOString();
    record.moderatedBy = req.user!.email;

    writeAuditLog(
      db,
      req.user!,
      'FEEDBACK_MODERATED',
      `Set feedback ${record.id} status to ${status}`
    );
    writeDb(db);
    res.json({ feedback: record });
  });

  // Feature 6: Smart Appointment Waitlist
  app.get('/api/waitlist/my', requireAuth(['patient']), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const entries = db.waitlist
      .filter((w) => w.patientId === req.user!.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({
      entries,
      channelStatus: getNotificationChannelStatus(),
    });
  });

  app.post('/api/waitlist', requireAuth(['patient']), (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const {
      doctorId,
      specializationId,
      preferredDate,
      preferredEndDate,
      preferredTimeRange,
      notificationPreference,
      consentToNotify,
    } = req.body as {
      doctorId?: string;
      specializationId?: string;
      preferredDate?: string;
      preferredEndDate?: string;
      preferredTimeRange?: WaitlistTimeRange;
      notificationPreference?: NotificationChannel;
      consentToNotify?: boolean;
    };

    if (!doctorId || !preferredDate || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      res.status(400).json({ error: 'Doctor and valid YYYY-MM-DD preferred date are required.' });
      return;
    }
    if (!consentToNotify) {
      res.status(400).json({ error: 'Notification consent is required to join the waitlist.' });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (preferredDate < todayStr) {
      res.status(400).json({ error: 'Waitlist preferred date cannot be in the past.' });
      return;
    }
    if (preferredEndDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredEndDate) || preferredEndDate < preferredDate) {
        res.status(400).json({ error: 'Preferred end date must be on or after the preferred start date.' });
        return;
      }
    }

    const db = readDb();
    const doctor = db.doctors.find((d) => d.id === doctorId && d.active);
    if (!doctor) {
      res.status(404).json({ error: 'Selected doctor is unavailable.' });
      return;
    }

    const duplicate = db.waitlist.some(
      (w) =>
        w.patientId === user.id &&
        w.doctorId === doctor.id &&
        w.preferredDate === preferredDate &&
        (w.status === 'active' || w.status === 'notified')
    );
    if (duplicate) {
      res.status(409).json({
        error: 'You already have an active waitlist request for this doctor and date.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const entry: AppointmentWaitlistEntry = {
      id: `wait-${crypto.randomUUID().slice(0, 8)}`,
      patientId: user.id,
      patientName: user.name,
      patientEmail: user.email,
      patientPhone: user.phone,
      doctorId: doctor.id,
      specializationId: specializationId || doctor.specializationId,
      preferredDate,
      preferredEndDate: preferredEndDate || undefined,
      preferredTimeRange: preferredTimeRange || 'any',
      notificationPreference: notificationPreference || 'in_app',
      consentToNotify: true,
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.waitlist.unshift(entry);
    pushNotification(db, {
      userId: user.id,
      title: 'Added to Appointment Waitlist',
      titleHi: 'अपॉइंटमेंट प्रतीक्षा सूची में जोड़ा गया',
      message: `You are on the waitlist for ${doctor.name} starting ${preferredDate}. We will notify you in-app if a matching slot opens.`,
      messageHi: `आपको ${doctor.nameHi} के लिए ${preferredDate} से प्रतीक्षा सूची में जोड़ दिया गया है। स्लॉट खाली होने पर आपको पोर्टल में सूचित किया जाएगा।`,
      type: 'waitlist',
      waitlistId: entry.id,
    });
    writeDb(db);

    res.status(201).json({
      entry,
      channelStatus: getNotificationChannelStatus(),
    });
  });

  app.patch('/api/waitlist/:id/withdraw', requireAuth(['patient']), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const entry = db.waitlist.find((w) => w.id === req.params.id);
    if (!entry) {
      res.status(404).json({ error: 'Waitlist entry not found' });
      return;
    }
    if (entry.patientId !== req.user!.id) {
      res.status(403).json({ error: 'You may only withdraw your own waitlist entries' });
      return;
    }
    if (entry.status === 'booked' || entry.status === 'cancelled') {
      res.status(400).json({ error: 'Waitlist entry is already finalized' });
      return;
    }
    entry.status = 'withdrawn';
    entry.updatedAt = new Date().toISOString();
    writeDb(db);
    res.json({ entry });
  });

  app.get('/api/admin/waitlist', requireAuth(['admin', 'staff']), (req, res) => {
    const db = readDb();
    const doctorMap = new Map(db.doctors.map((d) => [d.id, d]));
    const specMap = new Map(db.specializations.map((s) => [s.id, s]));

    const doctorFilter = String(req.query.doctorId || '').trim();
    const statusFilter = String(req.query.status || '').trim();
    const dateFilter = String(req.query.date || '').trim();
    const q = String(req.query.q || '').trim().toLowerCase();

    const entries = db.waitlist
      .filter((w) => {
        if (doctorFilter && doctorFilter !== 'all' && w.doctorId !== doctorFilter) return false;
        if (statusFilter && statusFilter !== 'all' && w.status !== statusFilter) return false;
        if (dateFilter) {
          const endDate = w.preferredEndDate || w.preferredDate;
          if (dateFilter < w.preferredDate || dateFilter > endDate) return false;
        }
        if (q) {
          const docName = doctorMap.get(w.doctorId)?.name.toLowerCase() || '';
          const match =
            w.patientName.toLowerCase().includes(q) ||
            docName.includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((w) => ({
        ...w,
        doctorName: doctorMap.get(w.doctorId)?.name || w.doctorId,
        specializationName: specMap.get(w.specializationId)?.name || w.specializationId,
      }));

    res.json({
      entries,
      logs: db.waitlistNotificationLogs.slice(0, 100),
      channelStatus: getNotificationChannelStatus(),
    });
  });

  app.patch('/api/admin/waitlist/:id/cancel', requireAuth(['admin', 'staff']), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const entry = db.waitlist.find((w) => w.id === req.params.id);
    if (!entry) {
      res.status(404).json({ error: 'Waitlist entry not found' });
      return;
    }
    entry.status = 'cancelled';
    entry.updatedAt = new Date().toISOString();
    const doctor = db.doctors.find((d) => d.id === entry.doctorId);

    pushNotification(db, {
      userId: entry.patientId,
      title: 'Waitlist Request Cancelled',
      titleHi: 'प्रतीक्षा सूची अनुरोध रद्द किया गया',
      message: `Your waitlist request with ${doctor?.name || 'clinic specialist'} for ${entry.preferredDate} has been cancelled by clinic staff.`,
      messageHi: `${doctor?.nameHi || 'विशेषज्ञ चिकित्सक'} के साथ ${entry.preferredDate} का आपका प्रतीक्षा सूची अनुरोध क्लिनिक स्टाफ द्वारा रद्द कर दिया गया है।`,
      type: 'cancellation',
      waitlistId: entry.id,
    });
    writeAuditLog(
      db,
      req.user!,
      'WAITLIST_CANCELLED',
      `Cancelled waitlist entry ${entry.id} for ${entry.patientName}`
    );
    writeDb(db);
    res.json({ entry });
  });

  // Admin: Overview & CRUD
  app.get('/api/admin/overview', requireAuth(['admin', 'staff']), (_req, res) => {
    const db = readDb();
    res.json({
      appointments: db.appointments,
      doctors: db.doctors,
      specializations: db.specializations,
      users: db.users.map(sanitizeUser),
      contactMessages: db.contactMessages,
      settings: db.settings,
      auditLogs: db.auditLogs.slice(0, 50),
    });
  });

  app.post('/api/admin/doctors', requireAuth(['admin']), (req, res) => {
    const body = req.body as Partial<Doctor>;
    if (!body.name?.trim() || !body.specializationId || !body.qualification?.trim()) {
      res.status(400).json({ error: 'Doctor name, specialization, and qualification are required' });
      return;
    }
    const db = readDb();
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newDoctor: Doctor = {
      id: `doc-${crypto.randomUUID().slice(0, 8)}`,
      slug: `${slug}-${crypto.randomUUID().slice(0, 4)}`,
      name: body.name.trim(),
      nameHi: body.nameHi?.trim() || body.name.trim(),
      specializationId: body.specializationId,
      qualification: body.qualification.trim(),
      qualificationHi: body.qualificationHi?.trim() || body.qualification.trim(),
      experienceSummary: body.experienceSummary?.trim() || 'Consultant Specialist',
      experienceSummaryHi: body.experienceSummaryHi?.trim() || 'कंसल्टेंट विशेषज्ञ',
      bio: body.bio?.trim() || 'Specialist outpatient consultant at Arogya Multi-Specialty Clinic.',
      bioHi: body.bioHi?.trim() || 'आरोग्य मल्टी-स्पेशलिटी क्लिनिक में विशेषज्ञ चिकित्सक।',
      languages: body.languages?.length ? body.languages : ['English', 'Hindi'],
      languagesHi: body.languagesHi?.length ? body.languagesHi : ['अंग्रेज़ी', 'हिन्दी'],
      consultationFee: Number(body.consultationFee) || 800,
      imageKey: body.imageKey || 'doctor_cardiology',
      active: body.active !== undefined ? Boolean(body.active) : true,
      schedule: body.schedule || {
        mon: { enabled: true, start: '09:30', end: '13:30', slotMinutes: 30 },
        tue: { enabled: true, start: '09:30', end: '13:30', slotMinutes: 30 },
        wed: { enabled: true, start: '09:30', end: '13:30', slotMinutes: 30 },
        thu: { enabled: true, start: '09:30', end: '13:30', slotMinutes: 30 },
        fri: { enabled: true, start: '09:30', end: '13:30', slotMinutes: 30 },
        sat: { enabled: true, start: '10:00', end: '13:00', slotMinutes: 30 },
        sun: { enabled: false, start: '10:00', end: '13:00', slotMinutes: 30 },
      },
    };
    db.doctors.push(newDoctor);
    writeDb(db);
    res.status(201).json({ doctor: newDoctor });
  });

  app.patch('/api/admin/doctors/:id', requireAuth(['admin']), (req, res) => {
    const db = readDb();
    const doctor = db.doctors.find((d) => d.id === req.params.id);
    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }
    Object.assign(doctor, req.body, { id: doctor.id, slug: doctor.slug });
    writeDb(db);
    res.json({ doctor });
  });

  // Admin: Specializations CRUD
  app.post('/api/admin/specializations', requireAuth(['admin']), (req, res) => {
    const body = req.body as Partial<Specialization>;
    if (!body.name?.trim() || !body.shortDescription?.trim()) {
      res.status(400).json({ error: 'Specialization name and description are required' });
      return;
    }
    const db = readDb();
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const newSpec: Specialization = {
      id: `spec-${crypto.randomUUID().slice(0, 8)}`,
      slug,
      name: body.name.trim(),
      nameHi: body.nameHi?.trim() || body.name.trim(),
      shortDescription: body.shortDescription.trim(),
      shortDescriptionHi: body.shortDescriptionHi?.trim() || body.shortDescription.trim(),
      overview: body.overview?.trim() || body.shortDescription.trim(),
      overviewHi: body.overviewHi?.trim() || body.shortDescriptionHi?.trim() || body.shortDescription.trim(),
      iconKey: body.iconKey || 'stethoscope',
      commonConditions: body.commonConditions?.length ? body.commonConditions : ['General Outpatient Consultation'],
      commonConditionsHi: body.commonConditionsHi?.length ? body.commonConditionsHi : ['सामान्य बाह्य रोगी परामर्श'],
      active: true,
    };
    db.specializations.push(newSpec);
    writeDb(db);
    res.status(201).json({ specialization: newSpec });
  });

  app.patch('/api/admin/specializations/:id', requireAuth(['admin']), (req, res) => {
    const db = readDb();
    const spec = db.specializations.find((s) => s.id === req.params.id);
    if (!spec) {
      res.status(404).json({ error: 'Specialization not found' });
      return;
    }
    Object.assign(spec, req.body, { id: spec.id });
    writeDb(db);
    res.json({ specialization: spec });
  });

  // Admin: Staff & Users
  app.post('/api/admin/users', requireAuth(['admin']), (req, res) => {
    const { name, email, phone, role, password, doctorId } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      role?: UserRole;
      password?: string;
      doctorId?: string;
    };
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !role || !password) {
      res.status(400).json({ error: 'All user fields are required' });
      return;
    }
    const db = readDb();
    if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const created: StoredUser = {
      id: `user-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      doctorId: role === 'doctor' ? doctorId : undefined,
      passwordHash: hashPassword(password),
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
    };
    db.users.push(created);
    writeDb(db);
    res.status(201).json({ user: sanitizeUser(created) });
  });

  app.get('/api/admin/seo-audit', requireAuth(['admin']), (req, res) => {
    const db = readDb();
    const origin = resolveRequestOrigin(req);
    const entries = buildSitemapEntries(db, origin);
    const approvedFeedbackCount = db.feedbacks.filter(
      (f) => f.status === 'approved' && f.publicConsent === true
    ).length;

    res.json({
      origin,
      sitemapUrl: `${origin}/sitemap.xml`,
      robotsUrl: `${origin}/robots.txt`,
      allowIndexing: db.settings.seo?.allowIndexing !== false,
      indexedRoutes: entries,
      excludedRoutes: ['/portal', '/admin', '/login', '/api/*'],
      activeDoctorCount: db.doctors.filter((d) => d.active).length,
      activeSpecializationCount: db.specializations.filter((s) => s.active).length,
      approvedFeedbackCount,
      schemas: ['MedicalClinic', 'WebSite (SearchAction)', 'Physician', 'FAQPage', 'BreadcrumbList'],
    });
  });

  app.patch('/api/admin/settings', requireAuth(['admin']), (req: AuthenticatedRequest, res) => {
    const db = readDb();
    const body = req.body as Partial<typeof db.settings>;
    const mergedSeo = body.seo
      ? {
          siteTitle: String(body.seo.siteTitle ?? db.settings.seo?.siteTitle ?? '').trim(),
          defaultDescription: String(
            body.seo.defaultDescription ?? db.settings.seo?.defaultDescription ?? ''
          ).trim(),
          keywords: String(body.seo.keywords ?? db.settings.seo?.keywords ?? '').trim(),
          ogImageUrl: String(body.seo.ogImageUrl ?? db.settings.seo?.ogImageUrl ?? '/og-clinic.jpg').trim(),
          allowIndexing:
            typeof body.seo.allowIndexing === 'boolean'
              ? body.seo.allowIndexing
              : db.settings.seo?.allowIndexing !== false,
          googleVerificationCode: String(
            body.seo.googleVerificationCode ?? db.settings.seo?.googleVerificationCode ?? ''
          ).trim(),
          bingVerificationCode: String(
            body.seo.bingVerificationCode ?? db.settings.seo?.bingVerificationCode ?? ''
          ).trim(),
        }
      : db.settings.seo;

    db.settings = { ...db.settings, ...body, seo: mergedSeo };
    if (body.seo && req.user) {
      writeAuditLog(
        db,
        req.user,
        'SEO_SETTINGS_UPDATED',
        `Updated search engine & SEO metadata (allowIndexing=${mergedSeo?.allowIndexing})`
      );
    }
    writeDb(db);
    res.json({ settings: db.settings });
  });

  // Contact messages
  app.post('/api/contact', (req, res) => {
    const { name, email, phone, subject, message } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      subject?: string;
      message?: string;
    };
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      res.status(400).json({ error: 'Name, email, and message are required' });
      return;
    }
    const db = readDb();
    const record = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || '',
      subject: subject?.trim() || 'General Clinic Inquiry',
      message: message.trim(),
      status: 'new' as const,
      createdAt: new Date().toISOString(),
    };
    db.contactMessages.unshift(record);
    writeDb(db);
    res.status(201).json({ contactMessage: record });
  });

  app.patch('/api/contact/:id', requireAuth(['staff', 'admin']), (req, res) => {
    const db = readDb();
    const item = db.contactMessages.find((m) => m.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    item.status = req.body.status === 'reviewed' ? 'reviewed' : 'new';
    writeDb(db);
    res.json({ contactMessage: item });
  });

  // Vite or static serving
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(
      express.static(distPath, {
        maxAge: '1y',
        immutable: true,
        setHeaders(res, filePath) {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Arogya Multi-Specialty Clinic server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
