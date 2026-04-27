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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
        Edit Note
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <TextField
          fullWidth
          margin="normal"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 3 }}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Content"
          multiline
          minRows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || !title.trim()}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}