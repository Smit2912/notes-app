'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import API from '@/lib/api';

type UpdatePayload = {
  id: string;
  content: string;
  version?: number;
};

type UpdateResponse = {
  message: string;
  version: number;
};

export const useUpdateNoteContent = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateResponse, any, UpdatePayload>({
    mutationFn: async (data: UpdatePayload) => {
      const res = await API.post('/update-note-content', data);
      return res.data;
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['notes'],
      });

      queryClient.invalidateQueries({
        queryKey: ['note-history', variables.id],
      });
    },
  });
};