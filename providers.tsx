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
    primary: {
      main: '#000000',
      dark: '#333333',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#666666',
      light: '#f5f5f5',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    divider: '#eaeaea',
    text: {
      primary: '#111827',
      secondary: '#6b7280',
    },
    error: {
      main: '#ef4444',
      light: '#fef2f2',
    },
    success: {
      main: '#10b981',
      light: '#ecfdf5',
    },
    warning: {
      main: '#f59e0b',
      light: '#fffbeb',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), Inter, Roboto, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.5rem' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
    // Fill the rest of the 25 required shadows with the largest one to satisfy MUI
    ...Array(19).fill('0px 25px 50px -12px rgba(0, 0, 0, 0.25)')
  ] as any, // Cast as any because MUI expects a fixed tuple of 25 strings
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
        outlined: {
          borderColor: '#eaeaea',
          '&:hover': {
            backgroundColor: '#f9fafb',
            borderColor: '#d1d5db',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #eaeaea',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.04), 0px 1px 2px rgba(0, 0, 0, 0.02)',
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            backgroundColor: '#ffffff',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: '#e5e7eb',
            },
            '&:hover fieldset': {
              borderColor: '#d1d5db',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#000000',
              borderWidth: '1px',
              boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
          padding: '24px 24px 16px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '0 24px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          borderTop: '1px solid #eaeaea',
          backgroundColor: '#f9fafb',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundColor: '#e0e7ff',
          color: '#4338ca',
        },
        colorSuccess: {
          backgroundColor: '#ecfdf5',
          color: '#047857',
        },
        colorWarning: {
          backgroundColor: '#fffbeb',
          color: '#b45309',
        },
        colorError: {
          backgroundColor: '#fef2f2',
          color: '#b91c1c',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#111827',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid #eaeaea',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderLeft: '1px solid #eaeaea',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.04)',
        },
      },
    },
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