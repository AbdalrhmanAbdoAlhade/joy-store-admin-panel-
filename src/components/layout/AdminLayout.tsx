import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import SessionTimeoutWarning from '@/src/components/common/SessionTimeoutWarning';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      <div className="flex flex-1 min-h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Suspense
              fallback={
                <div className="h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>

      {/* Global Inactivity Guard Modal */}
      <SessionTimeoutWarning />
    </div>
  );
};

export default AdminLayout;
