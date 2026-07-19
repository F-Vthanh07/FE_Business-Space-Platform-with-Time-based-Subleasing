import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MeshBackground } from './components/MeshBackground';
import { UserDashboardPage } from './features/user-dashboard/UserDashboardPage';
import { AdminDashboardPage } from './features/admin-dashboard/AdminDashboardPage';
import { AccessDeniedPage } from './components/AccessDeniedPage';
import { Homepage } from './features/homepage/Homepage';
import { ListingFeed } from './features/feed/ListingFeed';
import { ListingDetail } from './features/feed/ListingDetail';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { PaymentSuccess, PaymentFailed } from './features/wallet';
import { OnboardingProfilePage } from './features/onboarding';
import ClickSpark from './components/ClickSpark'; 
import './App.css';

import { FloatingChat } from './components/FloatingChat'; // Sửa lại đường dẫn folder cho đúng nha


import { ROUTES, type PortalRole } from './routes/routes';
import { ProtectedRoute } from './routes/ProtectedRoute';

const App: React.FC = () => {
  const navigate = useNavigate();

  // Persist role in localStorage so direct route access on refresh works properly
  const [role, setRole] = useState<PortalRole | null>(() => {
    return localStorage.getItem('portal_role') as PortalRole | null;
  });

  const handleLogout = () => {
    // Giữ lại preference của người dùng, xóa hết các key còn lại
    const keepKeys = ['app-language', 'app-theme'];
    const saved: Record<string, string> = {};
    keepKeys.forEach((k) => { const v = localStorage.getItem(k); if (v !== null) saved[k] = v; });
    localStorage.clear();
    Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));
    setRole(null);
    navigate(ROUTES.LOGIN);
  };

  return (
    <>
      {/* HIỆU ỨNG CLICK TOÀN MÀN HÌNH */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}>
        <ClickSpark
          sparkColor="#00D4A0" /* Xanh neon đồng bộ với hệ thống */
          sparkSize={10}
          sparkRadius={15}
          sparkCount={8}
          duration={400}
          extraScale={1}
        />
      </div>

      <Routes>
        {/* Landing Page */}
        <Route 
          path={ROUTES.HOME} 
          element={<Homepage onLaunch={() => navigate(ROUTES.LOGIN)} />} 
        />

        <Route 
          path="/feed" 
          element={<ListingFeed />} 
        />

        <Route path="/listing/:id" element={<ListingDetail />} />

        {/* Login Page */}
        <Route 
          path={ROUTES.LOGIN} 
          element={<LoginPage onLoginSuccess={(selectedRole) => setRole(selectedRole)} />} 
        />

        {/* Register Page */}
        <Route
          path={ROUTES.REGISTER}
          element={<RegisterPage />}
        />

        {/* Post-registration onboarding: profile completion + optional CCCD verification */}
        <Route
          path={ROUTES.ONBOARDING}
          element={<OnboardingProfilePage />}
        />

        {/* User Dashboard (Space Owner + Renter merged) - Protected */}
        <Route
          path={`${ROUTES.USER}/*`}
          element={
            <ProtectedRoute allowedRoles={['user']} currentRole={role}>
              <MeshBackground>
                <UserDashboardPage onLogout={handleLogout} />
              </MeshBackground>
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard - Protected */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={['admin']} currentRole={role}>
              <MeshBackground>
                <AdminDashboardPage onLogout={handleLogout} />
              </MeshBackground>
            </ProtectedRoute>
          } 
        />

        {/* Payment Result Pages (post-gateway redirect landing pages) - Protected */}
        <Route
          path="/payment/success"
          element={
            <ProtectedRoute allowedRoles={['user']} currentRole={role}>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/failed"
          element={
            <ProtectedRoute allowedRoles={['user']} currentRole={role}>
              <PaymentFailed />
            </ProtectedRoute>
          }
        />

        {/* Access Denied Page */}
        <Route
          path={ROUTES.ACCESS_DENIED}
          element={<AccessDeniedPage />}
        />

        {/* Fallback Catch All */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>

      <FloatingChat />
    </>
  );
};

export default App;