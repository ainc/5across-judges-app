// src/components/AppHeader.tsx
import { AppNav } from "@/components/AppNav";

type AppHeaderProps = {
  showAdminLink?: boolean;
  className?: string;
  judgeName?: string;
};

export function AppHeader({ showAdminLink = false, className = "mb-12", judgeName }: AppHeaderProps) {
  return (
    <header className={`sticky top-0 z-50 flex w-full min-w-0 items-center gap-6 bg-background px-4 py-3 ${className}`}>
      <img
        src="/images/5-across.png"
        alt="5 Across"
        width={1696}
        height={524}
        className="brand-logo-light h-20 w-auto shrink-0"
      />
      <img
        src="/images/5-across-dark.png"
        alt=""
        width={1696}
        height={524}
        className="brand-logo-dark h-20 w-auto shrink-0"
      />
      <AppNav showAdminLink={showAdminLink} judgeName={judgeName} />
    </header>
  );
}
