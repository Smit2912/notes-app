'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
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
    <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary' }}>
          Notes App
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user?.email && (
            <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
              {user.email}
            </Typography>
          )}

          <Button 
            variant="outlined" 
            size="small"
            color="inherit" 
            onClick={handleLogout} 
            disabled={loading}
            sx={{ color: 'text.primary', borderColor: 'divider' }}
          >
            {loading ? 'Logging out...' : 'Logout'}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}