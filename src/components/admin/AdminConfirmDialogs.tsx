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
        open={pendingConfirm?.type === "start-next"}
        title="End Current Competition?"
        message={
          "End this competition and archive its results? Competition can be made live again to edit settings.\n\nEnding current competition will require the creation and naming of a new competition."
        }
        confirmLabel="End Current / Create New Competition"
        variant="danger"
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
        variant="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "remove-category"}
        title="Delete Category?"
        message={`Delete "${pendingConfirm?.type === "remove-category" ? pendingConfirm.name : ""}"? Remaining category weights must equal 100%.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "remove-judge"}
        title="Delete Judge?"
        message={`"${pendingConfirm?.type === "remove-judge" ? pendingConfirm.name : ""}" will be deleted from this competition.\n\nJudges can be readded at any time.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      <ConfirmDialog
        open={pendingConfirm?.type === "delete-message"}
        title="Delete Judge Message?"
        message={`Message to "${pendingConfirm?.type === "delete-message" ? pendingConfirm.name : ""}" will be deleted.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </>
  );
}
