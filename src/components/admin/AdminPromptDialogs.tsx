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
        message="Settings of new competition can be edited at any time by making it live."
        label="Competition Name:"
        defaultValue={pendingPrompt?.type === "create-archived" ? pendingPrompt.defaultValue : ""}
        confirmLabel="Create"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
      <PromptDialog
        open={pendingPrompt?.type === "start-next"}
        title="Name New Competition"
        message="Choose a name for the new active competition. The current competition will be archived with its results."
        label="Competition Name:"
        defaultValue={pendingPrompt?.type === "start-next" ? pendingPrompt.defaultValue : ""}
        confirmLabel="Start New Competition"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
      <PromptDialog
        open={pendingPrompt?.type === "reset"}
        title="Reset Settings?"
        message={`Overwrite current competition settings and reset to default values?\n\nValues will only be updated in Admin Dashboard, 'Publish Competition Settings' must be clicked to implement changes to homepage.`}
        confirmLabel="Reset"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </>
  );
}
