import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { setAuthToken } from '@/lib/api';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        setAuthToken(session.access_token);
        await supabase.realtime.setAuth(session.access_token);
      }

      setUser(session?.user ?? null);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        setAuthToken(session.access_token);
        await supabase.realtime.setAuth(session.access_token);
      }

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};