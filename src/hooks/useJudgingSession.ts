"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pruneScoresForCompetition } from "@/lib/competition-config";
import { formatScoreValue, formatTimestamp } from "@/lib/judging-format";
import { getMissingCells, isScoreInRange, normalizeScore } from "@/lib/scoring";
import type {
  ActiveCompetitionResponse,
  Judge,
  JudgeScoresResponse,
  PendingConfirm,
  ScoreChange,
  SubmissionStatus,
  Toast,
} from "@/types/judging";

export { formatScoreValue, formatTimestamp };

type UseJudgingSessionOptions = {
  lockedJudgeId?: string;
};

export function useJudgingSession(options?: UseJudgingSessionOptions) {
  const lockedJudgeId = options?.lockedJudgeId;
  const [data, setData] = useState<ActiveCompetitionResponse | null>(null);
  const [selectedJudgeId, setSelectedJudgeId] = useState<string>(lockedJudgeId ?? "");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submissionUpdatedAt, setSubmissionUpdatedAt] = useState<string | null>(null);
  const [missingCells, setMissingCells] = useState<Array<{ companyId: string; categoryId: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [changeLog, setChangeLog] = useState<Record<string, ScoreChange[]>>({});
  const [changeLogOpen, setChangeLogOpen] = useState(false);
  const nextToastId = useRef(0);
  const baselineByJudge = useRef<Record<string, Record<string, number>>>({});

  const showToast = useCallback((message: string) => {
    const id = nextToastId.current++;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const applyCompetitionPayload = useCallback(
    (payload: ActiveCompetitionResponse, options?: { isNewRound?: boolean; configUpdated?: boolean }) => {
      setData((prev) => {
        const competitionChanged = prev !== null && prev.competition.id !== payload.competition.id;
        if (competitionChanged || options?.isNewRound) {
          setScores({});
          setSubmissionStatus(null);
          setSubmittedAt(null);
          setSubmissionUpdatedAt(null);
          setMissingCells([]);
          setChangeLog({});
          baselineByJudge.current = {};
        }
        return payload;
      });

      if (options?.configUpdated) {
        setScores((currentScores) =>
          pruneScoresForCompetition(currentScores, payload.companies, payload.categories),
        );
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
    [lockedJudgeId],
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
        setScores(nextScores);
        baselineByJudge.current[selectedJudgeId] = { ...nextScores };
        setChangeLog((prev) => {
          const next = { ...prev };
          delete next[selectedJudgeId];
          return next;
        });
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
    const controller = new AbortController();
    loadSavedScores({ signal: controller.signal });
    return () => controller.abort();
  }, [data, selectedJudgeId, loadSavedScores]);

  const hasSavedScores = submissionStatus !== null;

  function restoreSavedDraft() {
    setPendingConfirm({ type: "restore-draft" });
  }

  function handleConfirmDialog() {
    if (!pendingConfirm) return;

    if (pendingConfirm.type === "restore-draft") {
      loadSavedScores({
        showErrorToast: true,
        successMessage:
          submissionStatus === "FINAL"
            ? "Restored saved draft into the form."
            : "Restored saved draft into the form.",
      });
    } else if (pendingConfirm.type === "submit-final") {
      void submitScores(true, true);
    }

    setPendingConfirm(null);
  }

  const selectedJudge = useMemo(
    () => data?.judges.find((judge) => judge.id === selectedJudgeId) ?? null,
    [data?.judges, selectedJudgeId],
  );

  const scoreLegend = "Scoring Range 1–5: 1: Weak, 2: Needs Improvement, 3: Competent, 4: Above Expectations, 5: Excellent";

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

  function updateScore(companyId: string, categoryId: string, raw: string) {
    if (!selectedJudgeId) return;
    const key = `${companyId}:${categoryId}`;

    if (raw === "") {
      setScores((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      syncChangeLog(selectedJudgeId, companyId, categoryId, undefined);
      setMissingCells((prev) => {
        if (prev.length === 0) return prev;
        if (prev.some((cell) => cell.companyId === companyId && cell.categoryId === categoryId)) {
          return prev;
        }
        return [...prev, { companyId, categoryId }];
      });
      return;
    }

    const numeric = Number(raw);
    if (!isScoreInRange(numeric)) return;

    const normalized = normalizeScore(numeric);
    setScores((prev) => ({ ...prev, [key]: normalized }));
    syncChangeLog(selectedJudgeId, companyId, categoryId, normalized);
    setMissingCells((prev) =>
      prev.filter((cell) => !(cell.companyId === companyId && cell.categoryId === categoryId)),
    );
  }

  async function submitScores(isFinal: boolean, skipConfirm = false) {
    if (!data || !selectedJudgeId) {
      return;
    }
    if (isFinal && !skipConfirm) {
      setPendingConfirm({ type: "submit-final" });
      return;
    }
    setIsSubmitting(true);
    setMissingCells([]);
    try {
      const entries = Object.entries(scores).map(([key, value]) => {
        const [companyId, categoryId] = key.split(":");
        return { companyId, categoryId, score: value };
      });
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: data.competition.id,
          judgeId: selectedJudgeId,
          isFinal,
          entries,
        }),
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
        const apiMissing = Array.isArray(payload.missingCells)
          ? payload.missingCells
          : getMissingCells(
              data.companies.map((company) => company.id),
              data.categories.map((category) => category.id),
              entries,
            );
        setMissingCells(apiMissing);
        showToast("All cells must be filled before final submission.");
        return;
      }
      if (isFinal) {
        showToast("Final scores submitted successfully.");
      } else {
        showToast("Draft saved successfully.");
      }
      setMissingCells([]);
      setSubmissionStatus(payload.status ?? null);
      setSubmittedAt(payload.submittedAt ?? null);
      setSubmissionUpdatedAt(payload.updatedAt ?? null);
      const savedScores: Record<string, number> = {};
      for (const entry of entries) {
        savedScores[`${entry.companyId}:${entry.categoryId}`] = entry.score;
      }
      baselineByJudge.current[selectedJudgeId] = savedScores;
      setChangeLog((prev) => {
        const next = { ...prev };
        delete next[selectedJudgeId];
        return next;
      });
    } finally {
      setIsSubmitting(false);
    }
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

  return {
    data,
    selectedJudgeId,
    setSelectedJudgeId,
    scores,
    submissionStatus,
    submittedAt,
    submissionUpdatedAt,
    isSubmitting,
    isLoadingScores,
    toasts,
    pendingConfirm,
    setPendingConfirm,
    changeLog,
    changeLogOpen,
    setChangeLogOpen,
    selectedJudge,
    scoreLegend,
    totals,
    entryCount,
    missingCellKeys,
    hasChangeLog,
    hasSavedScores,
    updateScore,
    restoreSavedDraft,
    submitScores,
    handleConfirmDialog,
    deleteIndividualJudgeMessage,
  };
}
