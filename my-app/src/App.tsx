import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { MeshBackground } from './components/MeshBackground';
import { Header } from './components/Header';
import { UserDashboardPage } from './features/user-dashboard/UserDashboardPage';
import { AdminDashboardPage } from './features/admin-dashboard/AdminDashboardPage';
import { AccessDeniedPage } from './components/AccessDeniedPage';
import { Homepage } from './features/homepage/Homepage';
import { ListingFeed } from './features/feed/ListingFeed';
import { ListingDetail } from './features/feed/ListingDetail';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { PaymentSuccess, PaymentFailed } from './features/wallet';
import { OnboardingProfilePage } from './features/onboarding';
import { AiImageEditorPage } from './features/ai-image-editor/AiImageEditorPage';
import ClickSpark from './components/ClickSpark'; 
import './App.css';

import { NotFoundPage } from './components/NotFoundPage'; // Chỉnh đường dẫn nếu cần

import { FloatingChat } from './components/FloatingChat'; 

import { ROUTES, type PortalRole } from './routes/routes';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { clearLocalStorageForLogout } from './utils/preserveLocalStorage';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Persist role in localStorage so direct route access on refresh works properly
  const [role, setRole] = useState<PortalRole | null>(() => {
    return localStorage.getItem('portal_role') as PortalRole | null;
  });

  const handleLogout = () => {
    clearLocalStorageForLogout();
    setRole(null);
    navigate(ROUTES.LOGIN);
  };

  return (
    <>
      {/* Hiệu ứng click toàn màn hình */}
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

        <Route
          path="/ai-image-editor"
          element={
            <ProtectedRoute allowedRoles={['user']} currentRole={role}>
              <MeshBackground>
                <div className="app-shell">
                  <Header />
                  <main className="main-content ai-editor-standalone">
                    <AiImageEditorPage />
                  </main>
                </div>
              </MeshBackground>
            </ProtectedRoute>
          }
        />

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

        {/* Forgot Password Page */}
        <Route
          path={ROUTES.FORGOT_PASSWORD}
          element={<ForgotPasswordPage />}
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

        {/* Fallback Catch All (404 Page) */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {!isAdminRoute && <FloatingChat />}
    </>
  );
};

export default App;

