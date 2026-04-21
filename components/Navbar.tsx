'use client';

import { supabase } from '@/lib/supabaseClient';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function Navbar({ user }: { user: any }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">Notes App</Typography>

        <div>
          <Typography variant="body2" style={{ marginRight: 10, display: 'inline' }}>
            {user?.email}
          </Typography>

          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Toolbar>
    </AppBar>
  );
}