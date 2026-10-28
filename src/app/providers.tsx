import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useThemeStore } from '@/src/stores/themeStore';
import '@/src/i18n';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 3, // 3 minutes
            gcTime: 1000 * 60 * 15,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const { isDark } = useThemeStore();
  const isRtl = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position={isRtl ? 'bottom-left' : 'bottom-right'}
        dir={isRtl ? 'rtl' : 'ltr'}
        theme={isDark ? 'dark' : 'light'}
        richColors
        closeButton
      />
    </QueryClientProvider>
  );
};

export default Providers;
