"use client";

import Link from "next/link";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormDialog } from "@/components/FormDialog";
import { SignOutButton } from "@/components/SignOutButton";
import { formatScoreValue, formatTimestamp, useJudgingSession } from "@/hooks/useJudgingSession";
import CancelIcon from '@mui/icons-material/Cancel';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

type JudgingPageProps = {
  lockedJudgeId?: string;
  showAdminLink?: boolean;
};

export function JudgingPage({ lockedJudgeId, showAdminLink = false }: JudgingPageProps) {
  const isAdmin = showAdminLink;
  const {

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
  } = useJudgingSession({ lockedJudgeId });

  if (!data) {
    return <main className="p-6"></main>;
  }

  return (
    <main className="p-6 space-y-4">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div id="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className="toast">
              {toast.message}
            </div>
          ))}
        </div>
        <div>
          <p className="text-sm text-gray-600">Awesome Inc</p>
          <h1 className="text-2xl font-semibold">{data.competition.name}</h1>
          <p className="text-sm text-gray-600">Judge Scoring Homepage</p>
        </div>
        <img
          src="/images/5acrossbanner.png"
          alt="5 Across Banner"
          className="fiveacross-banner justify-self-center"
        />
        <div className="w-48 flex flex-col items-end gap-2 justify-self-end">
          {showAdminLink ? (
            <Link href="/admin" className="underline">
              Admin Dashboard
            </Link>
          ) : null}
          <Link href="/results" className="underline">
            Current Results
          </Link>
          <SignOutButton />
        </div>
      </header>

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
            <span className="inline-flex h-8 rounded border border-green-900 bg-green-100 px-3 py-1 text-medium font-medium text-green-900">
              Admin
            </span>
          ) : null}
          <span className="font-medium">{isAdmin ? "Editing Judge:" : "Judge:"}</span>
          {isAdmin ? (
            <select
              className="h-8 rounded border px-2 py-1"
              value={selectedJudgeId}
              onChange={(event) => setSelectedJudgeId(event.target.value)}
            >
              {data.judges.map((judge) => (
                <option key={judge.id} value={judge.id}>
                  {judge.name}
                  {judge.code ? ` (${judge.code})` : ""}
                </option>
              ))}
            </select>
          ) : (
            <span>
              {selectedJudge?.name}
              {selectedJudge?.code ? ` (${selectedJudge.code})` : ""}
            </span>
          )}
          {submissionStatus === "FINAL" ? (
            <span className="inline-flex h-8 rounded border border-green-900 bg-green-100 px-2 py-1 text-sm font-medium text-green-900">
              Final scores submitted at: {submittedAt ? `${formatTimestamp(submittedAt)}` : ""}
            </span>
          ) : submissionStatus === "DRAFT" ? (
            <span className="inline-flex h-8 rounded border border-amber-900 bg-amber-100 px-2 py-1 text-sm font-medium text-amber-900">
              Draft{submissionUpdatedAt ? ` last saved at: ${formatTimestamp(submissionUpdatedAt)}` : ""}
            </span>
          ) : (
            <span className="inline-flex h-8 rounded border border-gray-400 bg-gray-100 px-2 py-1 text-sm text-gray-600">No saved scores</span>
          )}
        </section>
        <div className="flex flex-wrap items-center gap-3">
          <p className="inline-flex h-8 rounded border border-gray-400 bg-gray-100 px-2 py-1 text-sm text-gray-600">
            {scoreLegend}
          </p>
          <div className="ml-auto shrink-0">
            <button
              type="button"
              onClick={() => setChangeLogOpen(true)}
              className="dark-button rounded border border-black bg-gray-900 px-3 py-1 text-white"
            >
              View Change History
            </button>
          </div>
        </div>
      </div>

      <section className="overflow-auto border rounded">
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 bg-white">
            <tr>
              <th className="sticky left-0 bg-white border p-2 text-left">Category <span className="text-sm font-medium text-gray-600">(Weight)</span></th>
              {data.companies.map((company) => (
                <th key={company.id} className="border p-2 min-w-40">
                  {company.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.categories.map((category) => (
              <tr key={category.id}>
                <td className="sticky left-0 bg-white border p-2 text-medium">
                  {category.name} <span className="text-sm font-medium text-gray-600">({category.weight}%)</span>
                </td>
                {data.companies.map((company) => {
                  const key = `${company.id}:${category.id}`;
                  const isMissing = missingCellKeys.has(key);
                  return (
                    <td key={key} className={`border p-1 text-center ${isMissing ? "bg-red-50" : ""}`}>
                      <input
                        className={`w-16 rounded border px-2 py-1 text-center disabled:bg-gray-50 ${
                          isMissing ? "border-red-500 bg-red-100" : ""
                        }`}
                        min={1}
                        max={5}
                        step={0.1}
                        type="number"
                        disabled={isLoadingScores}
                        placeholder=""
                        value={scores[key] ?? ""}
                        onChange={(event) => {
                          updateScore(company.id, category.id, event.target.value);
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="sticky left-0 bg-gray-50 border p-2 font-semibold">Weighted Total</td>
              {data.companies.map((company) => {
                const hasScores = data.categories.some(
                  (category) => typeof scores[`${company.id}:${category.id}`] === "number",
                );
                return (
                  <td key={company.id} className="border p-2 text-center font-semibold">
                    {hasScores ? totals[company.id]?.toFixed(1) ?? "0.0" : ""}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <button
          disabled={isSubmitting || isLoadingScores}
          onClick={() => submitScores(false)}
          className="dark-button rounded border border-black bg-gray-900 text-white px-3 py-2 disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          type="button"
          disabled={isSubmitting || isLoadingScores || !hasSavedScores}
          onClick={restoreSavedDraft}
          className="white-button rounded border border-black bg-white text-black px-3 py-2 disabled:opacity-50"
        >
          Restore Saved Draft
        </button>
        <button
          disabled={isSubmitting || isLoadingScores}
          onClick={() => submitScores(true)}
          className="red-button rounded border border-black bg-[#EE2524] px-3 py-2 text-white disabled:opacity-50"
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
        open={pendingConfirm?.type === "restore-draft"}
        title="Restore Saved Draft?"
        message="This will overwrite any scores currently in the form for this judge and replace them with those contained in most recent save."
        confirmLabel="Restore"
        onConfirm={handleConfirmDialog}
        onCancel={() => setPendingConfirm(null)}
      />
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
  );
}
