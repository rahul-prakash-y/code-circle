import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import MainLayout from './layouts/MainLayout';
import { Toaster } from 'react-hot-toast';
import { PageSkeleton } from './components/ui/LoadingSkeleton';
import { ThemeProvider } from './context/ThemeContext';

// Code-split route components via React.lazy for high-performance initial loading
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const SetupPassword = lazy(() => import('./pages/SetupPassword'));
const StudentBearers = lazy(() => import('./pages/StudentBearers'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const DomainsPage = lazy(() => import('./pages/DomainsPage'));
const AssessmentsPage = lazy(() => import('./pages/AssessmentsPage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const PassportPage = lazy(() => import('./pages/PassportPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const Profile = lazy(() => import('./pages/Profile'));
const CodingWorkspace = lazy(() => import('./components/coding/CodingWorkspace'));
const CodingAssessmentWorkspace = lazy(() => import('./components/coding/CodingAssessmentWorkspace'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const NewsFeed = lazy(() => import('./pages/NewsFeed'));
const TeamsManagement = lazy(() => import('./pages/TeamsManagement'));
const BearerManagement = lazy(() => import('./pages/BearerManagement'));
const StudentTrackingPage = lazy(() => import('./pages/StudentTrackingPage'));
const VerifyCertificatePage = lazy(() => import('./pages/VerifyCertificatePage'));
const DiagnosticsPage = lazy(() => import('./pages/DiagnosticsPage'));

export const decodeJwtPayload = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, token } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if JWT payload or user state requires password change
  const jwtPayload = decodeJwtPayload(token);
  const requirePasswordChange = Boolean(
    jwtPayload?.requirePasswordChange ||
    user?.requirePasswordChange ||
    user?.mustChangePassword
  );

  // Force redirect to /setup-password until initial password change is completed
  if (requirePasswordChange && location.pathname !== '/setup-password') {
    return <Navigate to="/setup-password" replace />;
  }

  // If password was already updated, prevent accessing setup screen
  if (!requirePasswordChange && location.pathname === '/setup-password') {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles) {
    const hasClearance = user.role === 'SuperAdmin' || allowedRoles.includes(user.role);
    if (!hasClearance) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Single consolidated auth and profile initialization
    checkAuth();
  }, [checkAuth]);

  return (
    <ThemeProvider>
      <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 2600,
          className: '!rounded-full !text-[13px] !font-medium',
          style: {
            background: 'var(--surface)',
            color: 'var(--label-primary)',
            border: '1px solid var(--separator)',
            boxShadow: 'var(--shadow-lg)',
            padding: '8px 16px',
            letterSpacing: '-0.01em',
          },
          success: {
            iconTheme: {
              primary: 'var(--success)',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--destructive)',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Public Certificate Verification Routes */}
          <Route path="/verify/:code" element={<VerifyCertificatePage />} />
          <Route path="/certificates/verify/:code" element={<VerifyCertificatePage />} />

          {/* Mandatory Initial Password Setup Route */}
          <Route
            path="/setup-password"
            element={
              <ProtectedRoute>
                <SetupPassword />
              </ProtectedRoute>
            }
          />

          {/* Fullscreen Coding Workspace without App Shell */}
          <Route
            path="/problem/:id"
            element={
              <ProtectedRoute>
                <CodingWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/code/:problemId"
            element={
              <ProtectedRoute>
                <CodingAssessmentWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/code/level/:levelId"
            element={
              <ProtectedRoute>
                <CodingAssessmentWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/code/:problemId"
            element={
              <ProtectedRoute>
                <CodingAssessmentWorkspace />
              </ProtectedRoute>
            }
          />


          {/* Persistent App Shell Layout Route */}
          <Route element={<MainLayout />}>
            <Route path="/news" element={<NewsFeed />} />
            <Route path="/bearers" element={<StudentBearers />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Dedicated Student & Academic Routes */}
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <DomainsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:domainId"
              element={
                <ProtectedRoute>
                  <DomainsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/domains"
              element={
                <ProtectedRoute>
                  <DomainsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/domains/:domainId"
              element={
                <ProtectedRoute>
                  <DomainsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/assessments"
              element={
                <ProtectedRoute>
                  <AssessmentsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/certificates"
              element={
                <ProtectedRoute>
                  <CertificatesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/passport"
              element={
                <ProtectedRoute>
                  <PassportPage />
                </ProtectedRoute>
              }
            />
            <Route path="/registrations" element={<Navigate to="/passport" replace />} />

            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <FeedbackPage />
                </ProtectedRoute>
              }
            />

            {/* Student Bearers (Club Executives) Management Module (SuperAdmin Only) */}
            <Route
              path="/bearers/manage"
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin']}>
                  <BearerManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bearers"
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin']}>
                  <BearerManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin']}>
                  <BearerManagement />
                </ProtectedRoute>
              }
            />

            {/* User Management Module (Admin & SuperAdmin) */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin', 'Faculty', 'Committee']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            {/* Legacy backward compatibility for /students */}
            <Route
              path="/students"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin', 'Faculty', 'Committee']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            {/* Student Tracking Module (SuperAdmin & Admin) */}
            <Route
              path="/tracking"
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']}>
                  <StudentTrackingPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Analytics Module */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin', 'Faculty', 'Committee']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* SuperAdmin Diagnostics & Database Manager Module */}
            <Route
              path="/diagnostics"
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin']}>
                  <DiagnosticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/diagnostics"
              element={
                <ProtectedRoute allowedRoles={['SuperAdmin']}>
                  <DiagnosticsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
    </ThemeProvider>
  );
}

export default App;
