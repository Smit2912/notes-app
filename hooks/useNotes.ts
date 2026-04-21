import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '@/lib/api';

export const useGetNotes = () => {
  return useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      try {
        const res = await API.get('/get-notes');
        return res.data;
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === 'object' && error !== null && 'response' in error
            ? (error as any).response?.data?.error
            : undefined;

        throw new Error(message || 'Failed to fetch notes');
      }
    },
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await API.post('/create-note', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      content: string;
    }) => {
      const res = await API.post('/update-note', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

// export const useUpdateNoteContent = () => {
//   return useMutation({
//     mutationFn: async (data: {
//       id: string;
//       content: string;
//     }) => {
//       const res = await API.post('/update-note-content', data);
//       return res.data;
//     },
//   });
// };

export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await API.post('/delete-note', { id });
      return res.data;
    },
    // 🚀 OPTIMISTIC UPDATE
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] });

      const previousNotes = queryClient.getQueryData(['notes']);

      queryClient.setQueryData(['notes'], (old: any) => ({
        ...old,
        data: old.data.filter((note: any) => note.id !== id),
      }));

      return { previousNotes };
    },

    // ❌ rollback if failed
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['notes'], context?.previousNotes);
    },

    // 🔄 always refetch for consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};
