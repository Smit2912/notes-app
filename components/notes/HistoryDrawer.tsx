'use client';

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Chip,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

import { useNoteHistory } from '@/hooks/useNoteHistory';
import Progress from '../Progress';

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
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 480 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
            Version History
          </Typography>
          <IconButton onClick={onClose} edge="end" size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto', bgcolor: '#fafafa' }}>
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Progress />
            </Box>
          )}

          {!isLoading && data?.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                No history found
              </Typography>
            </Box>
          )}

          {!isLoading && data?.map((item: any) => (
            <Box
              key={item.id}
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                p: 2.5,
                mb: 3,
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#d1d5db',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {new Date(item.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
                <Chip label="Snapshot" size="small" variant="outlined" sx={{ height: 24, fontSize: '0.7rem' }} />
              </Box>

              <Box
                sx={{
                  bgcolor: '#f9fafb',
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: '#f3f4f6',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 200,
                  overflowY: 'auto',
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  fontFamily: 'var(--font-geist-mono), monospace',
                  mb: 2,
                }}
              >
                {item.content || <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.5 }}>Empty content</Typography>}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="small" variant="outlined" onClick={() => onRestore(item.content)}>
                  Restore Version
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Drawer>
  );
}