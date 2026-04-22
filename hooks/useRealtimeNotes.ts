'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

// Global registry: ensures at most one live channel per user at any time.
// Prevents CHANNEL_ERROR caused by fast navigation creating duplicate channel names.
const activeChannels: Map<string, ReturnType<typeof supabase.channel>> =
  new Map();

async function safeRemoveChannel(
  channelName: string,
  channel: ReturnType<typeof supabase.channel>
) {
  try {
    activeChannels.delete(channelName);
    await supabase.removeChannel(channel);
  } catch {
    // Ignore errors on cleanup — channel may already be gone
  }
}

export const useRealtimeNotes = (user: any) => {
  const queryClient = useQueryClient();
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!user?.id) return;

    const channelName = `notes-${user.id}`;
    let retryCount = 0;
    const MAX_RETRIES = 5;

    const subscribe = async () => {
      if (!mountedRef.current) return;

      // Clean up any stale channel under this name before creating a new one
      const existing = activeChannels.get(channelName);
      if (existing) {
        await safeRemoveChannel(channelName, existing);
        // Give Supabase a tick to process the removal on the server side
        await new Promise((r) => setTimeout(r, 100));
      }

      if (!mountedRef.current) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mountedRef.current) return;

      if (!session?.access_token) {
        console.log('[Realtime] No session — skipping channel setup');
        return;
      }

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notes' },
          (payload) => {
            console.log('✅ NOTE CHANGE RECEIVED:', payload);
            queryClient.invalidateQueries({ queryKey: ['notes'] });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'note_collaborators' },
          (payload) => {
            console.log('✅ COLLAB CHANGE RECEIVED:', payload);
            queryClient.invalidateQueries({ queryKey: ['notes'] });
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Status:', status);

          if (status === 'SUBSCRIBED') {
            retryCount = 0; // Reset backoff on success
          }

          if (status === 'CHANNEL_ERROR' && mountedRef.current) {
            if (retryCount >= MAX_RETRIES) {
              console.warn('[Realtime] Max retries reached. Giving up.');
              return;
            }

            const delay = Math.min(1000 * 2 ** retryCount, 30_000); // exponential, max 30s
            retryCount++;
            console.warn(
              `[Realtime] CHANNEL_ERROR — retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`
            );

            retryTimerRef.current = setTimeout(() => {
              subscribe();
            }, delay);
          }
        });

      activeChannels.set(channelName, channel);
    };

    subscribe();

    return () => {
      mountedRef.current = false;

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      const ch = activeChannels.get(channelName);
      if (ch) {
        safeRemoveChannel(channelName, ch);
      }
    };
  }, [user?.id, queryClient]);
};
