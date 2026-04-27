'use client';

import { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Snackbar, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleLogin = async () => {
    setSignInLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showToast(error.message, 'error');
      setSignInLoading(false);
      return;
    }

    const { data } = await supabase.auth.getUser();
    console.log(`User signed in successfully: ${data}`);

    router.push('/');
  };

  const handleSignup = async () => {
    setSignUpLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      showToast(error.message, 'error');
      setSignUpLoading(false);
      return;
    }

    showToast('Signup successful. Please login.', 'success');
    const { data } = await supabase.auth.getUser();
    console.log(`User signed up successfully: ${data}`);
    setSignUpLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', p: { xs: 4, md: 6 }, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)' }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
            Welcome back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to access your notes
          </Typography>
        </Box>

        <TextField
          label="Email"
          fullWidth
          margin="normal"
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleLogin}
          disabled={signInLoading || signUpLoading || !email || !password}
          sx={{ mb: 2, height: 48, fontWeight: 600 }}
        >
          {signInLoading ? 'Logging in...' : 'Sign In'}
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
          <Box sx={{ flexGrow: 1, borderBottom: '1px solid', borderColor: 'divider' }} />
          <Typography variant="body2" sx={{ px: 2, color: 'text.secondary', fontWeight: 500 }}>
            OR
          </Typography>
          <Box sx={{ flexGrow: 1, borderBottom: '1px solid', borderColor: 'divider' }} />
        </Box>

        <Button
          fullWidth
          variant="outlined"
          size="large"
          onClick={handleSignup}
          disabled={signUpLoading || signInLoading || !email || !password}
          sx={{ height: 48, fontWeight: 600, color: 'text.primary', borderColor: 'divider' }}
        >
          {signUpLoading ? 'Creating account...' : 'Create an Account'}
        </Button>
      </Box>

      {/* 🔥 Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          variant="filled"
          sx={{
            width: '100%',
            minWidth: '300px',
            borderRadius: '12px',
            fontWeight: 500,
            fontSize: '0.9rem',
            alignItems: 'center',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
            '& .MuiAlert-icon': {
              fontSize: '22px',
            },
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}