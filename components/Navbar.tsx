'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function Navbar({ user }: { user: any }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">Notes App</Typography>

        <div>
          <Typography variant="body2" style={{ marginRight: 10, display: 'inline' }}>
            {user?.email}
          </Typography>

          <Button color="inherit" onClick={handleLogout} disabled={loading}>
            {loading ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </Toolbar>
    </AppBar>
  );
}