import { signOutAction } from "@/app/admin/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction} className="inline">
      <button type="submit" className="signoutbutton">
        Sign Out
      </button>
    </form>
  );
}
