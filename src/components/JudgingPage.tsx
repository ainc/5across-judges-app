"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormDialog } from "@/components/FormDialog";
import { formatWeightedTotal } from "@/lib/judging-format";
import { formatScoreValue, formatTimestamp, useJudgingSession } from "@/hooks/useJudgingSession";
import CancelIcon from '@mui/icons-material/Cancel';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import { AppHeader } from "./admin/AppHeader";
import { AppSelect } from "@/components/AppSelect";
import { StyledTable, tdClass, thClass } from "@/components/StyledTable";

const COMPANY_STORAGE_PREFIX = "judging-selected-company:";

const CONFETTI_COLORS = ["#C01824", "#E4303C", "#D0D0D0", "#B41824", "#F0F0F0", "#FC3C48"];

type ConfettiPiece = {
  id: number;
  x: number;
  y: number;
  spin: number;
  delay: number;
  color: string;
  width: number;
  height: number;
  radius: string;
};

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: 52 }, (_, id) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 240 + Math.random() * 320;
    return {
      id,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      spin: (180 + Math.random() * 540) * (Math.random() < 0.5 ? -1 : 1),
      delay: Math.random() * 0.06,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ?? CONFETTI_COLORS[0],
      width: 16 + Math.random() * 14,
      height: 8 + Math.random() * 5,
      radius: `${6 + Math.random() * 8}px ${5 + Math.random() * 10}px ${5 + Math.random() * 8}px ${4 + Math.random() * 8}px`,
    };
  });
}

function ConfettiBurst({ pieces }: { pieces: ConfettiPiece[] }) {
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setBurst(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-ribbon"
          style={{
            backgroundColor: piece.color,
            width: piece.width,
            height: piece.height,
            borderRadius: piece.radius,
            transitionDelay: `${piece.delay}s`,
            transform: burst
              ? `translate(calc(-50% + ${piece.x}px), calc(-50% + ${piece.y}px)) rotate(${piece.spin}deg) scale(1)`
              : "translate(-50%, -50%) rotate(0deg) scale(0.25)",
          }}
        />
      ))}
    </div>
  );
}

function storedCompanyId(competitionId: string) {
  try {
    return window.localStorage.getItem(`${COMPANY_STORAGE_PREFIX}${competitionId}`) ?? "";
  } catch {
    return "";
  }
}

const SCORE_SCALE = [
  { value: 1, label: ["Weak"] },
  { value: 2, label: ["Needs", "Improvement"] },
  { value: 3, label: ["Competent"] },
  { value: 4, label: ["Above", "Expectations"] },
  { value: 5, label: ["Excellent"] },
] as const;

const SCORE_SCALE_WIDTH = 360;
const SCORE_SCALE_NUMBER_PAD = 32;
const SCORE_SCALE_LINE_PAD = 16;
const SCORE_SCALE_LINE_Y = 22;
const SCORE_SCALE_SPAN = SCORE_SCALE_WIDTH - SCORE_SCALE_NUMBER_PAD * 2;

function isIncompleteScoreInput(raw: string): boolean {
  return raw === "." || raw === "-" || raw === "-." || raw.endsWith(".");
}

function ScoreInput({
  value,
  disabled,
  isMissing,
  onValue,
  onBlur,
  onKeyDown,
}: {
  value: number | undefined;
  disabled: boolean;
  isMissing: boolean;
  onValue: (raw: string) => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <span className="relative inline-block">
      <input
        className={`score-input w-16 rounded border px-2 py-1 text-center disabled:bg-muted-bg ${
          isMissing ? "border-danger bg-danger-bg" : ""
        }`}
        min={1}
        max={5}
        step={0.5}
        type="number"
        title="Whole or half points from 1 to 5"
        disabled={disabled}
        placeholder=""
        value={draft ?? value ?? ""}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "" || (!isIncompleteScoreInput(raw) && Number.isFinite(Number(raw)))) {
            setDraft(null);
            onValue(raw);
            return;
          }
          setDraft(raw);
        }}
        onBlur={() => {
          if (draft !== null && Number.isFinite(Number(draft))) {
            onValue(draft);
          }
          setDraft(null);
          onBlur();
        }}
        onKeyDown={onKeyDown}
      />
      {isMissing ? (
        <Tooltip title="Fill in score (1-5) before submitting company scores." arrow>
          <button
            type="button"
            aria-label="Fill in score (1-5) before submitting company scores."
            className="absolute top-0.5 right-0.5 z-10 inline-flex h-4 w-4 items-center justify-center rounded-full text-muted hover:text-foreground"
          >
            <InfoOutlinedIcon sx={{ fontSize: 16 }} />
          </button>
        </Tooltip>
      ) : null}
    </span>
  );
}

function ScoreScaleGraphic() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setExpanded(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const lineLeft = `${(SCORE_SCALE_LINE_PAD / SCORE_SCALE_WIDTH) * 100}%`;
  const lineWidth = `${((SCORE_SCALE_WIDTH - SCORE_SCALE_LINE_PAD * 2) / SCORE_SCALE_WIDTH) * 100}%`;
  const lineTop = `${(SCORE_SCALE_LINE_Y / 68) * 100}%`;

  return (
    <div className="score-scale-graphic" style={{ position: "relative" }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: lineLeft,
          top: lineTop,
          width: lineWidth,
          height: 2.5,
          marginTop: -1.25,
          borderRadius: 999,
          background:
            "linear-gradient(to right, #F7AFB3 0%, #F7AFB3 5%, #F7AFB3 27%, #F4868D 50%, #F05E67 73%, #EC3641 95%, #EC3641 100%)",
          transformOrigin: "left",
          transform: expanded ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      <svg
        viewBox={`0 0 ${SCORE_SCALE_WIDTH} 68`}
        style={{ display: "block", width: "100%" }}
        role="img"
        aria-label="Scoring range 1 to 5: 1 Weak, 2 Needs Improvement, 3 Competent, 4 Above Expectations, 5 Excellent"
      >
        {SCORE_SCALE.map((point, index) => {
          const x = SCORE_SCALE_NUMBER_PAD + (SCORE_SCALE_SPAN * index) / (SCORE_SCALE.length - 1);
          return (
            <g key={point.value}>
              <text
                x={x}
                y={SCORE_SCALE_LINE_Y - 8}
                textAnchor="middle"
                fill="currentColor"
                fontSize="10"
                fontWeight="400"
              >
                {point.value}
              </text>
              <text x={x} y={SCORE_SCALE_LINE_Y + 16} textAnchor="middle" fill="var(--muted)" fontSize="8">
                {point.label.map((line, lineIndex) => (
                  <tspan key={line} x={x} dy={lineIndex === 0 ? 0 : 10}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

type JudgingPageProps = {
  lockedJudgeId?: string;
  showAdminLink?: boolean;
};

export function JudgingPage({ lockedJudgeId, showAdminLink = false }: JudgingPageProps) {
  const isAdmin = showAdminLink;
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [flight, setFlight] = useState<{
    companyId: string;
    phase: "center" | "fly";
    left: number;
    top: number;
    width: number;
    height: number;
    animate: boolean;
  } | null>(null);
  const [addedSubmittedIds, setAddedSubmittedIds] = useState<string[]>([]);
  const flightTimers = useRef<number[]>([]);
  const centerUnicornRef = useRef<HTMLImageElement>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [scoringGuideOpen, setScoringGuideOpen] = useState(false);
  const scoreTableRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef(new Map<string, HTMLDivElement>());

  function onColumnTab(
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    selector: string,
  ) {
    if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
    const fields = [
      ...(scoreTableRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector) ?? []),
    ];
    const index = fields.indexOf(event.currentTarget);
    if (index < 0 || fields.length === 0) return;
    if (event.shiftKey) {
      if (index === 0) return;
      event.preventDefault();
      fields[index - 1]?.focus();
      return;
    }
    event.preventDefault();
    fields[(index + 1) % fields.length]?.focus();
  }
  const [restoredCompetitionId, setRestoredCompetitionId] = useState("");
  const canEditScores = !isAdmin || overrideEnabled;
  const {

    data,
    selectedJudgeId,
    selectJudge,
    scores,
    notes,
    isSubmitting,
    isLoadingScores,
    toasts,
    pendingConfirm,
    setPendingConfirm,
    changeLog,
    changeLogOpen,
    setChangeLogOpen,
    selectedJudge,
    totals,
    missingCellKeys,
    hasChangeLog,
    canUndo,
    saveStatusForCompany,
    updateScore,
    resetCompanyScores,
    updateNote,
    undoLastScore,
    flushAutosave,
    submitCompanyScores,
    handleConfirmDialog,
    deleteIndividualJudgeMessage,
    submittedCompanyIds,
  } = useJudgingSession({ lockedJudgeId });

  useEffect(() => {
    if (!data || restoredCompetitionId === data.competition.id) return;
    const stored = storedCompanyId(data.competition.id);
    const match = data.companies.some((company) => company.id === stored);
    setSelectedCompanyId(match ? stored : "");
    setRestoredCompetitionId(data.competition.id);
  }, [data, restoredCompetitionId]);

  function clearFlightTimers() {
    for (const id of flightTimers.current) window.clearTimeout(id);
    flightTimers.current = [];
  }

  useEffect(() => {
    return () => {
      for (const id of flightTimers.current) window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    clearFlightTimers();
    setFlight(null);
    setConfetti([]);
    setAddedSubmittedIds([]);
  }, [selectedJudgeId]);

  const submittedIds = [
    ...submittedCompanyIds,
    ...addedSubmittedIds.filter((companyId) => !submittedCompanyIds.includes(companyId)),
  ];

  useEffect(() => {
    if (!flight || flight.phase !== "fly" || flight.animate) return;
    let frame = 0;
    frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => {
        const slot = slotRefs.current.get(flight.companyId);
        const rect = slot?.getBoundingClientRect();
        if (!rect || rect.width === 0) {
          setFlight(null);
          setConfetti([]);
          return;
        }
        setFlight({
          companyId: flight.companyId,
          phase: "fly",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          animate: true,
        });
        const landTimer = window.setTimeout(() => {
          setFlight(null);
          setConfetti([]);
        }, 750);
        flightTimers.current.push(landTimer);
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [flight]);

  function celebrateSubmit(companyId: string) {
    clearFlightTimers();
    setConfetti(makeConfetti());
    setFlight({
      companyId,
      phase: "center",
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      animate: false,
    });
    const moveTimer = window.setTimeout(() => {
      const rect = centerUnicornRef.current?.getBoundingClientRect();
      setAddedSubmittedIds((prev) => (prev.includes(companyId) ? prev : [...prev, companyId]));
      if (!rect || rect.width === 0) {
        setFlight(null);
        setConfetti([]);
        return;
      }
      setFlight({
        companyId,
        phase: "fly",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        animate: false,
      });
    }, 900);
    flightTimers.current.push(moveTimer);
  }

  useEffect(() => {
    if (!data || restoredCompetitionId !== data.competition.id || !selectedCompanyId) return;
    try {
      window.localStorage.setItem(`${COMPANY_STORAGE_PREFIX}${data.competition.id}`, selectedCompanyId);
    } catch {
      // Storage can be unavailable in private browsing.
    }
  }, [data, restoredCompetitionId, selectedCompanyId]);

  if (!data || restoredCompetitionId !== data.competition.id) {
    return <main className="p-6"></main>;
  }

  const selectedId =
    selectedCompanyId && data.companies.some((company) => company.id === selectedCompanyId)
      ? selectedCompanyId
      : data.companies[0]?.id ?? "";
  const visibleCompanies = data.companies.filter((company) => company.id === selectedId);
  const selectedCompany = data.companies.find((company) => company.id === selectedId);
  const saveStatusLabel = saveStatusForCompany(selectedId);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader showAdminLink={isAdmin} judgeName={isAdmin ? undefined : selectedJudge?.name} className="mb-6 shrink-0" />
      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-6 pb-3">

      {selectedJudge?.message && (
        <section className="rounded border border-[#DF666A] bg-[#DF666A] p-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-semibold">Message for {selectedJudge.name}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{selectedJudge.message}</p>
            </div>
            <button
              type="button"
              onClick={() => void deleteIndividualJudgeMessage(selectedJudge)}
              className="closebutton"
            >
              <div className="close-container">
                <CancelIcon className="closebutton" fontSize="inherit" />
                <CancelOutlinedIcon className="grayclosebutton" fontSize="inherit" />
              </div>
            </button>
          </div>
        </section>
      )}
      {isAdmin ? (
        <section className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOverrideEnabled((on) => !on)}
            className="dark-button h-8 rounded border border-border bg-gray-900 px-3 py-1 text-white"
          >
            {overrideEnabled ? "Override On" : "Override"}
          </button>
          <AppSelect
            aria-label="Judge"
            className="h-8 rounded border px-2 py-1"
            value={selectedJudgeId}
            onChange={(event) => {
              setOverrideEnabled(false);
              selectJudge(event.target.value);
            }}
          >
            {data.judges.map((judge) => (
              <option key={judge.id} value={judge.id}>
                {judge.name}
              </option>
            ))}
          </AppSelect>
        </section>
      ) : null}

      {selectedCompany ? (
        <h2 className="shrink-0 text-left text-4xl font-bold leading-tight text-[#4b5563]">{selectedCompany.name}</h2>
      ) : null}

      <div className="flex min-h-0 flex-1 items-start gap-6" ref={scoreTableRef}>
      <StyledTable className="h-full min-w-0 flex-1" tableClassName="table-fixed">
          <colgroup>
            <col className="w-[46%]" />
            <col className="w-[34%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead className="sticky top-0 bg-background">
            <tr>
              <th className={`${thClass} sticky left-0 w-[46%] bg-background`}>
                <span className="flex items-baseline justify-between gap-2">
                  <span>Category</span>
                  <span className="flex items-baseline gap-3">
                    {saveStatusLabel ? (
                      <span className="text-xs font-normal text-muted">{saveStatusLabel}</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setScoringGuideOpen(true)}
                      className="text-sm font-normal text-foreground underline"
                    >
                      Scoring Guide
                    </button>
                  </span>
                </span>
              </th>
              {visibleCompanies.map((company) => (
                <th key={company.id} className={`${thClass} w-[34%] bg-background`}>
                  Scores
                </th>
              ))}
              <th className={`${thClass} w-[20%] bg-background`}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.categories.map((category) => (
              <tr key={category.id} className="h-px">
                <td className={`${tdClass} sticky left-0 bg-background text-medium`}>
                  <span className="inline-flex items-center gap-1">
                    {category.name}
                    {category.description?.trim() ? (
                      <Tooltip title={category.description} arrow>
                        <button
                          type="button"
                          aria-label={`Full description: ${category.description}`}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted hover:text-foreground"
                        >
                          <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                        </button>
                      </Tooltip>
                    ) : null}
                    <span className="text-sm font-medium text-muted">({category.weight}%)</span>
                  </span>
                </td>
                {visibleCompanies.map((company) => {
                  const key = `${company.id}:${category.id}`;
                  const isMissing = missingCellKeys.has(key);
                  return (
                    <td key={key} className={`${tdClass} p-1 text-center ${isMissing ? "bg-danger-bg" : ""}`}>
                      <ScoreInput
                        value={scores[key]}
                        disabled={isLoadingScores || !canEditScores}
                        isMissing={isMissing}
                        onValue={(raw) => updateScore(company.id, category.id, raw)}
                        onBlur={() => {
                          void flushAutosave();
                        }}
                        onKeyDown={(event) => onColumnTab(event, "input.score-input:not(:disabled)")}
                      />
                    </td>
                  );
                })}
                {visibleCompanies.map((company) => (
                  <td key={`${company.id}:${category.id}:note`} className={`${tdClass} h-px p-1 align-top`}>
                    <textarea
                      aria-label={`Notes for ${category.name}`}
                      className="note-input block h-full w-full resize-none rounded border px-2 py-1 text-sm"
                      rows={1}
                      disabled={isLoadingScores || !canEditScores}
                      value={notes[`${company.id}:${category.id}`] ?? ""}
                      onChange={(event) => updateNote(company.id, category.id, event.target.value)}
                      onBlur={() => {
                        void flushAutosave();
                      }}
                      onKeyDown={(event) => onColumnTab(event, "textarea.note-input:not(:disabled)")}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
      </StyledTable>
      <aside className="flex max-h-full w-[calc((100%-1.5rem)/3)] shrink-0 flex-col items-start overflow-y-auto pt-3 text-left">
        <p className="flex items-baseline whitespace-nowrap">
          <span className="text-8xl font-bold leading-none text-[#4b5563] tabular-nums">
            {formatWeightedTotal(totals[selectedId] ?? 0)}
          </span>
          <span className="ml-1 text-3xl font-bold text-[#9aa1ab]">/5</span>
        </p>
        <p className="mt-3 text-sm font-semibold">Weighted Total</p>
        <button
          type="button"
          disabled={isSubmitting || isLoadingScores || !canEditScores}
          onClick={() => submitCompanyScores(selectedId)}
          className="mt-4 w-full rounded border-0 px-3 py-2 text-black disabled:opacity-50"
          style={{ backgroundColor: "#EC3641", color: "#000000" }}
        >
          Submit Company Scores
        </button>
        <div className="mt-2 flex w-full items-baseline justify-between text-sm">
          <button type="button" onClick={() => setChangeLogOpen(true)} className="text-foreground underline">
            Change History
          </button>
          <button
            type="button"
            disabled={
              isSubmitting ||
              isLoadingScores ||
              !canEditScores ||
              !data.categories.some((category) => typeof scores[`${selectedId}:${category.id}`] === "number")
            }
            onClick={() => resetCompanyScores(selectedId)}
            className="underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset Scores
          </button>
        </div>
        <div className="mt-4 flex w-full items-stretch gap-2">
          {data.companies.map((company, index) => {
            const selected = company.id === selectedId;
            const submitted = submittedIds.includes(company.id);
            const isLanding = flight?.companyId === company.id;
            return (
              <button
                key={company.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedCompanyId(company.id)}
                className={`flex min-h-40 min-w-0 flex-1 flex-col items-center justify-start gap-1 rounded-lg px-1.5 py-3 text-center text-xs ${
                  selected ? "bg-[#4b5563] text-white" : "bg-[#e5e7eb] text-[#111827]"
                }`}
              >
                <span className="block font-semibold">Pitch {index + 1}</span>
                <span className="block break-words">{company.name}</span>
                <span className="mt-auto flex w-full flex-col items-center gap-1">
                  <div
                    ref={(node) => {
                      if (node) slotRefs.current.set(company.id, node);
                      else slotRefs.current.delete(company.id);
                    }}
                    className="flex h-12 w-full items-end justify-center"
                  >
                    {submitted ? (
                      <img
                        src="/images/unicorn.png"
                        alt=""
                        className={`h-12 w-12 max-w-full object-contain ${isLanding ? "opacity-0" : ""}`}
                      />
                    ) : null}
                  </div>
                  <span className="block leading-tight">{submitted ? "Submitted" : "Not submitted"}</span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
      </div>

      <section className="flex shrink-0 flex-wrap items-center gap-3">
        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting || isLoadingScores || !canUndo || !canEditScores}
            onClick={undoLastScore}
            className="white-button rounded border border-border bg-surface px-3 py-2 text-foreground disabled:opacity-50"
          >
            Undo
          </button>
        </div>
      </section>

      <FormDialog
        open={scoringGuideOpen}
        title="Scoring Guide"
        titleId="scoring-guide-title"
        onClose={() => setScoringGuideOpen(false)}
        panelClassName="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <ScoreScaleGraphic />
        <p className="pt-4 text-sm">
          Score each category from 1 to 5. Whole numbers and half points are allowed (for example, 3 or 3.5). See the scoring categories, weights, and descriptions below.
        </p>
        <ul className="space-y-3">
          {data.categories.map((category) => (
            <li key={category.id}>
              <p className="font-medium">
                {category.name}{" "}
                <span className="text-sm font-medium text-muted">({category.weight}%)</span>
              </p>
              {category.description?.trim() ? (
                <p className="text-sm text-muted">{category.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </FormDialog>
      <FormDialog
        open={changeLogOpen}
        title="Change History Log"
        onClose={() => setChangeLogOpen(false)}
        panelClassName="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <p className="text-sm text-muted">Unsaved edits of <strong>{selectedJudge?.name}'s</strong> most recent saved draft or final submission.</p>
        {!hasChangeLog ? (
          <p className="text-sm text-muted">No unsaved changes.</p>
        ) : (
          <>
            {data.judges.map((judge) => {
              const changes = changeLog[judge.id];
              if (!changes?.length) return null;
              return (
                <div key={judge.id} className="space-y-1">
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                    {changes.map((change) => {
                      const companyName =
                        data.companies.find((company) => company.id === change.companyId)?.name ?? change.companyId;
                      const categoryName =
                        data.categories.find((category) => category.id === change.categoryId)?.name ??
                        change.categoryId;
                      return (
                        <li key={`${change.companyId}:${change.categoryId}`}>
                          <strong>{companyName}</strong> · {categoryName}: <strong>{formatScoreValue(change.from)} → {formatScoreValue(change.to)}</strong>
                          <br /><i>{change.changedAt ? `${formatTimestamp(change.changedAt)}` : ""} · <span className="text-sm font-medium not-italic">Changed By: <strong>{isAdmin ? "Admin" : judge.name}</strong></span></i>
                          <hr />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </>
        )}
      </FormDialog>
      <ConfirmDialog
        open={pendingConfirm?.type === "submit-company"}
        title="Submit Company Scores?"
        message={(() => {
          const company = data.companies.find((item) => item.id === pendingConfirm?.companyId);
          const pitch = company ? data.companies.findIndex((item) => item.id === company.id) + 1 : 0;
          const label = company ? `Pitch ${pitch} - ${company.name}` : "this company";
          return (
            <>
              {`Submit scores for ${label}.`}
              {"\n"}
              <span className="text-xs">
                Submitted scores appear in Current Results. Scores can still be edited and resubmitted from the Scoring page.
              </span>
            </>
          );
        })()}
        confirmLabel="Submit"
        onConfirm={() => {
          void handleConfirmDialog().then((companyId) => {
            if (!companyId) return;
            celebrateSubmit(companyId);
            const index = data.companies.findIndex((company) => company.id === companyId);
            const next = data.companies[index + 1];
            if (next) setSelectedCompanyId(next.id);
          });
        }}
        onCancel={() => setPendingConfirm(null)}
      />
      {flight || confetti.length > 0
        ? createPortal(
            <div className="pointer-events-none fixed inset-0 z-[2000]">
              {confetti.length > 0 ? <ConfettiBurst pieces={confetti} /> : null}
              {flight?.phase === "center" ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    ref={centerUnicornRef}
                    src="/images/unicorn.png"
                    alt=""
                    className="unicorn-flash w-[min(22rem,70vw)] max-w-full"
                  />
                </div>
              ) : null}
              {flight?.phase === "fly" ? (
                <img
                  src="/images/unicorn.png"
                  alt=""
                  className={`unicorn-flight ${flight.animate ? "is-moving" : ""}`}
                  style={{
                    left: flight.left,
                    top: flight.top,
                    width: flight.width,
                    height: flight.height,
                  }}
                />
              ) : null}
            </div>,
            document.body,
          )
        : null}
      </main>
    </div>
  );
}
