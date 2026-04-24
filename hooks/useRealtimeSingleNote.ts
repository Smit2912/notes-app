'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Payload = {
  content: string;
  version: number;
  updated_by?: string | null;
};

type Props = {
  noteId: string;
  onRemoteUpdate: (payload: Payload) => void;
};

export const useRealtimeSingleNote = ({
  noteId,
  onRemoteUpdate,
}: Props) => {
  const callbackRef = useRef(onRemoteUpdate);
  callbackRef.current = onRemoteUpdate;

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
          callbackRef.current({
            content: payload.new?.content ?? '',
            version: payload.new?.version ?? 1,
            updated_by: payload.new?.updated_by ?? null,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId]);
};