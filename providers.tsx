'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

import {
  ThemeProvider,
  CssBaseline,
  createTheme,
} from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

export default function Providers({
  children,
}: {
  children: ReactNode;
}) {
  const [queryClient] = useState(
    () => new QueryClient()
  );

  return (
    <AppRouterCacheProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </AppRouterCacheProvider>
  );
}