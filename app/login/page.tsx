'use client';

import { useState } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);

  const handleLogin = async () => {
    setSignInLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
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
      alert(error.message);
      setSignUpLoading(false);
      return;
    }

    alert('Signup successful. Please login.');
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
    </Container>
  );
}