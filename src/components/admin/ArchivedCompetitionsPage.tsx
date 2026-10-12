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
      <AppHeader showAdminLink={true}>
        <h1>Archived Competitions</h1>
      </AppHeader>
      <main className="flex flex-col gap-10 px-6 pb-6">
        <section className="overflow-hidden rounded border p-4 space-y-3">
          <h2 className="text-xl font-semibold">Archived Competitions</h2>
          <DashboardTextActions>
            <DashboardTextButton
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
            >
              Create New Competition
            </DashboardTextButton>
          </DashboardTextActions>
          {archived.length === 0 ? (
            <p className="text-sm text-gray-600">No competitions in archive.</p>
          ) : null}
        </section>
        {archived.map((item) => (
          <section key={item.id} className="overflow-hidden rounded border p-4 space-y-3">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold">{item.name}</h2>
              <p className="mt-1 text-sm text-gray-600">
                {formatEventDate(item.eventDate)} · Winner: {item.winner ?? "TBD"} ·{" "}
                {item.finalSubmissionCount} final submission
                {item.finalSubmissionCount === 1 ? "" : "s"}
              </p>
            </div>
            <DashboardTextActions>
              <DashboardTextButton
                onClick={() => void makeArchivedCompetitionLive(item.id, item.name)}
                disabled={
                  isActivatingArchived === item.id ||
                  isDeletingArchived === item.id ||
                  isCreatingArchived === item.id
                }
              >
                Make Competition Live
              </DashboardTextButton>
              <DashboardTextButton
                onClick={() => void openArchivedDetails(item.id)}
                disabled={isLoadingArchivedDetails}
              >
                View Competition Details
              </DashboardTextButton>
              <DashboardTextButton
                onClick={() => void deletePastCompetition(item.id, item.name)}
                disabled={isDeletingArchived === item.id}
              >
                Delete Competition
              </DashboardTextButton>
            </DashboardTextActions>
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
