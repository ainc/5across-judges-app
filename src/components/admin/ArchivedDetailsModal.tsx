import { FormDialog } from "@/components/FormDialog";
import type { ArchivedCompetitionDetails } from "@/components/admin/types";
import { formatEventDate } from "@/lib/competition-results";

type ArchivedDetailsModalProps = {
  details: ArchivedCompetitionDetails | null;
  onClose: () => void;
};

export function ArchivedDetailsModal({ details, onClose }: ArchivedDetailsModalProps) {
  return (
    <FormDialog
      open={details !== null}
      title={`Name: "${details?.competition.name}"`}
      onClose={onClose}
      panelClassName="max-h-[90vh] max-w-2xl overflow-y-auto"
    >
      {details && (
        <div className="space-y-4 text-sm">
          <p>
            <span className="font-semibold">Event Date:</span>{" "}
            {formatEventDate(details.competition.eventDate)}
          </p>
          <p>
            <span className="font-semibold">Winner:</span> {details.winner ?? "TBD"}
          </p>
          <p>
            <span className="font-semibold">Final Submissions:</span> {details.finalSubmissionCount}
          </p>
          <div>
            <p className="font-semibold">Judges</p>
            <ul className="mt-1 list-disc pl-5">
              {details.judges.map((judge) => (
                <li key={judge.name}>
                  {judge.name}
                  {judge.code ? ` (${judge.code})` : ""}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Companies</p>
            <ul className="mt-1 list-disc pl-5">
              {details.companies.map((company) => (
                <li key={company.name}>
                  {company.name}
                  {company.presenter?.trim() ? ` — Presenter(s): ${company.presenter.trim()}` : ""}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Scoring Criteria</p>
            <ul className="mt-1 list-disc pl-5">
              {details.categories.map((category) => (
                <li key={category.name}>
                  {category.name} <span className="text-xs text-gray-500">({category.weight}%)</span>
                </li>
              ))}
            </ul>
          </div>
          {details.rankings.length > 0 && (
            <div>
              <p className="font-semibold">Results</p>
              <ol className="mt-1 list-decimal pl-5">
                {details.rankings.map((row) => (
                  <li key={row.rank}>
                    {row.companyName} — {row.finalScore.toFixed(1)} ({row.judgeCount} judge
                    {row.judgeCount === 1 ? "" : "s"})
                  </li>
                ))}
              </ol>
            </div>
          )}
          {details.competition.judgeMessage && (
            <div>
              <p className="font-semibold">Judge Message</p>
              <p className="mt-1 whitespace-pre-wrap">{details.competition.judgeMessage}</p>
            </div>
          )}
        </div>
      )}
    </FormDialog>
  );
}
