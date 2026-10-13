"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type AppNavProps = {
  showAdminLink?: boolean;
};

const pages = [
  { href: "/", label: "Scoring" },
  { href: "/results", label: "Current Results" },
  { href: "/admin", label: "Admin Dashboard", admin: true },
];

export function AppNav({ showAdminLink = false }: AppNavProps) {
  const pathname = usePathname();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [canPortal, setCanPortal] = useState(false);

  useEffect(() => {
    setCanPortal(true);
  }, []);

  const links = pages.filter((page) => !page.admin || showAdminLink);

  return (
    <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-6 gap-y-1">
      {links.map((page) => {
        const active = pathname === page.href;
        return (
          <Link
            key={page.href}
            href={page.href}
            aria-current={active ? "page" : undefined}
            className="page-header origin-center text-right leading-tight transition-transform duration-150 hover:scale-110"
            style={{ fontWeight: active ? 700 : 400, fontSize: "0.8125rem" }}
          >
            {page.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="page-header origin-center text-right leading-tight transition-transform duration-150 hover:scale-110"
        style={{ fontWeight: 400, fontSize: "0.8125rem" }}
      >
        Sign Out
      </button>
      {canPortal
        ? createPortal(
            <ConfirmDialog
              open={confirmOpen}
              title="Sign Out?"
              message="You will need to sign in again to score or view results."
              confirmLabel="Sign Out"
              onConfirm={() => {
                setConfirmOpen(false);
                void signOutAction();
              }}
              onCancel={() => setConfirmOpen(false)}
            />,
            document.body,
          )
        : null}
    </nav>
  );
}
