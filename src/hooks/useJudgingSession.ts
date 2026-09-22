"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pruneScoresForCompetition } from "@/lib/competition-config";
import { formatSaveAge, formatScoreValue, formatTimestamp } from "@/lib/judging-format";
import { getMissingCells, isScoreInRange, normalizeScore } from "@/lib/scoring";
import type {
  ActiveCompetitionResponse,
  Judge,
  JudgeScoresResponse,
  PendingConfirm,
  ScoreChange,
  ScoreUndo,
  SubmissionStatus,
  Toast,
} from "@/types/judging";

export { formatScoreValue, formatTimestamp };

const AUTOSAVE_DELAY_MS = 700;

type UseJudgingSessionOptions = {
  lockedJudgeId?: string;
};

type PersistOptions = {
  isFinal: boolean;
  skipConfirm?: boolean;
  quiet?: boolean;
  keepalive?: boolean;
  notesOnly?: boolean;
  competitionId?: string;
  judgeId?: string;
  scoresSnapshot?: Record<string, number>;
  notesSnapshot?: Record<string, string>;
};

function entriesFromScores(scores: Record<string, number>) {
  return Object.entries(scores).map(([key, value]) => {
    const [companyId, categoryId] = key.split(":");
    return { companyId, categoryId, score: value };
  });
}

function scoresDifferFromBaseline(
  baseline: Record<string, number> | undefined,
  current: Record<string, number>,
) {
  const saved = baseline ?? {};
  const keys = new Set([...Object.keys(saved), ...Object.keys(current)]);
  for (const key of keys) {
    if (saved[key] !== current[key]) return true;
  }
  return false;
}

function notesFromRecord(notes: Record<string, string>) {
  return Object.entries(notes).map(([companyId, body]) => ({ companyId, body }));
}

function notesDifferFromBaseline(
  baseline: Record<string, string> | undefined,
  current: Record<string, string>,
) {
  const saved = baseline ?? {};
  const keys = new Set([...Object.keys(saved), ...Object.keys(current)]);
  for (const key of keys) {
    if ((saved[key] ?? "") !== (current[key] ?? "")) return true;
  }
  return false;
}

export function useJudgingSession(options?: UseJudgingSessionOptions) {
  const lockedJudgeId = options?.lockedJudgeId;
  const [data, setData] = useState<ActiveCompetitionResponse | null>(null);
  const [selectedJudgeId, setSelectedJudgeId] = useState<string>(lockedJudgeId ?? "");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submissionUpdatedAt, setSubmissionUpdatedAt] = useState<string | null>(null);
  const [missingCells, setMissingCells] = useState<Array<{ companyId: string; categoryId: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [changeLog, setChangeLog] = useState<Record<string, ScoreChange[]>>({});
  const [changeLogOpen, setChangeLogOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<ScoreUndo[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const nextToastId = useRef(0);
  const baselineByJudge = useRef<Record<string, Record<string, number>>>({});
  const notesBaselineByJudge = useRef<Record<string, Record<string, string>>>({});
  const scoresRef = useRef(scores);
  const notesRef = useRef(notes);
  const dataRef = useRef(data);
  const selectedJudgeIdRef = useRef(selectedJudgeId);
  const submissionStatusRef = useRef(submissionStatus);
  const isLoadingScoresRef = useRef(isLoadingScores);
  const saveTimerRef = useRef<number | null>(null);
  const saveQueuedRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const persistScoresRef = useRef<(options: PersistOptions) => Promise<void>>(async () => {});

  const showToast = useCallback((message: string) => {
    const id = nextToastId.current++;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    selectedJudgeIdRef.current = selectedJudgeId;
  }, [selectedJudgeId]);

  useEffect(() => {
    submissionStatusRef.current = submissionStatus;
  }, [submissionStatus]);

  useEffect(() => {
    isLoadingScoresRef.current = isLoadingScores;
  }, [isLoadingScores]);

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const cancelScheduledAutosave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const applyCompetitionPayload = useCallback(
    (payload: ActiveCompetitionResponse, options?: { isNewRound?: boolean; configUpdated?: boolean }) => {
      setData((prev) => {
        const competitionChanged = prev !== null && prev.competition.id !== payload.competition.id;
        if (competitionChanged || options?.isNewRound) {
          cancelScheduledAutosave();
          saveQueuedRef.current = false;
          setScores({});
          setNotes({});
          setSubmissionStatus(null);
          setSubmittedAt(null);
          setSubmissionUpdatedAt(null);
          setMissingCells([]);
          setChangeLog({});
          setUndoStack([]);
          setIsAutosaving(false);
          baselineByJudge.current = {};
          notesBaselineByJudge.current = {};
        }
        return payload;
      });

      if (options?.configUpdated) {
        const companyIds = new Set(payload.companies.map((company) => company.id));
        setScores((currentScores) =>
          pruneScoresForCompetition(currentScores, payload.companies, payload.categories),
        );
        setNotes((currentNotes) => {
          const next: Record<string, string> = {};
          for (const [companyId, body] of Object.entries(currentNotes)) {
            if (companyIds.has(companyId)) next[companyId] = body;
          }
          notesRef.current = next;
          return next;
        });
        setMissingCells([]);
      }

      setSelectedJudgeId((prev) => {
        if (lockedJudgeId) {
          const lockedValid = payload.judges.some((judge) => judge.id === lockedJudgeId);
          return lockedValid ? lockedJudgeId : prev;
        }
        const stillValid = payload.judges.some((judge) => judge.id === prev);
        return stillValid ? prev : (payload.judges[0]?.id ?? "");
      });
    },
    [cancelScheduledAutosave, lockedJudgeId],
  );

  useEffect(() => {
    if (lockedJudgeId) {
      setSelectedJudgeId(lockedJudgeId);
    }
  }, [lockedJudgeId]);

  const loadCompetition = useCallback(async () => {
    const response = await fetch("/api/competitions/active");
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as ActiveCompetitionResponse;
    applyCompetitionPayload(payload);
  }, [applyCompetitionPayload]);

  useEffect(() => {
    void loadCompetition();
  }, [loadCompetition]);

  useEffect(() => {
    let currentCompetitionId = data?.competition.id;
    let currentConfigRevision = data?.configRevision;

    async function checkForCompetitionChange() {
      const response = await fetch("/api/competitions/active");
      if (!response.ok) return;
      const payload = (await response.json()) as ActiveCompetitionResponse;

      const isNewRound = currentCompetitionId !== undefined && currentCompetitionId !== payload.competition.id;
      const configUpdated =
        currentConfigRevision !== undefined && currentConfigRevision !== payload.configRevision;

      if (!isNewRound && !configUpdated) return;

      currentCompetitionId = payload.competition.id;
      currentConfigRevision = payload.configRevision;
      applyCompetitionPayload(
        payload,
        isNewRound ? { isNewRound: true } : configUpdated ? { configUpdated: true } : undefined,
      );
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void checkForCompetitionChange();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    const interval = window.setInterval(() => void checkForCompetitionChange(), 5000);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(interval);
    };
  }, [applyCompetitionPayload, data?.competition.id, data?.configRevision]);

  const loadSavedScores = useCallback(
    async (options?: { signal?: AbortSignal; successMessage?: string; showErrorToast?: boolean }) => {
      if (!data || !selectedJudgeId) return false;

      setIsLoadingScores(true);
      setMissingCells([]);

      try {
        const params = new URLSearchParams({
          competitionId: data.competition.id,
          judgeId: selectedJudgeId,
        });
        const response = await fetch(`/api/scores?${params}`, { signal: options?.signal });
        if (!response.ok) {
          if (options?.showErrorToast) showToast("Unable to load saved scores for this judge.");
          return false;
        }
        const payload = (await response.json()) as JudgeScoresResponse;
        const nextScores: Record<string, number> = {};
        for (const entry of payload.entries) {
          nextScores[`${entry.companyId}:${entry.categoryId}`] = entry.score;
        }
        const nextNotes: Record<string, string> = {};
        for (const company of data.companies) {
          nextNotes[company.id] = "";
        }
        for (const note of payload.notes ?? []) {
          nextNotes[note.companyId] = note.body;
        }
        scoresRef.current = nextScores;
        notesRef.current = nextNotes;
        setScores(nextScores);
        setNotes(nextNotes);
        baselineByJudge.current[selectedJudgeId] = { ...nextScores };
        notesBaselineByJudge.current[selectedJudgeId] = { ...nextNotes };
        setChangeLog((prev) => {
          const next = { ...prev };
          delete next[selectedJudgeId];
          return next;
        });
        setUndoStack([]);
        setSubmissionStatus(payload.status);
        setSubmittedAt(payload.submittedAt);
        setSubmissionUpdatedAt(payload.updatedAt);
        if (options?.successMessage) showToast(options.successMessage);
        return payload.entries.length > 0;
      } catch (error) {
        if (options?.signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
          return false;
        }
        if (options?.showErrorToast) showToast("Unable to load saved scores for this judge.");
        return false;
      } finally {
        if (!options?.signal?.aborted) setIsLoadingScores(false);
      }
    },
    [data, selectedJudgeId, showToast],
  );

  useEffect(() => {
    if (!data || !selectedJudgeId) return;
    cancelScheduledAutosave();
    saveQueuedRef.current = false;
    setIsAutosaving(false);
    const controller = new AbortController();
    loadSavedScores({ signal: controller.signal });
    return () => controller.abort();
  }, [cancelScheduledAutosave, data, selectedJudgeId, loadSavedScores]);

  const persistScores = useCallback(
    async (saveOptions: PersistOptions) => {
      const competition = dataRef.current;
      const judgeId = saveOptions.judgeId ?? selectedJudgeIdRef.current;
      if (!competition || !judgeId) return;

      if (saveOptions.isFinal && !saveOptions.skipConfirm) {
        setPendingConfirm({ type: "submit-final" });
        return;
      }

      if (saveInFlightRef.current) {
        if (!saveOptions.isFinal) {
          saveQueuedRef.current = true;
        }
        return;
      }

      if (saveOptions.isFinal) {
        saveQueuedRef.current = false;
        cancelScheduledAutosave();
      }

      const currentScores = saveOptions.scoresSnapshot ?? scoresRef.current;
      const currentNotes = saveOptions.notesSnapshot ?? notesRef.current;
      const entries = entriesFromScores(currentScores);
      const noteEntries = notesFromRecord(currentNotes);

      saveInFlightRef.current = true;
      setIsSubmitting(true);
      if (!saveOptions.isFinal || saveOptions.notesOnly) setIsAutosaving(true);
      setMissingCells([]);
      try {
        const response = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            competitionId: saveOptions.competitionId ?? competition.competition.id,
            judgeId,
            isFinal: saveOptions.isFinal,
            notesOnly: saveOptions.notesOnly === true,
            entries: saveOptions.notesOnly ? [] : entries,
            notes: noteEntries,
          }),
          keepalive: saveOptions.keepalive,
        });
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          showToast("Unable to save scores. Please sign in again.");
          return;
        }
        const payload = (await response.json()) as {
          missingCells?: Array<{ companyId: string; categoryId: string }>;
          status?: SubmissionStatus | null;
          submittedAt?: string | null;
          updatedAt?: string | null;
          error?: string;
        };
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            showToast(payload.error ?? "Unable to save scores for this judge.");
            return;
          }
          if (response.status === 400 && Array.isArray(payload.missingCells)) {
            setMissingCells(payload.missingCells);
            showToast("All cells must be filled before final submission.");
            return;
          }
          if (response.status === 400) {
            const apiMissing = getMissingCells(
              competition.companies.map((company) => company.id),
              competition.categories.map((category) => category.id),
              entries,
            );
            if (apiMissing.length > 0) {
              setMissingCells(apiMissing);
              showToast("All cells must be filled before final submission.");
              return;
            }
          }
          showToast(typeof payload.error === "string" ? payload.error : "Unable to save scores.");
          return;
        }
        if (saveOptions.isFinal) {
          showToast("Final scores submitted successfully.");
        } else if (!saveOptions.quiet) {
          showToast("Draft saved successfully.");
        }
        setMissingCells([]);
        if (!saveOptions.notesOnly) {
          setSubmissionStatus(payload.status ?? null);
          setSubmittedAt(payload.submittedAt ?? null);
          setSubmissionUpdatedAt(payload.updatedAt ?? null);
          const savedScores: Record<string, number> = {};
          for (const entry of entries) {
            savedScores[`${entry.companyId}:${entry.categoryId}`] = entry.score;
          }
          baselineByJudge.current[judgeId] = savedScores;
        }
        notesBaselineByJudge.current[judgeId] = { ...currentNotes };
        if (!saveOptions.notesOnly) {
          setChangeLog((prev) => {
            const next = { ...prev };
            delete next[judgeId];
            return next;
          });
        }
      } finally {
        saveInFlightRef.current = false;
        setIsSubmitting(false);
        setIsAutosaving(false);
        if (saveQueuedRef.current) {
          saveQueuedRef.current = false;
          if (submissionStatusRef.current !== "FINAL") {
            void persistScoresRef.current({ isFinal: false, quiet: true });
          }
        }
      }
    },
    [cancelScheduledAutosave, showToast],
  );

  useEffect(() => {
    persistScoresRef.current = persistScores;
  }, [persistScores]);

  const flushAutosave = useCallback(async () => {
    cancelScheduledAutosave();
    if (isLoadingScoresRef.current) {
      setIsAutosaving(false);
      return;
    }
    const judgeId = selectedJudgeIdRef.current;
    const currentScores = scoresRef.current;
    const currentNotes = notesRef.current;
    const scoresChanged = Boolean(
      judgeId && scoresDifferFromBaseline(baselineByJudge.current[judgeId], currentScores),
    );
    const notesChanged = Boolean(
      judgeId && notesDifferFromBaseline(notesBaselineByJudge.current[judgeId], currentNotes),
    );
    if (!judgeId || (!scoresChanged && !notesChanged)) {
      setIsAutosaving(false);
      return;
    }
    if (submissionStatusRef.current === "FINAL") {
      if (!notesChanged) {
        setIsAutosaving(false);
        return;
      }
      await persistScores({
        isFinal: false,
        notesOnly: true,
        quiet: true,
        judgeId,
        notesSnapshot: currentNotes,
        competitionId: dataRef.current?.competition.id,
      });
      return;
    }
    await persistScores({
      isFinal: false,
      quiet: true,
      judgeId,
      scoresSnapshot: currentScores,
      notesSnapshot: currentNotes,
      competitionId: dataRef.current?.competition.id,
    });
  }, [cancelScheduledAutosave, persistScores]);

  const scheduleAutosave = useCallback(() => {
    if (isLoadingScoresRef.current) return;
    setIsAutosaving(true);
    cancelScheduledAutosave();
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void flushAutosave();
    }, AUTOSAVE_DELAY_MS);
  }, [cancelScheduledAutosave, flushAutosave]);

  const selectJudge = useCallback(
    (nextJudgeId: string) => {
      if (nextJudgeId === selectedJudgeIdRef.current) return;
      void (async () => {
        await flushAutosave();
        setSelectedJudgeId(nextJudgeId);
      })();
    },
    [flushAutosave],
  );

  function handleConfirmDialog() {
    if (!pendingConfirm) return;

    if (pendingConfirm.type === "submit-final") {
      void persistScores({ isFinal: true, skipConfirm: true });
    }

    setPendingConfirm(null);
  }

  const selectedJudge = useMemo(
    () => data?.judges.find((judge) => judge.id === selectedJudgeId) ?? null,
    [data?.judges, selectedJudgeId],
  );

  const totals = useMemo(() => {
    if (!data) return {};
    const categoryMap = new Map(data.categories.map((category) => [category.id, category]));
    const result: Record<string, number> = {};
    for (const company of data.companies) {
      let total = 0;
      for (const category of data.categories) {
        const value = scores[`${company.id}:${category.id}`];
        if (typeof value === "number") {
          total += value * ((categoryMap.get(category.id)?.weight ?? 0) / 100);
        }
      }
      result[company.id] = Math.round(total * 100) / 100;
    }
    return result;
  }, [data, scores]);

  const entryCount = useMemo(() => {
    if (!data) return 0;
    return data.companies.length * data.categories.length;
  }, [data]);

  const missingCellKeys = useMemo(
    () => new Set(missingCells.map((cell) => `${cell.companyId}:${cell.categoryId}`)),
    [missingCells],
  );

  const hasChangeLog = useMemo(
    () => data?.judges.some((judge) => (changeLog[judge.id]?.length ?? 0) > 0) ?? false,
    [data?.judges, changeLog],
  );

  const saveStatusLabel = useMemo(() => {
    if (submissionStatus === "FINAL") {
      return submittedAt ? `Final scores submitted at: ${formatTimestamp(submittedAt)}` : "Final scores submitted";
    }
    if (isAutosaving) return "Saving...";
    if (!submissionStatus) return "No saved scores";
    return formatSaveAge(submissionUpdatedAt, nowMs);
  }, [isAutosaving, nowMs, submissionStatus, submissionUpdatedAt, submittedAt]);

  const syncChangeLog = useCallback((judgeId: string, companyId: string, categoryId: string, toValue: number | undefined) => {
    const key = `${companyId}:${categoryId}`;
    const baseline = baselineByJudge.current[judgeId] ?? {};
    const from = baseline[key] ?? null;
    const to = toValue ?? null;

    setChangeLog((prev) => {
      const remaining = (prev[judgeId] ?? []).filter(
        (change) => !(change.companyId === companyId && change.categoryId === categoryId),
      );
      if (from === to) {
        if (remaining.length === 0) {
          const next = { ...prev };
          delete next[judgeId];
          return next;
        }
        return { ...prev, [judgeId]: remaining };
      }
      return {
        ...prev,
        [judgeId]: [...remaining, { companyId, categoryId, from, to, changedAt: new Date().toISOString() }],
      };
    });
  }, []);

  const applyScoreValue = useCallback(
    (
      judgeId: string,
      companyId: string,
      categoryId: string,
      raw: string,
      recordUndo: boolean,
    ) => {
      const key = `${companyId}:${categoryId}`;
      const previous = scoresRef.current[key];

      if (raw === "") {
        if (recordUndo) {
          setUndoStack((prev) => [...prev, { companyId, categoryId, previous }]);
        }
        const next = { ...scoresRef.current };
        delete next[key];
        scoresRef.current = next;
        setScores(next);
        syncChangeLog(judgeId, companyId, categoryId, undefined);
        setMissingCells((prev) => {
          if (prev.some((cell) => cell.companyId === companyId && cell.categoryId === categoryId)) {
            return prev;
          }
          return [...prev, { companyId, categoryId }];
        });
        return true;
      }

      const numeric = Number(raw);
      if (!isScoreInRange(numeric)) return false;

      const normalized = normalizeScore(numeric);
      if (recordUndo) {
        setUndoStack((prev) => [...prev, { companyId, categoryId, previous }]);
      }
      const next = { ...scoresRef.current, [key]: normalized };
      scoresRef.current = next;
      setScores(next);
      syncChangeLog(judgeId, companyId, categoryId, normalized);
      setMissingCells((prev) =>
        prev.filter((cell) => !(cell.companyId === companyId && cell.categoryId === categoryId)),
      );
      return true;
    },
    [syncChangeLog],
  );

  function updateNote(companyId: string, body: string) {
    const next = { ...notesRef.current, [companyId]: body };
    notesRef.current = next;
    setNotes(next);
    scheduleAutosave();
  }

  function updateScore(companyId: string, categoryId: string, raw: string) {
    if (!selectedJudgeId) return;
    if (!applyScoreValue(selectedJudgeId, companyId, categoryId, raw, true)) return;
    scheduleAutosave();
  }

  function undoLastScore() {
    const last = undoStack[undoStack.length - 1];
    if (!last || !selectedJudgeId) return;
    setUndoStack((prev) => prev.slice(0, -1));
    applyScoreValue(
      selectedJudgeId,
      last.companyId,
      last.categoryId,
      last.previous === undefined ? "" : String(last.previous),
      false,
    );
    scheduleAutosave();
  }

  function submitScores(isFinal: boolean, skipConfirm = false) {
    if (isFinal) {
      void persistScores({ isFinal: true, skipConfirm });
      return;
    }
    void flushAutosave();
  }

  const deleteIndividualJudgeMessage = useCallback(async (judge: Judge) => {
    if (!judge) return;
    const response = await fetch(`/api/admin/judges/${judge.id}/message`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: null }),
    });
    if (!response.ok) {
      showToast("Unable to delete message.");
      return;
    }
    setData((prev) =>
      prev
        ? {
            ...prev,
            judges: prev.judges.map((item) => (item.id === judge.id ? { ...item, message: null } : item)),
          }
        : prev,
    );
  }, []);

  useEffect(() => {
    if (!selectedJudge?.message) return;
    const judge = selectedJudge;
    const timer = window.setTimeout(() => {
      void deleteIndividualJudgeMessage(judge);
    }, 60_000);
    return () => window.clearTimeout(timer);
  }, [selectedJudge, deleteIndividualJudgeMessage]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        void flushAutosave();
      }
    }

    function onPageHide() {
      if (isLoadingScoresRef.current) return;
      const judgeId = selectedJudgeIdRef.current;
      const competitionId = dataRef.current?.competition.id;
      const currentScores = scoresRef.current;
      const currentNotes = notesRef.current;
      if (!judgeId || !competitionId) return;
      const scoresChanged = scoresDifferFromBaseline(baselineByJudge.current[judgeId], currentScores);
      const notesChanged = notesDifferFromBaseline(notesBaselineByJudge.current[judgeId], currentNotes);
      if (submissionStatusRef.current === "FINAL") {
        if (!notesChanged) return;
        void persistScoresRef.current({
          isFinal: false,
          notesOnly: true,
          quiet: true,
          keepalive: true,
          judgeId,
          competitionId,
          notesSnapshot: currentNotes,
        });
        return;
      }
      if (!scoresChanged && !notesChanged) return;
      void persistScoresRef.current({
        isFinal: false,
        quiet: true,
        keepalive: true,
        judgeId,
        competitionId,
        scoresSnapshot: currentScores,
        notesSnapshot: currentNotes,
      });
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      cancelScheduledAutosave();
    };
  }, [cancelScheduledAutosave, flushAutosave]);

  return {
    data,
    selectedJudgeId,
    selectJudge,
    scores,
    notes,
    submissionStatus,
    submittedAt,
    submissionUpdatedAt,
    isSubmitting,
    isAutosaving,
    isLoadingScores,
    toasts,
    pendingConfirm,
    setPendingConfirm,
    changeLog,
    changeLogOpen,
    setChangeLogOpen,
    selectedJudge,
    totals,
    entryCount,
    missingCellKeys,
    hasChangeLog,
    canUndo: undoStack.length > 0,
    saveStatusLabel,
    updateScore,
    updateNote,
    undoLastScore,
    flushAutosave,
    submitScores,
    handleConfirmDialog,
    deleteIndividualJudgeMessage,
  };
}
