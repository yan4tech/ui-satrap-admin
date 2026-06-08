'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

import { Icon } from '@iconify/react';

import {
  COMPENSATION_TRIGGERS,
  CONDITION_MODES,
  buildCompensationJson,
  compensationTriggerDescription,
  compensationTriggerLabel,
  parseCompensationConfig,
  parseConditionForEditor,
} from '../_lib/compensation-labels';

const monoFieldSx = {
  '& textarea, & input': {
    fontFamily: 'monospace',
    direction: 'ltr',
    textAlign: 'left',
  },
};

function emptyRow() {
  return {
    action_id: '',
    mode: 'none',
    expr: '',
    jsonText: '',
  };
}

/**
 * @param {unknown} raw
 * @returns {Array<{ action_id: number|string, mode: string, expr: string, jsonText: string }>}
 */
function rowsFromConfig(raw, trigger) {
  const config = parseCompensationConfig(raw);
  const list = trigger === 'on_process_cancel' ? config.on_process_cancel : config.on_failure;
  if (!list.length) return [emptyRow()];
  return list.map((item) => {
    const condition = trigger === 'on_failure' ? parseConditionForEditor(item.condition_json) : { mode: 'none', expr: '', jsonText: '' };
    return {
      action_id: item.action_id,
      mode: condition.mode,
      expr: condition.expr,
      jsonText: condition.jsonText,
    };
  });
}

/**
 * @param {Array<{ action_id: number|string, mode: string, expr: string, jsonText: string }>} rows
 * @param {string} trigger
 */
function configFromRows(rows, trigger) {
  const config = { on_failure: [], on_process_cancel: [] };
  const target = trigger === 'on_process_cancel' ? 'on_process_cancel' : 'on_failure';

  config[target] = rows
    .filter((row) => row.action_id)
    .map((row) => {
      const item = { action_id: Number(row.action_id) };
      if (trigger === 'on_failure' && row.mode !== 'none') {
        item.mode = row.mode;
        item.expr = row.expr;
        item.jsonText = row.jsonText;
      }
      return item;
    });

  return config;
}

/**
 * @param {{
 *   value: unknown,
 *   onChange: (config: { on_failure: Array<Record<string, unknown>>, on_process_cancel: Array<Record<string, unknown>> }) => void,
 *   actions: Array<{ id: number, name: string, action_key: string, connector_name?: string }>,
 *   disabled?: boolean,
 * }} props
 */
export function CompensationEditor({ value, onChange, actions, disabled = false }) {
  const [expanded, setExpanded] = useState(false);
  const [trigger, setTrigger] = useState('on_failure');
  const [rowsByTrigger, setRowsByTrigger] = useState(() => ({
    on_failure: rowsFromConfig(value, 'on_failure'),
    on_process_cancel: rowsFromConfig(value, 'on_process_cancel'),
  }));
  const [parseError, setParseError] = useState(null);

  useEffect(() => {
    setRowsByTrigger({
      on_failure: rowsFromConfig(value, 'on_failure'),
      on_process_cancel: rowsFromConfig(value, 'on_process_cancel'),
    });
    setParseError(null);
  }, [value]);

  const rows = rowsByTrigger[trigger] ?? [emptyRow()];
  const supportsCondition = trigger === 'on_failure';

  const emitChange = useCallback(
    (nextRowsByTrigger) => {
      const merged = {
        on_failure: configFromRows(nextRowsByTrigger.on_failure, 'on_failure').on_failure,
        on_process_cancel: configFromRows(nextRowsByTrigger.on_process_cancel, 'on_process_cancel').on_process_cancel,
      };
      onChange?.(buildCompensationJson(merged));
    },
    [onChange]
  );

  const updateRows = useCallback(
    (nextRows) => {
      const next = { ...rowsByTrigger, [trigger]: nextRows };
      setRowsByTrigger(next);
      try {
        setParseError(null);
        emitChange(next);
      } catch (err) {
        setParseError(err?.message || 'خطا در condition_json');
      }
    },
    [emitChange, rowsByTrigger, trigger]
  );

  const handleRowChange = (index, patch) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    updateRows(next);
  };

  const handleAddRow = () => {
    updateRows([...rows, emptyRow()]);
  };

  const handleRemoveRow = (index) => {
    const next = rows.filter((_, i) => i !== index);
    updateRows(next.length ? next : [emptyRow()]);
  };

  const actionOptions = useMemo(
    () =>
      actions.map((action) => ({
        id: action.id,
        label: `${action.action_key} — ${action.name}${action.connector_name ? ` (${action.connector_name})` : ''}`,
      })),
    [actions]
  );

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      disableGutters
      sx={{ border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<Icon icon="solar:alt-arrow-down-linear" width={18} />}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Icon icon="solar:restart-linear" width={20} />
          <Typography variant="subtitle2">Compensation / Saga</Typography>
          <Typography variant="caption" color="text.secondary">
            جبران خطا و لغو فرایند
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Tabs
            value={trigger}
            onChange={(_, next) => setTrigger(next)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {COMPENSATION_TRIGGERS.map((item) => (
              <Tab
                key={item.value}
                value={item.value}
                label={compensationTriggerLabel(item.value)}
                sx={{ fontFamily: item.value === trigger ? 'monospace' : undefined, direction: 'ltr' }}
              />
            ))}
          </Tabs>

          {compensationTriggerDescription(trigger) ? (
            <Typography variant="caption" color="text.secondary" display="block">
              {compensationTriggerDescription(trigger)}
            </Typography>
          ) : null}

          {rows.map((row, index) => (
            <Box
              key={`${trigger}-${index}`}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.neutral',
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 72 }}>
                    Action #{index + 1}
                  </Typography>
                  <FormControl fullWidth size="small" disabled={disabled}>
                    <InputLabel>Action جبرانی</InputLabel>
                    <Select
                      value={row.action_id}
                      label="Action جبرانی"
                      onChange={(e) => handleRowChange(index, { action_id: e.target.value })}
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
                  </FormControl>
                  <IconButton
                    size="small"
                    color="error"
                    disabled={disabled || rows.length <= 1}
                    onClick={() => handleRemoveRow(index)}
                    aria-label="حذف action"
                  >
                    <Icon icon="solar:trash-bin-trash-linear" width={18} />
                  </IconButton>
                </Stack>

                {supportsCondition ? (
                  <Stack spacing={1}>
                    <FormControl fullWidth size="small" disabled={disabled}>
                      <InputLabel>شرط اجرا (اختیاری)</InputLabel>
                      <Select
                        value={row.mode}
                        label="شرط اجرا (اختیاری)"
                        onChange={(e) => handleRowChange(index, { mode: e.target.value })}
                      >
                        {CONDITION_MODES.map((mode) => (
                          <MenuItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {row.mode === 'simple' ? (
                      <TextField
                        fullWidth
                        size="small"
                        label="عبارت JSONata"
                        value={row.expr}
                        onChange={(e) => handleRowChange(index, { expr: e.target.value })}
                        placeholder='مثال: registry_reference_id یا $exists(registry_reference_id)'
                        helperText="رشته JSONata یا عبارت truthy روی متغیرهای فرایند"
                        disabled={disabled}
                        sx={monoFieldSx}
                      />
                    ) : null}

                    {row.mode === 'json' ? (
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="condition_json (JSON)"
                        value={row.jsonText}
                        onChange={(e) => handleRowChange(index, { jsonText: e.target.value })}
                        helperText='رشته JSONata ("expr") یا شیء {"expr":"..."}'
                        disabled={disabled}
                        sx={monoFieldSx}
                      />
                    ) : null}
                  </Stack>
                ) : null}
              </Stack>
            </Box>
          ))}

          <Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Icon icon="solar:add-circle-linear" width={18} />}
              onClick={handleAddRow}
              disabled={disabled}
            >
              افزودن action
            </Button>
          </Box>

          {parseError ? <Alert severity="error">{parseError}</Alert> : null}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
