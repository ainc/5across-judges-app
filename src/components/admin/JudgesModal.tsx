import { FormDialog } from "@/components/FormDialog";
import type { Judge } from "@/components/admin/types";

type JudgesModalProps = {
  open: boolean;
  judges: Judge[];
  messageStatus: Record<string, string>;
  onClose: () => void;
  onAddJudge: () => void;
  onJudgeNameChange: (id: string, name: string) => void;
  onJudgeCodeChange: (id: string, code: string) => void;
  onJudgeMessageChange: (id: string, message: string) => void;
  onRequestRemoveJudge: (id: string, name: string) => void;
  onSendMessage: (id: string) => void;
  onRequestDeleteMessage: (id: string, name: string) => void;
};

export function JudgesModal({
  open,
  judges,
  messageStatus,
  onClose,
  onAddJudge,
  onJudgeNameChange,
  onJudgeCodeChange,
  onJudgeMessageChange,
  onRequestRemoveJudge,
  onSendMessage,
  onRequestDeleteMessage,
}: JudgesModalProps) {
  return (
    <FormDialog
      open={open}
      title="Manage Judges"
      onClose={onClose}
      panelClassName="max-h-[90vh] max-w-2xl overflow-y-auto"
    >
      <button
        type="button"
        onClick={onAddJudge}
        className="dark-button rounded border border-black bg-gray-900 px-3 py-2 text-white"
      >
        Add Judge
      </button>
      {judges.map((judge) => (
        <div key={judge.id} className="space-y-2 rounded bg-white p-3">
          <div className="flex flex-wrap items-start gap-2">
            <input
              className="min-w-0 flex-1 rounded border p-2"
              value={judge.name}
              placeholder="Judge name"
              onChange={(event) => onJudgeNameChange(judge.id, event.target.value)}
            />
            <button
              type="button"
              onClick={() => onRequestRemoveJudge(judge.id, judge.name)}
              disabled={judges.length <= 1}
              className="deletebutton"
            >
              <div className="delete-container">
                <img src="/images/deletebutton.png" alt="Delete Button" className="deletebutton" />
                <img src="/images/graydeletebutton.png" alt="Hovered Delete Button" className="graydeletebutton" />
              </div>
            </button>
          </div>
          <input
            className="min-w-0 flex-1 rounded border p-2"
            value={judge.code ?? ""}
            placeholder="Code (optional)"
            onChange={(event) => onJudgeCodeChange(judge.id, event.target.value)}
          />
        </div>
      ))}
    </FormDialog>
  );
}
