"use client";

import { useEffect, useState } from "react";
import { FormDialog } from "@/components/FormDialog";
import { ModalDeleteButton } from "@/components/admin/ModalDeleteButton";
import { PreviousJudgesModal } from "@/components/admin/PreviousJudgesModal";
import type { Judge } from "@/components/admin/types";
import { loadReservedUsernames } from "@/lib/admin-api";
import { takenUsernameMessage, usernameKey } from "@/lib/judge-usernames";

type JudgesModalProps = {
  open: boolean;
  judges: Judge[];
  savedUsernames: Record<string, string>;
  messageStatus: Record<string, string>;
  onClose: () => void;
  onAddJudge: () => void;
  onAddPreviousJudges: (judges: Array<{ name: string; username: string }>) => void;
  onJudgeNameChange: (id: string, name: string) => void;
  onJudgeUsernameChange: (id: string, username: string) => void;
  onJudgeMessageChange: (id: string, message: string) => void;
  onRequestRemoveJudge: (id: string, name: string) => void;
  onSendMessage: (id: string) => void;
  onRequestDeleteMessage: (id: string, name: string) => void;
  onSave: () => void;
  isSaving?: boolean;
};

export function JudgesModal({
  open,
  judges,
  savedUsernames,
  messageStatus,
  onClose,
  onAddJudge,
  onAddPreviousJudges,
  onJudgeNameChange,
  onJudgeUsernameChange,
  onJudgeMessageChange,
  onRequestRemoveJudge,
  onSendMessage,
  onRequestDeleteMessage,
  onSave,
  isSaving = false,
}: JudgesModalProps) {
  const [previousOpen, setPreviousOpen] = useState(false);
  const [trackedOpen, setTrackedOpen] = useState(open);
  const [reservedState, setReservedState] = useState<{
    open: boolean;
    usernames: string[] | null;
    error: string;
  }>({ open: false, usernames: null, error: "" });

  if (trackedOpen !== open) {
    setTrackedOpen(open);
    if (!open) setPreviousOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const usernames = await loadReservedUsernames();
      if (cancelled) return;
      if (!usernames) {
        setReservedState({ open: true, usernames: [], error: "Unable to check existing usernames." });
        return;
      }
      setReservedState({ open: true, usernames, error: "" });
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const reservedUsernames = reservedState.open === open ? reservedState.usernames : null;
  const reservedError = reservedState.open === open ? reservedState.error : "";

  const usernameErrors = new Map(
    judges.map((judge) => [
      judge.id,
      reservedUsernames
        ? takenUsernameMessage({
            username: judge.username,
            savedUsername: savedUsernames[judge.id],
            reusedUsername: judge.reusedUsername,
            otherUsernames: judges.filter((other) => other.id !== judge.id).map((other) => other.username),
            reservedUsernames,
          })
        : null,
    ]),
  );
  const hasUsernameError = [...usernameErrors.values()].some(Boolean);

  return (
    <FormDialog
      open={open}
      title="Manage Judges"
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
      saveDisabled={hasUsernameError || reservedUsernames === null || Boolean(reservedError)}
      panelClassName="max-h-[90vh] max-w-2xl overflow-y-auto"
    >
      <p className="text-sm text-muted">
        Each judge needs a username. Saving a new judge creates a login with that username and the shared judge
        password. Changing a judge&apos;s name leaves their username as it is. Edit the username to change that
        login. A new username cannot match an existing account.
      </p>
      {reservedError ? <p className="text-sm text-danger">{reservedError}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAddJudge}
          className="dark-button rounded border border-border bg-gray-900 px-3 py-2 text-white"
        >
          Add Judge
        </button>
        <button
          type="button"
          onClick={() => setPreviousOpen(true)}
          className="white-button rounded border border-border bg-surface px-3 py-2"
        >
          Select from Previous Judges
        </button>
      </div>
      {judges.map((judge) => (
        <div key={judge.id} className="space-y-2 rounded bg-surface p-3">
          <div className="flex items-center gap-2">
            <input
              className="min-w-0 flex-1 rounded border p-2"
              value={judge.name}
              placeholder="Judge name"
              onChange={(event) => onJudgeNameChange(judge.id, event.target.value)}
            />
            <ModalDeleteButton
              onClick={() => onRequestRemoveJudge(judge.id, judge.name)}
              disabled={judges.length <= 1}
              aria-label={`Remove ${judge.name || "judge"}`}
            />
          </div>
          <label className="block text-xs font-medium text-muted">
            Username
            <input
              className={`mt-1 w-full rounded border p-2 text-sm ${usernameErrors.get(judge.id) ? "border-danger-border" : ""}`}
              value={judge.username}
              placeholder="Username (required)"
              aria-label={`Username for ${judge.name || "new judge"}`}
              aria-invalid={Boolean(usernameErrors.get(judge.id))}
              aria-describedby={usernameErrors.get(judge.id) ? `judge-username-error-${judge.id}` : undefined}
              onChange={(event) => onJudgeUsernameChange(judge.id, event.target.value)}
            />
          </label>
          {usernameErrors.get(judge.id) ? (
            <p id={`judge-username-error-${judge.id}`} className="text-sm text-danger">
              {usernameErrors.get(judge.id)}
            </p>
          ) : null}
        </div>
      ))}
      <PreviousJudgesModal
        open={previousOpen}
        currentUsernames={judges.map((judge) => judge.username)}
        onClose={() => setPreviousOpen(false)}
        onAdd={onAddPreviousJudges}
        onRemoved={(username) => {
          const key = usernameKey(username);
          setReservedState((current) => ({
            ...current,
            usernames: current.usernames?.filter((item) => usernameKey(item) !== key) ?? current.usernames,
          }));
        }}
      />
    </FormDialog>
  );
}
