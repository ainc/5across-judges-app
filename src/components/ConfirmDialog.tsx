type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClassName =
    variant === "danger"
      ? "red-button rounded border border-black bg-[#EE2524] px-2 py-1 text-white"
      : "dark-button rounded border border-black bg-gray-900 px-2 py-1 text-white";

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="dark-button absolute inset-0 bg-black/40"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded border bg-white p-6 shadow-lg"
      >
        <img src="/images/5acrossbanner.png" alt="5 Across Banner" className="fiveacross-banner mx-auto mb-4 h-20 w-20 object-contain" />
        <h2 id="confirm-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="white-button rounded border border-black bg-white px-4 py-2"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={confirmClassName}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
