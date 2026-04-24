'use client';

import { Box, Typography, Button } from '@mui/material';

type Props = {
  open: boolean;
  localContent: string;
  remoteContent: string;
  onKeepMine: () => void;
  onApplyRemote: () => void;
  onMergeBoth: () => void;
};

export default function ConflictResolutionDialog({
  open,
  localContent,
  remoteContent,
  onKeepMine,
  onApplyRemote,
  onMergeBoth,
}: Props) {
  if (!open) return null;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        my: 2,
      }}
    >
      <Typography
        sx={{
          fontWeight: 'bold',
        }}
        variant='subtitle1'
        gutterBottom
      >
        Remote changes detected
      </Typography>

      <Typography
        sx={{
          fontWeight: 'medium',
          color: 'text.secondary',
        }}
        variant='subtitle2'
        gutterBottom
      >
        Editing paused until conflict is resolved
      </Typography>

      <Typography variant='body2' sx={{ mb: 1 }}>
        Your Draft
      </Typography>

      <Box
        sx={{
          bgcolor: 'grey.100',
          p: 1.5,
          borderRadius: 1,
          minHeight: 80,
          whiteSpace: 'pre-wrap',
          mb: 2,
        }}
      >
        {localContent || 'Empty'}
      </Box>

      <Typography variant='body2' sx={{ mb: 1 }}>
        Incoming Version
      </Typography>

      <Box
        sx={{
          bgcolor: 'info.light',
          p: 1.5,
          borderRadius: 1,
          minHeight: 80,
          whiteSpace: 'pre-wrap',
          mb: 2,
        }}
      >
        {remoteContent || 'Empty'}
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        <Button variant='outlined' onClick={onKeepMine}>
          Keep Mine
        </Button>

        <Button variant='contained' color='warning' onClick={onApplyRemote}>
          Apply Remote
        </Button>

        <Button variant='contained' color='success' onClick={onMergeBoth}>
          Merge Both
        </Button>
      </Box>
    </Box>
  );
}
