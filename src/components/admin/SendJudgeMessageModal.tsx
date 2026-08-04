"use client";

import { useEffect, useState } from "react";
import { FormDialog } from "@/components/FormDialog";

type SendJudgeMessageModalProps = {
  open: boolean;
  judgeName: string;
  onClose: () => void;
  onSend: (message: string) => void;
};

export function SendJudgeMessageModal({
  open,
  judgeName,
  onClose,
  onSend,
}: SendJudgeMessageModalProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  return (
    <FormDialog
      open={open}
      title={`Send Message to ${judgeName || "judge"}`}
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
            disabled={!message.trim()}
            onClick={() => onSend(message.trim())}
            className="dark-button rounded border border-black bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
          >
            Send Message
          </button>
        </>
      }
    >
      <label className="block text-sm">
        Message
        <textarea
          className="mt-1 w-full rounded border p-2"
          rows={4}
          value={message}
          placeholder={`Send message to ${judgeName || "judge"}:`}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
    </FormDialog>
  );
}
