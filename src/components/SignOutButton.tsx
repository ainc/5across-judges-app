"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { submitSignOut } from "@/components/submit-sign-out";
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
          submitSignOut();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
