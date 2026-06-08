'use client';

import { useMemo } from 'react';

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { Icon } from '@iconify/react';

import {
  DEFAULT_POLL_MAX_ATTEMPTS,
  DEFAULT_POLL_INTERVAL_SEC,
  formatPollPreview,
} from '../_lib/process-binding-labels';

const monoFieldSx = {
  '& textarea, & input': {
    fontFamily: 'monospace',
    direction: 'ltr',
    textAlign: 'left',
  },
};

/**
 * @param {{
 *   value: { status_action_id: number|string, interval_sec: number, max_attempts: number, success_when: string, fail_when: string, terminal_statuses: string },
 *   onChange: (next: Record<string, unknown>) => void,
 *   actions: Array<{ id: number, name: string, action_key: string, connector_name?: string }>,
 *   disabled?: boolean,
 * }} props
 */
export function PollConfigForm({ value, onChange, actions, disabled = false }) {
  const actionOptions = useMemo(
    () =>
      actions.map((action) => ({
        id: action.id,
        label: `${action.action_key} — ${action.name}${action.connector_name ? ` (${action.connector_name})` : ''}`,
      })),
    [actions]
  );

  const preview = formatPollPreview(value);

  const patch = (updates) => {
    onChange?.({ ...value, ...updates });
  };

  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.neutral',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Icon icon="solar:refresh-circle-linear" width={20} />
          <Typography variant="subtitle2">Poll configuration</Typography>
          <Typography variant="caption" color="text.secondary">
            polling وضعیت async
          </Typography>
        </Stack>

        <FormControl fullWidth size="small" disabled={disabled}>
          <InputLabel>Status action</InputLabel>
          <Select
            value={value.status_action_id}
            label="Status action"
            onChange={(e) => patch({ status_action_id: e.target.value })}
          >
            <MenuItem value="">
              <em>— انتخاب —</em>
            </MenuItem>
            {actionOptions.map((action) => (
              <MenuItem key={action.id} value={action.id}>
                {action.label}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            معمولاً action از نوع GET status (مثلاً registry.status)
          </Typography>
        </FormControl>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            size="small"
            type="number"
            label="interval_sec"
            value={value.interval_sec}
            onChange={(e) => patch({ interval_sec: Number(e.target.value) })}
            inputProps={{ min: 1 }}
            helperText={`پیش‌فرض: ${DEFAULT_POLL_INTERVAL_SEC}`}
            disabled={disabled}
            sx={monoFieldSx}
          />
          <TextField
            fullWidth
            size="small"
            type="number"
            label="max_attempts"
            value={value.max_attempts}
            onChange={(e) => patch({ max_attempts: Number(e.target.value) })}
            inputProps={{ min: 1 }}
            helperText={`پیش‌فرض: ${DEFAULT_POLL_MAX_ATTEMPTS}`}
            disabled={disabled}
            sx={monoFieldSx}
          />
        </Box>

        <TextField
          fullWidth
          size="small"
          label="terminal_statuses (اختیاری)"
          value={value.terminal_statuses}
          onChange={(e) => patch({ terminal_statuses: e.target.value })}
          placeholder="APPROVED,REJECTED"
          helperText="با کاما جدا کنید — برای تولید خودکار success_when / fail_when"
          disabled={disabled}
          sx={monoFieldSx}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            size="small"
            label="success_when (اختیاری)"
            value={value.success_when}
            onChange={(e) => patch({ success_when: e.target.value })}
            placeholder="body.status = 'APPROVED'"
            disabled={disabled}
            sx={monoFieldSx}
          />
          <TextField
            fullWidth
            size="small"
            label="fail_when (اختیاری)"
            value={value.fail_when}
            onChange={(e) => patch({ fail_when: e.target.value })}
            placeholder="body.status = 'REJECTED'"
            disabled={disabled}
            sx={monoFieldSx}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', direction: 'ltr' }}>
          {preview}
        </Typography>
      </Stack>
    </Box>
  );
}
