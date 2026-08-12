import { FormDialog } from "@/components/FormDialog";
import type { Judge } from "@/components/admin/types";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";

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
          <div className="flex items-center gap-2">
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
              className="modaldelete h-9 w-9 shrink-0 self-center"
              aria-label={`Remove ${judge.name || "judge"}`}
            >
              <div className="modaldelete-container" aria-hidden>
                <DeleteForeverIcon className="modaldelete-icon" fontSize="inherit" />
                <DeleteForeverOutlinedIcon className="graymodaldelete" fontSize="inherit" />
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
