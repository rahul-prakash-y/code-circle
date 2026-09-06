import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import MainLayout from './layouts/MainLayout';
import { Toaster } from 'react-hot-toast';
import { PageSkeleton } from './components/ui/LoadingSkeleton';

// Code-split route components via React.lazy for high-performance initial loading
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const StudentBearers = lazy(() => import('./pages/StudentBearers'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const CodingWorkspace = lazy(() => import('./components/coding/CodingWorkspace'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const NewsFeed = lazy(() => import('./pages/NewsFeed'));

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
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
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
          }
        }}
      />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/bearers" element={<StudentBearers />} />
          <Route 
            path="/news" 
            element={
              <MainLayout>
                <NewsFeed />
              </MainLayout>
            } 
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/problem/:id"
            element={
              <ProtectedRoute>
                <CodingWorkspace />
              </ProtectedRoute>
            }
          />

          {/* User Management Module (Admin & SuperAdmin) */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin', 'Faculty', 'Committee']}>
                <MainLayout>
                  <UserManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Legacy backward compatibility for /students */}
          <Route
            path="/students"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin', 'Faculty', 'Committee']}>
                <MainLayout>
                  <UserManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
