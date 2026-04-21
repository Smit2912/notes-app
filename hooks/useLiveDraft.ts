'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  noteId: string;
  user: any;
  onRemoteDraft: (content: string) => void;
};

export const useLiveDraft = ({
  noteId,
  user,
  onRemoteDraft,
}: Props) => {
  const channelRef = useRef<any>(null);

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

  useEffect(() => {
    if (!noteId || !user) return;

    const channel = supabase.channel(`draft-note-${noteId}`);

    channelRef.current = channel;

    channel
      .on(
        'broadcast',
        { event: 'draft_update' },
        ({ payload }: any) => {
          if (!payload) return;
          if (payload.user_id === user.id) return;

          onRemoteDraft(payload.content);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId, user?.id, onRemoteDraft]);

  return { sendDraft };
};