'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  noteId: string;
  user: any;
  onRemoteDraft: (content: string) => void;
  onResolution?: (version: number) => void;
};

export const useLiveDraft = ({ noteId, user, onRemoteDraft, onResolution }: Props) => {
  const channelRef = useRef<any>(null);
  const callbackRef = useRef(onRemoteDraft);
  callbackRef.current = onRemoteDraft;

  const resolutionCallbackRef = useRef(onResolution);
  resolutionCallbackRef.current = onResolution;

  const sendDraft = async (content: string) => {
    if (!channelRef.current || !user) return;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'draft_update',
      payload: {
        user_id: user.id,
        content,
      },
    });
  };

  const sendResolution = async (version: number) => {
    if (!channelRef.current || !user) return;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'conflict_resolved',
      payload: {
        user_id: user.id,
        version,
      },
    });
  };

  useEffect(() => {
    if (!noteId || !user) return;

    const channel = supabase.channel(`draft-note-${noteId}`);

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'draft_update' }, ({ payload }: any) => {
        if (!payload) return;
        if (payload.user_id === user.id) return;

        callbackRef.current(payload.content);
      })
      .on('broadcast', { event: 'conflict_resolved' }, ({ payload }: any) => {
        if (!payload || payload.user_id === user.id) return;
        if (resolutionCallbackRef.current) {
          resolutionCallbackRef.current(payload.version);
        }
      })
      .subscribe((status) => {
        console.log('Realtime Status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error(
            'Realtime failed. Check if RLS allows selecting these tables.'
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId, user?.id]);

  return { sendDraft, sendResolution };
};
