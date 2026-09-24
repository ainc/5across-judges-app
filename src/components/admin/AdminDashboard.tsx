"use client";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { useState } from "react";
import { AdminConfirmDialogs } from "@/components/admin/AdminConfirmDialogs";
import { AdminPromptDialogs } from "@/components/admin/AdminPromptDialogs";
import { ArchivedDetailsModal } from "@/components/admin/ArchivedDetailsModal";
import { CategoriesModal } from "@/components/admin/CategoriesModal";
import { CompaniesModal } from "@/components/admin/CompaniesModal";
import { DashboardTextActions, DashboardTextButton } from "@/components/admin/DashboardTextButton";
import { JudgesModal } from "@/components/admin/JudgesModal";
import { SendJudgeMessageModal } from "@/components/admin/SendJudgeMessageModal";
import { EventDateCalendar } from "@/components/EventDateCalendar";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { formatEventDate } from "@/lib/competition-results";
import { AppHeader } from "./AppHeader";

export function AdminDashboard() {
  const [messageOpen, setMessageOpen] = useState(false);
  const {
    data,
    archived,
    resultsPreview,
    pendingConfirm,
    pendingPrompt,
    openSection,
    viewingArchived,
    isSaving,
    isReady,
    isSavingResults,
    isArchiving,
    isStarting,
    isDeletingArchived,
    isActivatingArchived,
    isCreatingArchived,
    isLoadingArchivedDetails,
    individualJudgeMessageStatus,
    autoResultsSummary,
    criteriaWeightTotal,
    setPendingConfirm,
    setPendingPrompt,
    setIndividualJudgeMessageStatus,
    updateCompetitionField,
    updateList,
    openSectionModal,
    closeSectionModal,
    openArchivedDetails,
    closeArchivedDetails,
    addJudge,
    requestRemoveJudge,
    addCategory,
    requestRemoveCategory,
    sendIndividualJudgeMessage,
    requestDeleteJudgeMessage,
    saveSettings,
    endCurrentCompetition,
    startNewCompetition,
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
        <h1>Admin Dashboard</h1>
      </AppHeader>
      <main className="px-6 pb-6">
        <div className="flex items-start gap-10">
          <div className="flex min-w-0 flex-1 flex-col gap-10">
            <section className="overflow-hidden rounded border p-4 space-y-3">
              <h2 className="text-xl font-semibold">Competition Actions</h2>
              <DashboardTextActions>
                <DashboardTextButton
                  onClick={() => setMessageOpen(true)}
                  disabled={!data || data.judges.length === 0}
                >
                  Message Judge
                </DashboardTextButton>
                <DashboardTextButton
                  onClick={endCurrentCompetition}
                  disabled={isArchiving || !data}
                >
                  End Competition
                </DashboardTextButton>
                <DashboardTextButton
                  onClick={startNewCompetition}
                  disabled={isStarting || !!data}
                >
                  Start New Competition
                </DashboardTextButton>
              </DashboardTextActions>
            </section>

            <section className="overflow-hidden rounded border p-4 space-y-3">
              <h2 className="text-xl font-semibold">Recent 5 Across Results</h2>
              {resultsPreview ? (
                <>
                  <p className="text-sm">
                    Winner: <span className="font-medium">{resultsPreview.winner ?? "TBD"}</span> ·{" "}
                    {resultsPreview.finalJudgeCount} final judge submission
                    {resultsPreview.finalJudgeCount === 1 ? "" : "s"}
                  </p>
                  <ol className="list-decimal pl-5 text-sm space-y-1">
                    {resultsPreview.rankings.map((row) => (
                      <li key={row.rank}>
                        {row.companyName} — <strong>{row.finalScore.toFixed(1)}</strong>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  {data ? "No final submissions yet." : "No live competition. Start a new competition to begin scoring."}
                </p>
              )}
              <DashboardTextActions>
                <DashboardTextButton
                  onClick={() => setPendingConfirm({ type: "save-results" })}
                  disabled={isSavingResults || !data}
                >
                  Save & Copy Competition
                </DashboardTextButton>
              </DashboardTextActions>
            </section>

            {data ? (
              <section className="overflow-hidden rounded border p-4 space-y-3">
                <h2 className="text-xl font-semibold">{data.competition.name} Settings</h2>
                <DashboardTextActions>
                  <DashboardTextButton
                    onClick={() => void saveSettings()}
                    disabled={isSaving}
                  >
                    {isSaving ? "Publishing..." : "Publish Competition Settings"}
                  </DashboardTextButton>
                </DashboardTextActions>
                <label className="block text-sm">
                  Competition Name
                  <input
                    className="mt-1 w-full rounded border p-2"
                    value={data.competition.name}
                    onChange={(event) => updateCompetitionField("name", event.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  Competition Date
                  <EventDateCalendar
                    value={data.competition.eventDate.slice(0, 10)}
                    onChange={(value) => updateCompetitionField("eventDate", value)}
                  />
                </label>
                <label className="block text-sm">
                  Competition Summary
                  <textarea
                    className="mt-1 w-full resize-none rounded border p-2 font-mono text-sm [field-sizing:fixed]"
                    rows={6}
                    value={autoResultsSummary}
                    readOnly
                  />
                </label>
              </section>
            ) : (
              <section className="rounded border p-4">
                <p className="text-sm text-gray-600">No live competition. Use Start New Competition to create one.</p>
              </section>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-10">
            <section className="overflow-hidden rounded border p-4 space-y-3">
              <h2 className="text-xl font-semibold">Settings</h2>
              <DashboardTextActions>
                <DashboardTextButton
                  onClick={() => openSectionModal("judges")}
                  disabled={!data}
                >
                  Manage Judges
                </DashboardTextButton>
                <DashboardTextButton
                  onClick={() => openSectionModal("companies")}
                  disabled={!data}
                >
                  Manage Companies
                </DashboardTextButton>
                <DashboardTextButton
                  onClick={() => openSectionModal("categories")}
                  disabled={!data}
                >
                  Manage Scoring Criteria
                </DashboardTextButton>
                <DashboardTextButton
                  onClick={() => setPendingPrompt({ type: "reset" })}
                  disabled={!data}
                >
                  Reset Settings
                </DashboardTextButton>
              </DashboardTextActions>
            </section>

            <section className="relative overflow-hidden rounded border p-4 space-y-3">
              <button
                type="button"
                aria-label="Create competition"
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
                className="newcompetitionbutton absolute top-2.5 right-2.5 z-10"
              >
                <div className="newcompetition-container" aria-hidden>
                  <AddCircleIcon className="newcompetitionbutton" fontSize="inherit" />
                  <AddCircleOutlineOutlinedIcon className="graynewcompetitionbutton" fontSize="inherit" />
                </div>
              </button>
              <h2 className="text-xl font-semibold leading-none pr-12">Archived Competitions</h2>
              {archived.length === 0 ? (
                <p className="text-sm text-gray-600">No competitions in archive.</p>
              ) : (
                <ul className="space-y-4">
                  {archived.map((item) => (
                    <li key={item.id} className="space-y-3">
                      <div className="min-w-0 text-sm">
                        <p className="font-medium leading-none">{item.name}</p>
                        <p className="mt-1 text-gray-600 leading-none">
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
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        {data ? (
          <>
            <JudgesModal
              open={openSection === "judges"}
              judges={data.judges}
              messageStatus={individualJudgeMessageStatus}
              onClose={closeSectionModal}
              onAddJudge={addJudge}
              onJudgeNameChange={(id, name) => updateList("judges", id, "name", name)}
              onJudgeCodeChange={(id, code) => updateList("judges", id, "code", code)}
              onJudgeMessageChange={(id, message) => {
                updateList("judges", id, "message", message);
                setIndividualJudgeMessageStatus((prev) => ({ ...prev, [id]: "" }));
              }}
              onRequestRemoveJudge={requestRemoveJudge}
              onSendMessage={(id) => void sendIndividualJudgeMessage(id)}
              onRequestDeleteMessage={requestDeleteJudgeMessage}
            />
            <SendJudgeMessageModal
              open={messageOpen}
              judges={data.judges}
              onClose={() => setMessageOpen(false)}
              onSend={(judgeId, message) => {
                void sendIndividualJudgeMessage(judgeId, message).then((sent) => {
                  if (sent) setMessageOpen(false);
                });
              }}
            />
            <CompaniesModal
              open={openSection === "companies"}
              companies={data.companies}
              onClose={closeSectionModal}
              onCompanyNameChange={(id, name) => updateList("companies", id, "name", name)}
            />
            <CategoriesModal
              open={openSection === "categories"}
              categories={data.categories}
              criteriaWeightTotal={criteriaWeightTotal ?? 0}
              onClose={closeSectionModal}
              onAddCategory={addCategory}
              onCategoryNameChange={(id, name) => updateList("categories", id, "name", name)}
              onCategoryWeightChange={(id, weight) => updateList("categories", id, "weight", weight)}
              onRequestRemoveCategory={requestRemoveCategory}
            />
          </>
        ) : null}

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
      </main>
    </>
  );
}
