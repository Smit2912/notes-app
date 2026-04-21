'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';

type Props = {
  open: boolean;
  note: any;
  onClose: () => void;
  onSave: (payload: {
    id: string;
    title: string;
    content: string;
  }) => void;
  loading?: boolean;
};

export default function EditNoteDialog({
  open,
  note,
  onClose,
  onSave,
  loading = false,
}: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const handleSave = () => {
    onSave({
      id: note.id,
      title,
      content,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Edit Note</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          margin="normal"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Content"
          multiline
          minRows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}