'use client';

import { useState } from 'react';
import { TextField, Button, Container, Typography } from '@mui/material';
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

      <Button
        fullWidth
        variant="contained"
        onClick={handleLogin}
        disabled={signInLoading}
      >
        {signInLoading ? 'Logging in...' : 'Login'}
      </Button>

      <Button fullWidth onClick={handleSignup} disabled={signUpLoading}>
        {signUpLoading ? 'Signing up...' : 'Signup'}
      </Button>
    </Container>
  );
}