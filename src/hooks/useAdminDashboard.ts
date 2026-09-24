"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ArchivedCompetitionDetails,
  Judge,
  PendingConfirm,
  PendingPrompt,
  SectionModal,
} from "@/components/admin/types";
import {
  loadAdminData,
  loadArchivedCompetitionDetails,
  loadArchivedCompetitions,
  loadResultsPreview,
  readJsonResponse,
  type AdminCompetitionResponse,
  type ArchivedCompetition,
  type ResultsPreview,
} from "@/lib/admin-api";
import { DEFAULT_COMPANIES, DEFAULT_JUDGES } from "@/lib/competition-config";
import { formatResultsSummary } from "@/lib/competition-results";

type Toast = { id: number; message: string };

export function useAdminDashboard() {
  const [data, setData] = useState<AdminCompetitionResponse | null>(null);
  const [resultsPreview, setResultsPreview] = useState<ResultsPreview | null>(null);
  const [archived, setArchived] = useState<ArchivedCompetition[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingResults, setIsSavingResults] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isDeletingArchived, setIsDeletingArchived] = useState<string | null>(null);
  const [isActivatingArchived, setIsActivatingArchived] = useState<string | null>(null);
  const [isCreatingArchived, setIsCreatingArchived] = useState<string | null>(null);
  const [individualJudgeMessageStatus, setIndividualJudgeMessageStatus] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [pendingPrompt, setPendingPrompt] = useState<PendingPrompt>(null);
  const [openSection, setOpenSection] = useState<SectionModal>(null);
  const [viewingArchived, setViewingArchived] = useState<ArchivedCompetitionDetails | null>(null);
  const [isLoadingArchivedDetails, setIsLoadingArchivedDetails] = useState(false);
  const nextToastId = useRef(0);

  const showToast = useCallback((message: string) => {
    const id = nextToastId.current++;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const refresh = useCallback(async () => {
    const [adminData, preview, history] = await Promise.all([
      loadAdminData(),
      loadResultsPreview(),
      loadArchivedCompetitions(),
    ]);

    setArchived(history);
    setResultsPreview(preview);
    setData(adminData);
    setIsReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadResultsPreview().then(setResultsPreview);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const autoResultsSummary = useMemo(() => {
    if (!data) return "";
    return formatResultsSummary(
      data.competition.name,
      data.competition.eventDate,
      resultsPreview?.rankings ?? [],
      resultsPreview?.winner ?? null,
      resultsPreview?.finalJudgeCount ?? 0,
    );
  }, [data, resultsPreview]);

  const weightTotal = useMemo(
    () => (data?.categories ?? []).reduce((sum, category) => sum + category.weight, 0),
    [data?.categories],
  );

  const criteriaWeightTotal = data?.categories.reduce((sum, category) => {
    const value = category.weight;
    if (typeof value !== "number" || value == null) return sum;
    return sum + Number(value);
  }, 0);

  function updateCompetitionField(field: keyof AdminCompetitionResponse["competition"], value: string) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            competition: {
              ...prev.competition,
              [field]: value,
            },
          }
        : prev,
    );
  }

  function updateList<T extends { id: string }>(
    listName: "judges" | "companies" | "categories",
    id: string,
    field: string,
    value: string | number,
  ) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            [listName]: prev[listName].map((item) =>
              item.id === id
                ? {
                    ...item,
                    [field]: value,
                  }
                : item,
            ),
          }
        : prev,
    );
  }

  function openSectionModal(section: Exclude<SectionModal, null>) {
    setOpenSection(section);
  }

  function closeSectionModal() {
    setOpenSection(null);
    showToast("Settings must be saved by clicking 'Publish Competition Settings'.")
  }

  async function openArchivedDetails(id: string) {
    setIsLoadingArchivedDetails(true);
    const details = await loadArchivedCompetitionDetails(id);
    setIsLoadingArchivedDetails(false);
    if (!details) {
      showToast("Unable to load archived competition details.");
      return;
    }
    setViewingArchived(details);
  }

  function closeArchivedDetails() {
    setViewingArchived(null);
  }

  function addJudge() {
    const newId = `new-${crypto.randomUUID()}`;
    setData((prev) =>
      prev
        ? {
            ...prev,
            judges: [...prev.judges, { id: newId, name: "", code: null, message: null }],
          }
        : prev,
    );
    showToast("Judge added.");
  }

  function requestRemoveJudge(id: string, name: string) {
    setPendingConfirm({ type: "remove-judge", id, name: name.trim() || "this judge" });
  }

  function removeJudge(id: string) {
    setData((prev) =>
      prev && prev.judges.length > 1
        ? {
            ...prev,
            judges: prev.judges.filter((judge) => judge.id !== id),
          }
        : prev,
    );
    showToast("Judge removed.");
  }

  function addCategory() {
    const newId = `new-${crypto.randomUUID()}`;
    setData((prev) =>
      prev
        ? {
            ...prev,
            categories: [
              ...prev.categories,
              { id: newId, name: "", weight: 0, maxScore: 5 },
            ],
          }
        : prev,
    );
    showToast("Category added.");
  }

  function requestRemoveCategory(id: string, name: string) {
    setPendingConfirm({ type: "remove-category", id, name: name.trim() || "this category" });
  }

  function removeCategory(id: string) {
    setData((prev) =>
      prev && prev.categories.length > 1
        ? {
            ...prev,
            categories: prev.categories.filter((category) => category.id !== id),
          }
        : prev,
    );
    showToast("Category removed.");
  }

  async function sendIndividualJudgeMessage(judgeId: string, messageOverride?: string) {
    if (!data) return false;

    const judge = data.judges.find((item) => item.id === judgeId);
    if (!judge) return false;

    if (judge.id.startsWith("new-")) {
      showToast("Save competition settings before sending a message to a new judge.");
      return false;
    }

    const message = (messageOverride ?? judge.message)?.trim();
    if (!message) {
      showToast("Enter a message before sending.");
      return false;
    }

    const response = await fetch(`/api/admin/judges/${judgeId}/message`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const payload = await readJsonResponse(response);
    if (!response.ok) {
      showToast("Unable to send message.");
      return false;
    }

    setData((prev) =>
      prev
        ? {
            ...prev,
            judges: prev.judges.map((item) =>
              item.id === judgeId
                ? { ...item, message: (payload.judge as Judge | undefined)?.message ?? message }
                : item,
            ),
          }
        : prev,
    );

    showToast(`Message sent to ${judge.name}.`);
    return true;
  }

  function requestDeleteJudgeMessage(id: string, name: string) {
    setPendingConfirm({ type: "delete-message", id, name: name.trim() || "this message" });
  }

  async function deleteIndividualJudgeMessage(judgeId: string) {
    if (!data) return;

    const judge = data.judges.find((item) => item.id === judgeId);
    if (!judge?.message) return;

    if (judge.id.startsWith("new-")) {
      updateList("judges", judgeId, "message", "");
      showToast("Message cleared.");
      return;
    }

    const response = await fetch(`/api/admin/judges/${judgeId}/message`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: null }),
    });

    const payload = await readJsonResponse(response);
    if (!response.ok) {
      showToast("Unable to delete message.");
      return;
    }

    setData((prev) =>
      prev
        ? {
            ...prev,
            judges: prev.judges.map((item) => (item.id === judgeId ? { ...item, message: null } : item)),
          }
        : prev,
    );
    showToast(`Message to ${judge.name} deleted.`);
  }

  async function saveSettings() {
    if (!data) return;

    if (data.judges.length === 0) {
      showToast("Add at least one judge before saving.");
      return;
    }

    if (data.judges.some((judge) => !judge.name.trim())) {
      showToast("All judges must have a name before saving.");
      return;
    }

    if (data.categories.length === 0) {
      showToast("Add at least one scoring criteria before saving.");
      return;
    }

    if (data.categories.some((category) => !category.name.trim())) {
      showToast("All scoring criteria must have a name before saving.");
      return;
    }

    if (weightTotal !== 100) {
      showToast(`Category weights must total 100% (currently ${weightTotal}%).`);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/competition", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.competition.name,
          eventDate: data.competition.eventDate,
          resultsSummary: autoResultsSummary,
          judges: data.judges,
          companies: data.companies,
          categories: data.categories,
        }),
      });

      const payload = await readJsonResponse(response);
      if (response.ok && payload.judges && payload.categories) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                competition: (payload.competition as AdminCompetitionResponse["competition"]) ?? prev.competition,
                judges: payload.judges as AdminCompetitionResponse["judges"],
                companies:
                  (payload.companies as AdminCompetitionResponse["companies"] | undefined) ??
                  prev.companies,
                categories: payload.categories as AdminCompetitionResponse["categories"],
              }
            : prev,
        );
      }
      if (response.ok) {
        const preview = await loadResultsPreview();
        setResultsPreview(preview);
      }
      showToast(
        response.ok
          ? "5 Across settings saved and published to home page."
          : (payload.error as string | undefined) ?? "Unable to save settings.",
      );
    } catch {
      showToast("Unable to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveResultsSnapshot() {
    setIsSavingResults(true);
    const response = await fetch("/api/admin/competition/save-results", { method: "POST" });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      showToast((payload.error as string | undefined) ?? "Unable to save results.");
      setIsSavingResults(false);
      return;
    }

    setData((prev) =>
      prev
        ? {
            ...prev,
            competition: {
              ...prev.competition,
              resultsSummary: payload.resultsSummary as string,
            },
          }
        : prev,
    );
    const [preview, history] = await Promise.all([loadResultsPreview(), loadArchivedCompetitions()]);
    setResultsPreview(preview);
    setArchived(history);
    showToast("Results saved to archive.");
    setIsSavingResults(false);
  }

  function endCurrentCompetition() {
    if (!data) return;
    setPendingConfirm({ type: "end-current" });
  }

  async function executeEndCurrentCompetition() {
    if (!data) return;

    const oldName = data.competition.name;
    setIsArchiving(true);

    const response = await fetch("/api/admin/competition/end", { method: "POST" });
    const payload = await readJsonResponse(response);
    if (!response.ok) {
      showToast((payload.error as string | undefined) ?? "Unable to end competition.");
      setIsArchiving(false);
      return;
    }

    await refresh();
    showToast(`"${oldName}" results have been computed and the competition is archived.`);
    setIsArchiving(false);
  }

  function startNewCompetition() {
    if (data) {
      showToast("End the current competition before starting a new one.");
      return;
    }
    setPendingPrompt({
      type: "start-next",
      defaultValue: archived[0]?.name ?? "5 Across",
    });
  }

  async function executeStartNewCompetition(nextName: string) {
    setIsStarting(true);

    const response = await fetch("/api/admin/competition/next", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextName }),
    });

    const payload = await readJsonResponse(response);
    if (!response.ok) {
      showToast((payload.error as string | undefined) ?? "Unable to start new competition.");
      setIsStarting(false);
      return;
    }

    const newName = (payload.nextCompetitionName as string | undefined) ?? nextName;
    await refresh();
    showToast(`"${newName}" is now the live competition.`);
    setIsStarting(false);
  }

  function createArchivedCompetition(templateId: string, templateName: string) {
    const baseName = "5 Across";
    setPendingPrompt({
      type: "create-archived",
      templateId,
      templateName,
      defaultValue:
        templateName.trim().toLowerCase() === baseName.toLowerCase()
          ? `${baseName} (copy)`
          : baseName,
    });
  }

  async function executeCreateArchivedCompetition(templateId: string, name: string) {
    setIsCreatingArchived(templateId);

    const response = await fetch("/api/admin/competitions/archived", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, name }),
    });
    const payload = await response.json();

    if (!response.ok) {
      showToast(payload.error ?? "Unable to create archived competition.");
      setIsCreatingArchived(null);
      return;
    }

    await refresh();
    showToast(`Created "${name}" in archive.`);
    setIsCreatingArchived(null);
  }

  function makeArchivedCompetitionLive(id: string, name: string) {
    setPendingConfirm({ type: "activate", id, name });
  }

  async function executeMakeArchivedCompetitionLive(id: string, name: string) {
    setIsActivatingArchived(id);

    const response = await fetch(`/api/admin/competitions/archived/${id}`, { method: "POST" });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      showToast((payload.error as string | undefined) ?? "Unable to activate competition.");
      setIsActivatingArchived(null);
      return;
    }

    await refresh();
    showToast(`"${name}" is now live and previous competition is archived.`);
    setIsActivatingArchived(null);
  }

  function deletePastCompetition(id: string, name: string) {
    setPendingConfirm({ type: "delete", id, name });
  }

  async function executeDeletePastCompetition(id: string, name: string) {
    setIsDeletingArchived(id);

    const response = await fetch(`/api/admin/competitions/archived/${id}`, { method: "DELETE" });
    const payload = await response.json();

    if (!response.ok) {
      showToast(payload.error ?? "Unable to delete archived competition.");
      setIsDeletingArchived(null);
      return;
    }

    setArchived((prev) => prev.filter((item) => item.id !== id));
    showToast(`Deleted "${name}".`);
    setIsDeletingArchived(null);
  }

  function handleConfirmDialog() {
    if (!pendingConfirm) return;

    const confirmType = pendingConfirm.type;

    if (confirmType === "end-current") {
      void executeEndCurrentCompetition();
    } else if (confirmType === "save-results") {
      void saveResultsSnapshot();
    } else if (confirmType === "activate") {
      void executeMakeArchivedCompetitionLive(pendingConfirm.id, pendingConfirm.name);
    } else if (confirmType === "delete") {
      void executeDeletePastCompetition(pendingConfirm.id, pendingConfirm.name);
    } else if (confirmType === "remove-category") {
      removeCategory(pendingConfirm.id);
    } else if (confirmType === "remove-judge") {
      removeJudge(pendingConfirm.id);
    } else if (confirmType === "delete-message") {
      void deleteIndividualJudgeMessage(pendingConfirm.id);
    }

    setPendingConfirm(null);
  }

  function resetSettingsToDefaults() {
    setData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        judges: DEFAULT_JUDGES.map((judge, index) => ({
          id: prev.judges[index]?.id ?? `new-judge-${index}`,
          name: judge.name,
          code: judge.code,
          message: null,
        })),
        companies: prev.companies.map((company, index) => ({
          ...company,
          name: DEFAULT_COMPANIES[index]?.name ?? company.name,
          presenter: null,
        })),
      };
    });
    showToast("Settings reset to default values. Click 'Publish Competition Settings' to apply to homepage.");
  }

  function handlePromptSubmit(name: string) {
    if (!pendingPrompt) return;

    if (pendingPrompt.type === "create-archived") {
      void executeCreateArchivedCompetition(pendingPrompt.templateId, name);
    } else if (pendingPrompt.type === "start-next") {
      void executeStartNewCompetition(name);
    } else if (pendingPrompt.type === "reset") {
      resetSettingsToDefaults();
    }

    setPendingPrompt(null);
  }

  return {
    isReady,
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
  };
}
