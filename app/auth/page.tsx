'use client';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

export default function AuthPage() {

  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signUp = async () => {
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
  };

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log(data.session?.access_token);
    await supabase.auth.getSession();

    if (error) {
      console.error('Error signing in:', error);
    } else {
      alert('Login successful!');
      console.log('User signed in successfully:', data);
      router.push('/');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Auth</h1>

      <input placeholder='Email' onChange={(e) => setEmail(e.target.value)} />

      <br />
      <br />

      <input
        type='password'
        placeholder='Password'
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />
      <br />

      <button onClick={signUp} className='mr-4'>
        Sign Up
      </button>
      <button onClick={signIn} className='mr-4'>
        Login
      </button>
      <button onClick={() => supabase.auth.signOut()}>Logout</button>
    </div>
  );
}
