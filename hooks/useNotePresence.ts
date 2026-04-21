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

export const useNotePresence = (
  noteId: string,
  user: UserType | null
) => {
  const [onlineUsers, setOnlineUsers] = useState<
    PresenceUser[]
  >([]);

  useEffect(() => {
    if (!noteId || !user) return;

    const channel = supabase.channel(
      `note-room-${noteId}`,
      {
        config: {
          presence: {
            key: user.id,
          },
        },
      }
    );

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();

      const users = Object.values(state)
        .flat()
        .map((item: any) => ({
          user_id: item.user_id,
          email: item.email,
        }));

      setOnlineUsers(users);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          email: user.email || 'Unknown',
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId, user]);

  return { onlineUsers };
};