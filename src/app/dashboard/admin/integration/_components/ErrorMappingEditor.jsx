'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { Icon } from '@iconify/react';

import {
  DEFAULT_SAMPLE_ERROR_RESPONSE,
  emptyErrorMappingRule,
  formatErrorMappingJson,
  formatSetVariables,
  parseErrorMappingJsonText,
  parseErrorMappingRules,
  parseSetVariables,
  previewErrorMapping,
} from '../_lib/error-mapping-labels';

const monoFieldSx = {
  '& textarea, & input': {
    fontFamily: 'monospace',
    direction: 'ltr',
    textAlign: 'left',
  },
};

/**
 * @param {{
 *   value: unknown,
 *   onChange: (rules: Array<{ when: string, set: Record<string, unknown>, retry: boolean }>) => void,
 *   disabled?: boolean,
 * }} props
 */
export function ErrorMappingEditor({ value, onChange, disabled = false }) {
  const [expanded, setExpanded] = useState(false);
  const [rawMode, setRawMode] = useState(false);
  const [rows, setRows] = useState(() => parseErrorMappingRules(value));
  const [rawText, setRawText] = useState(() => formatErrorMappingJson(value));
  const [setTexts, setSetTexts] = useState(() => rows.map((row) => formatSetVariables(row.set)));
  const [parseError, setParseError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const nextRows = parseErrorMappingRules(value);
    setRows(nextRows);
    setSetTexts(nextRows.map((row) => formatSetVariables(row.set)));
    setRawText(formatErrorMappingJson(value));
    setParseError(null);
  }, [value]);

  const emitRows = useCallback(
    (nextRows, nextSetTexts = setTexts) => {
      setRows(nextRows);
      onChange?.(nextRows);
      setRawText(formatErrorMappingJson(nextRows));
      setSetTexts(nextSetTexts);
    },
    [onChange, setTexts]
  );

  const updateRow = (index, patch) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    emitRows(next);
  };

  const updateSetText = (index, text) => {
    const nextTexts = [...setTexts];
    nextTexts[index] = text;
    setSetTexts(nextTexts);
    try {
      const set = parseSetVariables(text);
      setParseError(null);
      updateRow(index, { set });
    } catch (error) {
      setParseError(error?.message || 'خطا در Set variables');
    }
  };

  const handleAddRow = () => {
    const next = [...rows, emptyErrorMappingRule()];
    emitRows(next, [...setTexts, '{}']);
  };

  const handleRemoveRow = (index) => {
    const next = rows.filter((_, i) => i !== index);
    const nextTexts = setTexts.filter((_, i) => i !== index);
    emitRows(next.length ? next : [emptyErrorMappingRule()], next.length ? nextTexts : ['{}']);
  };

  const handleRawChange = (text) => {
    setRawText(text);
    try {
      const parsed = parseErrorMappingJsonText(text);
      setParseError(null);
      setRows(parsed);
      setSetTexts(parsed.map((row) => formatSetVariables(row.set)));
      onChange?.(parsed);
    } catch (error) {
      setParseError(error?.message || 'JSON نامعتبر');
    }
  };

  const runPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const result = await previewErrorMapping(rows, DEFAULT_SAMPLE_ERROR_RESPONSE);
      setPreview(result);
    } catch (error) {
      setPreview(null);
      setPreviewError(error?.message || 'خطا در preview');
    } finally {
      setPreviewLoading(false);
    }
  }, [rows]);

  useEffect(() => {
    if (!expanded || rawMode) return undefined;
    const timer = setTimeout(() => {
      runPreview();
    }, 250);
    return () => clearTimeout(timer);
  }, [expanded, rawMode, rows, runPreview]);

  const previewLabel = useMemo(() => {
    if (previewLoading) return 'در حال محاسبه preview…';
    if (previewError) return previewError;
    if (!preview?.matched) return 'هیچ قانونی با نمونه 400 مطابقت ندارد';
    const vars = JSON.stringify(preview.set ?? {}, null, 0);
    return `Rule: ${preview.when} → set ${vars}${preview.retry ? ' · retry=true' : ''}`;
  }, [preview, previewError, previewLoading]);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      disableGutters
      sx={{ border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<Icon icon="solar:alt-arrow-down-linear" width={18} />}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Icon icon="solar:danger-triangle-linear" width={20} />
          <Typography variant="subtitle2">Error Mapping</Typography>
          <Typography variant="caption" color="text.secondary">
            نگاشت خطای HTTP به متغیرهای gateway
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={rawMode}
                onChange={(e) => setRawMode(e.target.checked)}
                disabled={disabled}
              />
            }
            label="حالت JSON خام"
          />

          {rawMode ? (
            <TextField
              fullWidth
              multiline
              minRows={10}
              label="error_mapping_json"
              value={rawText}
              onChange={(e) => handleRawChange(e.target.value)}
              disabled={disabled}
              sx={monoFieldSx}
            />
          ) : (
            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 220 }}>Condition (JSONata)</TableCell>
                    <TableCell sx={{ minWidth: 220 }}>Set Variables</TableCell>
                    <TableCell width={90} align="center">
                      Retry
                    </TableCell>
                    <TableCell width={56} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={`error-rule-${index}`}>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={row.when}
                          onChange={(e) => updateRow(index, { when: e.target.value })}
                          placeholder="status_code >= 400"
                          disabled={disabled}
                          sx={monoFieldSx}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          minRows={2}
                          value={setTexts[index] ?? '{}'}
                          onChange={(e) => updateSetText(index, e.target.value)}
                          placeholder='{"gateway_approved": false}'
                          disabled={disabled}
                          sx={monoFieldSx}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={Boolean(row.retry)}
                          onChange={(e) => updateRow(index, { retry: e.target.checked })}
                          disabled={disabled}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={disabled || rows.length <= 1}
                          onClick={() => handleRemoveRow(index)}
                          aria-label="حذف قانون"
                        >
                          <Icon icon="solar:trash-bin-trash-linear" width={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!rawMode ? (
            <Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Icon icon="solar:add-circle-linear" width={18} />}
                onClick={handleAddRow}
                disabled={disabled}
              >
                افزودن قانون
              </Button>
            </Box>
          ) : null}

          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'background.neutral',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Preview — sample 400 response
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'left', mb: 1 }}
            >
              {JSON.stringify(DEFAULT_SAMPLE_ERROR_RESPONSE)}
            </Typography>
            <Typography variant="body2" color={previewError ? 'error.main' : 'text.primary'}>
              {previewLabel}
            </Typography>
          </Box>

          {parseError ? <Alert severity="error">{parseError}</Alert> : null}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
