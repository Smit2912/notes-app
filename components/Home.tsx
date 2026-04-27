'use client';

import {
  useGetNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from '@/hooks/useNotes';
import {
  useAddCollaborator,
  useGetCollaborators,
  useRemoveCollaborator,
  useUpdateCollaborator,
} from '@/hooks/useCollaborators';

import { useState } from 'react';

import {
  Container,
  Typography,
  Card,
  CardContent,
  Snackbar,
  Alert,
} from '@mui/material';
import { Skeleton } from '@mui/material';

import { useRouter } from 'next/navigation';

import { useRealtimeNotes } from '@/hooks/useRealtimeNotes';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';

import CreateNoteForm from '@/components/notes/CreateNoteForm';
import NoteCard from '@/components/notes/NoteCard';
import CollaboratorDialog from '@/components/notes/CollaboratorDialog';
import EditNoteDialog from '@/components/notes/EditNoteDialog';
import { useQueryClient } from '@tanstack/react-query';

export default function Home() {
  // const { user } = useAuth();
  // useRealtimeNotes(user?.id);

  const queryClient = useQueryClient(); 

  
  const { user, loading } = useAuth();

  useRealtimeNotes(!loading ? user : null);
  
  const router = useRouter();

  const { data, isLoading, error } = useGetNotes();

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const addCollaborator = useAddCollaborator();
  const updateCollaborator = useUpdateCollaborator();
  const removeCollaborator = useRemoveCollaborator();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState('viewer');

  const [openDialog, setOpenDialog] = useState(false);

  const [editingNote, setEditingNote] = useState<any>(null);

  const { onlineUsers } = usePresence(selectedNoteId, user);

  const { data: collaborators, isLoading: collabLoading } = useGetCollaborators(
    selectedNoteId
  );

  // 🔥 Toast system
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const showToast = (
    message: string,
    severity: 'success' | 'error' = 'success'
  ) => {
    setToast({ open: true, message, severity });
  };

  // ------------------ Actions ------------------

  const handleCreate = () => {
    createNote.mutate(
      { title, content },
      {
        onSuccess: () => {
          showToast('Note created');
          setTitle('');
          setContent('');
        },
        onError: () => showToast('Create failed', 'error'),
      }
    );
  };

  const startEdit = (note: any) => {
    setEditingNote(note);
  };

  const handleUpdate = () => {
    if (!editingId) return;

    updateNote.mutate(
      { id: editingId, title: editTitle, content: editContent },
      {
        onSuccess: () => {
          showToast('Note updated');
          setEditingId(null);
        },
        onError: () => showToast('Update failed', 'error'),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteNote.mutate(id, {
      onSuccess: () => showToast('Note deleted'),
      onError: () => showToast('Delete failed', 'error'),
    });
  };

  const openCollaborators = (noteId: string) => {
    setSelectedNoteId(noteId);
    setOpenDialog(true);
  };

  const handleAddCollaborator = () => {
    if (!selectedNoteId) return;

    addCollaborator.mutate(
      { note_id: selectedNoteId, email: collabEmail, role: collabRole },
      {
        onSuccess: () => {
          showToast('Collaborator added');
          setCollabEmail('');
          // 🚀 MANUALLY trigger the notes refresh for the current user
          queryClient.invalidateQueries({ queryKey: ['notes'] });
          // Also refresh the dialog list
          queryClient.invalidateQueries({
            queryKey: ['collaborators', selectedNoteId],
          });
          setOpenDialog(false);
        },
        onError: (err: any) =>
          showToast(err?.response?.data?.error || 'Failed', 'error'),
      }
    );
  };

  const handleRoleChange = (userId: string, role: string) => {
    if (!selectedNoteId) return;

    updateCollaborator.mutate(
      { note_id: selectedNoteId, user_id: userId, role },
      {
        onSuccess: () => {
          showToast('Role updated');
          setOpenDialog(false);
        },
        onError: () => showToast('Update failed', 'error'),
      }
    );
  };

  const handleRemove = (userId: string) => {
    if (!selectedNoteId) return;

    removeCollaborator.mutate(
      { note_id: selectedNoteId, user_id: userId },
      {
        onSuccess: () => {
          showToast('Removed');
          setOpenDialog(false);
        },
        onError: () => showToast('Remove failed', 'error'),
      }
    );
  };

  // ------------------ UI ------------------

  if (isLoading) {
    return (
      <Container>
        <Typography variant='h4' gutterBottom>
          Notes Dashboard
        </Typography>

        {[1, 2, 3].map((i) => (
          <Card key={i} sx={{ mt: 2 }}>
            <CardContent>
              <Skeleton variant='text' height={30} width='40%' />
              <Skeleton variant='text' height={20} width='80%' />
            </CardContent>
          </Card>
        ))}
      </Container>
    );
  }
  if (error) return <p>{error.message}</p>;

  return (
    <Container>
      <Typography variant='h4' gutterBottom>
        Notes Dashboard
      </Typography>

      <CreateNoteForm
        loading={createNote.isPending}
        onCreate={({ title, content }) =>
          createNote.mutate(
            { title, content },
            {
              onSuccess: () => showToast('Note created'),
              onError: () => showToast('Create failed', 'error'),
            }
          )
        }
      />

      {/* Notes */}
      {data?.data?.map((note: any) => (
        <NoteCard
          key={note.id}
          note={note}
          onOpen={() => router.push(`/notes/${note.id}`)}
          onEdit={() => startEdit(note)}
          onDelete={() => handleDelete(note.id)}
          onShare={() => openCollaborators(note.id)}
        />
      ))}

      {/* 🔥 Dialog */}
      <CollaboratorDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        collaborators={collaborators || []}
        loading={collabLoading}
        adding={addCollaborator.isPending}
        onlineUsers={onlineUsers}
        email={collabEmail}
        setEmail={setCollabEmail}
        role={collabRole}
        setRole={setCollabRole}
        onAdd={handleAddCollaborator}
        onRoleChange={handleRoleChange}
        onRemove={handleRemove}
      />

      <EditNoteDialog
        open={!!editingNote}
        note={editingNote}
        onClose={() => setEditingNote(null)}
        loading={updateNote.isPending}
        onSave={(payload) =>
          updateNote.mutate(payload, {
            onSuccess: () => {
              showToast('Updated');
              setEditingNote(null);
            },
            onError: () => showToast('Update failed', 'error'),
          })
        }
      />

      {/* 🔥 Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Container>
  );
}
