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
import Image from 'next/image';
import WorkingTogetherSvg from '../assets/undraw_working-together_r43a.svg';

import {
  Container,
  Typography,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Box,
  Grid,
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
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Typography variant='h3' gutterBottom sx={{ mb: 4 }}>
          Notes Dashboard
        </Typography>

        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Skeleton variant='text' height={40} width='60%' sx={{ mb: 1 }} />
                  <Skeleton variant='text' height={20} width='100%' />
                  <Skeleton variant='text' height={20} width='80%' />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }
  if (error) return <p>{error.message}</p>;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Box sx={{ 
        mb: 8, 
        display: 'flex', 
        flexDirection: { xs: 'column-reverse', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: { xs: 4, md: 8 } 
      }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
          <Box>
            <Typography variant='h3' sx={{ mb: 1, fontWeight: 800, letterSpacing: '-0.02em' }}>
              Notes Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Manage and collaborate on your notes in real-time.
            </Typography>
          </Box>
          <Box sx={{ width: '100%', maxWidth: 500 }}>
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
          </Box>
        </Box>
        
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', width: '100%', maxWidth: { xs: 400, md: 500 } }}>
          <Image 
            src={WorkingTogetherSvg} 
            alt="Working together" 
            style={{ width: '100%', height: 'auto' }}
            priority
          />
        </Box>
      </Box>

      {/* Notes */}
      <Grid container spacing={3}>
        {data?.data?.map((note: any) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={note.id}>
            <NoteCard
              note={note}
              onOpen={() => router.push(`/notes/${note.id}`)}
              onEdit={() => startEdit(note)}
              onDelete={() => handleDelete(note.id)}
              onShare={() => openCollaborators(note.id)}
            />
          </Grid>
        ))}
      </Grid>

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
