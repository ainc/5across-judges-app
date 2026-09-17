export type Judge = { id: string; name: string; code: string | null; message: string | null };
export type Company = { id: string; name: string; presenter?: string | null };
export type Category = { id: string; name: string; weight: number; maxScore: number };

export type ActiveCompetitionResponse = {
  competition: {
    id: string;
    name: string;
    eventDate: string;
    judgeMessage: string | null;
    updatedAt: string;
  };
  configRevision: string;
  judges: Judge[];
  companies: Company[];
  categories: Category[];
};

export type SubmissionStatus = "DRAFT" | "FINAL";

export type JudgeScoresResponse = {
  status: SubmissionStatus | null;
  submittedAt: string | null;
  updatedAt: string | null;
  entries: Array<{ companyId: string; categoryId: string; score: number }>;
};

export type PendingConfirm = { type: "submit-final" } | null;

export type ScoreUndo = {
  companyId: string;
  categoryId: string;
  previous: number | undefined;
};

export type ScoreChange = {
  companyId: string;
  categoryId: string;
  from: number | null;
  to: number | null;
  changedAt: string;
};

export type Toast = { id: number; message: string };
