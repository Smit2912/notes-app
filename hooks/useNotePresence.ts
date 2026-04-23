'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type UserType = {
  id: string;
  email?: string;
};

type PresenceUser = {
  user_id: string;
  email: string;
};

export const useNotePresence = (noteId: string, user: UserType | null) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!noteId || !user) return;

    const channel = supabase.channel(`note-room-${noteId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();

      // Deduplicate users by user_id to avoid showing the same user multiple times
      // (e.g. across multiple tabs or heartbeats)
      const uniqueMap = new Map<string, PresenceUser>();

      Object.values(state)
        .flat()
        .forEach((item: any) => {
          if (!item.user_id) return;
          uniqueMap.set(item.user_id, {
            user_id: item.user_id,
            email: item.email || 'Unknown',
          });
        });

      setOnlineUsers(Array.from(uniqueMap.values()));
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          email: user.email || 'Unknown',
        });
      }
      if (status === 'CHANNEL_ERROR') {
        console.error(
          'Realtime failed. Check if RLS allows selecting these tables.'
        );
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId, user?.id]); // Use user.id to avoid unnecessary re-subscriptions

  return { onlineUsers };
};
