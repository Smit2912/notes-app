'use client';

import { Box, Chip, Typography } from '@mui/material';

type Props = {
  users: any[];
};

export default function PresencePanel({ users }: Props) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Online Now: {users.length}
      </Typography>

      {users.map((user) => (
        <Chip
          key={user.user_id}
          label={user.email}
          color="success"
          size="small"
          sx={{ mr: 1, mb: 1 }}
        />
      ))}
    </Box>
  );
}