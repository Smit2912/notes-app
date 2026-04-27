'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  Chip,
  Box,
} from '@mui/material';

import PresencePanel from './PresencePanel';

type Props = {
  open: boolean;
  onClose: () => void;
  collaborators: any[];
  loading: boolean;
  onlineUsers: any[];
  email: string;
  setEmail: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  adding: boolean;
  onAdd: () => void;
  onRoleChange: (userId: string, role: string) => void;
  onRemove: (userId: string) => void;
};

export default function CollaboratorDialog(props: Props) {
  const {
    open,
    onClose,
    collaborators,
    loading,
    adding,
    onlineUsers,
    email,
    setEmail,
    role,
    setRole,
    onAdd,
    onRoleChange,
    onRemove,
  } = props;

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Collaborators</DialogTitle>

      <DialogContent>
        <PresencePanel users={onlineUsers} />

        {loading ? (
          <p>Loading...</p>
        ) : (
          collaborators?.map((c: any) => (
            <Box
              key={c.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <span>{c.profiles?.email}</span>
                <Chip label={c.role} size="small" />
              </Box>

              {c.role !== 'owner' && (
                <Box>
                  <Select
                    size="small"
                    value={c.role}
                    onChange={(e) =>
                      onRoleChange(c.user_id, e.target.value)
                    }
                    sx={{ mr: 1, minWidth: 120 }}
                  >
                    <MenuItem value="viewer">Viewer</MenuItem>
                    <MenuItem value="editor">Editor</MenuItem>
                  </Select>

                  <Button
                    color="error"
                    onClick={() => onRemove(c.user_id)}
                  >
                    Remove
                  </Button>
                </Box>
              )}
            </Box>
          ))
        )}

        <TextField
          fullWidth
          margin="normal"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={adding}
        />

        <Select
          fullWidth
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={adding}
        >
          <MenuItem value="viewer">Viewer</MenuItem>
          <MenuItem value="editor">Editor</MenuItem>
        </Select>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={onAdd}
          disabled={adding || !email}
        >
          {adding ? 'Adding...' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}