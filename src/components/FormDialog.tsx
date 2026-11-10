import type { ReactNode } from "react";

type FormDialogProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSave?: () => void;
  children: ReactNode;
  closeLabel?: string;
  saveLabel?: string;
  saveDisabled?: boolean;
  isSaving?: boolean;
  footer?: ReactNode;
  footerExtra?: ReactNode;
  panelClassName?: string;
  layerClassName?: string;
  titleId?: string;
};

export function FormDialog({
  open,
  title = "Edit",
  onClose,
  onSave,
  children,
  closeLabel = "Done",
  saveLabel = "Save",
  saveDisabled = false,
  isSaving = false,
  footer,
  footerExtra,
  panelClassName = "max-w-md",
  layerClassName = "z-[1100]",
  titleId = "form-dialog-title",
}: FormDialogProps) {
  if (!open) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 ${layerClassName}`}>
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 appearance-none border-0 bg-black/40 p-0 hover:bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full rounded border bg-surface p-6 shadow-lg ${panelClassName}`}
      >
        <img
          src="/images/5acrossbanner.png"
          alt="5 Across Banner"
          className="fiveacross-banner mx-auto mb-4 h-20 w-20 object-contain"
        />
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-4 space-y-3">{children}</div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          {footer ?? (
            <>
              {footerExtra}
              {onSave ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSaving}
                    className="white-button rounded border border-border bg-surface px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saveDisabled || isSaving}
                    className="dark-button rounded border border-border bg-gray-900 px-4 py-2 text-white"
                  >
                    {isSaving ? "Saving..." : saveLabel}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="dark-button rounded border border-border bg-gray-900 px-4 py-2 text-white"
                >
                  {closeLabel}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
