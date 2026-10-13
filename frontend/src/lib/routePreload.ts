/**
 * Smart Route Preloader for Code Circle
 * Preloads dynamic page chunks on hover/focus or browser idle time
 * ensuring 0ms navigation delays and eliminating loading skeletons during active browsing.
 */

const loaders: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('../pages/Dashboard'),
  '/events': () => import('../pages/EventsPage'),
  '/courses': () => import('../pages/DomainsPage'),
  '/domains': () => import('../pages/DomainsPage'),
  '/assessments': () => import('../pages/AssessmentsPage'),
  '/contests': () => import('../pages/ContestsPage'),
  '/attendance': () => import('../pages/AttendancePage'),
  '/certificates': () => import('../pages/CertificatesPage'),
  '/leaderboard': () => import('../pages/LeaderboardPage'),
  '/points': () => import('../pages/PointsPage'),
  '/my-points': () => import('../pages/PointsPage'),
  '/admin/points': () => import('../pages/PointsPage'),
  '/passport': () => import('../pages/PassportPage'),
  '/registrations': () => import('../pages/PassportPage'),
  '/feedback': () => import('../pages/FeedbackPage'),
  '/news': () => import('../pages/NewsFeed'),
  '/bearers': () => import('../pages/StudentBearers'),
  '/bearers/manage': () => import('../pages/BearerManagement'),
  '/teams': () => import('../pages/BearerManagement'),
  '/admin/bearers': () => import('../pages/BearerManagement'),
  '/users': () => import('../pages/UserManagement'),
  '/students': () => import('../pages/UserManagement'),
  '/tracking': () => import('../pages/StudentTrackingPage'),
  '/analytics': () => import('../pages/AnalyticsPage'),
  '/diagnostics': () => import('../pages/DiagnosticsPage'),
  '/admin/diagnostics': () => import('../pages/DiagnosticsPage'),
  '/profile': () => import('../pages/Profile'),
};

const preloadedSet = new Set<string>();

/**
 * Preload a specific route on demand (e.g. on hover / focus)
 */
export const preloadRoute = (path: string) => {
  if (!path) return;
  const base = path.split('?')[0].split('#')[0];
  if (preloadedSet.has(base)) return;
  const loader = loaders[base];
  if (loader) {
    preloadedSet.add(base);
    loader().catch(() => {
      preloadedSet.delete(base);
    });
  }
};

/**
 * Preload primary navigation routes in the background during idle time
 */
export const preloadCommonRoutes = () => {
  const common = [
    '/dashboard',
    '/events',
    '/courses',
    '/points',
    '/attendance',
    '/leaderboard',
    '/news',
  ];

  const execute = () => {
    common.forEach((route) => preloadRoute(route));
  };

  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(execute);
    } else {
      setTimeout(execute, 1200);
    }
  }
};

export default preloadRoute;
