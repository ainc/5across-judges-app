"use client";

import { useEffect, useState } from "react";
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
}: {
  value: number | undefined;
  disabled: boolean;
  isMissing: boolean;
  onValue: (raw: string) => void;
  onBlur: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      className={`score-input w-16 rounded border px-2 py-1 text-center disabled:bg-gray-50 ${
        isMissing ? "border-red-500 bg-red-100" : ""
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
    />
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
          width: expanded ? lineWidth : 0,
          height: 2.5,
          marginTop: -1.25,
          borderRadius: 999,
          background: "#ee2524",
          transformOrigin: "left",
          transition: "width 0.85s cubic-bezier(0.22, 1, 0.36, 1)",
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
                fill="#ee2524"
                fontSize="11"
                fontWeight="700"
              >
                {point.value}
              </text>
              <text x={x} y={SCORE_SCALE_LINE_Y + 16} textAnchor="middle" fill="#323232" fontSize="8">
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
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
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
    saveStatusLabel,
    updateScore,
    updateNote,
    undoLastScore,
    flushAutosave,
    submitCompanyScores,
    handleConfirmDialog,
    deleteIndividualJudgeMessage,
  } = useJudgingSession({ lockedJudgeId });

  useEffect(() => {
    if (!data || restoredCompetitionId === data.competition.id) return;
    const stored = storedCompanyId(data.competition.id);
    const match = data.companies.some((company) => company.id === stored);
    setSelectedCompanyId(match ? stored : "");
    setRestoredCompetitionId(data.competition.id);
  }, [data, restoredCompetitionId]);

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

  return (
    <>
      <AppHeader showAdminLink={isAdmin}>
        <h1>Judge's Scoring Homepage</h1>
      </AppHeader>
      <main className="space-y-4 px-6 pb-6">

      {selectedJudge?.message && (
        <section className="rounded border border-blue-300 bg-blue-50 p-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">Message for {selectedJudge.name}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-blue-950">{selectedJudge.message}</p>
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
      <div className="space-y-2">
        <section className="flex flex-wrap items-center gap-3">
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => setOverrideEnabled((on) => !on)}
                className="dark-button h-8 rounded border border-black bg-gray-900 px-3 py-1 text-white"
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
            </>
          ) : (
            <span>{selectedJudge?.name}</span>
          )}
          <span className="text-sm text-gray-600">
            {saveStatusLabel}
          </span>
        </section>
      </div>

      <ScoreScaleGraphic />

      <StyledTable>
          <thead className="sticky top-0 bg-white">
            <tr>
              <th className={`${thClass} sticky left-0 bg-white`}>Category</th>
              {visibleCompanies.map((company) => (
                <th key={company.id} className={`${thClass} min-w-40`}>
                  <AppSelect
                    aria-label="Company"
                    value={selectedId}
                    onChange={(event) => setSelectedCompanyId(event.target.value)}
                    className="w-full rounded border bg-white p-1 font-semibold"
                  >
                    {data.companies.map((option, index) => (
                      <option key={option.id} value={option.id}>
                        Pitch {index + 1} - {option.name}
                      </option>
                    ))}
                  </AppSelect>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.categories.map((category) => (
              <tr key={category.id}>
                <td className={`${tdClass} sticky left-0 bg-white text-medium`}>
                  <span className="inline-flex items-center gap-1">
                    {category.name}
                    {category.description?.trim() ? (
                      <Tooltip title={category.description} arrow>
                        <button
                          type="button"
                          aria-label={`Full description: ${category.description}`}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-500 hover:text-gray-800"
                        >
                          <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                        </button>
                      </Tooltip>
                    ) : null}
                    <span className="text-sm font-medium text-gray-600">({category.weight}%)</span>
                  </span>
                </td>
                {visibleCompanies.map((company) => {
                  const key = `${company.id}:${category.id}`;
                  const isMissing = missingCellKeys.has(key);
                  return (
                    <td key={key} className={`${tdClass} p-1 text-center ${isMissing ? "bg-red-50" : ""}`}>
                      <ScoreInput
                        value={scores[key]}
                        disabled={isLoadingScores || !canEditScores}
                        isMissing={isMissing}
                        onValue={(raw) => updateScore(company.id, category.id, raw)}
                        onBlur={() => {
                          void flushAutosave();
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className={`${tdClass} sticky left-0 bg-gray-50 font-semibold`}>Weighted Total</td>
              {visibleCompanies.map((company) => {
                const hasScores = data.categories.some(
                  (category) => typeof scores[`${company.id}:${category.id}`] === "number",
                );
                return (
                  <td key={company.id} className={`${tdClass} text-center font-semibold`}>
                    {hasScores ? formatWeightedTotal(totals[company.id] ?? 0) : ""}
                  </td>
                );
              })}
            </tr>
          </tbody>
      </StyledTable>

      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="text-lg font-semibold">Notes</h2>
        {visibleCompanies.map((company) => (
          <label key={company.id} className="block text-sm">
            {company.name}
            <textarea
              className="mt-1 w-full resize-none rounded border p-2 [field-sizing:fixed]"
              rows={3}
              disabled={isLoadingScores || !canEditScores}
              value={notes[company.id] ?? ""}
              onChange={(event) => updateNote(company.id, event.target.value)}
              onBlur={() => {
                void flushAutosave();
              }}
            />
          </label>
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-3">
        {isAdmin ? (
          <button
            type="button"
            onClick={() => setChangeLogOpen(true)}
            className="dark-button rounded border border-black bg-gray-900 px-3 py-2 text-white"
          >
            View Change History
          </button>
        ) : null}
        <button
          disabled={isSubmitting || isLoadingScores || !canEditScores}
          onClick={() => submitCompanyScores(selectedId)}
          className="dark-button rounded border border-black bg-gray-900 px-3 py-2 text-white disabled:opacity-50"
        >
          Submit Company Scores
        </button>
        <button
          type="button"
          disabled={isSubmitting || isLoadingScores || !canUndo || !canEditScores}
          onClick={undoLastScore}
          className="white-button rounded border border-black bg-white text-black px-3 py-2 disabled:opacity-50"
        >
          Undo
        </button>
      </section>

      <FormDialog
        open={changeLogOpen}
        title="Change History Log"
        onClose={() => setChangeLogOpen(false)}
        panelClassName="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <p className="text-sm text-gray-600">Unsaved edits of <strong>{selectedJudge?.name}'s</strong> most recent saved draft or final submission.</p>
        {!hasChangeLog ? (
          <p className="text-sm text-gray-600">No unsaved changes.</p>
        ) : (
          <>
            {data.judges.map((judge) => {
              const changes = changeLog[judge.id];
              if (!changes?.length) return null;
              return (
                <div key={judge.id} className="space-y-1">
                  <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
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
          return `Submit scores for ${label}. Every category needs a score. Submitted scores appear in Current Results. Later edits stay saved on this sheet, and Current Results updates when you submit this company again.`;
        })()}
        confirmLabel="Submit"
        onConfirm={() => {
          void handleConfirmDialog().then((companyId) => {
            if (!companyId) return;
            const index = data.companies.findIndex((company) => company.id === companyId);
            const next = data.companies[index + 1];
            if (next) setSelectedCompanyId(next.id);
          });
        }}
        onCancel={() => setPendingConfirm(null)}
      />
      </main>
    </>
  );
}
