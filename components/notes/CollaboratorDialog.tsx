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
  Typography,
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
        Manage Collaborators
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <PresencePanel users={onlineUsers} />

        <Box sx={{ mb: 4, mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Collaborators
          </Typography>

          {loading ? (
            <Typography variant="body2" color="text.secondary">Loading collaborators...</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {collaborators?.map((c: any) => (
                <Box
                  key={c.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.default'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {c.profiles?.email}
                    </Typography>
                    <Chip label={c.role} size="small" variant={c.role === 'owner' ? 'filled' : 'outlined'} />
                  </Box>

                  {c.role !== 'owner' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Select
                        size="small"
                        value={c.role}
                        onChange={(e) =>
                          onRoleChange(c.user_id, e.target.value)
                        }
                        sx={{ minWidth: 100, height: 32 }}
                      >
                        <MenuItem value="viewer">Viewer</MenuItem>
                        <MenuItem value="editor">Editor</MenuItem>
                      </Select>

                      <Button
                        color="error"
                        size="small"
                        onClick={() => onRemove(c.user_id)}
                        sx={{ minWidth: 'auto', p: '4px 8px' }}
                      >
                        Remove
                      </Button>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Add New Collaborator
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={adding}
              sx={{ flexGrow: 1 }}
            />

            <Select
              size="small"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={adding}
              sx={{ width: 120, flexShrink: 0 }}
            >
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="editor">Editor</MenuItem>
            </Select>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" sx={{ color: 'text.secondary' }}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={onAdd}
          disabled={adding || !email}
        >
          {adding ? 'Adding...' : 'Add Collaborator'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}