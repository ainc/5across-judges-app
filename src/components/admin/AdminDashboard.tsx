"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminConfirmDialogs } from "@/components/admin/AdminConfirmDialogs";
import { AdminPromptDialogs } from "@/components/admin/AdminPromptDialogs";
import { CategoriesModal } from "@/components/admin/CategoriesModal";
import { CompaniesModal } from "@/components/admin/CompaniesModal";
import { DashboardTextActions, DashboardTextButton } from "@/components/admin/DashboardTextButton";
import { JudgesModal } from "@/components/admin/JudgesModal";
import { SendJudgeMessageModal } from "@/components/admin/SendJudgeMessageModal";
import { EventDateCalendar } from "@/components/EventDateCalendar";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { AppHeader } from "./AppHeader";

export function AdminDashboard() {
  const router = useRouter();
  const [messageOpen, setMessageOpen] = useState(false);
  const {
    data,
    resultsPreview,
    pendingConfirm,
    pendingPrompt,
    openSection,
    isSaving,
    isReady,
    isSavingResults,
    isArchiving,
    isStarting,
    individualJudgeMessageStatus,
    criteriaWeightTotal,
    setPendingConfirm,
    setPendingPrompt,
    setIndividualJudgeMessageStatus,
    updateCompetitionField,
    updateList,
    openSectionModal,
    closeSectionModal,
    saveOpenSection,
    addJudge,
    requestRemoveJudge,
    addCategory,
    requestRemoveCategory,
    sendIndividualJudgeMessage,
    requestDeleteJudgeMessage,
    endCurrentCompetition,
    startNewCompetition,
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
              <DashboardTextButton onClick={() => router.push("/admin/archived")}>
                  Open Archived Competitions
                </DashboardTextButton>
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
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-10">
            <section className="overflow-hidden rounded border p-4 space-y-3">
              <h2 className="text-xl font-semibold">Competition Details</h2>
              <DashboardTextActions>
                <DashboardTextButton
                  onClick={() => setPendingConfirm({ type: "save-results" })}
                  disabled={isSavingResults || !data}
                >
                  Copy Competition into Archive
                </DashboardTextButton>
                <DashboardTextButton
                  onClick={() => setPendingConfirm({ type: "save-details" })}
                  disabled={isSaving || !data}
                >
                  {isSaving ? "Saving..." : "Save Competition Details"}
                </DashboardTextButton>
              </DashboardTextActions>
              {data ? (
                <>
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
                </>
              ) : null}
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
                        {row.companyName} — <strong>{row.finalScore.toFixed(2)}</strong>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  {data ? "No final submissions yet." : "No live competition. Start a new competition to begin scoring."}
                </p>
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
              onSave={() => void saveOpenSection()}
              isSaving={isSaving}
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
              onSave={() => void saveOpenSection()}
              isSaving={isSaving}
            />
            <CategoriesModal
              open={openSection === "categories"}
              categories={data.categories}
              criteriaWeightTotal={criteriaWeightTotal ?? 0}
              onClose={closeSectionModal}
              onAddCategory={addCategory}
              onCategoryNameChange={(id, name) => updateList("categories", id, "name", name)}
              onCategoryDescriptionChange={(id, description) =>
                updateList("categories", id, "description", description)
              }
              onCategoryWeightChange={(id, weight) => updateList("categories", id, "weight", weight)}
              onRequestRemoveCategory={requestRemoveCategory}
              onSave={() => void saveOpenSection()}
              isSaving={isSaving}
            />
          </>
        ) : null}

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
