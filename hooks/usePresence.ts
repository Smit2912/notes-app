'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type PresenceUser = {
  user_id: string;
  email: string;
  cursor?: number;
  online_at: string;
};

type TypingUser = {
  user_id: string;
  email: string;
};

export const usePresence = (noteId: string | null, user: any) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const channelRef = useRef<any>(null);

  const localTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const remoteTypingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  /**
   * -----------------------------
   * Normalize online users
   * -----------------------------
   */
  const syncPresenceState = () => {
    if (!channelRef.current || !user) return;

    const state = channelRef.current.presenceState();

    const allMetas = Object.values(state).flat() as PresenceUser[];

    const uniqueMap = new Map<string, PresenceUser>();

    allMetas.forEach((meta) => {
      const existing = uniqueMap.get(meta.user_id);

      if (!existing) {
        uniqueMap.set(meta.user_id, meta);
        return;
      }

      const oldTime = new Date(existing.online_at || 0).getTime();

      const newTime = new Date(meta.online_at || 0).getTime();

      if (newTime >= oldTime) {
        uniqueMap.set(meta.user_id, meta);
      }
    });

    const users = Array.from(uniqueMap.values());

    setOnlineUsers(users.filter((u) => u.user_id !== user.id));
  };

  /**
   * -----------------------------
   * Update my presence
   * -----------------------------
   */
  const trackPresence = async (payload: Partial<PresenceUser>) => {
    if (!channelRef.current || !user) return;

    await channelRef.current.track({
      user_id: user.id,
      email: user.email,
      cursor: 0,
      online_at: new Date().toISOString(),
      ...payload,
    });
  };

  /**
   * -----------------------------
   * Typing Broadcast
   * -----------------------------
   */
  const sendTyping = async () => {
    if (!channelRef.current || !user) return;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: user.id,
        email: user.email,
      },
    });

    if (localTypingTimeoutRef.current) {
      clearTimeout(localTypingTimeoutRef.current);
    }

    localTypingTimeoutRef.current = setTimeout(async () => {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: {
          user_id: user.id,
        },
      });
    }, 1200);
  };

  /**
   * -----------------------------
   * Cursor update
   * -----------------------------
   */
  const updateCursor = async (cursor: number) => {
    await trackPresence({ cursor });
  };

  /**
   * -----------------------------
   * Init Channel
   * -----------------------------
   */
  useEffect(() => {
    if (!noteId || !user) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      // If there is a lingering channel from a previous noteId, remove it and
      // wait a tick so Supabase server-side state settles before re-joining.
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        await new Promise((r) => setTimeout(r, 150));
      }

      if (cancelled) return;

      channel = supabase.channel(`presence-note-${noteId}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      channelRef.current = channel;

      channel
        /**
         * Presence
         */
        .on('presence', { event: 'sync' }, syncPresenceState)
        .on('presence', { event: 'join' }, syncPresenceState)
        .on('presence', { event: 'leave' }, syncPresenceState)

        /**
         * Typing start
         */
        .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
          if (!payload || payload.user_id === user.id) return;

          setTypingUsers((prev) => {
            const exists = prev.find((u) => u.user_id === payload.user_id);
            if (exists) return prev;
            return [...prev, { user_id: payload.user_id, email: payload.email }];
          });

          if (remoteTypingTimeoutsRef.current[payload.user_id]) {
            clearTimeout(remoteTypingTimeoutsRef.current[payload.user_id]);
          }

          remoteTypingTimeoutsRef.current[payload.user_id] = setTimeout(() => {
            setTypingUsers((prev) =>
              prev.filter((u) => u.user_id !== payload.user_id)
            );
          }, 1500);
        })

        /**
         * Typing stop
         */
        .on('broadcast', { event: 'stop_typing' }, ({ payload }: any) => {
          if (!payload) return;
          setTypingUsers((prev) =>
            prev.filter((u) => u.user_id !== payload.user_id)
          );
        })

        .subscribe(async (status: string) => {
          console.log(`[Presence ${noteId}] Status:`, status);
          if (status === 'SUBSCRIBED') {
            await trackPresence({ cursor: 0 });
          }
          if (status === 'CHANNEL_ERROR') {
            console.error(
              '[Presence] CHANNEL_ERROR — channel may still be closing server-side; will retry on next mount.'
            );
          }
        });
    };

    setup();

    return () => {
      cancelled = true;

      if (localTypingTimeoutRef.current) {
        clearTimeout(localTypingTimeoutRef.current);
      }
      Object.values(remoteTypingTimeoutsRef.current).forEach(clearTimeout);

      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
        channelRef.current = null;
      }
    };
  }, [noteId, user?.id]);

  return {
    onlineUsers,
    typingUsers,
    triggerTyping: sendTyping,
    updateCursor,
  };
};
