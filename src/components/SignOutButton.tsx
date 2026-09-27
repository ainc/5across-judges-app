"use client";

import { signOutAction } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useState } from "react";

export function SignOutButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <button type="button" className="signoutbutton" onClick={() => setConfirmOpen(true)}>
        Sign Out
      </button>
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
      />
    </>
  );
}
