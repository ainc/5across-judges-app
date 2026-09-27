type StyledTableProps = {
  children: React.ReactNode;
  tableClassName?: string;
};

export const thClass = "border-r border-b p-2 text-left";
export const tdClass = "border-r border-b p-2";

export function StyledTable({ children, tableClassName }: StyledTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border">
      <div className="overflow-auto">
        <table
          className={["styled-table min-w-full border-collapse", tableClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </table>
      </div>
    </section>
  );
}
