import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/src/stores/authStore';

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasPanelAccess =
    user.role === 'admin' ||
    user.roles?.includes('admin') ||
    user.roles?.includes('employee') ||
    (user.permissions?.length ?? 0) > 0;

  if (!hasPanelAccess) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
