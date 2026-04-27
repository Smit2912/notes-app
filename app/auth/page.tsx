'use client';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

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
    <div style={{ padding: 20 }}>
      <h1>Auth</h1>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />

      <br />
      <br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />

      <br />
      <br />

      <button onClick={signUp} className="mr-4" disabled={loading}>
        {loading ? 'Processing...' : 'Sign Up'}
      </button>
      <button onClick={signIn} className="mr-4" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      <button onClick={handleLogout} disabled={loading}>
        {loading ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}
