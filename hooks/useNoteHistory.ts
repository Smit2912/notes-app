'use client';

import { useQuery } from '@tanstack/react-query';
import API from '@/lib/api';

export const useNoteHistory = (
  noteId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: ['note-history', noteId],

    queryFn: async () => {
      const res = await API.post(
        '/get-note-history',
        {
          note_id: noteId,
        }
      );

      return res.data.data;
    },

    enabled: !!noteId && enabled,

    staleTime: 0,
  });
};