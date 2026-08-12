import { FormDialog } from "@/components/FormDialog";
import { ModalDeleteButton } from "@/components/admin/ModalDeleteButton";
import type { Category } from "@/components/admin/types";

type CategoriesModalProps = {
  open: boolean;
  categories: Category[];
  criteriaWeightTotal: number;
  onClose: () => void;
  onAddCategory: () => void;
  onCategoryNameChange: (id: string, name: string) => void;
  onCategoryWeightChange: (id: string, weight: number | "") => void;
  onRequestRemoveCategory: (id: string, name: string) => void;
};

export function CategoriesModal({
  open,
  categories,
  criteriaWeightTotal,
  onClose,
  onAddCategory,
  onCategoryNameChange,
  onCategoryWeightChange,
  onRequestRemoveCategory,
}: CategoriesModalProps) {
  const weightsValid = criteriaWeightTotal === 100;

  return (
    <FormDialog
      open={open}
      title="Manage Scoring Criteria"
      onClose={onClose}
      panelClassName="max-h-[90vh] max-w-2xl overflow-y-auto"
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-3">
          {!weightsValid ? (
            <p className="rounded border border-[#EE2524] bg-red-300 text-black px-2 py-2">
              Criteria weights must total 100% (currently {criteriaWeightTotal}%).
            </p>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            disabled={!weightsValid}
            className="dark-button rounded border border-black bg-gray-900 px-4 py-2 text-white"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onAddCategory}
          className="dark-button rounded border border-black bg-gray-900 px-3 py-2 text-white"
        >
          Add Category
        </button>
        <span
          className={`text-sm font-medium ${weightsValid ? "text-green-700" : "text-red-700"}`}
        >
          Weights: {criteriaWeightTotal}%
        </span>
      </div>
      {categories.map((category) => (
        <div key={category.id} className="space-y-2 rounded bg-white p-3">
          <div className="flex items-center gap-2">
            <input
              className="min-w-0 flex-1 rounded border p-2"
              value={category.name}
              placeholder="Criterion name"
              onChange={(event) => onCategoryNameChange(category.id, event.target.value)}
            />
            <ModalDeleteButton
              onClick={() => onRequestRemoveCategory(category.id, category.name)}
              disabled={categories.length <= 1}
              aria-label={`Remove ${category.name || "category"}`}
            />
          </div>
          <label className="block text-sm">
            Weight (%)
            <input
              type="number"
              className="mt-1 w-full rounded border p-2"
              value={category.weight}
              onChange={(event) =>
                onCategoryWeightChange(
                  category.id,
                  event.target.value === "" ? "" : Number(event.target.value),
                )
              }
            />
          </label>
        </div>
      ))}
    </FormDialog>
  );
}
