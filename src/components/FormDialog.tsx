import type { ReactNode } from "react";

type FormDialogProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  closeLabel?: string;
  footer?: ReactNode;
  panelClassName?: string;
};

export function FormDialog({
  open,
  title = "Edit",
  onClose,
  children,
  closeLabel = "Done",
  footer,
  panelClassName = "max-w-md",
}: FormDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 appearance-none border-0 bg-black/40 p-0 hover:bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-dialog-title"
        className={`relative w-full rounded border bg-white p-6 shadow-lg ${panelClassName}`}
      >
        <img
          src="/images/5acrossbanner.png"
          alt="5 Across Banner"
          className="fiveacross-banner mx-auto mb-4 h-20 w-20 object-contain"
        />
        <h2 id="form-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-4 space-y-3">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          {footer ?? (
            <button
              type="button"
              onClick={onClose}
              className="dark-button rounded border border-black bg-gray-900 px-4 py-2 text-white"
            >
              {closeLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
