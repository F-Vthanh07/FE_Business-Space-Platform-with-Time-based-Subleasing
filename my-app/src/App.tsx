import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MeshBackground } from './components/MeshBackground';
import { OwnerDashboardPage } from './features/owner-dashboard/OwnerDashboardPage';
import { RenterDashboardPage } from './features/renter-dashboard/RenterDashboardPage';
import { Homepage } from './features/homepage/Homepage';
import { AuthPage } from './features/auth/AuthPage';
import './App.css';

type PortalRole = 'owner' | 'renter';

// Export route paths of each page as requested
export const ROUTES = {
  HOME: '/',
  OWNER: '/owner',
  RENTER: '/renter',
  LOGIN: '/login',
};

// ProtectedRoute component inside App.tsx for role checking and redirection
interface ProtectedRouteProps {
  allowedRoles: PortalRole[];
  currentRole: PortalRole | null;
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, currentRole, children }) => {
  if (!currentRole) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return children;
};

const App: React.FC = () => {
  const navigate = useNavigate();

  // Persist role in localStorage so direct route access on refresh works properly
  const [role, setRole] = useState<PortalRole | null>(() => {
    return localStorage.getItem('portal_role') as PortalRole | null;
  });

  const handleLogout = () => {
    localStorage.removeItem('portal_role');
    localStorage.removeItem('portal_token');
    setRole(null);
    navigate(ROUTES.LOGIN);
  };

  return (
    <Routes>
      {/* Landing Page */}
      <Route 
        path={ROUTES.HOME} 
        element={<Homepage onLaunch={() => navigate(ROUTES.LOGIN)} />} 
      />

      {/* Login / Register Page */}
      <Route 
        path={ROUTES.LOGIN} 
        element={<AuthPage onLoginSuccess={(selectedRole) => setRole(selectedRole)} />} 
      />

      {/* Space Owner Dashboard - Protected */}
      <Route 
        path="/owner/*" 
        element={
          <ProtectedRoute allowedRoles={['owner']} currentRole={role}>
            <MeshBackground>
              <OwnerDashboardPage onLogout={handleLogout} />
            </MeshBackground>
          </ProtectedRoute>
        } 
      />

      {/* Primary Tenant Dashboard - Protected */}
      <Route 
        path="/renter/*" 
        element={
          <ProtectedRoute allowedRoles={['renter']} currentRole={role}>
            <MeshBackground>
              <RenterDashboardPage onLogout={handleLogout} />
            </MeshBackground>
          </ProtectedRoute>
        } 
      />

      {/* Fallback Catch All */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
};

export default App;
