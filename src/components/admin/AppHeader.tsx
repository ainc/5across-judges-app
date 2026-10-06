// src/components/AppHeader.tsx
import { AppNav } from "@/components/AppNav";

type AppHeaderProps = {
  showAdminLink?: boolean;
  children?: React.ReactNode; // unique title / subtitle per page
  className?: string;
};

export function AppHeader({ showAdminLink = false, children, className = "mb-12" }: AppHeaderProps) {
  return (
    <header className={`sticky top-0 z-50 flex w-full min-w-0 items-center justify-between gap-4 overflow-hidden bg-white px-4 py-3 backdrop-blur-sm ${className}`}>

      <img
        src="/images/5-across.png"
        alt="5 Across"
        width={1696}
        height={524}
        className="h-20 w-auto shrink-0"
      />
    <div className="flex flex-col items-end text-right">
        <div className="page-header">
          {children}
        </div>
        <AppNav showAdminLink={showAdminLink} />
    </div>
    </header>
  );
}