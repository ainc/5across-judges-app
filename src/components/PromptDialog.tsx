import { useEffect, useState } from "react";

type PromptDialogProps = {
  open: boolean;
  title?: string;
  message?: string;
  label?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

export function PromptDialog({
  open,
  title = "Enter value",
  message,
  label,
  defaultValue = "",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onSubmit,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  if (!open) return null;

  const requiresInput = Boolean(label);

  function handleSubmit() {
    const trimmed = value.trim();
    if (requiresInput && !trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 appearance-none border-0 bg-black/40 p-0 hover:bg-black/40"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-dialog-title"
        className="relative w-full max-w-md rounded border bg-white p-6 shadow-lg"
      >
        <img src="/images/5acrossbanner.png" alt="5 Across Banner" className="fiveacross-banner mx-auto mb-4 h-20 w-20 object-contain" />
        <h2 id="prompt-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        {message && <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">{message}</p>}
        {requiresInput ? (
          <label className="mt-4 block text-sm">
            {label}
            <input
              autoFocus
              className="mt-1 w-full rounded border p-2"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSubmit();
              }}
            />
          </label>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="white-button rounded border border-black bg-white px-4 py-2"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={requiresInput && !value.trim()}
            className="dark-button rounded border border-black bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
