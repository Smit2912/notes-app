'use client';

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Button,
  Chip,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

import { useNoteHistory } from '@/hooks/useNoteHistory';

type Props = {
  open: boolean;
  noteId: string;
  onClose: () => void;
  onRestore: (content: string) => void;
};

export default function HistoryDrawer({
  open,
  noteId,
  onClose,
  onRestore,
}: Props) {
  const { data, isLoading } = useNoteHistory(
    noteId,
    open
  );

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
    >
      <Box
        sx={{
          width: 420,
          p: 2,
          height: '100%',
          overflowY: 'auto',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant='h6'>
            Version History
          </Typography>

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {isLoading && <CircularProgress />}

        {!isLoading &&
          data?.length === 0 && (
            <Typography variant='body2'>
              No history found
            </Typography>
          )}

        {!isLoading &&
          data?.map((item: any) => (
            <Box
              key={item.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography
                  variant='caption'
                  color='text.secondary'
                >
                  {new Date(
                    item.created_at
                  ).toLocaleString()}
                </Typography>

                <Chip
                  label='Snapshot'
                  size='small'
                />
              </Box>

              <Box
                sx={{
                  bgcolor: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  whiteSpace:
                    'pre-wrap',
                  maxHeight: 160,
                  overflow: 'hidden',
                  fontSize: 14,
                }}
              >
                {item.content ||
                  'Empty content'}
              </Box>

              <Box
                sx={{
                  mt: 1.5,
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                }}
              >
                <Button
                  size='small'
                  variant='contained'
                  onClick={() =>
                    onRestore(
                      item.content
                    )
                  }
                >
                  Restore
                </Button>
              </Box>
            </Box>
          ))}
      </Box>
    </Drawer>
  );
}