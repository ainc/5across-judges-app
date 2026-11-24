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
import { SubmissionStatusTable } from "@/components/admin/SubmissionStatusTable";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { formatEventDateInput, normalizeEventDate, parseEventDate } from "@/lib/competition-results";
import { formatWeightedTotal } from "@/lib/judging-format";
import { AppHeader } from "./AppHeader";

export function AdminDashboard() {
  const router = useRouter();
  const [messageOpen, setMessageOpen] = useState(false);
  const [eventDateError, setEventDateError] = useState("");
  const {
    data,
    resultsPreview,
    pendingConfirm,
    pendingPrompt,
    openSection,
    savedJudgeUsernames,
    isSaving,
    isReady,
    isSavingResults,
    toasts,
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
    addPreviousJudges,
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

  const leader = resultsPreview?.rankings.find((row) => row.rank === 1);

  if (!isReady) return null;

  return (
    <>
      <AppHeader showAdminLink={true} />
      <main className="space-y-10 px-6 pb-6">
        {data ? (
          <div className="space-y-3">
          <h2 className="text-left text-2xl font-bold leading-tight text-[#111827]">Submitted Scores</h2>
          <div className="flex items-stretch gap-4">
            <section className="min-w-0 flex-1 overflow-hidden rounded border p-4">
              <SubmissionStatusTable
                judges={data.judges}
                companies={data.companies}
                submissions={data.submissions ?? []}
              />
            </section>
            {leader ? (
              <aside className="flex w-80 shrink-0 flex-col justify-between self-stretch rounded-lg bg-[#e5e7eb] px-4 py-3 text-[#111827]">
                <div>
                  <p className="text-sm">Highest Score</p>
                  <p className="break-words text-2xl font-bold leading-tight">{leader.companyName}</p>
                  <p className="text-sm font-semibold leading-tight">Pitch {leader.pitch}</p>
                </div>
                <p className="text-6xl font-bold leading-none text-[#EC3641]">
                  {formatWeightedTotal(leader.finalScore)}
                  <span className="text-2xl text-[#111827]">/5</span>
                </p>
              </aside>
            ) : null}
          </div>
          </div>
        ) : null}
        <div className="flex items-start gap-10">
          <div className="flex min-w-0 flex-1 flex-col gap-10">
            <div className="space-y-3">
            <h2 className="text-left text-2xl font-bold leading-tight text-[#111827]">Competition Actions</h2>
            <section className="overflow-hidden rounded border p-4 space-y-3">
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
            </div>
            <div className="space-y-3">
            <h2 className="text-left text-2xl font-bold leading-tight text-[#111827]">Settings</h2>
            <section className="overflow-hidden rounded border p-4 space-y-3">
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
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-10">
            <div className="space-y-3">
            <h2 className="text-left text-2xl font-bold leading-tight text-[#111827]">Competition Details</h2>
            <section className="overflow-hidden rounded border p-4 space-y-3">
              <DashboardTextActions>
                <DashboardTextButton
                  onClick={() => setPendingConfirm({ type: "save-results" })}
                  disabled={isSavingResults || !data}
                >
                  Copy Competition into Archive
                </DashboardTextButton>
                <DashboardTextButton
                  onClick={() => {
                    if (!data || !parseEventDate(data.competition.eventDate)) {
                      setEventDateError("Enter a valid date as MM/DD/YYYY.");
                      return;
                    }
                    setEventDateError("");
                    setPendingConfirm({ type: "save-details" });
                  }}
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
                  <label className="block text-sm" htmlFor="competition-date">
                    Competition Date
                    <input
                      id="competition-date"
                      className={`mt-1 w-full rounded border p-2 ${eventDateError ? "border-danger" : ""}`}
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="MM/DD/YYYY"
                      maxLength={10}
                      aria-invalid={eventDateError ? true : undefined}
                      aria-describedby={eventDateError ? "competition-date-error" : undefined}
                      value={formatEventDateInput(data.competition.eventDate)}
                      onChange={(event) => {
                        const value = event.target.value;
                        updateCompetitionField("eventDate", value);
                        if (value.length < 10 || normalizeEventDate(value)) {
                          setEventDateError("");
                          return;
                        }
                        setEventDateError("Enter a valid date as MM/DD/YYYY.");
                      }}
                      onBlur={(event) => {
                        const normalized = normalizeEventDate(event.target.value);
                        if (!normalized) {
                          setEventDateError("Enter a valid date as MM/DD/YYYY.");
                          return;
                        }
                        setEventDateError("");
                        updateCompetitionField("eventDate", normalized);
                      }}
                    />
                    {eventDateError ? (
                      <p id="competition-date-error" className="mt-1 text-sm text-danger">
                        {eventDateError}
                      </p>
                    ) : null}
                  </label>
                </>
              ) : null}
              {resultsPreview ? (
                <>
                  <p className="text-sm">
                    Highest Score: <span className="font-medium">{resultsPreview.winner ?? "TBD"}</span> ·{" "}
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
                <p className="text-sm text-muted">
                  {data ? "No final submissions yet." : "No live competition. Start a new competition to begin scoring."}
                </p>
              )}
            </section>
            </div>
          </div>
        </div>

        {data ? (
          <>
            <JudgesModal
              open={openSection === "judges"}
              judges={data.judges}
              savedUsernames={savedJudgeUsernames}
              messageStatus={individualJudgeMessageStatus}
              onClose={closeSectionModal}
              onAddJudge={addJudge}
              onAddPreviousJudges={addPreviousJudges}
              onJudgeNameChange={(id, name) => updateList("judges", id, "name", name)}
              onJudgeUsernameChange={(id, username) => updateList("judges", id, "username", username)}
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
        <div id="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className="toast">
              {toast.message}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
