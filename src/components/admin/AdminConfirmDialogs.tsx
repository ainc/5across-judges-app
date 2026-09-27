import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { PendingConfirm } from "@/components/admin/types";

type AdminConfirmDialogsProps = {
  pendingConfirm: PendingConfirm;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminConfirmDialogs({ pendingConfirm, onConfirm, onCancel }: AdminConfirmDialogsProps) {
  return (
    <>
      <ConfirmDialog
        open={pendingConfirm?.type === "save-results"}
        title="Save & Copy Competition?"
        message={
          "Current competition will remain active, and a copy will be created in the archive."
        }
        confirmLabel="Save & Copy"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "save-details"}
        title="Save Competition Details?"
        message={
          "Save the competition name, date, and summary to the live competition?\n\nJudges, companies, and scoring criteria are saved from their Manage windows. This does not end the competition or archive results."
        }
        confirmLabel="Save"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "end-current"}
        title="End Current Competition?"
        message={
          "Compute this competition's results and move it to the archive?\n\nThis does not start a new live competition. Use Start New Competition after ending."
        }
        confirmLabel="End and Archive"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "activate"}
        title="Make Competition Live?"
        message={`Make "${pendingConfirm?.type === "activate" ? pendingConfirm.name : ""}" the active competition? The current active competition will be archived.\n\nArchived competition cannot be made active if it shares the same name as currently active competition.`}
        confirmLabel="Make Live"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "delete"}
        title="Delete Competition?"
        message={`Delete "${pendingConfirm?.type === "delete" ? pendingConfirm.name : ""}"? Archived competitions cannot be restored upon deletion.`}
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "remove-category"}
        title="Delete Category?"
        message={`Delete "${pendingConfirm?.type === "remove-category" ? pendingConfirm.name : ""}"? Remaining category weights must equal 100%.`}
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "remove-judge"}
        title="Delete Judge?"
        message={`"${pendingConfirm?.type === "remove-judge" ? pendingConfirm.name : ""}" will be deleted from this competition.\n\nJudges can be readded at any time.`}
        confirmLabel="Remove"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "delete-message"}
        title="Delete Judge Message?"
        message={`Message to "${pendingConfirm?.type === "delete-message" ? pendingConfirm.name : ""}" will be deleted.`}
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </>
  );
}
