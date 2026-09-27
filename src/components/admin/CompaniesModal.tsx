import { FormDialog } from "@/components/FormDialog";
import type { Company } from "@/components/admin/types";

type CompaniesModalProps = {
  open: boolean;
  companies: Company[];
  onClose: () => void;
  onCompanyNameChange: (id: string, name: string) => void;
  onSave: () => void;
  isSaving?: boolean;
};

export function CompaniesModal({
  open,
  companies,
  onClose,
  onCompanyNameChange,
  onSave,
  isSaving = false,
}: CompaniesModalProps) {
  return (
    <FormDialog
      open={open}
      title="Manage Companies"
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
      panelClassName="max-h-[90vh] max-w-2xl overflow-y-auto"
    >
      {companies.map((company) => (
        <div key={company.id} className="space-y-2 rounded bg-white p-3">
          <input
            className="w-full rounded border p-2"
            value={company.name}
            placeholder="Company name"
            onChange={(event) => onCompanyNameChange(company.id, event.target.value)}
          />
        </div>
      ))}
    </FormDialog>
  );
}
