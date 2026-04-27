'use client';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button } from '@mui/material';

export default function AuthPage() {

  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Error signing up:', error);
    } else {
      alert('Sign up successful! Please check your email for confirmation.');
      console.log('User signed up successfully:', data);
    }
    setLoading(false);
  };

  const signIn = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error);
      setLoading(false);
    } else {
      alert('Login successful!');
      console.log('User signed in successfully:', data);
      router.push('/');
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', p: { xs: 4, md: 6 }, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)' }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
            Auth Actions
          </Typography>
        </Box>

        <TextField
          label="Email"
          fullWidth
          margin="normal"
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          sx={{ mb: 2 }}
        />

        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={signIn}
            disabled={loading || !email || !password}
            sx={{ height: 48, fontWeight: 600 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <Button 
            fullWidth 
            variant="outlined" 
            size="large"
            onClick={signUp} 
            disabled={loading || !email || !password}
            sx={{ height: 48, fontWeight: 600 }}
          >
            {loading ? 'Processing...' : 'Sign Up'}
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
            <Box sx={{ flexGrow: 1, borderBottom: '1px solid', borderColor: 'divider' }} />
          </Box>

          <Button 
            fullWidth 
            variant="text" 
            color="error"
            onClick={handleLogout} 
            disabled={loading}
          >
            {loading ? 'Logging out...' : 'Logout'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
