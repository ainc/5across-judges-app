// src/components/AppHeader.tsx
import { AppNav } from "@/components/AppNav";

type AppHeaderProps = {
  showAdminLink?: boolean;
  children?: React.ReactNode; // unique title / subtitle per page
};

export function AppHeader({ showAdminLink = false, children }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 mb-6 flex w-full items-center justify-between gap-4 overflow-visible bg-[#323232]/55 px-4 py-3 backdrop-blur-sm">

      <img
        src="https://awesomeinc.org/static/03d26df95cda6e973c41adb3678dd8a2/d66c5/5AcrossLogo_15_black%406x.webp"
        alt="5 Across Banner"
        className="fiveacross-banner"
      />
    <div className="flex flex-col items-end text-right">
        {children}
        <AppNav showAdminLink={showAdminLink} />
    </div>
    </header>
  );
}