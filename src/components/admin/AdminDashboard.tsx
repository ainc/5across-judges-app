"use client";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import PlayCircleFilledWhiteOutlinedIcon from '@mui/icons-material/PlayCircleFilledWhiteOutlined';
import Link from "next/link";
import { useState } from "react";
import { AdminConfirmDialogs } from "@/components/admin/AdminConfirmDialogs";
import { AdminPromptDialogs } from "@/components/admin/AdminPromptDialogs";
import { ArchivedDetailsModal } from "@/components/admin/ArchivedDetailsModal";
import { CategoriesModal } from "@/components/admin/CategoriesModal";
import { CompaniesModal } from "@/components/admin/CompaniesModal";
import { DashboardDeleteButton } from "@/components/admin/DashboardDeleteButton";
import { JudgesModal } from "@/components/admin/JudgesModal";
import { SendJudgeMessageModal } from "@/components/admin/SendJudgeMessageModal";
import { EventDateCalendar } from "@/components/EventDateCalendar";
import { SignOutButton } from "@/components/SignOutButton";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { formatEventDate } from "@/lib/competition-results";
import { AppHeader } from "./AppHeader";

export function AdminDashboard() {
  const [messageJudgeId, setMessageJudgeId] = useState<string | null>(null);
  const {
    data,
    archived,
    resultsPreview,
    toasts,
    pendingConfirm,
    pendingPrompt,
    openSection,
    viewingArchived,
    isSaving,
    isSavingResults,
    isArchiving,
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
    startNextCompetition,
    createArchivedCompetition,
    makeArchivedCompetitionLive,
    deletePastCompetition,
    handleConfirmDialog,
    handlePromptSubmit,
  } = useAdminDashboard();

  if (!data) return null;

  return (
    <>
      <AppHeader showAdminLink={true}>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      </AppHeader>
      <main className="space-y-6 px-6 pb-6">

      <div className="flex gap-10 items-start">
        <section className="flex-1 rounded border p-4 space-y-3">
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
            <p className="text-sm text-gray-600">No final submissions yet.</p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setPendingConfirm({ type: "save-results" })}
              disabled={isSavingResults}
              className="white-button rounded border border-black bg-white text-black px-4 py-2 disabled:opacity-50"
            >
              Save & Copy Competition
            </button>
            <button
              onClick={startNextCompetition}
              disabled={isArchiving}
              className="red-button rounded border border-black bg-[#EE2524] text-white px-3 py-2 disabled:opacity-50"
            >
              End Current Competition
            </button>
          </div>
        </section>

        <section className="relative flex-1 rounded border p-4 space-y-3">
          <button
            type="button"
            aria-label="Create competition"
            onClick={() => createArchivedCompetition(data.competition.id, data.competition.name)}
            disabled={
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
            <ul className="space-y-2 text-sm">
              {archived.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-x-2 rounded bg-white p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium leading-none">{item.name}</p>
                    <p className="mt-1 text-gray-600 leading-none">
                      {formatEventDate(item.eventDate)} · Winner: {item.winner ?? "TBD"} ·{" "}
                      {item.finalSubmissionCount} final submission
                      {item.finalSubmissionCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="archived-row-actions flex h-full shrink-0 items-stretch gap-4">
                    <button
                      type="button"
                      aria-label={`Make ${item.name} live`}
                      onClick={() => void makeArchivedCompetitionLive(item.id, item.name)}
                      disabled={
                        isActivatingArchived === item.id ||
                        isDeletingArchived === item.id ||
                        isCreatingArchived === item.id
                      }
                      className="makelivebutton"
                    >
                      <div className="live-container" aria-hidden>
                        <PlayCircleFilledWhiteIcon className="makelivebutton" fontSize="inherit" />
                        <PlayCircleFilledWhiteOutlinedIcon className="graylivebutton" fontSize="inherit" />
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label={`View ${item.name} details`}
                      onClick={() => void openArchivedDetails(item.id)}
                      disabled={isLoadingArchivedDetails}
                      className="viewbutton"
                    >
                      <div className="view-container" aria-hidden>
                        <VisibilityIcon className="viewbutton" fontSize="inherit" />
                        <VisibilityOutlinedIcon className="grayviewbutton" fontSize="inherit" />
                      </div>
                    </button>
                    <DashboardDeleteButton
                      variant="archive"
                      aria-label={`Delete ${item.name}`}
                      onClick={() => void deletePastCompetition(item.id, item.name)}
                      disabled={isDeletingArchived === item.id}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

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
          open={messageJudgeId !== null}
          judgeName={
            data.judges.find((judge) => judge.id === messageJudgeId)?.name.trim() || "judge"
          }
          onClose={() => setMessageJudgeId(null)}
          onSend={(message) => {
            if (!messageJudgeId) return;
            void sendIndividualJudgeMessage(messageJudgeId, message).then((sent) => {
              if (sent) setMessageJudgeId(null);
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
      </div>

      <div className="flex gap-10 items-start">
        <section className="flex-1 rounded border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">"{data.competition.name}" Settings</h2>
            <button
              type="button"
              onClick={() => void saveSettings()}
              disabled={isSaving}
              className="dark-button rounded border border-black bg-gray-900 text-base font-semibold text-white px-3 py-2 disabled:opacity-50"
            >
              {isSaving ? "Publishing..." : "Publish Competition Settings"}
            </button>
          </div>
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
              className="mt-1 w-full rounded border p-2 field-sizing-content font-mono text-sm"
              rows={6}
              value={autoResultsSummary}
              readOnly
            />
          </label>
        </section>

        <section className="flex-1 rounded border p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => openSectionModal("judges")}
              className="dark-button rounded border border-black bg-gray-900 text-base font-semibold text-white px-3 py-2"
            >
              Judges
            </button>
            <button
              type="button"
              onClick={() => setPendingPrompt({ type: "reset" })}
              className="red-button rounded border border-black bg-[#EE2524] text-white px-3 py-2 disabled:opacity-50"
            >
              Reset Settings
            </button>
          </div>
          {data.judges.map((judge, index) => (
            <div
              key={judge.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 rounded bg-white px-0.5 py-2"
            >
              <div className="flex min-w-0 gap-1">
                <span className="text-base font-medium text-gray-600">{index + 1}.</span>
                <div className="flex flex-col">
                  <span className="text-base font-medium text-black">
                    {judge.name.trim() || "Unnamed judge"}
                  </span>
                  {judge.code ? (
                    <span className="text-sm font-medium text-gray-600">Code: {judge.code}</span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => setMessageJudgeId(judge.id)}
                  disabled={!!judge.message?.trim()}
                  className="dark-button rounded border border-black bg-gray-900 px-2 py-1 text-sm font-medium text-white"
                  title={judge.message?.trim() ? "Message already sent" : `Message ${judge.name}`}
                >
                  Message {judge.name}
                </button>
                <DashboardDeleteButton
                  variant="message"
                  onClick={() => requestDeleteJudgeMessage(judge.id, judge.name)}
                  disabled={!judge.message?.trim()}
                  aria-label={judge.message?.trim() ? "Delete message" : "No message sent"}
                  title={judge.message?.trim() ? "Delete message" : "No message sent"}
                />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => openSectionModal("companies")}
              className="dark-button rounded border border-black bg-gray-900 text-base font-semibold text-white px-3 py-2"
            >
              Companies
            </button>
          </div>
          {data.companies.map((company) => (
            <div key={company.id} className="rounded bg-white px-0.5 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-medium text-black">
                  {company.name.trim() || "Unnamed company"}
                </span>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => openSectionModal("categories")}
              className="dark-button rounded border border-black bg-gray-900 text-base font-semibold text-white px-3 py-2"
            >
              Scoring Criteria
            </button>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${criteriaWeightTotal === 100 ? "text-green-700" : "text-red-700"}`}
              >
                Weights: {criteriaWeightTotal}%
              </span>
            </div>
          </div>
          {data.categories.map((category) => (
            <div key={category.id} className="flex flex-wrap items-center gap-2 rounded bg-white px-1 py-3 font-medium text-base text-black">
              <span className="font-medium">{category.name.trim() || "Unnamed category"}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm text-gray-600">({category.weight}%)</span>
              </div>
            </div>
          ))}
        </section>
      </div>

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
