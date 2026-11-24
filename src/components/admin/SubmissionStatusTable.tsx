import type { ReactNode } from "react";
import type { Judge } from "@/components/admin/types";

type Company = { id: string; name: string };

const submittedColor = "#111827";
const missingColor = "#EC3641";

function StatusMark({
  submitted,
  decorative = false,
  compact = false,
}: {
  submitted: boolean;
  decorative?: boolean;
  compact?: boolean;
}) {
  const size = compact ? 14 : 18;
  return (
    <span
      className={`inline-flex items-center justify-center ${compact ? "" : "h-8 w-full rounded-lg bg-[#d1d5db]"}`}
      style={{ color: submitted ? submittedColor : missingColor }}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : submitted ? "Submitted" : "Not Submitted"}
    >
      {submitted ? <CheckIcon size={size} /> : <XIcon size={size} />}
    </span>
  );
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8.5 6.2 12 13 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SubmissionStatusTable({
  judges,
  companies,
  submissions,
  footer,
}: {
  judges: Judge[];
  companies: Company[];
  submissions: Array<{ judgeId: string; companyId: string }>;
  footer?: ReactNode;
}) {
  const submitted = new Set(submissions.map((item) => `${item.judgeId}:${item.companyId}`));

  if (judges.length === 0 || companies.length === 0) {
    return (
      <div>
        <p className="text-sm text-muted">Add judges and companies to see submission status.</p>
        {footer ? <div className="mt-3 text-left">{footer}</div> : null}
      </div>
    );
  }

  return (
    <div className="w-max max-w-full">
      <div className="overflow-x-auto">
        <table className="w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-0 pr-2 text-left font-semibold" />
              {judges.map((judge) => (
                <th key={judge.id} className="p-0 pl-3 text-center font-semibold text-[#111827]">
                  <div className="w-40">{judge.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((company, index) => (
              <tr key={company.id}>
                <th className="p-0 pr-2 text-left font-medium text-[#111827]">
                  Pitch {index + 1} - {company.name}
                </th>
                {judges.map((judge) => {
                  const isSubmitted = submitted.has(`${judge.id}:${company.id}`);
                  return (
                    <td key={judge.id} className="p-0 pl-3 pt-1 text-center">
                      <div className="w-40">
                        <StatusMark submitted={isSubmitted} />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div>{footer}</div>
        <div className="flex gap-3 text-xs text-[#111827]">
          <span className="inline-flex items-center gap-1.5">
            <StatusMark submitted decorative compact />
            Submitted
          </span>
          <span className="inline-flex items-center gap-1.5">
            <StatusMark submitted={false} decorative compact />
            Not Submitted
          </span>
        </div>
      </div>
    </div>
  );
}
