import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

type AppNavProps = {
  showAdminLink?: boolean;
};

export function AppNav({ showAdminLink = false }: AppNavProps) {
  return (
    <nav className="flex flex-wrap gap-4 text-sm">
      <Link href="/" className="underline">
        Home
      </Link>
      <Link href="/results" className="underline">
        Current Results
      </Link>
      {showAdminLink ? (
        <Link href="/admin" className="underline">
          Admin Dashboard
        </Link>
      ) : null}
      <SignOutButton />
    </nav>
  );
}