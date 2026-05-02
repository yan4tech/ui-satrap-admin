'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';

import StartServiceStep from './StartServiceStep';
import { startService } from './start-service-api';
import {
  advanceTaskNext,
  completeTaskForm,
  fetchProcessTasks,
  getTaskVersionsForElement,
  mergeAllTasksByTaskId,
  mergeApiTasksWithSnapshot,
  pickActiveUserFacingTask,
  pickLatestTaskForElement,
  pickPipelineEarliestTaskFromIdMap,
} from './engine-api';
import {
  getBpmnElementIdForStepperIndex,
  getStepperIndexForElementId,
  SERVICE1_STEPPER_LABELS,
} from './service1-step-config';
import ServiceOneStepTaskDetailDialog from './ServiceOneStepTaskDetailDialog';
import ServiceOneTaskPanel from './ServiceOneTaskPanel';

export default function WorkflowWizard() {
  const searchParams = useSearchParams();
  const processIdFromUrl = searchParams.get('processId');
  const definitionKeyFromUrl = searchParams.get('definitionKey');

  const parsedResumePid = useMemo(() => {
    if (processIdFromUrl == null || String(processIdFromUrl).trim() === '') return NaN;
    return Number(processIdFromUrl);
  }, [processIdFromUrl]);

  const hasResumeQuery = Number.isFinite(parsedResumePid) && parsedResumePid > 0;
  const resumeWrongService =
    hasResumeQuery &&
    definitionKeyFromUrl != null &&
    String(definitionKeyFromUrl).trim() !== '' &&
    definitionKeyFromUrl !== 'service1';

  const [processInstanceId, setProcessInstanceId] = useState(null);
  const [tasks, setTasks] = useState({});
  const [uiStep, setUiStep] = useState(0);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [startError, setStartError] = useState(null);
  const [startSubmitting, setStartSubmitting] = useState(false);
  const [stepSubmitting, setStepSubmitting] = useState(false);
  const [navSubmitting, setNavSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [formPhaseComplete, setFormPhaseComplete] = useState(false);
  const [processFinished, setProcessFinished] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [urlResumeDone, setUrlResumeDone] = useState(() => !hasResumeQuery);
  const hadResumeQueryRef = useRef(false);
  const lastCurrentTaskRef = useRef(null);
  const allTasksByIdRef = useRef({});

  const [allTasksById, setAllTasksById] = useState({});
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    task: null,
    stepLabel: '',
    loading: false,
    error: null,
    taskVersionsForElement: null,
  });

  const currentTask = useMemo(() => pickActiveUserFacingTask(tasks), [tasks]);

  useEffect(() => {
    if (currentTask) {
      lastCurrentTaskRef.current = currentTask;
    }
  }, [currentTask]);

  useEffect(() => {
    setAllTasksById((prev) => mergeAllTasksByTaskId(prev, tasks));
  }, [tasks]);

  useEffect(() => {
    allTasksByIdRef.current = allTasksById;
  }, [allTasksById]);

  const tasksByElement = useMemo(() => {
    const m = {};
    Object.values(allTasksById).forEach((t) => {
      if (!t?.element_id) return;
      const k = String(t.element_id).trim().toLowerCase();
      (m[k] = m[k] || []).push(t);
    });
    Object.keys(m).forEach((el) => {
      m[el].sort((a, b) => new Date(a.CreatedAt || 0) - new Date(b.CreatedAt || 0));
    });
    return m;
  }, [allTasksById]);

  const syncFromTasks = useCallback((taskMap) => {
    const t = pickActiveUserFacingTask(taskMap);
    if (!t) {
      const last = lastCurrentTaskRef.current;
      if (last?.ID != null) {
        setAllTasksById((prev) => ({ ...prev, [String(last.ID)]: { ...last } }));
      }
      setProcessFinished(true);
      setUiStep(SERVICE1_STEPPER_LABELS.length);
      return;
    }
    setProcessFinished(false);
    setUiStep(getStepperIndexForElementId(t.element_id));
  }, []);

  const loadTasks = useCallback(
    async (pid) => {
      setTasksLoading(true);
      setLoadError(null);
      try {
        const t = await fetchProcessTasks(pid);
        const merged = mergeApiTasksWithSnapshot(pid, {}, t);
        setTasks(merged);
        syncFromTasks(merged);
        return merged;
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'خطا در دریافت وظایف.');
        setTasks({});
        setUiStep(1);
        setProcessFinished(false);
      } finally {
        setTasksLoading(false);
      }
    },
    [syncFromTasks],
  );

  useEffect(() => {
    if (resumeWrongService) {
      setUrlResumeDone(true);
      return;
    }

    if (!hasResumeQuery) {
      if (hadResumeQueryRef.current) {
        setProcessInstanceId(null);
        setTasks({});
        setUiStep(0);
        setProcessFinished(false);
        setLoadError(null);
        setFormPhaseComplete(false);
        setSubmitError(null);
        setAllTasksById({});
        setDetailDialog({
          open: false,
          task: null,
          stepLabel: '',
          loading: false,
          error: null,
          taskVersionsForElement: null,
        });
      }
      hadResumeQueryRef.current = false;
      setUrlResumeDone(true);
      return;
    }

    hadResumeQueryRef.current = true;
    let cancelled = false;
    setUrlResumeDone(false);
    setProcessInstanceId(parsedResumePid);
    setStartError(null);
    setLoadError(null);

    (async () => {
      try {
        await loadTasks(parsedResumePid);
      } finally {
        if (!cancelled) setUrlResumeDone(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasResumeQuery, resumeWrongService, parsedResumePid, loadTasks]);

  useEffect(() => {
    setFormPhaseComplete(false);
    setSubmitError(null);
  }, [currentTask?.ID]);

  const handleSubmitStepForm = async (body) => {
    if (!processInstanceId || !currentTask) return;
    setSubmitError(null);
    setStepSubmitting(true);
    try {
      await completeTaskForm(processInstanceId, currentTask.ID, body);
      setFormPhaseComplete(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'خطا در ثبت مرحله.');
    } finally {
      setStepSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (uiStep === 0) {
      setStartError(null);
      setStartSubmitting(true);
      try {
        const id = await startService();
        setAllTasksById({});
        setProcessInstanceId(id);
        setFormPhaseComplete(false);
        await loadTasks(id);
      } catch (e) {
        setStartError(e instanceof Error ? e.message : 'خطا در شروع خدمت.');
      } finally {
        setStartSubmitting(false);
      }
      return;
    }

    if (processFinished || !currentTask || !formPhaseComplete) return;

    setNavSubmitting(true);
    setSubmitError(null);
    try {
      setAllTasksById((prev) => ({ ...prev, [String(currentTask.ID)]: { ...currentTask } }));
      await advanceTaskNext(processInstanceId, currentTask.ID, { approved: true });
      setFormPhaseComplete(false);
      const nextTasks = await fetchProcessTasks(processInstanceId);
      const merged = mergeApiTasksWithSnapshot(processInstanceId, allTasksByIdRef.current, nextTasks);
      setTasks(merged);
      syncFromTasks(merged);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'خطا در رفتن به مرحله بعد.');
    } finally {
      setNavSubmitting(false);
    }
  };

  const handleFinishClick = () => {
    alert('فرایند تکمیل شد.');
  };

  const handleBack = () => {
    if (processInstanceId) return;
    setUiStep((s) => Math.max(0, s - 1));
  };

  const resolvedStepForHistory = processFinished ? SERVICE1_STEPPER_LABELS.length : uiStep;

  const openStepDetail = useCallback(
    async (stepIndex, stepLabel) => {
      if (stepIndex === 0) {
        if (!processInstanceId) return;
        setDetailDialog({
          open: true,
          task: null,
          stepLabel,
          loading: true,
          error: null,
          taskVersionsForElement: null,
        });
        try {
          const taskMap = await fetchProcessTasks(processInstanceId);
          const merged = mergeApiTasksWithSnapshot(processInstanceId, allTasksByIdRef.current, taskMap);
          setAllTasksById(merged);
          const startVersions = getTaskVersionsForElement(merged, 'start');
          const startTask = pickLatestTaskForElement(merged, 'start');
          if (startTask) {
            setDetailDialog({
              open: true,
              task: startTask,
              stepLabel,
              loading: false,
              error: null,
              taskVersionsForElement: startVersions.length ? startVersions : [startTask],
            });
            return;
          }
          const inferred = pickPipelineEarliestTaskFromIdMap(merged);
          if (inferred) {
            setDetailDialog({
              open: true,
              task: { ...inferred, __inferredForStartStep: true },
              stepLabel,
              loading: false,
              error: null,
              taskVersionsForElement: [inferred],
            });
            return;
          }
          setDetailDialog({
            open: true,
            task: {
              __syntheticStart: true,
              process_instance_id: processInstanceId,
            },
            stepLabel,
            loading: false,
            error: null,
            taskVersionsForElement: null,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'خطا در دریافت لیست تسک‌ها.';
          setDetailDialog({
            open: true,
            task: {
              __syntheticStart: true,
              process_instance_id: processInstanceId,
            },
            stepLabel,
            loading: false,
            error: msg,
            taskVersionsForElement: null,
          });
        }
        return;
      }
      const el = getBpmnElementIdForStepperIndex(stepIndex);
      if (!processInstanceId || !el) return;

      setDetailDialog({
        open: true,
        task: null,
        stepLabel,
        loading: true,
        error: null,
        taskVersionsForElement: null,
      });

      try {
        const taskMap = await fetchProcessTasks(processInstanceId);
        const merged = mergeApiTasksWithSnapshot(processInstanceId, allTasksByIdRef.current, taskMap);
        setAllTasksById(merged);
        const versions = getTaskVersionsForElement(merged, el);
        const resolved = pickLatestTaskForElement(merged, el);
        const resolvedVersions = versions.length > 0 ? versions : resolved ? [resolved] : [];

        setDetailDialog({
          open: true,
          task: resolved,
          stepLabel,
          loading: false,
          error: resolved
            ? null
            : 'در پاسخ جاری سرور و در حافظهٔ محلی برای این element_id تسکی نیست.',
          taskVersionsForElement: resolvedVersions.length ? resolvedVersions : null,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'خطا در دریافت لیست تسک‌ها.';
        const merged = allTasksByIdRef.current;
        const versions = getTaskVersionsForElement(merged, el);
        const fallback = pickLatestTaskForElement(merged, el);
        setDetailDialog({
          open: true,
          task: fallback ?? null,
          stepLabel,
          loading: false,
          error: fallback ? `${msg} — آخرین دادهٔ ذخیره‌شده نمایش داده شد.` : msg,
          taskVersionsForElement: versions.length ? versions : fallback ? [fallback] : null,
        });
      }
    },
    [processInstanceId],
  );

  const renderBody = () => {
    if (uiStep === 0) {
      return <StartServiceStep error={startError} />;
    }
    if (tasksLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      );
    }
    if (loadError) {
      return <Alert severity="error">{loadError}</Alert>;
    }
    if (processFinished) {
      return <Alert severity="success">همه مراحل قابل نمایش برای این فرایند انجام شد.</Alert>;
    }
    return (
      <ServiceOneTaskPanel
        key={currentTask?.ID ?? 'no-task'}
        task={currentTask}
        onSubmitStepForm={handleSubmitStepForm}
        submitting={stepSubmitting}
        submitError={submitError}
      />
    );
  };

  const nextDisabled =
    uiStep === 0
      ? startSubmitting
      : tasksLoading ||
        processFinished ||
        !formPhaseComplete ||
        navSubmitting ||
        !currentTask;

  const nextLabel =
    uiStep === 0 && startSubmitting
      ? 'در حال ارسال…'
      : navSubmitting
        ? 'در حال ارسال…'
        : 'بعدی';

  if (resumeWrongService) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            این فرایند متعلق به خدمت دیگری است. از صفحهٔ لیست خدمات، برای همان نوع خدمت دکمهٔ جزییات را بزنید.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (hasResumeQuery && !urlResumeDone) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            بارگذاری فرایند…
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 3 }} component="div">
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" useFlexGap>
            <span>خدمت شماره یک</span>
            {processInstanceId != null ? (
              <Chip
                label={`شماره خدمت: ${processInstanceId}`}
                color="primary"
                size="small"
                variant="outlined"
              />
            ) : null}
          </Stack>
        </Typography>

        <Stepper
          activeStep={processFinished ? SERVICE1_STEPPER_LABELS.length : uiStep}
          alternativeLabel
          sx={{ mb: 1 }}
        >
          {SERVICE1_STEPPER_LABELS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {processInstanceId != null ? (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.75,
              justifyContent: 'space-between',
              mb: 3,
              px: { xs: 0, md: 0.5 },
            }}
          >
            {SERVICE1_STEPPER_LABELS.map((label, si) => {
              const elementId = getBpmnElementIdForStepperIndex(si);
              /* API گاهی تسک‌های DONE را در map برنمی‌گرداند؛ آنگاه tasksByElement خالی است ولی مرحله از نظر استپر گذشته */
              const hasMergedTasksForStep =
                si > 0 && Boolean(elementId && tasksByElement[elementId]?.length);
              const passedThisStepOnStepper = resolvedStepForHistory > si;
              const canView =
                si === 0
                  ? Boolean(processInstanceId)
                  : resolvedStepForHistory >= si &&
                    (hasMergedTasksForStep || passedThisStepOnStepper);
              return (
                <Box key={label} sx={{ flex: '1 1 72px', minWidth: 64, textAlign: 'center' }}>
                  <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    disabled={!canView}
                    onClick={() => void openStepDetail(si, label)}
                    sx={{
                      fontSize: 11,
                      py: 0.25,
                      px: 0.5,
                      textDecoration: canView ? 'underline' : 'none',
                      color: canView ? 'primary.main' : 'text.disabled',
                    }}
                  >
                    جزییات
                  </Button>
                </Box>
              );
            })}
          </Box>
        ) : null}

        <Box sx={{ minHeight: 120 }}>{renderBody()}</Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button variant="outlined" disabled={uiStep === 0 || Boolean(processInstanceId)} onClick={handleBack}>
            قبلی
          </Button>

          {processFinished ? (
            <Button variant="contained" color="success" onClick={handleFinishClick}>
              پایان
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext} disabled={nextDisabled}>
              {nextLabel}
            </Button>
          )}
        </Box>

        <ServiceOneStepTaskDetailDialog
          open={detailDialog.open}
          onClose={() =>
            setDetailDialog({
              open: false,
              task: null,
              stepLabel: '',
              loading: false,
              error: null,
              taskVersionsForElement: null,
            })
          }
          task={detailDialog.task}
          stepLabel={detailDialog.stepLabel}
          loading={detailDialog.loading}
          error={detailDialog.error}
          taskVersionsForElement={detailDialog.taskVersionsForElement}
        />
      </CardContent>
    </Card>
  );
}
