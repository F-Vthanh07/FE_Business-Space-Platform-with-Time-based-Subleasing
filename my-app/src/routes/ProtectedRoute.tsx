import React from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES, type PortalRole } from './routes';

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
    return <Navigate to={ROUTES.ACCESS_DENIED} replace />;
  }

  return children;
};
