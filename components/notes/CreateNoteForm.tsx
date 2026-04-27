'use client';

import { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';

type Props = {
  onCreate: (data: { title: string; content: string }) => void;
  loading?: boolean;
};

export default function CreateNoteForm({
  onCreate,
  loading = false,
}: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      content: content.trim(),
    });

    setTitle('');
    setContent('');
  };

  return (
    <Box sx={{
      p: 3,
      bgcolor: 'background.paper',
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
      minWidth: { sm: 320, md: 400 }
    }}>
      <TextField
        label="Title"
        fullWidth
        placeholder="e.g. Weekly Sync Notes"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
      />

      <TextField
        label="Content"
        fullWidth
        multiline
        minRows={3}
        placeholder="Start writing..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !title.trim()}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Creating...' : 'Create Note'}
        </Button>
      </Box>
    </Box>
  );
}