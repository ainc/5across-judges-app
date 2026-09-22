"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormDialog } from "@/components/FormDialog";
import { firstPhrase } from "@/lib/judging-format";
import { formatScoreValue, formatTimestamp, useJudgingSession } from "@/hooks/useJudgingSession";
import CancelIcon from '@mui/icons-material/Cancel';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import { AppHeader } from "./admin/AppHeader";
import { StyledTable, tdClass, thClass } from "@/components/StyledTable";

const SCORE_SCALE = [
  { value: 1, label: ["Weak"] },
  { value: 2, label: ["Needs", "Improvement"] },
  { value: 3, label: ["Competent"] },
  { value: 4, label: ["Above", "Expectations"] },
  { value: 5, label: ["Excellent"] },
] as const;

const SCORE_SCALE_WIDTH = 192;
const SCORE_SCALE_PAD = 16;
const SCORE_SCALE_LINE_Y = 10;
const SCORE_SCALE_SPAN = SCORE_SCALE_WIDTH - SCORE_SCALE_PAD * 2;

function ScoreScaleGraphic() {
  return (
    <svg
      className="score-scale-graphic"
      viewBox={`0 0 ${SCORE_SCALE_WIDTH} 42`}
      role="img"
      aria-label="Scoring range 1 to 5: 1 Weak, 2 Needs Improvement, 3 Competent, 4 Above Expectations, 5 Excellent"
    >
      <line
        x1={SCORE_SCALE_PAD}
        y1={SCORE_SCALE_LINE_Y}
        x2={SCORE_SCALE_WIDTH - SCORE_SCALE_PAD}
        y2={SCORE_SCALE_LINE_Y}
        stroke="#ee2524"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {SCORE_SCALE.map((point, index) => {
        const x = SCORE_SCALE_PAD + (SCORE_SCALE_SPAN * index) / (SCORE_SCALE.length - 1);
        return (
          <g key={point.value}>
            <circle cx={x} cy={SCORE_SCALE_LINE_Y} r="5" fill="#ee2524" />
            <text
              x={x}
              y={SCORE_SCALE_LINE_Y + 2.5}
              textAnchor="middle"
              fill="#fff"
              fontSize="6"
              fontWeight="700"
            >
              {point.value}
            </text>
            <text x={x} y={SCORE_SCALE_LINE_Y + 13} textAnchor="middle" fill="#323232" fontSize="5.5">
              {point.label.map((line, lineIndex) => (
                <tspan key={line} x={x} dy={lineIndex === 0 ? 0 : 6.5}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
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
  const canEditScores = !isAdmin || overrideEnabled;
  const {

    data,
    selectedJudgeId,
    selectJudge,
    scores,
    notes,
    submissionStatus,
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
    entryCount,
    missingCellKeys,
    hasChangeLog,
    canUndo,
    saveStatusLabel,
    updateScore,
    updateNote,
    undoLastScore,
    flushAutosave,
    submitScores,
    handleConfirmDialog,
    deleteIndividualJudgeMessage,
  } = useJudgingSession({ lockedJudgeId });

  if (!data) {
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
        <h1 className="text-2xl font-semibold">Judge's Scoring Homepage</h1>
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
          <span className="font-medium">{isAdmin ? "Editing Judge:" : ""}</span>
          {isAdmin ? (
            <>
              <select
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
                    {judge.code ? ` (${judge.code})` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setOverrideEnabled((on) => !on)}
                className="dark-button h-8 rounded border border-black bg-gray-900 px-3 py-1 text-white"
              >
                {overrideEnabled ? "Override On" : "Override"}
              </button>
            </>
          ) : (
            <span>
              {selectedJudge?.name}
              {selectedJudge?.code ? ` (${selectedJudge.code})` : ""}
            </span>
          )}
          {submissionStatus === "FINAL" ? (
            <span className="inline-flex h-8 rounded border border-green-900 bg-green-100 px-2 py-1 text-sm font-medium text-green-900">
              {saveStatusLabel}
            </span>
          ) : submissionStatus === "DRAFT" || saveStatusLabel === "Saving..." ? (
            <span className="inline-flex h-8 rounded border border-amber-900 bg-amber-100 px-2 py-1 text-sm font-medium text-amber-900">
              {saveStatusLabel}
            </span>
          ) : (
            <span className="inline-flex h-8 rounded border border-gray-400 bg-gray-100 px-2 py-1 text-sm text-gray-600">
              {saveStatusLabel}
            </span>
          )}
          <div className="ml-auto shrink-0">
            <button
              type="button"
              onClick={() => setChangeLogOpen(true)}
              className="dark-button rounded border border-black bg-gray-900 px-3 py-1 text-white"
            >
              View Change History
            </button>
          </div>
        </section>
      </div>

      <ScoreScaleGraphic />

      <StyledTable>
          <thead className="sticky top-0 bg-white">
            <tr>
              <th className={`${thClass} sticky left-0 bg-white`}>Category</th>
              {visibleCompanies.map((company) => (
                <th key={company.id} className={`${thClass} min-w-40`}>
                  <select
                    aria-label="Company"
                    value={selectedId}
                    onChange={(event) => setSelectedCompanyId(event.target.value)}
                    className="w-full rounded border bg-white p-1 font-semibold"
                  >
                    {data.companies.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.categories.map((category) => (
              <tr key={category.id}>
                <td className={`${tdClass} sticky left-0 bg-white text-medium`}>
                  <span className="inline-flex items-center gap-1">
                    {firstPhrase(category.name)}
                    <Tooltip title={category.name} arrow>
                      <button
                        type="button"
                        aria-label={`Full description: ${category.name}`}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-500 hover:text-gray-800"
                      >
                        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                      </button>
                    </Tooltip>
                    <span className="text-sm font-medium text-gray-600">({category.weight}%)</span>
                  </span>
                </td>
                {visibleCompanies.map((company) => {
                  const key = `${company.id}:${category.id}`;
                  const isMissing = missingCellKeys.has(key);
                  return (
                    <td key={key} className={`${tdClass} p-1 text-center ${isMissing ? "bg-red-50" : ""}`}>
                      <input
                        className={`score-input w-16 rounded border px-2 py-1 text-center disabled:bg-gray-50 ${
                          isMissing ? "border-red-500 bg-red-100" : ""
                        }`}
                        min={1}
                        max={5}
                        step={0.1}
                        type="number"
                        disabled={isLoadingScores || !canEditScores}
                        placeholder=""
                        value={scores[key] ?? ""}
                        onChange={(event) => {
                          updateScore(company.id, category.id, event.target.value);
                        }}
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
                    {hasScores ? totals[company.id]?.toFixed(1) ?? "0.0" : ""}
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
              className="mt-1 w-full rounded border p-2"
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
        <button
          type="button"
          disabled={isSubmitting || isLoadingScores || !canUndo || !canEditScores}
          onClick={undoLastScore}
          className="white-button rounded border border-black bg-white text-black px-3 py-2 disabled:opacity-50"
        >
          Undo
        </button>
        <button
          disabled={isSubmitting || isLoadingScores || !canEditScores}
          onClick={() => submitScores(true)}
          className="dark-button rounded border border-black bg-gray-900 px-3 py-2 text-white disabled:opacity-50"
        >
          Submit Final Scores
        </button>
        <p className="text-sm text-gray-600">
          {Object.keys(scores).length}/{entryCount} cells scored
        </p>
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
        open={pendingConfirm?.type === "submit-final"}
        title="Submit Final Scores?"
        message={
          "These can be revised at any time by simply re-submitting with updated scores.\n\nCurrently submitted scores can be viewed in 'Current Results'."
        }
        confirmLabel="Submit"
        onConfirm={handleConfirmDialog}
        onCancel={() => setPendingConfirm(null)}
      />
      </main>
    </>
  );
}
