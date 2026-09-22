type StyledTableProps = {
  children: React.ReactNode;
  tableClassName?: string;
};

export const thClass = "border p-2 text-left";
export const tdClass = "border p-2";

export function StyledTable({ children, tableClassName }: StyledTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border">
      <div className="overflow-auto">
        <table
          className={["min-w-full border-collapse", tableClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </table>
      </div>
    </section>
  );
}
