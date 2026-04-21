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
    <Box sx={{ mb: 3 }}>
      <TextField
        label="Title"
        fullWidth
        margin="normal"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <TextField
        label="Content"
        fullWidth
        margin="normal"
        multiline
        minRows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Note'}
      </Button>
    </Box>
  );
}