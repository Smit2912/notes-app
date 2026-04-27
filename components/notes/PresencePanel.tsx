'use client';

import { Box, Chip, Typography } from '@mui/material';

type Props = {
  users: any[];
};

export default function PresencePanel({ users }: Props) {
  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <Box 
          sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: users.length > 0 ? 'success.main' : 'text.disabled',
            mr: 1,
            position: 'relative',
            '&::after': users.length > 0 ? {
              content: '""',
              position: 'absolute',
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              borderRadius: '50%',
              border: '2px solid',
              borderColor: 'success.main',
              opacity: 0.2,
              animation: 'pulse 2s infinite',
            } : {}
          }} 
        />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: users.length > 0 ? 'success.main' : 'text.secondary' }}>
          {users.length > 0 ? `Online Now (${users.length})` : 'Offline'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {users.map((user) => (
          <Chip
            key={user.user_id}
            label={user.email}
            color="success"
            variant="outlined"
            size="small"
            sx={{ 
              bgcolor: '#ecfdf5', // success.light equivalent
              borderColor: 'success.main',
              fontWeight: 500
            }}
          />
        ))}
        {users.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No one else is currently viewing this note.
          </Typography>
        )}
      </Box>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>
    </Box>
  );
}