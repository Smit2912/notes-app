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

  const { onlineUsers } = useNotePresence(id, user);
  const { typingUsers, triggerTyping } = usePresence(id, user);

  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Saved');
  const [historyOpen, setHistoryOpen] = useState(false);

  const [pendingRemote, setPendingRemote] = useState<{
    local: string;
    remote: string;
    remoteVersion?: number;
  } | null>(null);

  const hydrated = useRef(false);
  const lastSaved = useRef('');
  const currentVersion = useRef(1);

  const localTyping = useRef(false);
  const typingTimer = useRef<any>(null);
  const broadcastTimer = useRef<any>(null);

  const protectLocalDraft = useRef(false);
  const skipNextAutosave = useRef(false);

  const liveUpdateReceived = useRef(false);
  const lastRemoteResolutionVersion = useRef<number | null>(null);
  const queryClient = useQueryClient();

  /**
   * Prevent conflict loop
   */
  const suppressIncomingDrafts = useRef(false);

  const canEdit =
    data?.role === 'owner' ||
    data?.role === 'editor';

  /**
   * Initial hydrate & Cache Sync
   */
  useEffect(() => {
    if (!data) return;

    const serverContent = data.content || '';
    const serverVersion = data.version || 1;

    // First time loading (Hydration)
    if (!hydrated.current) {
      hydrated.current = true;

      // If we already got a live update (broadcast or postgres),
      // we trust its content more than a potentially stale initial cache hit.
      if (!liveUpdateReceived.current) {
        setContent(serverContent);
      }

      lastSaved.current = serverContent;
      currentVersion.current = serverVersion;
      return;
    }

    // Subsequent updates from server (e.g. cache refetch)
    // Only overwrite if it's actually NEWER than our current version
    if (serverVersion > currentVersion.current) {
      /**
       * If local busy -> popup conflict resolution (Only for Editors)
       */
      if (canEdit && (localTyping.current || protectLocalDraft.current || pendingRemote)) {
        if (serverContent !== content && !content.startsWith(serverContent)) {
          setPendingRemote({
            local: content,
            remote: serverContent,
            remoteVersion: serverVersion,
          });
        }
        return;
      }

      /**
       * Safe to sync
       */
      setContent(serverContent);
      lastSaved.current = serverContent;
      currentVersion.current = serverVersion;
      setStatus('Updated from server');
    }
  }, [data, content]);

  /**
   * Draft Realtime
   */
  const { sendDraft, sendResolution } = useLiveDraft({
    noteId: id,
    user,

    onResolution: (version) => {
      lastRemoteResolutionVersion.current = version;
      
      // If we already have a pending resolution dialog for this version, 
      // automatically close it and accept the remote version.
      if (pendingRemote && (pendingRemote.remoteVersion === version || currentVersion.current + 1 === version)) {
        setPendingRemote(null);
        setContent(pendingRemote.remote);
        lastSaved.current = pendingRemote.remote;
        currentVersion.current = version;
        setStatus('Conflict resolved by other user');
        protectLocalDraft.current = false;
      }
    },

    onRemoteDraft: (incoming) => {
      liveUpdateReceived.current = true;
      /**
       * Ignore temporary stale loop traffic
       */
      if (suppressIncomingDrafts.current) {
        return;
      }

      /**
       * Ignore identical
       */
      if (incoming === content) {
        return;
      }

      /**
       * If local busy -> ignore draft to avoid overwriting local work.
       * We wait for the actual database update to trigger a real conflict resolution.
       */
      if (canEdit && (localTyping.current || protectLocalDraft.current || pendingRemote)) {
        return;
      }

      /**
       * Soft sync
       */
      setContent(incoming);
      setStatus('Live synced');
    },
  });

  /**
   * Database Realtime (Source of Truth)
   */
  useRealtimeSingleNote({
    noteId: id,
    onRemoteUpdate: (payload) => {
      liveUpdateReceived.current = true;

      // Sync React Query cache so other parts of the UI stay updated
      queryClient.setQueryData(['note', id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          content: payload.content,
          version: payload.version,
        };
      });

      if (suppressIncomingDrafts.current) return;

      // Ignore if it's our own update (already handled by mutation response) or older
      if (payload.version <= currentVersion.current) {
        return;
      }

      // If local busy -> trigger conflict resolution
      if (canEdit && (localTyping.current || protectLocalDraft.current || pendingRemote)) {
        // If this version was signaled as a resolution, accept it and skip the prompt
        if (payload.version === lastRemoteResolutionVersion.current) {
          setContent(payload.content);
          lastSaved.current = payload.content;
          currentVersion.current = payload.version;
          setStatus('Conflict resolved by other user');
          protectLocalDraft.current = false;
          return;
        }

        // Ignore if the incoming content is what we are currently typing (prefix) or identical
        if (content.startsWith(payload.content) || payload.content === content) {
          return;
        }

        setPendingRemote({
          local: content,
          remote: payload.content,
          remoteVersion: payload.version,
        });
        return;
      }

      // Safe to sync
      setContent(payload.content);
      lastSaved.current = payload.content;
      currentVersion.current = payload.version;
      setStatus('Synced');
    },
  });

  const handleSaveError = (err: any) => {
    if (err.response?.status === 409) {
      const { remoteContent, remoteVersion } = err.response.data;
      setPendingRemote({
        local: content,
        remote: remoteContent,
        remoteVersion: remoteVersion,
      });
      return true;
    }

    if (err.response?.status === 403) {
      setStatus('Access Revoked');
      alert('Your access to this note has been revoked. Your changes cannot be saved.');
      return true;
    }

    return false;
  };

  /**
   * Autosave
   */
  useEffect(() => {
    if (!hydrated.current) return;
    if (!canEdit) return;
    if (pendingRemote) return;

    if (content === lastSaved.current)
      return;

    if (skipNextAutosave.current) {
      skipNextAutosave.current =
        false;
      return;
    }

    const timer = setTimeout(
      async () => {
        try {
          const res = await updateContent.mutateAsync({
            id,
            content,
            version: currentVersion.current,
          });

          lastSaved.current = content;
          currentVersion.current = res.version;
          protectLocalDraft.current = false;
          setStatus('Saved');
        } catch (err: any) {
          if (!handleSaveError(err)) {
            setStatus('Failed');
          }
        }
      },
      800
    );

    return () =>
      clearTimeout(timer);
  }, [
    content,
    canEdit,
    id,
    updateContent,
    pendingRemote,
  ]);

  /**
   * Utility
   */
  const muteDraftsTemporarily =
    () => {
      suppressIncomingDrafts.current =
        true;

      setTimeout(() => {
        suppressIncomingDrafts.current =
          false;
      }, 2000);
    };

  /**
   * Loading
   */
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

  return (
    <Container
      maxWidth='md'
      sx={{ mt: 5 }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'flex-start',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant='h4'>
            {data.title}
          </Typography>

          <Typography
            variant='body2'
            sx={{ mt: 1 }}
          >
            {onlineUsers.length} online
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              mt: 1,
            }}
          >
            {onlineUsers.map((u) => (
              <Chip
                key={u.user_id}
                label={u.email}
                color='success'
                size='small'
              />
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Button
            variant='outlined'
            size='small'
            onClick={() =>
              setHistoryOpen(true)
            }
          >
            History
          </Button>

          <Chip
            label={data.role.toUpperCase()}
            color={
              data.role === 'owner'
                ? 'primary'
                : data.role ===
                  'editor'
                ? 'warning'
                : 'default'
            }
          />
        </Box>
      </Box>

      <Typography
        variant='body2'
        sx={{ mb: 1 }}
      >
        {status}
      </Typography>

      {typingUsers.length > 0 && (
        <Typography
          variant='body2'
          color='primary'
          sx={{ mb: 1 }}
        >
          {typingUsers.length === 1
            ? `${typingUsers[0].email} is typing...`
            : `${typingUsers.length} people are typing...`}
        </Typography>
      )}

      <ConflictResolutionDialog
        open={!!pendingRemote}
        localContent={
          pendingRemote?.local || ''
        }
        remoteContent={
          pendingRemote?.remote || ''
        }

        /**
         * KEEP MINE
         */
        onKeepMine={async () => {
          const mine = content;
          const versionToOverwrite = pendingRemote?.remoteVersion || currentVersion.current;

          muteDraftsTemporarily();

          localTyping.current = false;
          protectLocalDraft.current = true;

          try {
            const res = await updateContent.mutateAsync({
              id,
              content: mine,
              version: versionToOverwrite,
            });

            lastSaved.current = mine;
            currentVersion.current = res.version;
            setStatus('Saved');
            protectLocalDraft.current = false;
            setPendingRemote(null);

            // Signal to others that this was a resolution to avoid conflict loops
            sendResolution(res.version);
          } catch (err: any) {
            if (!handleSaveError(err)) {
              setStatus('Failed');
            }
          }
        }}

        /**
         * APPLY REMOTE
         */
        onApplyRemote={async () => {
          if (!pendingRemote) return;

          const remote = pendingRemote.remote;
          const remoteVersion = pendingRemote.remoteVersion;

          muteDraftsTemporarily();

          localTyping.current = false;
          protectLocalDraft.current = false;
          skipNextAutosave.current = true;

          setPendingRemote(null);
          setContent(remote);

          // Update local metadata to match server
          lastSaved.current = remote;
          if (remoteVersion) {
            currentVersion.current = remoteVersion;
          }
          setStatus('Synced');
        }}

        /**
         * MERGE BOTH
         */
        onMergeBoth={async () => {
          if (!pendingRemote) return;

          const local = pendingRemote.local.trim();
          const remote = pendingRemote.remote.trim();
          const versionToOverwrite = pendingRemote.remoteVersion || currentVersion.current;

          const merged =
            local && remote ? `${local}\n\n${remote}` : local || remote;

          muteDraftsTemporarily();

          localTyping.current = false;
          protectLocalDraft.current = true;
          skipNextAutosave.current = true;

          setContent(merged);

          try {
            const res = await updateContent.mutateAsync({
              id,
              content: merged,
              version: versionToOverwrite,
            });

            lastSaved.current = merged;
            currentVersion.current = res.version;
            setStatus('Merged & Saved');
            protectLocalDraft.current = false;
            setPendingRemote(null);

            // Signal to others that this was a resolution to avoid conflict loops
            sendResolution(res.version);
          } catch (err: any) {
            if (!handleSaveError(err)) {
              setStatus('Failed');
            }
          }
        }}
      />

      <HistoryDrawer
        open={historyOpen}
        noteId={id}
        onClose={() => setHistoryOpen(false)}
        onRestore={async (versionContent: string) => {
          muteDraftsTemporarily();
          skipNextAutosave.current = true;
          setHistoryOpen(false);
          setContent(versionContent);

          try {
            const res = await updateContent.mutateAsync({
              id,
              content: versionContent,
              version: currentVersion.current,
            });

            lastSaved.current = versionContent;
            currentVersion.current = res.version;
            setStatus('Version restored');
          } catch (err: any) {
            if (!handleSaveError(err)) {
              setStatus('Failed');
            }
          }
        }}
      />

      <TextField
        fullWidth
        multiline
        minRows={18}
        value={content}
        disabled={!canEdit}
        onChange={(e) => {
          const value =
            e.target.value;

          setContent(value);
          setStatus('Typing...');

          localTyping.current = true;

          if (
            typingTimer.current
          ) {
            clearTimeout(
              typingTimer.current
            );
          }

          typingTimer.current =
            setTimeout(() => {
              localTyping.current =
                false;
            }, 2000);

          triggerTyping();

          /**
           * Throttle draft broadcasts to 50ms to avoid network congestion
           */
          if (broadcastTimer.current) clearTimeout(broadcastTimer.current);
          broadcastTimer.current = setTimeout(() => {
            if (!pendingRemote) {
              sendDraft(value);
            }
          }, 50);
        }}
      />
    </Container>
  );
}