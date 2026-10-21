type StyledTableProps = {
  children: React.ReactNode;
  tableClassName?: string;
  className?: string;
};

export const thClass = "border-r border-b p-2 text-left";
export const tdClass = "border-r border-b p-2";

export function StyledTable({ children, tableClassName, className }: StyledTableProps) {
  const fill = className?.includes("h-full") ?? false;
  return (
    <section className={["overflow-hidden rounded-xl border", className].filter(Boolean).join(" ")}>
      <div className={fill ? "h-full overflow-hidden" : "overflow-auto"}>
        <table
          className={["styled-table min-w-full border-collapse", fill ? "h-full" : "", tableClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </table>
      </div>
    </section>
  );
}
