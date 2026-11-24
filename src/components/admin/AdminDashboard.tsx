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
    handleConfirmDialog,
    handlePromptSubmit,
  } = useAdminDashboard();

  const leader = resultsPreview?.rankings.find((row) => row.rank === 1);
  const dashboardColumns = "minmax(0, 1fr) 20rem";
  const alignedColumns =
    "max-content minmax(1.25rem, 0.5fr) 1rem minmax(1.25rem, 0.5fr) max-content";

  if (!isReady) return null;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <AppHeader showAdminLink={true} className="mb-12 shrink-0" />
      <main className="min-h-0 flex-1 overflow-hidden px-6 pb-6">
        <div
          className={leader ? "grid items-stretch gap-y-4" : "flex flex-col gap-4"}
          style={leader ? { gridTemplateColumns: alignedColumns } : undefined}
        >
        {data ? (
          <section
            className={`grid items-stretch overflow-hidden rounded-xl bg-[#e5e7eb] ${leader ? "col-span-full grid-cols-subgrid" : ""}`}
            style={leader ? undefined : { gridTemplateColumns: "minmax(0, 1fr)" }}
          >
            <div className="col-start-1 min-w-0 py-4 pl-4">
              <h2 className="mb-3 text-left text-2xl font-bold leading-tight text-[#111827]">Submitted Scores</h2>
              <SubmissionStatusTable
                judges={data.judges}
                companies={data.companies}
                submissions={data.submissions ?? []}
                footer={
                  <button
                    type="button"
                    onClick={() => setMessageOpen(true)}
                    disabled={data.judges.length === 0}
                    className="text-sm text-[#EC3641] underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Message Judge
                  </button>
                }
              />
            </div>
            {leader ? <div className="relative col-start-3" aria-hidden="true"><div className="absolute top-4 bottom-4 left-1/2 w-px -translate-x-1/2 bg-[#9ca3af]" /></div> : null}
            {leader ? (
              <aside className="col-start-5 flex w-80 max-w-full flex-col justify-between py-4 pr-4 text-[#111827]">
                <div>
                  <p className="text-sm">Highest Score</p>
                  <p className="break-words text-2xl font-bold leading-tight">{leader.companyName}</p>
                  <p className="text-sm font-semibold leading-tight">Pitch {leader.pitch}</p>
                </div>
                <p className="text-8xl font-bold leading-none text-[#EC3641]">
                  {formatWeightedTotal(leader.finalScore)}
                  <span className="text-4xl text-[#111827]">/5</span>
                </p>
              </aside>
            ) : null}
          </section>
        ) : null}
        <div
          className={leader ? "col-span-full grid grid-cols-subgrid items-stretch" : "grid items-stretch"}
          style={leader ? undefined : { gridTemplateColumns: dashboardColumns }}
        >
          <div
            className={`order-2 flex min-w-0 flex-col ${leader ? "col-span-2 col-start-4" : ""}`}
            style={leader ? { width: 0, minWidth: "100%" } : undefined}
          >
            <section className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-transparent p-4">
              <h2 className="mb-3 text-left text-2xl font-bold leading-tight text-foreground">Settings</h2>
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
              </DashboardTextActions>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={endCurrentCompetition}
                    disabled={isArchiving || !data}
                    className="rounded border-0 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: "#EC3641", color: "#000000" }}
                  >
                    {isArchiving ? "Ending..." : "End and Start New Competition"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingPrompt({ type: "reset" })}
                  disabled={!data}
                  className="text-sm text-muted underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset Settings
                </button>
              </div>
            </section>
          </div>

          <div
            className={`order-1 flex min-w-0 flex-col ${leader ? "col-span-2" : ""}`}
            style={leader ? { width: 0, minWidth: "100%" } : undefined}
          >
            <section className="flex flex-1 flex-col gap-3 overflow-hidden rounded-xl border bg-transparent p-4">
              <h2 className="text-left text-2xl font-bold leading-tight text-foreground">Competition Details</h2>
              {data ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="col-span-2 block min-w-0 text-sm">
                      Competition Name
                      <input
                        className="section-field mt-1 w-full rounded border p-2"
                        value={data.competition.name}
                        onChange={(event) => updateCompetitionField("name", event.target.value)}
                      />
                    </label>
                    <label className="col-span-1 block min-w-0 text-sm" htmlFor="competition-date">
                    Competition Date
                    <input
                      id="competition-date"
                      className={`section-field mt-1 w-full rounded border p-2 ${eventDateError ? "border-danger" : ""}`}
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
                  </div>
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
                        {row.companyName} — {row.finalScore.toFixed(2)}
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="text-sm text-muted">
                  {data ? "No final submissions yet." : "No live competition. Start a new competition to begin scoring."}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between gap-3">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setPendingConfirm({ type: "save-results" })}
                    disabled={isSavingResults || !data}
                    className="text-sm text-muted underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Copy into Archive
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!data || !parseEventDate(data.competition.eventDate)) {
                        setEventDateError("Enter a valid date as MM/DD/YYYY.");
                        return;
                      }
                      setEventDateError("");
                      setPendingConfirm({ type: "save-details" });
                    }}
                    disabled={isSaving || !data}
                    className="text-sm text-muted underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Details"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/admin/archived")}
                  className="text-sm text-muted underline"
                >
                  Open Archived Competitions
                </button>
              </div>
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
    </div>
  );
}
