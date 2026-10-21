import { PromptDialog } from "@/components/PromptDialog";
import type { PendingPrompt } from "@/components/admin/types";

type AdminPromptDialogsProps = {
  pendingPrompt: PendingPrompt;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

export function AdminPromptDialogs({ pendingPrompt, onSubmit, onCancel }: AdminPromptDialogsProps) {
  return (
    <>
      <PromptDialog
        open={pendingPrompt?.type === "create-archived"}
        title="Create New Competition"
        message={`This adds an inactive competition to the archive. The live competition is left as it is.\n\nScoring criteria are copied from the live competition. Judges start as Judge A, B, and C with logins judge1, judge2, and judge3, and companies start as Company A through E. No scores are copied.\n\nYou can edit these settings later by making this competition live.`}
        label="Competition Name:"
        defaultValue={pendingPrompt?.type === "create-archived" ? pendingPrompt.defaultValue : ""}
        confirmLabel="Create"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
      <PromptDialog
        open={pendingPrompt?.type === "start-next"}
        title="Name New Competition"
        message="Choose a name for the new live competition."
        label="Competition Name:"
        defaultValue={pendingPrompt?.type === "start-next" ? pendingPrompt.defaultValue : ""}
        confirmLabel="Start New Competition"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
      <PromptDialog
        open={pendingPrompt?.type === "reset"}
        title="Reset Settings?"
        message={`Overwrite current judges and company names with default values?\n\nValues will only update in the Admin Dashboard. Open Manage Judges and Manage Companies and click Save to apply them.`}
        confirmLabel="Reset"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </>
  );
}
