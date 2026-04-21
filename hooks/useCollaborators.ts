import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '@/lib/api';

export const useGetCollaborators = (noteId: string | null) => {
  return useQuery({
    queryKey: ['collaborators', noteId],
    queryFn: async () => {
      const res = await API.post('/get-collaborators', {
        note_id: noteId,
      });
      return res.data;
    },
    enabled: !!noteId, // 🚀 prevents unnecessary calls
  });
};

export const useAddCollaborator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      note_id: string;
      email: string;
      role: string;
    }) => {
      const res = await API.post('/add-collaborator', data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['collaborators', variables.note_id],
      });
    },
  });
};

export const useUpdateCollaborator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      note_id: string;
      user_id: string;
      role: string;
    }) => {
      const res = await API.post('/update-collaborator', data);
      return res.data;
    },
    onMutate: async (variables) => {
      const { note_id, user_id, role } = variables;

      await queryClient.cancelQueries({
        queryKey: ['collaborators', note_id],
      });

      const previous = queryClient.getQueryData(['collaborators', note_id]);

      queryClient.setQueryData(['collaborators', note_id], (old: any[]) =>
        old?.map((c) => (c.user_id === user_id ? { ...c, role } : c))
      );

      return { previous };
    },

    onError: (_err, variables, context) => {
      queryClient.setQueryData(
        ['collaborators', variables.note_id],
        context?.previous
      );
    },

    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['collaborators', variables.note_id],
      });
    },
  });
};

export const useRemoveCollaborator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { note_id: string; user_id: string }) => {
      const res = await API.post('/remove-collaborator', data);
      return res.data;
    },
    onMutate: async (variables) => {
      const { note_id, user_id } = variables;

      await queryClient.cancelQueries({
        queryKey: ['collaborators', note_id],
      });

      const previous = queryClient.getQueryData(['collaborators', note_id]);

      queryClient.setQueryData(['collaborators', note_id], (old: any[]) =>
        old?.filter((c) => c.user_id !== user_id)
      );

      return { previous };
    },

    onError: (_err, variables, context) => {
      queryClient.setQueryData(
        ['collaborators', variables.note_id],
        context?.previous
      );
    },

    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['collaborators', variables.note_id],
      });
    },
  });
};
