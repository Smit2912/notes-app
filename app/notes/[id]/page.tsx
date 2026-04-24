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

  /** -----------------------------
   * Draft channel
   * ----------------------------- */
  const { sendDraft, sendResolution } =
    useLiveDraft({
      noteId: id,
      user,

      onRemoteDraft: (incoming) => {
        if (!canEdit) return;
        if (pendingRemote) return;
        if (suppressIncomingRef.current)
          return;
        if (localTypingRef.current)
          return;

        if (
          incoming === contentRef.current
        )
          return;

        setContent(incoming);
        contentRef.current = incoming;
        /**
         * Remote draft is NOT local edit.
         * Keep local clean state aligned.
         */
        savedRef.current = incoming;
        setStatus('Live synced');
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
    <Container
      maxWidth="md"
      sx={{ mt: 5 }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems:
            'flex-start',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4">
            {data.title}
          </Typography>

          <Typography
            variant="body2"
            sx={{ mt: 1 }}
          >
            {
              onlineUsers.length
            }{' '}
            online
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap:
                'wrap',
              mt: 1,
            }}
          >
            {onlineUsers.map(
              (u) => (
                <Chip
                  key={
                    u.user_id
                  }
                  label={
                    u.email
                  }
                  size="small"
                  color="success"
                />
              )
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems:
              'center',
          }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={() =>
              setHistoryOpen(
                true
              )
            }
          >
            History
          </Button>

          <Chip
            label={data.role.toUpperCase()}
            color={
              data.role ===
                'owner'
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
        variant="body2"
        sx={{ mb: 1 }}
      >
        {status}
      </Typography>

      {typingUsers.length >
        0 && (
          <Typography
            variant="body2"
            color="primary"
            sx={{ mb: 1 }}
          >
            {typingUsers.length ===
              1
              ? `${typingUsers[0].email} is typing...`
              : `${typingUsers.length} people are typing...`}
          </Typography>
        )}

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

        onApplyRemote={() => {
          if (
            !pendingRemote
          )
            return;

          setContent(
            pendingRemote.remote
          );

          contentRef.current =
            pendingRemote.remote;

          savedRef.current =
            pendingRemote.remote;

          versionRef.current =
            pendingRemote.remoteVersion;

          localTypingRef.current =
            false;

          protectDraftRef.current =
            false;

          setPendingRemote(
            null
          );

          setStatus(
            'Synced'
          );
        }}

        onKeepMine={async () => {
          if (
            !pendingRemote
          )
            return;

          protectDraftRef.current =
            true;

          await saveNote(
            pendingRemote.local,
            pendingRemote.remoteVersion
          );

          sendResolution(
            versionRef.current
          );

          setPendingRemote(
            null
          );

          setStatus(
            'Saved'
          );
        }}

        onMergeBoth={async () => {
          if (
            !pendingRemote
          )
            return;

          const merged = `${pendingRemote.local}\n\n${pendingRemote.remote}`;

          setContent(
            merged
          );

          contentRef.current =
            merged;

          protectDraftRef.current =
            true;

          await saveNote(
            merged,
            pendingRemote.remoteVersion
          );

          sendResolution(
            versionRef.current
          );

          setPendingRemote(
            null
          );

          setStatus(
            'Merged & Saved'
          );
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
        onRestore={async (
          value
        ) => {
          setHistoryOpen(
            false
          );

          setContent(
            value
          );

          contentRef.current =
            value;

          await saveNote(
            value,
            versionRef.current
          );

          setStatus(
            'Version restored'
          );
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

          setContent(
            value
          );

          contentRef.current =
            value;

          setStatus(
            'Typing...'
          );

          localTypingRef.current =
            true;

          if (
            typingTimerRef.current
          ) {
            clearTimeout(
              typingTimerRef.current
            );
          }

          typingTimerRef.current =
            setTimeout(
              () => {
                localTypingRef.current =
                  false;
              },
              1200
            );

          triggerTyping();

          if (
            draftTimerRef.current
          ) {
            clearTimeout(
              draftTimerRef.current
            );
          }

          draftTimerRef.current =
            setTimeout(
              () => {
                sendDraft(
                  value
                );
              },
              60
            );
        }}
      />
    </Container>
  );
}