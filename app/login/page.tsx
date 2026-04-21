'use client';

import { useState } from 'react';
import { TextField, Button, Container, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.push('/');
  };

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert('Signup successful. Please login.');
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4">Login</Typography>

      <TextField
        label="Email"
        fullWidth
        margin="normal"
        onChange={(e) => setEmail(e.target.value)}
      />

      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button fullWidth variant="contained" onClick={handleLogin}>
        Login
      </Button>

      <Button fullWidth onClick={handleSignup}>
        Signup
      </Button>
    </Container>
  );
}