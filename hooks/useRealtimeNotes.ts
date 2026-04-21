'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

export const useRealtimeNotes = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('notes-realtime')

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notes'] });
        }
      )

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'note_collaborators',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notes'] });
          queryClient.invalidateQueries({ queryKey: ['collaborators'] });
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};