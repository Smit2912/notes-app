'use client';

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
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
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant='h6'>{note.title}</Typography>

        <Typography variant='body2' sx={{ mb: 1 }}>
          {note.content}
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
        />
      </CardContent>

      <CardActions>
        <Button onClick={onOpen}>Open</Button>

        {/* {canEdit && <Button onClick={onEdit}>Edit</Button>} */}

        {isOwner && (
          <>
            <Button onClick={onShare}>Share</Button>
            <Button color='error' onClick={onDelete}>
              Delete
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
}
