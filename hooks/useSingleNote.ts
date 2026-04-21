'use client';

import { useQuery } from '@tanstack/react-query';
import API from '@/lib/api';

export const useSingleNote = (
  id: string,
  enabled?: boolean
) => {
  return useQuery({
    queryKey: ['note', id],

    queryFn: async () => {
      const res = await API.post(
        '/get-note-by-id',
        { id }
      );

      return res.data.data;
    },

    enabled: enabled ?? !!id,
  });
};