'use client';

import { useParams } from 'next/navigation';
import {
  Container,
  Typography,
  TextField,
  Chip,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { useSingleNote } from '@/hooks/useSingleNote';
import { useUpdateNoteContent } from '@/hooks/useUpdateNoteContent';
import { useNotePresence } from '@/hooks/useNotePresence';
import { usePresence } from '@/hooks/usePresence';
import { useLiveDraft } from '@/hooks/useLiveDraft';
import { useRealtimeSingleNote } from '@/hooks/useRealtimeSingleNote';

import ConflictResolutionDialog from '@/components/notes/ConflictResolutionDialog';
import HistoryDrawer from '@/components/notes/HistoryDrawer';

export default function NotePage() {
  const params = useParams();
  const id = params.id as string;

  const { user, loading: authLoading } = useAuth();

  const { data, isLoading, error } = useSingleNote(
    id,
    !authLoading && !!user
  );

  const updateContent = useUpdateNoteContent();
  const queryClient = useQueryClient();

  const { onlineUsers } = useNotePresence(id, user);
  const { typingUsers, triggerTyping } = usePresence(id, user);

  /** -----------------------------
   * UI State
   * ----------------------------- */
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Saved');
  const [historyOpen, setHistoryOpen] = useState(false);

  const [pendingRemote, setPendingRemote] = useState<{
    local: string;
    remote: string;
    remoteVersion: number;
  } | null>(null);

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

  /** -----------------------------
   * Stable refs (single source)
   * ----------------------------- */
  const hydratedRef = useRef(false);

  const contentRef = useRef('');
  const savedRef = useRef('');
  const versionRef = useRef(1);

  const localTypingRef = useRef(false);
  const protectDraftRef = useRef(false);
  const suppressIncomingRef = useRef(false);

  const typingTimerRef = useRef<any>(null);
  const draftTimerRef = useRef<any>(null);

  const canEdit =
    data?.role === 'owner' ||
    data?.role === 'editor';

  /** keep ref synced */
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  /** -----------------------------
   * Initial hydrate + passive sync
   * No popup logic here
   * ----------------------------- */
  useEffect(() => {
    if (!data) return;

    const serverContent = data.content || '';
    const serverVersion = data.version || 1;

    if (!hydratedRef.current) {
      hydratedRef.current = true;

      setContent(serverContent);
      contentRef.current = serverContent;

      savedRef.current = serverContent;
      versionRef.current = serverVersion;
      return;
    }

    /** passive sync only */
    if (
      serverVersion > versionRef.current &&
      !localTypingRef.current &&
      !protectDraftRef.current &&
      !pendingRemote
    ) {
      setContent(serverContent);
      contentRef.current = serverContent;

      savedRef.current = serverContent;
      versionRef.current = serverVersion;

      setStatus('Synced');
    }
  }, [data, pendingRemote]);

  /** -----------------------------
   * Save helper
   * ----------------------------- */
  const saveNote = async (
    nextContent: string,
    version: number
  ) => {
    const res =
      await updateContent.mutateAsync({
        id,
        content: nextContent,
        version,
      });

    savedRef.current = nextContent;
    versionRef.current = res.version;

    localTypingRef.current = false;
    protectDraftRef.current = false;

    return res;
  };

  const refreshConflictFrom409 = (
    err: any,
    localDraft: string
  ) => {
    if (err.response?.status !== 409) {
      throw err;
    }

    const {
      remoteContent,
      remoteVersion,
    } = err.response.data;

    setPendingRemote({
      local: localDraft,
      remote: remoteContent,
      remoteVersion,
    });

    protectDraftRef.current = false;
    localTypingRef.current = false;

    setStatus('Conflict updated');
  };

  /** -----------------------------
   * Draft channel
   * ----------------------------- */
  const { sendDraft, sendResolution } =
    useLiveDraft({
      noteId: id,
      user,

      onRemoteDraft: () => {
        if (!canEdit) return;
        if (pendingRemote) return;
        if (suppressIncomingRef.current) return;

        // Do NOT mutate editor content.
        // Draft channel only signals live typing presence.
        setStatus('Collaborator typing...');
      },

      onResolution: (version) => {
        if (
          pendingRemote &&
          pendingRemote.remoteVersion ===
          version
        ) {
          setContent(
            pendingRemote.remote
          );

          contentRef.current =
            pendingRemote.remote;

          savedRef.current =
            pendingRemote.remote;

          versionRef.current =
            version;

          localTypingRef.current =
            false;

          protectDraftRef.current =
            false;

          setPendingRemote(null);
          setStatus(
            'Resolved by collaborator'
          );
        }
      },
    });

  /** -----------------------------
   * Database realtime
   * Only place popup happens
   * ----------------------------- */
  useRealtimeSingleNote({
    noteId: id,

    onRemoteUpdate: (payload) => {
      /** own save */
      if (
        payload.updated_by ===
        user?.id
      ) {
        savedRef.current =
          payload.content;

        versionRef.current =
          payload.version;

        return;
      }

      /** while conflict dialog open -> freeze remote updates */
      if (pendingRemote) {
        return;
      }

      /** stale */
      if (
        payload.version <=
        versionRef.current
      ) {
        return;
      }

      queryClient.setQueryData(
        ['note', id],
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            content:
              payload.content,
            version:
              payload.version,
          };
        }
      );

      /** viewer mode */
      if (!canEdit) {
        setContent(
          payload.content
        );

        contentRef.current =
          payload.content;

        savedRef.current =
          payload.content;

        versionRef.current =
          payload.version;

        setStatus('Synced');
        return;
      }

      /** dirty local => popup */
      /** user truly has unsaved local changes */
      const hasUnsavedChanges =
        contentRef.current !== savedRef.current;

      /** dirty local => popup only if needed */
      if (
        hasUnsavedChanges ||
        localTypingRef.current ||
        protectDraftRef.current
      ) {
        if (
          payload.content !== contentRef.current
        ) {
          setPendingRemote({
            local: contentRef.current,
            remote: payload.content,
            remoteVersion: payload.version,
          });
        }

        return;
      }

      /** clean local => sync */
      setContent(payload.content);

      contentRef.current =
        payload.content;

      savedRef.current =
        payload.content;

      versionRef.current =
        payload.version;

      setStatus('Synced');
    },
  });

  /** -----------------------------
   * Autosave
   * ----------------------------- */
  useEffect(() => {
    if (!hydratedRef.current)
      return;
    if (!canEdit) return;
    if (pendingRemote) return;

    if (
      content ===
      savedRef.current
    )
      return;

    const timer = setTimeout(
      async () => {
        try {
          await saveNote(
            contentRef.current,
            versionRef.current
          );

          setStatus('Saved');
        } catch (err: any) {
          if (
            err.response?.status ===
            409
          ) {
            const {
              remoteContent,
              remoteVersion,
            } =
              err.response.data;

            setPendingRemote({
              local:
                contentRef.current,
              remote:
                remoteContent,
              remoteVersion,
            });
          } else {
            setStatus(
              'Failed'
            );
          }
        }
      },
      1000
    );

    return () =>
      clearTimeout(timer);
  }, [
    content,
    canEdit,
    pendingRemote,
  ]);

  /** -----------------------------
   * Loading
   * ----------------------------- */
  if (authLoading || isLoading) {
    return (
      <Container sx={{ mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container sx={{ mt: 5 }}>
        Error loading note
      </Container>
    );
  }

  /** -----------------------------
   * Render
   * ----------------------------- */
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: 'text.primary' }}>
            {data.title}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={data.role.toUpperCase()}
              size="small"
              variant={data.role === 'owner' ? 'filled' : 'outlined'}
              color={data.role === 'owner' ? 'primary' : data.role === 'editor' ? 'warning' : 'default'}
              sx={{ fontWeight: 600, fontSize: '0.7rem', height: 24 }}
            />
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              onClick={() => setHistoryOpen(true)}
              sx={{ color: 'text.secondary', borderColor: 'divider' }}
            >
              History
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: status === 'Synced' || status === 'Saved' ? 'success.main' : status === 'Typing...' ? 'warning.main' : 'error.main' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {status}
              </Typography>
            </Box>

            {typingUsers.length > 0 && (
              <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box component="span" sx={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', bgcolor: 'primary.main', animation: 'pulse 1.5s infinite' }} />
                {typingUsers.length === 1 ? `${typingUsers[0].email} is typing...` : `${typingUsers.length} people are typing...`}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {onlineUsers.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main', mr: 1, position: 'relative', '&::after': { content: '""', position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: '50%', border: '1px solid', borderColor: 'success.main', opacity: 0.5, animation: 'pulse 2s infinite' } }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1, fontWeight: 500 }}>
                  {onlineUsers.length} online:
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {onlineUsers.map((u) => (
                <Chip key={u.user_id} label={u.email.split('@')[0]} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', borderColor: 'success.main', color: 'success.dark', bgcolor: '#ecfdf5' }} />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <ConflictResolutionDialog
        open={
          !!pendingRemote
        }
        localContent={
          pendingRemote?.local ||
          ''
        }
        remoteContent={
          pendingRemote?.remote ||
          ''
        }

        onApplyRemote={async () => {
          if (!pendingRemote) return;

          try {
            const latest = await queryClient.refetchQueries({
              queryKey: ['note', id],
            });

            const note = queryClient.getQueryData<any>(['note', id]);

            if (!note) return;

            setContent(note.content);
            contentRef.current = note.content;

            savedRef.current = note.content;
            versionRef.current = note.version;

            localTypingRef.current = false;
            protectDraftRef.current = false;

            setPendingRemote(null);
            setStatus('Synced');

          } catch {
            setStatus('Failed');
          }
        }}

        onKeepMine={async () => {
          if (!pendingRemote) return;

          protectDraftRef.current = true;

          try {
            await saveNote(
              pendingRemote.local,
              pendingRemote.remoteVersion
            );

            sendResolution(versionRef.current);

            setPendingRemote(null);
            setStatus('Saved');

          } catch (err) {
            refreshConflictFrom409(
              err,
              pendingRemote.local
            );
          }
        }}

        onMergeBoth={async () => {
          if (!pendingRemote) return;

          const merged =
            `${pendingRemote.local}\n\n${pendingRemote.remote}`;

          setContent(merged);
          contentRef.current = merged;

          protectDraftRef.current = true;

          try {
            await saveNote(
              merged,
              pendingRemote.remoteVersion
            );

            sendResolution(versionRef.current);

            setPendingRemote(null);
            setStatus('Merged & Saved');

          } catch (err) {
            refreshConflictFrom409(
              err,
              merged
            );
          }
        }}
      />

      <HistoryDrawer
        open={historyOpen}
        noteId={id}
        onClose={() =>
          setHistoryOpen(
            false
          )
        }
        onRestore={async (value) => {
          if (!canEdit) {
            showToast('You do not have permission to restore versions.', 'error');
            setHistoryOpen(false);
            return;
          }

          try {
            await saveNote(value, versionRef.current);
            setContent(value);
            contentRef.current = value;
            setStatus('Version restored');
            showToast('Version restored successfully');
          } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to restore version', 'error');
            setStatus('Failed');
          } finally {
            setHistoryOpen(false);
          }
        }}
      />

      <TextField
        fullWidth
        multiline
        minRows={20}
        placeholder={canEdit ? "Start writing..." : "This note is empty."}
        value={content}
        disabled={!canEdit || !!pendingRemote}
        variant="standard"
        slotProps={{
          input: {
            disableUnderline: true,
            sx: {
              fontSize: '1.1rem',
              lineHeight: 1.7,
              color: 'text.primary',
              fontFamily: 'var(--font-geist-sans), sans-serif',
              p: 0,
              '&.Mui-disabled': {
                WebkitTextFillColor: 'inherit',
                opacity: 0.7,
              }
            }
          }
        }}
        sx={{
          '& .MuiInputBase-root': {
            p: 2,
            bgcolor: 'transparent',
          }
        }}
        onChange={(e) => {
          const value = e.target.value;
          setContent(value);
          contentRef.current = value;
          setStatus('Typing...');
          localTypingRef.current = true;

          if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
          }
          typingTimerRef.current = setTimeout(() => {
            localTypingRef.current = false;
          }, 1200);

          triggerTyping();

          if (draftTimerRef.current) {
            clearTimeout(draftTimerRef.current);
          }
          draftTimerRef.current = setTimeout(() => {
            sendDraft(value);
          }, 60);
        }}
      />

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