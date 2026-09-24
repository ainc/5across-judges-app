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
        src="https://awesomeinc.org/static/03d26df95cda6e973c41adb3678dd8a2/d66c5/5AcrossLogo_15_black%406x.webp"
        alt="5 Across Banner"
        width={200}
        height={48}
        className="h-12 w-auto shrink-0"
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