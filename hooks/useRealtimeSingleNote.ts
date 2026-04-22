'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  noteId: string;
  onRemoteUpdate: (payload: { content: string; version: number }) => void;
};

export const useRealtimeSingleNote = ({ noteId, onRemoteUpdate }: Props) => {
  useEffect(() => {
    if (!noteId) return;

    const channel = supabase
      .channel(`note-${noteId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notes',
          filter: `id=eq.${noteId}`,
        },
        (payload: any) => {
          onRemoteUpdate({
            content: payload.new?.content ?? '',
            version: payload.new?.version ?? 1,
          });
        }
      )
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
  }, [noteId, onRemoteUpdate]);
};
