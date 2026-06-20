'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Icon } from '@iconify/react';

import {
  buildInputSchemaTree,
  buildProcessVariableTree,
} from '../_lib/mapping-tree';
import {
  buildMappingEvalRoot,
  formatMappingJson,
  parseMappingJson,
  parseSampleVariables,
  previewInputMapping,
} from '../_lib/mapping-preview';
import { getProcessStepSampleVariables } from '../_lib/process-bpmn-steps';

const DEFAULT_SAMPLE_VARIABLES = {
  user_id: 'U-12345',
  form1: {
    national_id: '0012345678',
    mobile: '09121234567',
  },
};

const treePanelSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  p: 1,
  minHeight: 260,
  maxHeight: 360,
  overflow: 'auto',
  bgcolor: 'background.neutral',
};

const monoFieldSx = {
  '& textarea, & input': {
    fontFamily: 'monospace',
    direction: 'ltr',
    textAlign: 'left',
  },
};

/**
 * @param {{
 *   node: import('../_lib/mapping-tree').TreeNode,
 *   selectedId?: string|null,
 *   onPick?: (node: import('../_lib/mapping-tree').TreeNode) => void,
 *   draggable?: boolean,
 *   droppable?: boolean,
 *   onDropOn?: (target: import('../_lib/mapping-tree').TreeNode, sourceExpression: string) => void,
 * }} props
 */
function MappingTreeNode({ node, selectedId, onPick, draggable, droppable, onDropOn }) {
  const isLeaf = Boolean(node.expression);
  const isSelected = selectedId === node.id;

  const label = (
    <Box
      component="span"
      draggable={draggable && isLeaf}
      onDragStart={(event) => {
        if (!draggable || !isLeaf || !node.expression) return;
        event.dataTransfer.setData('text/plain', node.expression);
        event.dataTransfer.effectAllowed = 'copy';
      }}
      onDragOver={(event) => {
        if (!droppable || !isLeaf) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(event) => {
        if (!droppable || !isLeaf || !onDropOn) return;
        event.preventDefault();
        const expr = event.dataTransfer.getData('text/plain');
        if (expr) onDropOn(node, expr);
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (onPick && isLeaf) onPick(node);
      }}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.5,
        py: 0.25,
        borderRadius: 0.75,
        cursor: isLeaf ? 'pointer' : 'default',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': isLeaf ? { bgcolor: 'action.hover' } : undefined,
      }}
    >
      {isLeaf && draggable ? <Icon icon="solar:menu-dots-linear" width={14} /> : null}
      <Typography variant="body2" component="span" sx={{ fontFamily: isLeaf ? 'monospace' : undefined, fontSize: 13 }}>
        {node.label}
      </Typography>
    </Box>
  );

  if (node.children?.length) {
    return (
      <TreeItem itemId={node.id} label={label}>
        {node.children.map((child) => (
          <MappingTreeNode
            key={child.id}
            node={child}
            selectedId={selectedId}
            onPick={onPick}
            draggable={draggable}
            droppable={droppable}
            onDropOn={onDropOn}
          />
        ))}
      </TreeItem>
    );
  }

  return <TreeItem itemId={node.id} label={label} />;
}

/**
 * Visual + expression editor for input mapping (API field → JSONata expression).
 *
 * @param {{
 *   value?: Record<string, string>,
 *   onChange?: (next: Record<string, string>) => void,
 *   inputSchema?: object|null,
 *   sampleVariables?: Record<string, unknown>,
 *   onSampleVariablesChange?: (next: Record<string, unknown>) => void,
 *   processKey?: string,
 *   stepId?: string,
 *   instanceId?: number,
 *   env?: Record<string, string>,
 *   readOnly?: boolean,
 * }} props
 */
export function MappingEditor({
  value,
  onChange,
  inputSchema,
  sampleVariables: sampleVariablesProp,
  onSampleVariablesChange,
  processKey = 'service1',
  stepId = 'step1',
  instanceId = 1,
  env = {},
  readOnly = false,
}) {
  const [mode, setMode] = useState('visual');
  const [mapping, setMapping] = useState(value ?? {});
  const [expressionText, setExpressionText] = useState(formatMappingJson(value ?? {}));
  const [selectedSource, setSelectedSource] = useState(null);
  const [internalSample, setInternalSample] = useState(DEFAULT_SAMPLE_VARIABLES);
  const [sampleText, setSampleText] = useState(formatMappingJson(DEFAULT_SAMPLE_VARIABLES));
  const [previewResult, setPreviewResult] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const sampleVariables = sampleVariablesProp ?? internalSample;

  useEffect(() => {
    setMapping(value ?? {});
    setExpressionText(formatMappingJson(value ?? {}));
  }, [value]);

  useEffect(() => {
    if (sampleVariablesProp) {
      setSampleText(formatMappingJson(sampleVariablesProp));
    }
  }, [sampleVariablesProp]);

  useEffect(() => {
    if (sampleVariablesProp) return;
    const stepSample = getProcessStepSampleVariables(processKey, stepId);
    if (stepSample) {
      setInternalSample(stepSample);
      setSampleText(formatMappingJson(stepSample));
    }
  }, [processKey, stepId, sampleVariablesProp]);

  const commitMapping = useCallback(
    (next) => {
      setMapping(next);
      setExpressionText(formatMappingJson(next));
      onChange?.(next);
    },
    [onChange]
  );

  const processTree = useMemo(
    () => buildProcessVariableTree(sampleVariables, env),
    [sampleVariables, env]
  );

  const apiTree = useMemo(() => buildInputSchemaTree(inputSchema), [inputSchema]);

  const mappingEntries = useMemo(
    () => Object.entries(mapping ?? {}).filter(([key]) => key && !key.startsWith('_')),
    [mapping]
  );

  const connectMapping = useCallback(
    (apiField, expression) => {
      if (readOnly || !apiField || !expression) return;
      commitMapping({
        ...(mapping ?? {}),
        [apiField]: expression,
      });
      setSelectedSource(null);
    },
    [commitMapping, mapping, readOnly]
  );

  const handlePickSource = useCallback((node) => {
    if (!node.expression) return;
    setSelectedSource(node);
  }, []);

  const handlePickTarget = useCallback(
    (node) => {
      if (!node.expression) return;
      if (selectedSource?.expression) {
        connectMapping(node.expression, selectedSource.expression);
        return;
      }
      setSelectedSource(null);
    },
    [connectMapping, selectedSource]
  );

  const handleDropOnTarget = useCallback(
    (target, sourceExpression) => {
      if (!target.expression) return;
      connectMapping(target.expression, sourceExpression);
    },
    [connectMapping]
  );

  const handleExpressionApply = () => {
    try {
      const parsed = parseMappingJson(expressionText);
      const normalized = {};
      Object.entries(parsed).forEach(([key, val]) => {
        normalized[key] = typeof val === 'string' ? val : JSON.stringify(val);
      });
      commitMapping(normalized);
      setPreviewError(null);
    } catch (error) {
      setPreviewError(error?.message || 'JSON نامعتبر');
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewResult(null);
    try {
      const variables = parseSampleVariables(sampleText);
      if (onSampleVariablesChange) {
        onSampleVariablesChange(variables);
      } else {
        setInternalSample(variables);
      }

      const root = buildMappingEvalRoot({
        instanceId,
        processKey,
        stepId,
        variables,
        env,
      });
      const payload = await previewInputMapping(mapping, root);
      setPreviewResult(payload);
    } catch (error) {
      setPreviewError(error?.message || 'خطا در پیش‌نمایش');
    } finally {
      setPreviewLoading(false);
    }
  };

  const updateLineExpression = (field, expression) => {
    commitMapping({ ...(mapping ?? {}), [field]: expression });
  };

  const removeLine = (field) => {
    const next = { ...(mapping ?? {}) };
    delete next[field];
    commitMapping(next);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
        <Tabs value={mode} onChange={(_, next) => setMode(next)} sx={{ minHeight: 40 }}>
          <Tab value="visual" label="نمای بصری" sx={{ minHeight: 40 }} />
          <Tab value="expression" label="Expression (JSONata)" sx={{ minHeight: 40 }} />
        </Tabs>
        {selectedSource ? (
          <Chip
            size="small"
            color="primary"
            onDelete={() => setSelectedSource(null)}
            label={`منبع: ${selectedSource.expression}`}
            sx={{ fontFamily: 'monospace', direction: 'ltr' }}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            برای اتصال: یک متغیر فرایند را انتخاب کنید، سپس فیلد API را کلیک یا درگ کنید
          </Typography>
        )}
      </Stack>

      {mode === 'visual' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              متغیرهای فرایند
            </Typography>
            <Box sx={treePanelSx}>
              <SimpleTreeView defaultExpandedItems={['instance', 'instance.variables', 'env']}>
                {processTree.map((node) => (
                  <MappingTreeNode
                    key={node.id}
                    node={node}
                    selectedId={selectedSource?.id}
                    onPick={readOnly ? undefined : handlePickSource}
                    draggable={!readOnly}
                  />
                ))}
              </SimpleTreeView>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              فیلدهای API (input_schema)
            </Typography>
            <Box sx={treePanelSx}>
              {apiTree.length ? (
                <SimpleTreeView defaultExpandedItems={apiTree.map((n) => n.id)}>
                  {apiTree.map((node) => (
                    <MappingTreeNode
                      key={node.id}
                      node={node}
                      onPick={readOnly ? undefined : handlePickTarget}
                      droppable={!readOnly}
                      onDropOn={handleDropOnTarget}
                    />
                  ))}
                </SimpleTreeView>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  input_schema تعریف نشده — فیلدها را در حالت Expression اضافه کنید.
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      ) : (
        <TextField
          fullWidth
          multiline
          minRows={12}
          label="Input mapping (JSON)"
          value={expressionText}
          onChange={(event) => setExpressionText(event.target.value)}
          disabled={readOnly}
          helperText='کلید = فیلد API، مقدار = عبارت JSONata (مثال: "mobile": "instance.variables.form1.mobile")'
          sx={monoFieldSx}
        />
      )}

      {mode === 'expression' && !readOnly ? (
        <Box>
          <Button variant="outlined" onClick={handleExpressionApply}>
            اعمال JSON
          </Button>
        </Box>
      ) : null}

      <Divider />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          خطوط mapping
        </Typography>
        {mappingEntries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            هنوز mappingی تعریف نشده است.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {mappingEntries.map(([field, expr]) => (
              <Card key={field} variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                  <Chip label={field} size="small" color="info" sx={{ fontFamily: 'monospace', direction: 'ltr' }} />
                  <Icon icon="solar:arrow-left-linear" width={18} />
                  <TextField
                    size="small"
                    fullWidth
                    value={String(expr ?? '')}
                    onChange={(event) => updateLineExpression(field, event.target.value)}
                    disabled={readOnly}
                    placeholder="instance.variables.user_id"
                    sx={monoFieldSx}
                  />
                  {!readOnly ? (
                    <Tooltip title="حذف">
                      <IconButton size="small" color="error" onClick={() => removeLine(field)} aria-label="حذف">
                        <Icon icon="solar:trash-bin-trash-linear" width={18} />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          پیش‌نمایش payload
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={6}
          label="متغیرهای نمونه (instance.variables)"
          value={sampleText}
          onChange={(event) => setSampleText(event.target.value)}
          sx={{ ...monoFieldSx, mb: 1.5 }}
        />
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:play-linear" width={18} />}
          onClick={handlePreview}
          disabled={previewLoading}
        >
          پیش‌نمایش
        </Button>

        {previewError ? (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {previewError}
          </Alert>
        ) : null}

        {previewResult ? (
          <Box
            component="pre"
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'grey.100',
              overflow: 'auto',
              fontSize: 12,
              fontFamily: 'monospace',
              direction: 'ltr',
              textAlign: 'left',
            }}
          >
            {formatMappingJson(previewResult)}
          </Box>
        ) : null}
      </Box>
    </Stack>
  );
}

export default MappingEditor;
