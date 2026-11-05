"use client";

import { useEffect, useState } from "react";
import { FormDialog } from "@/components/FormDialog";
import { ModalDeleteButton } from "@/components/admin/ModalDeleteButton";
import { PreviousJudgesModal } from "@/components/admin/PreviousJudgesModal";
import type { Judge } from "@/components/admin/types";

type JudgesModalProps = {
  open: boolean;
  judges: Judge[];
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

  useEffect(() => {
    if (!open) setPreviousOpen(false);
  }, [open]);

  return (
    <FormDialog
      open={open}
      title="Manage Judges"
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
      panelClassName="max-h-[90vh] max-w-2xl overflow-y-auto"
    >
      <p className="text-sm text-muted">
        Each judge needs a username. Saving a new judge creates a login with that username and the shared judge
        password. Changing a judge&apos;s name leaves their username as it is. Edit the username to change that
        login.
      </p>
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
              className="mt-1 w-full rounded border p-2 text-sm"
              value={judge.username}
              placeholder="Username (required)"
              aria-label={`Username for ${judge.name || "new judge"}`}
              onChange={(event) => onJudgeUsernameChange(judge.id, event.target.value)}
            />
          </label>
        </div>
      ))}
      <PreviousJudgesModal
        open={previousOpen}
        currentUsernames={judges.map((judge) => judge.username)}
        onClose={() => setPreviousOpen(false)}
        onAdd={onAddPreviousJudges}
      />
    </FormDialog>
  );
}
