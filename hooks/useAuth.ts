import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { setAuthToken } from '@/lib/api';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();

      const session = data.session;

      if (session?.access_token) {
        setAuthToken(session.access_token);
      }

      setUser(session?.user ?? null);
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.access_token) {
          setAuthToken(session.access_token); // ✅ direct, no extra call
        }

        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};