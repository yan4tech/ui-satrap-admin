'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { alpha } from '@mui/material/styles';
import StepIcon from '@mui/material/StepIcon';
import {
  Box,
  Card,
  Chip,
  Step,
  StepButton,
  Alert,
  Stack,
  Button,
  Dialog,
  Stepper,
  StepLabel,
  Typography,
  CardContent,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
  DialogContentText,
} from '@mui/material';

import StartServiceStep from './StartServiceStep';
import { startService } from './start-service-api';
import ServiceOneTaskPanel from './ServiceOneTaskPanel';
import ServiceOneStepTaskDetailDialog from './ServiceOneStepTaskDetailDialog';
import {
  SERVICE1_STEPPER_LABELS,
  getStepperIndexForElementId,
  getBpmnElementIdForStepperIndex,
  getService1WorkflowRank,
} from './service1-step-config';
import {
  rejectProcess,
  advanceTaskNext,
  completeTaskForm,
  fetchProcessTasks,
  rejectServiceStep,
  fetchProcessInstance,
  mergeAllTasksByTaskId,
  readService1ProcessMeta,
  pickActiveUserFacingTask,
  pickLatestTaskForElement,
  writeService1ProcessMeta,
  getTaskVersionsForElement,
  mergeApiTasksWithSnapshot,
  pickFallbackLatestTouchTask,
  canCurrentClientCompleteTask,
  parseEngineProcessRejectState,
  pickPipelineEarliestTaskFromIdMap,
} from './engine-api';

const SERVICE1_DEFINITION_KEY = 'service1';

function isEngineInstanceFinished(instance) {
  if (!instance || typeof instance !== 'object') return false;
  const status = String(instance.status ?? instance.process_status ?? instance.state ?? '')
    .trim()
    .toUpperCase();
  const lastAction = String(instance.last_action ?? '')
    .trim()
    .toUpperCase();
  if (
    status === 'COMPLETED' ||
    status === 'COMPLETE' ||
    status === 'DONE' ||
    status === 'FINISHED' ||
    status === 'ENDED' ||
    status === 'TERMINATED' ||
    status === 'CANCELLED'
  ) {
    return true;
  }
  if (
    lastAction === 'COMPLETE' ||
    lastAction === 'COMPLETED' ||
    lastAction === 'FINISH' ||
    lastAction === 'FINISHED' ||
    lastAction === 'END' ||
    lastAction === 'ENDED'
  ) {
    return true;
  }
  return Boolean(
    instance.completed_at ??
      instance.CompletedAt ??
      instance.ended_at ??
      instance.EndedAt ??
      instance.finished_at ??
      instance.FinishedAt
  );
}

function createService1StepIcon(stepIndex, uiStep, processFinished, waitingOnOtherParty) {
  return function Service1QueuedStepIcon(props) {
    const showWait =
      !processFinished && waitingOnOtherParty && stepIndex === uiStep && stepIndex > 0;
    if (showWait) {
      return (
        <Box
          role="img"
          aria-label="در انتظار کاربر دیگر"
          sx={(theme) => ({
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid',
            borderColor: 'warning.main',
            bgcolor: alpha(theme.palette.warning.main, 0.14),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            lineHeight: 1,
          })}
        >
          ⏳
        </Box>
      );
    }
    return <StepIcon {...props} />;
  };
}

function isTaskAlreadyComplete(task) {
  if (!task || typeof task !== 'object') return false;
  if (
    task.is_complete === true ||
    task.isComplete === true ||
    task.completed === true ||
    task.IsComplete === true
  ) {
    return true;
  }
  const status = String(task.status ?? task.task_status ?? '')
    .trim()
    .toUpperCase();
  return status === 'DONE' || status === 'COMPLETED' || status === 'COMPLETE' || status === 'FINISHED';
}

function pickLatestUserFacingTask(taskMap, { actionableOnly = false } = {}) {
  if (!taskMap || typeof taskMap !== 'object') return null;
  const list = Object.values(taskMap).filter(Boolean);
  if (!list.length) return null;
  const eligible = list.filter((t) => {
    const type = String(t?.type ?? '')
      .trim()
      .replace(/\s+/g, '')
      .toUpperCase();
    const isUserFacing = type === 'USER_TASK' || type === 'SERVICE_REVIEW';
    if (!isUserFacing) return false;
    if (!actionableOnly) return true;
    return canCurrentClientCompleteTask(t);
  });
  if (!eligible.length) return null;
  return [...eligible].sort((a, b) => {
    const tb = new Date(b.UpdatedAt || b.completed_at || b.CreatedAt || 0).getTime();
    const ta = new Date(a.UpdatedAt || a.completed_at || a.CreatedAt || 0).getTime();
    if (tb !== ta) return tb - ta;
    const ra = getService1WorkflowRank(a.element_id);
    const rb = getService1WorkflowRank(b.element_id);
    if (rb !== ra) return rb - ra;
    return (b.ID ?? 0) - (a.ID ?? 0);
  })[0];
}

export default function WorkflowWizard() {
  const router = useRouter();
  const pathname = usePathname();
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
    definitionKeyFromUrl !== SERVICE1_DEFINITION_KEY;

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
  const [processRejected, setProcessRejected] = useState(false);
  const [processRejectComment, setProcessRejectComment] = useState('');
  const [rejectedViewTask, setRejectedViewTask] = useState(null);
  const [processRejectDialogOpen, setProcessRejectDialogOpen] = useState(false);
  const [processRejectDialogComment, setProcessRejectDialogComment] = useState('');
  const [processRejectDialogError, setProcessRejectDialogError] = useState('');
  const [rejectProcessSubmitting, setRejectProcessSubmitting] = useState(false);
  const [previewStep, setPreviewStep] = useState(null);
  const pendingRejectAnchorTaskRef = useRef(null);
  const [loadError, setLoadError] = useState(null);
  const [urlResumeDone, setUrlResumeDone] = useState(() => !hasResumeQuery);
  const hadResumeQueryRef = useRef(false);
  const skipResumeLoadAfterStartRef = useRef(false);
  const lastClientStartedProcessIdRef = useRef(null);
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

  const currentTask = useMemo(() => {
    if (processRejected && rejectedViewTask) return rejectedViewTask;
    const active = pickActiveUserFacingTask(tasks);
    if (active) return active;
    return pickLatestUserFacingTask(tasks);
  }, [tasks, processRejected, rejectedViewTask]);

  const waitingOnOtherParty = useMemo(
    () =>
      processInstanceId != null &&
      !tasksLoading &&
      !processFinished &&
      !processRejected &&
      uiStep > 0 &&
      Boolean(currentTask) &&
      !canCurrentClientCompleteTask(currentTask),
    [processInstanceId, tasksLoading, processFinished, processRejected, uiStep, currentTask]
  );

  useEffect(() => {
    setProcessRejected(false);
    setRejectedViewTask(null);
    setProcessRejectComment('');
    setProcessRejectDialogOpen(false);
    setProcessRejectDialogComment('');
    setProcessRejectDialogError('');
    pendingRejectAnchorTaskRef.current = null;
  }, [processInstanceId]);

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

  const syncFromTasks = useCallback((taskMap, options = {}) => {
    const { canMarkFinished = true } = options;
    const t = pickActiveUserFacingTask(taskMap);
    if (!t) {
      if (canMarkFinished) {
        setProcessFinished(true);
        setUiStep(SERVICE1_STEPPER_LABELS.length);
        return;
      }
      const latest = pickLatestUserFacingTask(taskMap);
      if (latest) {
        setProcessFinished(false);
        setUiStep(getStepperIndexForElementId(latest.element_id));
        return;
      }
      const last = lastCurrentTaskRef.current;
      if (last?.ID != null) {
        setAllTasksById((prev) => ({ ...prev, [String(last.ID)]: { ...last } }));
      }
      if (canMarkFinished) {
        setProcessFinished(true);
        setUiStep(SERVICE1_STEPPER_LABELS.length);
      } else {
        setProcessFinished(false);
      }
      return;
    }
    setProcessFinished(false);
    setUiStep(getStepperIndexForElementId(t.element_id));
  }, []);

  const loadTasks = useCallback(
    async (pid, options = {}) => {
      const { silent = false } = options;
      if (!silent) {
        setTasksLoading(true);
        setLoadError(null);
      }
      let mergedOut;
      try {
        const t = await fetchProcessTasks(pid);
        setLoadError(null);
        const merged = mergeApiTasksWithSnapshot(
          pid,
          silent ? allTasksByIdRef.current : {},
          t
        );
        const inst = await fetchProcessInstance(pid);
        const rejectFromApi = inst ? parseEngineProcessRejectState(inst) : null;
        const storedMeta = readService1ProcessMeta(pid);
        const rejectFromMeta =
          !rejectFromApi && storedMeta?.rejected === true
            ? { rejected: true, comment: String(storedMeta.comment ?? '').trim() }
            : null;
        const rejectState = rejectFromApi ?? rejectFromMeta;
        if (rejectState?.rejected) {
          setProcessRejected(true);
          setProcessRejectComment(rejectState.comment || '');
          const anchor = pickActiveUserFacingTask(merged) ||
            pickFallbackLatestTouchTask(merged) || {
              ID: 0,
              element_id: 'review2',
              type: 'SERVICE_REVIEW',
              status: 'READY',
              process_instance_id: pid,
              __syntheticRejectedAnchor: true,
            };
          setRejectedViewTask({ ...anchor });
          setTasks(merged);
          setProcessFinished(false);
          setUiStep(getStepperIndexForElementId(anchor.element_id));
          mergedOut = merged;
        } else {
          setProcessRejected(false);
          setProcessRejectComment('');
          setRejectedViewTask(null);
          setTasks(merged);
          syncFromTasks(merged, { canMarkFinished: isEngineInstanceFinished(inst) });
          mergedOut = merged;
        }
      } catch (e) {
        if (!silent) {
          setLoadError(e instanceof Error ? e.message : 'خطا در دریافت وظایف.');
          setTasks({});
          setUiStep(1);
          setProcessFinished(false);
        }
        mergedOut = undefined;
      } finally {
        if (!silent) {
          setTasksLoading(false);
        }
      }
      return mergedOut;
    },
    [syncFromTasks]
  );

  useEffect(() => {
    if (!waitingOnOtherParty || processInstanceId == null) return undefined;
    const pid = processInstanceId;
    void loadTasks(pid, { silent: true });
    const intervalId = window.setInterval(() => {
      void loadTasks(pid, { silent: true });
    }, 10_000);
    return () => window.clearInterval(intervalId);
  }, [waitingOnOtherParty, processInstanceId, loadTasks]);

  useEffect(() => {
    /* useEffect: خروج زودهنگام یا تابع cleanup — هر دو برای React معتبرند */
    /* eslint-disable consistent-return */
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
        setProcessRejected(false);
        setRejectedViewTask(null);
        setProcessRejectComment('');
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

    if (
      skipResumeLoadAfterStartRef.current &&
      lastClientStartedProcessIdRef.current != null &&
      Number(lastClientStartedProcessIdRef.current) === parsedResumePid
    ) {
      skipResumeLoadAfterStartRef.current = false;
      setUrlResumeDone(true);
      return undefined;
    }

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
    /* eslint-enable consistent-return */
  }, [hasResumeQuery, resumeWrongService, parsedResumePid, loadTasks]);

  useEffect(() => {
    setFormPhaseComplete(false);
    setSubmitError(null);
  }, [currentTask?.ID]);

  useEffect(() => {
    setPreviewStep(null);
  }, [processInstanceId, uiStep, processFinished, processRejected]);

  const closeProcessRejectDialog = useCallback(() => {
    if (rejectProcessSubmitting) return;
    setProcessRejectDialogOpen(false);
    setProcessRejectDialogComment('');
    setProcessRejectDialogError('');
    pendingRejectAnchorTaskRef.current = null;
  }, [rejectProcessSubmitting]);

  const confirmProcessReject = useCallback(async () => {
    const comment = processRejectDialogComment.trim();
    const anchor = pendingRejectAnchorTaskRef.current;
    if (!processInstanceId || !comment || !anchor) {
      closeProcessRejectDialog();
      return;
    }
    setSubmitError(null);
    setProcessRejectDialogError('');
    setRejectProcessSubmitting(true);
    try {
      await rejectProcess(processInstanceId, { comment });
      writeService1ProcessMeta(processInstanceId, { rejected: true, comment });
      setProcessRejectComment(comment);
      setRejectedViewTask({ ...anchor });
      setProcessRejected(true);
      setTasks({});
      setFormPhaseComplete(false);
      setProcessRejectDialogOpen(false);
      setProcessRejectDialogComment('');
      setProcessRejectDialogError('');
      pendingRejectAnchorTaskRef.current = null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'خطا در رد فرایند.';
      setSubmitError(msg);
      setProcessRejectDialogError(msg);
    } finally {
      setRejectProcessSubmitting(false);
    }
  }, [processInstanceId, processRejectDialogComment, closeProcessRejectDialog]);

  /** @returns {Promise<boolean>} موفقیت ثبت در موتور */
  const handleSubmitStepForm = async (body) => {
    if (!processInstanceId || !currentTask) return false;
    if (!canCurrentClientCompleteTask(currentTask)) {
      setSubmitError('این مرحله برای نقش فعلی شما نیست؛ کاربر مجاز باید آن را در موتور تکمیل کند.');
      return false;
    }
    setSubmitError(null);
    setStepSubmitting(true);
    try {
      if (body?.engineReviewDecision === 'rejected') {
        const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
        if (!comment) {
          setSubmitError('برای رد فرایند، وارد کردن توضیح / دلیل رد الزامی است.');
          return false;
        }
        pendingRejectAnchorTaskRef.current = currentTask;
        setProcessRejectDialogComment(comment);
        setProcessRejectDialogError('');
        setProcessRejectDialogOpen(true);
        return false;
      }
      if (body?.engineReviewDecision === 'correction') {
        await rejectServiceStep(processInstanceId, currentTask.ID, {
          comment: typeof body.comment === 'string' ? body.comment : '',
        });
        setFormPhaseComplete(false);
        await loadTasks(processInstanceId);
        return true;
      }
      if (body?.engineReviewDecision === 'approved') {
        const review_comment =
          typeof body.review_comment === 'string' && body.review_comment.trim() !== ''
            ? body.review_comment.trim()
            : 'ok';
        const formPayload =
          body.taskFormPayload && typeof body.taskFormPayload === 'object'
            ? body.taskFormPayload
            : {};
        await completeTaskForm(processInstanceId, currentTask.ID, {
          review_status: 'approved',
          review_comment,
          ...formPayload,
        });
        setFormPhaseComplete(true);
        return true;
      }
      if (body && body.rejectToEngine) {
        await rejectServiceStep(processInstanceId, currentTask.ID, {
          comment: typeof body.comment === 'string' ? body.comment : '',
        });
        setFormPhaseComplete(false);
        await loadTasks(processInstanceId);
        return true;
      }
      const {
        rejectToEngine: _r,
        engineReviewDecision: _ed,
        taskFormPayload: _tf,
        review_comment: _rc,
        ...rest
      } = body || {};
      await completeTaskForm(processInstanceId, currentTask.ID, rest);
      setFormPhaseComplete(true);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'خطا در ثبت مرحله.';
      setSubmitError(msg);
      return false;
    } finally {
      setStepSubmitting(false);
    }
  };

  const canAdvanceFromCurrent = formPhaseComplete || isTaskAlreadyComplete(currentTask);

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
        lastClientStartedProcessIdRef.current = id;
        skipResumeLoadAfterStartRef.current = true;
        const qs = new URLSearchParams({
          processId: String(id),
          definitionKey: SERVICE1_DEFINITION_KEY,
        });
        router.replace(`${pathname}?${qs.toString()}`);
      } catch (e) {
        setStartError(e instanceof Error ? e.message : 'خطا در شروع خدمت.');
      } finally {
        setStartSubmitting(false);
      }
      return;
    }

    if (processFinished || processRejected || !currentTask || !canAdvanceFromCurrent) return;
    if (!canCurrentClientCompleteTask(currentTask)) return;

    setNavSubmitting(true);
    setSubmitError(null);
    try {
      setAllTasksById((prev) => ({ ...prev, [String(currentTask.ID)]: { ...currentTask } }));
      const nextRes = await advanceTaskNext(processInstanceId, currentTask.ID, { approved: true });
      const nextData =
        nextRes && typeof nextRes === 'object' && nextRes.data && typeof nextRes.data === 'object'
          ? nextRes.data
          : nextRes;
      const nextStatus = String(nextData?.status ?? '').trim().toUpperCase();
      const nextAction = String(nextData?.last_action ?? '').trim().toUpperCase();
      const nextCompleted =
        nextData?.is_completed === true ||
        nextData?.step_workflow_closed === true ||
        nextStatus === 'DONE' ||
        nextAction === 'COMPLETE' ||
        nextAction === 'COMPLETED' ||
        nextAction === 'FINISH' ||
        nextAction === 'FINISHED' ||
        Boolean(nextData?.completed_at ?? nextData?.ended_at ?? nextData?.finished_at);
      if (nextCompleted) {
        setProcessFinished(true);
        setUiStep(SERVICE1_STEPPER_LABELS.length);
      }
      setFormPhaseComplete(false);
      await loadTasks(processInstanceId);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'خطا در رفتن به مرحله بعد.');
    } finally {
      setNavSubmitting(false);
    }
  };

  const handleFinishClick = () => {
    alert('فرایند تکمیل شد.');
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
          const merged = mergeApiTasksWithSnapshot(
            processInstanceId,
            allTasksByIdRef.current,
            taskMap
          );
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
        const merged = mergeApiTasksWithSnapshot(
          processInstanceId,
          allTasksByIdRef.current,
          taskMap
        );
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
    [processInstanceId]
  );

  const renderBody = () => {
    const stepToRender = previewStep != null ? previewStep : uiStep;
    const elementIdForPreview =
      previewStep != null && previewStep > 0 ? getBpmnElementIdForStepperIndex(previewStep) : null;
    const previewTask =
      previewStep != null && elementIdForPreview
        ? pickLatestTaskForElement(allTasksById, elementIdForPreview)
        : null;
    const renderedTask = previewStep != null ? previewTask : currentTask;

    if (stepToRender === 0) {
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
    if (processFinished && previewStep == null) {
      return <Alert severity="success">همه مراحل قابل نمایش برای این فرایند انجام شد.</Alert>;
    }
    if (previewStep != null && !renderedTask) {
      return (
        <Alert severity="info">
          برای این مرحله هنوز داده‌ای جهت نمایش وجود ندارد. بعد از ثبت یا پیشروی فرایند، این بخش قابل
          مشاهده می‌شود.
        </Alert>
      );
    }
    return (
      <ServiceOneTaskPanel
        key={`${renderedTask?.ID ?? 'no-task'}-${previewStep ?? 'live'}`}
        task={renderedTask}
        tasksIdMap={allTasksById}
        reviewHydrationKey={processInstanceId}
        onSubmitStepForm={handleSubmitStepForm}
        submitting={stepSubmitting}
        submitError={submitError}
        interactionLocked={processRejected || previewStep != null}
        waitForOtherUser={waitingOnOtherParty}
        finalSubmitDisabled={
          previewStep != null ||
          formPhaseComplete ||
          isTaskAlreadyComplete(previewStep != null ? renderedTask : currentTask)
        }
      />
    );
  };

  const nextDisabled =
    uiStep === 0
      ? startSubmitting
      : tasksLoading ||
        previewStep != null ||
        processFinished ||
        processRejected ||
        !canAdvanceFromCurrent ||
        navSubmitting ||
        !currentTask ||
        waitingOnOtherParty;

  const nextLabel =
    uiStep === 0 && startSubmitting
      ? 'در حال ارسال…'
      : navSubmitting
        ? 'در حال ارسال…'
        : waitingOnOtherParty && uiStep > 0
          ? 'در انتظار طرف دیگر'
          : 'بعدی';

  if (resumeWrongService) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            این فرایند متعلق به خدمت دیگری است. از صفحهٔ لیست خدمات، برای همان نوع خدمت دکمهٔ جزییات
            را بزنید.
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
        {processRejected ? (
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
              <Chip label="فرایند رد شده" color="error" size="small" />
              <Typography variant="body2" color="text.secondary">
                ادامهٔ فرایند در موتور متوقف است؛ فقط مشاهدهٔ مراحل و جزئیات ممکن است.
              </Typography>
            </Stack>
            {processRejectComment ? (
              <Alert
                severity="error"
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderWidth: 2,
                  '& .MuiAlert-message': { width: '100%' },
                }}
              >
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75 }}>
                  پیام رد (ثبت‌شده در موتور)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.65 }}
                >
                  {processRejectComment}
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                این فرایند به‌عنوان ردشده علامت‌گذاری شده است؛ متن دلیل در پاسخ سرور خالی بوده است.
              </Alert>
            )}
          </Stack>
        ) : null}
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

        {waitingOnOtherParty ? (
          <Alert severity="warning" sx={{ mb: 2 }} variant="outlined">
            <Typography variant="body2">
              این مرحله برای نقش فعلی شما در سامانه نیست (مثلاً بررسی خدمت برای شرکت، یا تکمیل فرم
              برای شعبه/موبایل). تا وقتی کاربر مجاز آن را در موتور انجام ندهد، دکمهٔ «بعدی» غیرفعال
              می‌ماند.
            </Typography>
          </Alert>
        ) : null}

        <Stepper
          nonLinear
          activeStep={
            processFinished ? SERVICE1_STEPPER_LABELS.length : uiStep
          }
          alternativeLabel
          sx={{
            mb: 1.5,
            px: { xs: 0, md: 0.5 },
            '& .MuiStepLabel-label': {
              fontWeight: 600,
            },
            '& .MuiStepLabel-label.Mui-active': {
              color: 'primary.main',
              fontWeight: 800,
            },
            '& .MuiStepLabel-label.Mui-completed': {
              color: 'success.main',
            },
          }}
        >
          {SERVICE1_STEPPER_LABELS.map((label, index) => {
            const showStepWait =
              !processFinished && waitingOnOtherParty && index === uiStep && index > 0;
            const isPastStep = resolvedStepForHistory > index;
            const canPreview = processInstanceId != null && (index === uiStep || isPastStep);
            return (
              <Step key={label} completed={isPastStep}>
                <StepButton
                  disableRipple={!canPreview}
                  disableTouchRipple={!canPreview}
                  onClick={() => {
                    if (!canPreview) return;
                    if (index === uiStep) {
                      setPreviewStep(null);
                      return;
                    }
                    setPreviewStep(index);
                  }}
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    ...(previewStep === index
                      ? {
                          bgcolor: 'action.selected',
                          '& .MuiStepLabel-label': {
                            color: 'primary.main',
                            fontWeight: 800,
                          },
                        }
                      : {}),
                    ...(canPreview
                      ? {
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }
                      : {}),
                  }}
                >
                  <StepLabel
                    StepIconComponent={createService1StepIcon(
                      index,
                      uiStep,
                      processFinished,
                      waitingOnOtherParty
                    )}
                    optional={
                      showStepWait ? (
                        <Typography
                          variant="caption"
                          color="warning.main"
                          display="block"
                          sx={{
                            mt: 0.35,
                            maxWidth: 160,
                            mx: 'auto',
                            lineHeight: 1.25,
                            textAlign: 'center',
                            fontWeight: 600,
                          }}
                        >
                          در انتظار انجام
                        </Typography>
                      ) : null
                    }
                  >
                    {label}
                  </StepLabel>
                </StepButton>
              </Step>
            );
          })}
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

        {previewStep != null ? (
          <Alert severity="info" variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
            شما در حالت مشاهدهٔ مرحله قبل هستید؛ تمام اکشن‌ها غیرفعال هستند.
          </Alert>
        ) : null}

        <Box
          sx={{
            minHeight: uiStep === 0 ? 300 : 120,
            display: 'flex',
            flexDirection: 'column',
            alignItems: uiStep === 0 ? 'center' : 'stretch',
            justifyContent: uiStep === 0 ? 'center' : 'flex-start',
            py: uiStep === 0 ? 2 : 0,
            px: uiStep === 0 ? { xs: 1, sm: 2 } : 0,
          }}
        >
          {renderBody()}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 1.5 }}>
          {previewStep != null ? (
            <Button variant="outlined" onClick={() => setPreviewStep(null)}>
              بازگشت به مرحله جاری
            </Button>
          ) : null}
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
          rejectBannerComment={processRejected ? processRejectComment : ''}
        />

        <Dialog
          open={processRejectDialogOpen}
          onClose={closeProcessRejectDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>تایید رد فرایند</DialogTitle>
          <DialogContent>
            <DialogContentText component="div">
              <Typography variant="body2" color="text.primary" sx={{ mb: 1.5 }}>
                با تایید، کل فرایند در موتور رد می‌شود و ادامهٔ آن متوقف می‌گردد. این کار جدی است؛
                آیا مطمئن هستید؟
              </Typography>
              {processInstanceId != null ? (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  شماره فرایند: <strong>{processInstanceId}</strong>
                </Typography>
              ) : null}
              {processRejectDialogComment ? (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.5,
                    p: 1.25,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {processRejectDialogComment}
                </Typography>
              ) : null}
              {processRejectDialogError ? (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {processRejectDialogError}
                </Alert>
              ) : null}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeProcessRejectDialog} disabled={rejectProcessSubmitting}>
              انصراف
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => void confirmProcessReject()}
              disabled={rejectProcessSubmitting}
            >
              {rejectProcessSubmitting ? 'در حال ثبت رد…' : 'بله، فرایند رد شود'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
