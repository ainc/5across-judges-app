export type Judge = { id: string; name: string; code: string | null; message: string | null };
export type Company = { id: string; name: string; presenter: string | null };
export type Category = { id: string; name: string; weight: number; maxScore: number };

export type PendingConfirm =
  | { type: "start-next" }
  | { type: "save-results" }
  | { type: "activate"; id: string; name: string }
  | { type: "delete"; id: string; name: string }
  | { type: "remove-category"; id: string; name: string }
  | { type: "remove-judge"; id: string; name: string }
  | { type: "delete-message"; id: string; name: string }
  | null;

export type PendingPrompt =
  | {
      type: "create-archived";
      templateId: string;
      templateName: string;
      defaultValue: string;
    }
  | {
      type: "start-next";
      defaultValue: string;
    }
  | { type: "reset" }
  | null;

export type SectionModal = "judges" | "companies" | "categories" | null;

export type ArchivedCompetitionDetails = {
  competition: {
    id: string;
    name: string;
    eventDate: string;
    isActive: boolean;
    judgeMessage: string | null;
    resultsSummary: string | null;
  };
  judges: Array<{ name: string; code: string | null }>;
  companies: Array<{ name: string; presenter: string | null }>;
  categories: Array<{ name: string; weight: number }>;
  winner: string | null;
  finalSubmissionCount: number;
  rankings: Array<{ rank: number; companyName: string; finalScore: number; judgeCount: number }>;
};
