"use client";

import { AdminConfirmDialogs } from "@/components/admin/AdminConfirmDialogs";
import { AdminPromptDialogs } from "@/components/admin/AdminPromptDialogs";
import { ArchivedDetailsModal } from "@/components/admin/ArchivedDetailsModal";
import { DashboardTextActions, DashboardTextButton } from "@/components/admin/DashboardTextButton";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { formatEventDate } from "@/lib/competition-results";
import { AppHeader } from "./AppHeader";

export function ArchivedCompetitionsPage() {
  const {
    data,
    archived,
    pendingConfirm,
    pendingPrompt,
    viewingArchived,
    isReady,
    isDeletingArchived,
    isActivatingArchived,
    isCreatingArchived,
    isLoadingArchivedDetails,
    setPendingConfirm,
    setPendingPrompt,
    openArchivedDetails,
    closeArchivedDetails,
    createArchivedCompetition,
    makeArchivedCompetitionLive,
    deletePastCompetition,
    handleConfirmDialog,
    handlePromptSubmit,
  } = useAdminDashboard();

  if (!isReady) return null;

  return (
    <>
      <AppHeader showAdminLink={true} />
      <main className="flex flex-col gap-10 px-6 pb-6">
        <section className="overflow-hidden rounded border p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-left text-2xl font-bold leading-tight text-foreground">Archived Competitions</h2>
            <button
              type="button"
              onClick={() => {
                if (!data) return;
                createArchivedCompetition(data.competition.id, data.competition.name);
              }}
              disabled={
                !data ||
                isCreatingArchived !== null ||
                isActivatingArchived !== null ||
                isDeletingArchived !== null
              }
              className="dark-button shrink-0 rounded border-0 bg-gray-900 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create New Archived Competition
            </button>
          </div>
          {archived.length === 0 ? (
            <p className="text-sm text-muted">No competitions in archive.</p>
          ) : null}
        </section>
        {archived.map((item) => (
          <section key={item.id} className="overflow-hidden rounded border p-4 space-y-3">
            <div className="min-w-0">
              <h2 className="text-left text-2xl font-bold leading-tight text-foreground">{item.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {formatEventDate(item.eventDate)} · Highest Score: {item.winner ?? "TBD"} ·{" "}
                {item.finalSubmissionCount} final submission
                {item.finalSubmissionCount === 1 ? "" : "s"}
              </p>
            </div>
            <DashboardTextActions>
              <DashboardTextButton
                onClick={() => void openArchivedDetails(item.id)}
                disabled={isLoadingArchivedDetails}
              >
                View Competition Details
              </DashboardTextButton>
            </DashboardTextActions>
            <div className="flex flex-wrap items-center justify-start gap-3">
              <button
                type="button"
                onClick={() => void deletePastCompetition(item.id, item.name)}
                disabled={isDeletingArchived === item.id}
                className="rounded border-0 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: "#EC3641", color: "#000000" }}
              >
                Delete Competition
              </button>
              <button
                type="button"
                onClick={() => void makeArchivedCompetitionLive(item.id, item.name)}
                disabled={
                  isActivatingArchived === item.id ||
                  isDeletingArchived === item.id ||
                  isCreatingArchived === item.id
                }
                className="dark-button rounded border-0 bg-gray-900 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Make Competition Live
              </button>
            </div>
          </section>
        ))}
      </main>
      <ArchivedDetailsModal details={viewingArchived} onClose={closeArchivedDetails} />
      <AdminConfirmDialogs
        pendingConfirm={pendingConfirm}
        onConfirm={handleConfirmDialog}
        onCancel={() => setPendingConfirm(null)}
      />
      <AdminPromptDialogs
        pendingPrompt={pendingPrompt}
        onSubmit={handlePromptSubmit}
        onCancel={() => setPendingPrompt(null)}
      />
    </>
  );
}
