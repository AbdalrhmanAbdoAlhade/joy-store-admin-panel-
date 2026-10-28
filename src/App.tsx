import React, { Suspense, useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import Providers from './app/providers';
import { router } from './app/router';
import ErrorBoundary from '@/src/components/errors/ErrorBoundary';
import PageLoader from '@/src/components/loaders/PageLoader';
import { authService } from '@/src/services/authService';
import { useAuthStore } from '@/src/stores/authStore';

const CenteredLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <PageLoader label="جاري التحميل..." />
  </div>
);

const AppShell: React.FC = () => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('toy_admin_token');
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }
      try {
        const user = await authService.getProfile(token);
        useAuthStore.getState().login(token, user);
      } catch {
        useAuthStore.getState().logout();
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  if (isCheckingAuth) {
    return <CenteredLoader />;
  }

  return (
    <Suspense fallback={<CenteredLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default function App() {
  return (
    <Providers>
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </Providers>
  );
}
