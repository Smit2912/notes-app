'use client';

import { useParams } from 'next/navigation';
import {
  Container,
  Typography,
  TextField,
  Chip,
  Box,
  CircularProgress,
  Button,
} from '@mui/material';

import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useSingleNote } from '@/hooks/useSingleNote';
import { useUpdateNoteContent } from '@/hooks/useUpdateNoteContent';
import { useNotePresence } from '@/hooks/useNotePresence';
import { usePresence } from '@/hooks/usePresence';
import { useLiveDraft } from '@/hooks/useLiveDraft';

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
  } | null>(null);

  const hydrated = useRef(false);
  const lastSaved = useRef('');
  const currentVersion = useRef(1);

  const localTyping = useRef(false);
  const typingTimer = useRef<any>(null);

  const protectLocalDraft = useRef(false);
  const skipNextAutosave = useRef(false);

  /**
   * Prevent conflict loop
   */
  const suppressIncomingDrafts = useRef(false);

  const canEdit =
    data?.role === 'owner' ||
    data?.role === 'editor';

  /**
   * Initial hydrate
   */
  useEffect(() => {
    if (!data || hydrated.current) return;

    hydrated.current = true;

    const serverContent =
      data.content || '';

    setContent(serverContent);

    lastSaved.current =
      serverContent;

    currentVersion.current =
      data.version || 1;
  }, [data]);

  /**
   * Draft Realtime
   */
  const { sendDraft } = useLiveDraft({
    noteId: id,
    user,

    onRemoteDraft: (incoming) => {
      /**
       * Ignore temporary stale loop traffic
       */
      if (
        suppressIncomingDrafts.current
      ) {
        return;
      }

      /**
       * Ignore identical
       */
      if (incoming === content) {
        return;
      }

      /**
       * If local busy -> popup
       */
      if (
        localTyping.current ||
        protectLocalDraft.current
      ) {
        setPendingRemote({
          local: content,
          remote: incoming,
        });

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
   * Autosave
   */
  useEffect(() => {
    if (!hydrated.current) return;
    if (!canEdit) return;

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
          const res =
            await updateContent.mutateAsync(
              {
                id,
                content,
              }
            );

          lastSaved.current =
            content;

          currentVersion.current =
            res.version;

          protectLocalDraft.current =
            false;

          setStatus('Saved');
        } catch {
          setStatus('Failed');
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

          muteDraftsTemporarily();

          localTyping.current = false;
          protectLocalDraft.current =
            true;

          setPendingRemote(null);

          try {
            const res =
              await updateContent.mutateAsync(
                {
                  id,
                  content: mine,
                }
              );

            lastSaved.current = mine;

            currentVersion.current =
              res.version;

            setStatus('Saved');
          } catch {
            setStatus('Failed');
          }
        }}

        /**
         * APPLY REMOTE
         */
        onApplyRemote={async () => {
          if (!pendingRemote)
            return;

          const remote =
            pendingRemote.remote;

          muteDraftsTemporarily();

          localTyping.current = false;
          protectLocalDraft.current =
            false;

          skipNextAutosave.current =
            true;

          setPendingRemote(null);
          setContent(remote);

          try {
            const res =
              await updateContent.mutateAsync(
                {
                  id,
                  content: remote,
                }
              );

            lastSaved.current =
              remote;

            currentVersion.current =
              res.version;

            setStatus('Synced');
          } catch {
            setStatus('Failed');
          }
        }}

        /**
         * MERGE BOTH
         */
        onMergeBoth={async () => {
          if (!pendingRemote)
            return;

          const local =
            pendingRemote.local.trim();

          const remote =
            pendingRemote.remote.trim();

          const merged =
            local && remote
              ? `${local}\n\n${remote}`
              : local || remote;

          muteDraftsTemporarily();

          localTyping.current = false;
          protectLocalDraft.current =
            true;

          skipNextAutosave.current =
            true;

          setPendingRemote(null);
          setContent(merged);

          try {
            const res =
              await updateContent.mutateAsync(
                {
                  id,
                  content: merged,
                }
              );

            lastSaved.current =
              merged;

            currentVersion.current =
              res.version;

            setStatus(
              'Merged & Saved'
            );
          } catch {
            setStatus('Failed');
          }
        }}
      />

      <HistoryDrawer
        open={historyOpen}
        noteId={id}
        onClose={() =>
          setHistoryOpen(false)
        }
        onRestore={async (
          versionContent
        ) => {
          muteDraftsTemporarily();

          skipNextAutosave.current =
            true;

          setHistoryOpen(false);
          setContent(versionContent);

          try {
            const res =
              await updateContent.mutateAsync(
                {
                  id,
                  content:
                    versionContent,
                }
              );

            lastSaved.current =
              versionContent;

            currentVersion.current =
              res.version;

            setStatus(
              'Version restored'
            );
          } catch {
            setStatus('Failed');
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
            }, 10000);

          triggerTyping();
          sendDraft(value);
        }}
      />
    </Container>
  );
}