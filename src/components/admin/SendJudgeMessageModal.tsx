"use client";

import { useEffect, useState } from "react";
import { AppSelect } from "@/components/AppSelect";
import { FormDialog } from "@/components/FormDialog";
import type { Judge } from "@/components/admin/types";

type SendJudgeMessageModalProps = {
  open: boolean;
  judges: Judge[];
  onClose: () => void;
  onSend: (judgeId: string, message: string) => void;
};

export function SendJudgeMessageModal({
  open,
  judges,
  onClose,
  onSend,
}: SendJudgeMessageModalProps) {
  const [judgeId, setJudgeId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setMessage("");
    const firstAvailable = judges.find((judge) => !judge.message?.trim()) ?? judges[0];
    setJudgeId(firstAvailable?.id ?? "");
  }, [open, judges]);

  const selectedJudge = judges.find((judge) => judge.id === judgeId);
  const alreadySent = Boolean(selectedJudge?.message?.trim());
  const judgeName = selectedJudge?.name.trim() || "judge";

  return (
    <FormDialog
      open={open}
      title="Send Message to Judge"
      onClose={onClose}
      closeLabel="Cancel"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="white-button rounded border border-black bg-white px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!message.trim() || !judgeId || alreadySent}
            onClick={() => onSend(judgeId, message.trim())}
            className="dark-button rounded border border-black bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
          >
            Send Message
          </button>
        </>
      }
    >
      <label className="block text-sm">
        Judge
        <div className="mt-1">
          <AppSelect
            aria-label="Judge"
            className="h-9 w-full rounded border bg-white px-2 py-1"
            value={judgeId}
            onChange={(event) => setJudgeId(event.target.value)}
          >
            {judges.map((judge) => (
              <option key={judge.id} value={judge.id}>
                {judge.name.trim() || "Unnamed judge"}
                {judge.message?.trim() ? " (already sent)" : ""}
              </option>
            ))}
          </AppSelect>
        </div>
      </label>
      {alreadySent ? (
        <p className="text-sm text-gray-600">A message has already been sent to {judgeName}.</p>
      ) : (
        <label className="block text-sm">
          Message
          <textarea
            className="mt-1 w-full rounded border p-2"
            rows={4}
            value={message}
            placeholder={`Send message to ${judgeName}:`}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
      )}
    </FormDialog>
  );
}
