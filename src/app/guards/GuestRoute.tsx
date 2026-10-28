import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/src/stores/authStore';

export const GuestRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  const hasPanelAccess =
    !!user &&
    (user.role === 'admin' ||
      user.roles?.includes('admin') ||
      user.roles?.includes('employee') ||
      (user.permissions?.length ?? 0) > 0);

  if (isAuthenticated && hasPanelAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
