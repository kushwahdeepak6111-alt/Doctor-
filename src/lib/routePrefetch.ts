const prefetched = new Set<string>();

export const routeLoaders = {
  about: () => import('../pages/AboutPage'),
  specializations: () => import('../pages/SpecializationsPage'),
  doctors: () => import('../pages/DoctorsPage'),
  doctorDetail: () => import('../pages/DoctorDetailPage'),
  book: () => import('../pages/BookingPage'),
  faq: () => import('../pages/FaqPage'),
  contact: () => import('../pages/ContactPage'),
  login: () => import('../pages/LoginPage'),
  portal: () => import('../pages/PortalPage'),
  admin: () => import('../pages/AdminPage'),
};

export function prefetchRoute(path: string): void {
  const clean = (path.split('?')[0] || '/').trim();
  if (clean === '/' || clean === '' || prefetched.has(clean)) return;

  let loader: (() => Promise<unknown>) | undefined;
  if (clean === '/about') loader = routeLoaders.about;
  else if (clean === '/specializations' || clean === '/services') loader = routeLoaders.specializations;
  else if (clean === '/doctors') loader = routeLoaders.doctors;
  else if (clean.startsWith('/doctors/')) loader = routeLoaders.doctorDetail;
  else if (clean === '/book') loader = routeLoaders.book;
  else if (clean === '/faq') loader = routeLoaders.faq;
  else if (clean === '/contact') loader = routeLoaders.contact;
  else if (clean === '/login') loader = routeLoaders.login;
  else if (clean === '/portal') loader = routeLoaders.portal;
  else if (clean === '/admin' || clean.startsWith('/admin/')) loader = routeLoaders.admin;

  if (!loader) return;
  prefetched.add(clean);
  void loader().catch(() => {
    prefetched.delete(clean);
  });
}

export function warmPrimaryRoutes(): void {
  prefetchRoute('/doctors');
  prefetchRoute('/specializations');
  prefetchRoute('/book');
}
