'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import API from '@/lib/api';

export const useUpdateNoteContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; content: string }) => {
      const res = await API.post('/update-note-content', data);
      return res.data;
    },

    // Optimistic cache update
    onMutate: async (variables) => {
      const { id, content } = variables;

      await queryClient.cancelQueries({
        queryKey: ['note', id],
      });

      const previousNote = queryClient.getQueryData(['note', id]);

      queryClient.setQueryData(['note', id], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          content,
        };
      });

      return { previousNote };
    },

    // Rollback if failed
    onError: (_error, variables, context) => {
      queryClient.setQueryData(['note', variables.id], context?.previousNote);
    },

    // Sync after mutation
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['note', variables.id],
      });

      queryClient.invalidateQueries({
        queryKey: ['notes'],
      });

      queryClient.invalidateQueries({
        queryKey: ['note-history', variables.id],
      });
    },
  });
};
