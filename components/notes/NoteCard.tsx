'use client';

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
} from '@mui/material';

type Note = {
  id: string;
  title: string;
  content: string;
  role: 'owner' | 'editor' | 'viewer';
};

type Props = {
  note: Note;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
};

export default function NoteCard({
  note,
  onOpen,
  onEdit,
  onDelete,
  onShare,
}: Props) {
  const canEdit = note.role === 'owner' || note.role === 'editor';

  const isOwner = note.role === 'owner';

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': {
          borderColor: '#d1d5db',
        }
      }}
      onClick={onOpen}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant='h6' sx={{ fontWeight: 600, lineHeight: 1.3, color: 'text.primary', flexGrow: 1, mr: 2 }}>
            {note.title || 'Untitled Note'}
          </Typography>
          <Chip
            size='small'
            label={note.role.toUpperCase()}
            color={
              note.role === 'owner'
                ? 'primary'
                : note.role === 'editor'
                ? 'warning'
                : 'default'
            }
            sx={{ flexShrink: 0, fontSize: '0.7rem', height: 24 }}
          />
        </Box>

        <Typography 
          variant='body2' 
          color="text.secondary"
          sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.6
          }}
        >
          {note.content || 'No content yet...'}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end', borderTop: '1px solid transparent' }}>
        {isOwner && (
          <>
            <Button size="small" onClick={(e) => { e.stopPropagation(); onShare(); }} sx={{ color: 'text.secondary' }}>
              Share
            </Button>
            <Button size="small" color='error' onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              Delete
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
}
