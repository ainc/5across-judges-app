import type { Judge } from "@/components/admin/types";

type Company = { id: string; name: string };

export function SubmissionStatusTable({
  judges,
  companies,
  submissions,
}: {
  judges: Judge[];
  companies: Company[];
  submissions: Array<{ judgeId: string; companyId: string }>;
}) {
  const submitted = new Set(submissions.map((item) => `${item.judgeId}:${item.companyId}`));

  if (judges.length === 0 || companies.length === 0) {
    return <p className="text-sm text-muted">Add judges and companies to see submission status.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left font-semibold">Judge</th>
            {companies.map((company, index) => (
              <th key={company.id} className="p-2 text-center font-semibold">
                Pitch {index + 1} - {company.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {judges.map((judge) => (
            <tr key={judge.id}>
              <th className="p-2 text-left font-medium">{judge.name}</th>
              {companies.map((company) => {
                const isSubmitted = submitted.has(`${judge.id}:${company.id}`);
                return (
                  <td key={company.id} className="p-2 text-center">
                    <span
                      className="inline-flex min-w-28 justify-center rounded px-2 py-1 text-xs font-semibold"
                      style={
                        isSubmitted
                          ? { backgroundColor: "#e5e7eb", color: "#111827" }
                          : { backgroundColor: "#EC3641", color: "#000000" }
                      }
                    >
                      {isSubmitted ? "Submitted" : "Not Submitted"}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
