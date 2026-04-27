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
        borderColor: 'warning.main',
        bgcolor: 'warning.light',
        borderRadius: 3,
        p: { xs: 2, sm: 3 },
        my: 3,
        boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.1), 0 2px 4px -1px rgba(245, 158, 11, 0.06)',
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            fontWeight: 700,
            color: 'warning.dark',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
          variant='h6'
          gutterBottom
        >
          ⚠️ Remote changes detected
        </Typography>

        <Typography
          sx={{
            fontWeight: 500,
            color: 'warning.dark',
            opacity: 0.8
          }}
          variant='body2'
        >
          Editing paused until conflict is resolved. Please review the versions below and choose how to proceed.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        <Box>
          <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>
            Your Draft
          </Typography>
          <Box
            sx={{
              bgcolor: 'background.paper',
              p: 2,
              borderRadius: 2,
              minHeight: 120,
              whiteSpace: 'pre-wrap',
              border: '1px solid',
              borderColor: 'divider',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.875rem'
            }}
          >
            {localContent || <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Empty</Typography>}
          </Box>
        </Box>

        <Box>
          <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>
            Incoming Version
          </Typography>
          <Box
            sx={{
              bgcolor: 'info.light',
              color: 'white',
              p: 2,
              borderRadius: 2,
              minHeight: 120,
              whiteSpace: 'pre-wrap',
              border: '1px solid',
              borderColor: 'info.main',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.875rem'
            }}
          >
            {remoteContent || <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.7 }}>Empty</Typography>}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'rgba(0,0,0,0.05)',
        }}
      >
        <Button variant='outlined' onClick={onKeepMine} sx={{ borderColor: 'warning.main', color: 'warning.dark', '&:hover': { borderColor: 'warning.dark', bgcolor: 'rgba(245,158,11,0.1)' } }}>
          Keep Mine
        </Button>

        <Button variant='contained' onClick={onApplyRemote} sx={{ bgcolor: 'info.main', color: '#fff', '&:hover': { bgcolor: 'info.dark' } }}>
          Apply Remote
        </Button>

        <Button variant='contained' onClick={onMergeBoth} sx={{ bgcolor: 'warning.dark', color: '#fff', '&:hover': { bgcolor: '#000' } }}>
          Merge Both
        </Button>
      </Box>
    </Box>
  );
}
