'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
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

import { LoadingButton } from '@mui/lab';
import { Icon } from '@iconify/react';

import { formatWebhookTestPayload } from '../_lib/webhook-labels';
import {
  DEFAULT_INBOUND_SAMPLE_PAYLOAD,
  buildInboundMappingJson,
  emptyInboundMappingRow,
  formatInboundMappingJson,
  inboundMappingToRows,
  parseInboundMapping,
  parseInboundMappingJsonText,
  previewInboundResume,
  rowsToInboundMapping,
} from '../_lib/inbound-mapping-labels';

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
 *   onChange: (json: Record<string, unknown>|null) => void,
 *   disabled?: boolean,
 *   title?: string,
 * }} props
 */
export function InboundMappingEditor({
  value,
  onChange,
  disabled = false,
  title = 'Inbound Mapping',
}) {
  const [expanded, setExpanded] = useState(false);
  const [rawMode, setRawMode] = useState(false);
  const [rows, setRows] = useState([emptyInboundMappingRow()]);
  const [meta, setMeta] = useState({ correlation_path: '', status_field: '' });
  const [rawText, setRawText] = useState('{}');
  const [sampleText, setSampleText] = useState(formatWebhookTestPayload(DEFAULT_INBOUND_SAMPLE_PAYLOAD));
  const [parseError, setParseError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const syncFromValue = useCallback((raw) => {
    const parsed = parseInboundMapping(raw);
    setRows(inboundMappingToRows(parsed.mapping));
    setMeta(parsed.meta);
    setRawText(formatInboundMappingJson(buildInboundMappingJson(parsed.mapping, parsed.meta) ?? {}));
    setParseError(null);
  }, []);

  useEffect(() => {
    syncFromValue(value);
  }, [value, syncFromValue]);

  const emitChange = useCallback(
    (nextRows, nextMeta = meta) => {
      const mapping = rowsToInboundMapping(nextRows);
      const json = buildInboundMappingJson(mapping, nextMeta);
      setRawText(formatInboundMappingJson(json ?? {}));
      onChange?.(json);
    },
    [meta, onChange]
  );

  const updateRows = (nextRows) => {
    setRows(nextRows);
    emitChange(nextRows);
  };

  const updateMeta = (patch) => {
    const nextMeta = { ...meta, ...patch };
    setMeta(nextMeta);
    emitChange(rows, nextMeta);
  };

  const updateRow = (index, patch) => {
    updateRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleAddRow = () => {
    updateRows([...rows, emptyInboundMappingRow()]);
  };

  const handleRemoveRow = (index) => {
    const next = rows.filter((_, i) => i !== index);
    updateRows(next.length ? next : [emptyInboundMappingRow()]);
  };

  const handleRawChange = (text) => {
    setRawText(text);
    try {
      const parsed = parseInboundMappingJsonText(text);
      const state = parseInboundMapping(parsed);
      setParseError(null);
      setRows(inboundMappingToRows(state.mapping));
      setMeta(state.meta);
      onChange?.(parsed);
    } catch (error) {
      setParseError(error?.message || 'JSON نامعتبر');
    }
  };

  const runPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const samplePayload = JSON.parse(sampleText);
      const mapping = rowsToInboundMapping(rows);
      const result = await previewInboundResume(mapping, meta, samplePayload);
      setPreview(result);
    } catch (error) {
      setPreview(null);
      setPreviewError(error?.message || 'خطا در preview');
    } finally {
      setPreviewLoading(false);
    }
  }, [meta, rows, sampleText]);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      disableGutters
      sx={{ border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<Icon icon="solar:alt-arrow-down-linear" width={18} />}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Icon icon="solar:inbox-in-linear" width={20} />
          <Typography variant="subtitle2">{title}</Typography>
          <Typography variant="caption" color="text.secondary">
            JSONata روی payload → نام متغیر resume
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Box
            sx={{
              p: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.neutral',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              _meta
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                label="correlation path"
                value={meta.correlation_path}
                onChange={(e) => updateMeta({ correlation_path: e.target.value })}
                placeholder="body.tracking_id"
                helperText="مسیر JSONata برای correlation_id (ذخیره در _meta.correlation_id_field)"
                disabled={disabled || rawMode}
                sx={monoFieldSx}
              />
              <TextField
                fullWidth
                size="small"
                label="status_field (اختیاری)"
                value={meta.status_field}
                onChange={(e) => updateMeta({ status_field: e.target.value })}
                placeholder="body.status"
                disabled={disabled || rawMode}
                sx={monoFieldSx}
              />
            </Stack>
          </Box>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Switch
              checked={rawMode}
              onChange={(e) => setRawMode(e.target.checked)}
              disabled={disabled}
            />
            <Typography variant="body2">حالت JSON خام</Typography>
          </Stack>

          {rawMode ? (
            <TextField
              fullWidth
              multiline
              minRows={10}
              label="inbound_mapping_json"
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
                    <TableCell sx={{ minWidth: 220 }}>Expression (JSONata)</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Variable name</TableCell>
                    <TableCell width={56} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={`inbound-row-${index}`}>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={row.expression}
                          onChange={(e) => updateRow(index, { expression: e.target.value })}
                          placeholder="body.status"
                          disabled={disabled}
                          sx={monoFieldSx}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={row.variable}
                          onChange={(e) => updateRow(index, { variable: e.target.value })}
                          placeholder="registry_status"
                          disabled={disabled}
                          sx={monoFieldSx}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={disabled || rows.length <= 1}
                          onClick={() => handleRemoveRow(index)}
                          aria-label="حذف"
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
                افزودن mapping
              </Button>
            </Box>
          ) : null}

          <TextField
            fullWidth
            multiline
            minRows={6}
            label="Sample webhook JSON"
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            disabled={disabled}
            sx={monoFieldSx}
          />

          <LoadingButton
            size="small"
            variant="outlined"
            loading={previewLoading}
            startIcon={<Icon icon="solar:play-linear" width={18} />}
            onClick={runPreview}
            disabled={disabled}
          >
            Preview mapped resume variables
          </LoadingButton>

          {preview ? (
            <Alert severity="info">
              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                Mapped variables
              </Typography>
              <Box component="pre" sx={{ m: 0, fontSize: 12, direction: 'ltr' }}>
                {JSON.stringify(preview.mapped, null, 2)}
              </Box>
              <Typography variant="caption" display="block" sx={{ mt: 1, fontFamily: 'monospace', direction: 'ltr' }}>
                correlation_id: {preview.correlation_id || '—'}
              </Typography>
            </Alert>
          ) : null}

          {previewError ? <Alert severity="error">{previewError}</Alert> : null}
          {parseError ? <Alert severity="error">{parseError}</Alert> : null}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
