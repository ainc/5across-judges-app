"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormDialog } from "@/components/FormDialog";
import { ModalDeleteButton } from "@/components/admin/ModalDeleteButton";

export type PreviousJudgeOption = {
  id: string;
  name: string;
  username: string;
};

type PreviousJudgesModalProps = {
  open: boolean;
  currentUsernames: string[];
  onClose: () => void;
  onAdd: (judges: Array<{ name: string; username: string }>) => void;
};

function usernameKey(username: string) {
  return username.trim().toLowerCase();
}

export function PreviousJudgesModal({ open, currentUsernames, onClose, onAdd }: PreviousJudgesModalProps) {
  const [judges, setJudges] = useState<PreviousJudgeOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PreviousJudgeOption | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setSelectedIds([]);
    setError("");
    setIsLoading(true);

    void (async () => {
      try {
        const response = await fetch("/api/admin/previous-judges", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as {
          judges?: PreviousJudgeOption[];
          error?: string;
        } | null;
        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to load previous judges.");
        }
        if (!cancelled) setJudges(payload?.judges ?? []);
      } catch (loadError) {
        if (!cancelled) {
          setJudges([]);
          setError(loadError instanceof Error ? loadError.message : "Unable to load previous judges.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const taken = new Set(currentUsernames.map(usernameKey).filter(Boolean));

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function addSelected() {
    const chosen = judges.filter((judge) => selectedIds.includes(judge.id) && !taken.has(usernameKey(judge.username)));
    if (chosen.length === 0) return;
    onAdd(chosen.map((judge) => ({ name: judge.name, username: judge.username })));
    onClose();
  }

  async function confirmDelete() {
    if (!pendingDelete || isDeleting) return;
    setIsDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/previous-judges/${pendingDelete.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to remove that judge from the list.");
      }
      setJudges((prev) => prev.filter((judge) => judge.id !== pendingDelete.id));
      setSelectedIds((prev) => prev.filter((id) => id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to remove that judge from the list.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <FormDialog
        open
        title="Select from Previous Judges"
        titleId="previous-judges-title"
        layerClassName="z-[1200]"
        onClose={onClose}
        onSave={addSelected}
        saveLabel="Add Judges"
        saveDisabled={isLoading || selectedIds.length === 0 || isDeleting}
        panelClassName="max-h-[90vh] max-w-lg overflow-y-auto"
      >
        <p className="text-sm text-muted">
          Judges are added here when you save them in Manage Judges, and they stay after you remove them from a
          competition. Add Judges puts the selected people on the current list. Save Manage Judges to create their
          logins.
        </p>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {isLoading ? <p className="text-sm text-muted">Loading previous judges...</p> : null}
        {!isLoading && !error && judges.length === 0 ? (
          <p className="text-sm text-muted">No previous judges yet. Save a judge in Manage Judges to start the list.</p>
        ) : null}
        <div className="space-y-2">
          {judges.map((judge) => {
            const alreadyAdded = taken.has(usernameKey(judge.username));
            const checked = selectedIds.includes(judge.id);
            return (
              <div key={judge.id} className="flex items-center gap-2 rounded bg-surface p-3">
                <label className={`flex min-w-0 flex-1 items-start gap-3 ${alreadyAdded ? "opacity-60" : ""}`}>
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={checked && !alreadyAdded}
                    disabled={alreadyAdded || isDeleting}
                    aria-label={`Select ${judge.name || judge.username}`}
                    onChange={() => toggle(judge.id)}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">{judge.name}</span>
                    <span className="block text-sm text-muted">{judge.username}</span>
                    {alreadyAdded ? <span className="block text-xs text-muted">Already added</span> : null}
                  </span>
                </label>
                <ModalDeleteButton
                  onClick={() => setPendingDelete(judge)}
                  disabled={isDeleting}
                  aria-label={`Remove ${judge.name || judge.username} from previous judges`}
                />
              </div>
            );
          })}
        </div>
      </FormDialog>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove from Previous Judges?"
        titleId="remove-previous-judge-title"
        layerClassName="z-[1300]"
        message={
          pendingDelete
            ? `Remove "${pendingDelete.name}" (${pendingDelete.username}) from the previous judges list?\n\nThis does not remove them from the current competition. They show up here again if you add that username as a new judge and save.`
            : ""
        }
        confirmLabel={isDeleting ? "Removing..." : "Remove"}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
      />
    </>,
    document.body,
  );
}
