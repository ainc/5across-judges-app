import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { JudgingPage } from "@/components/JudgingPage";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  if (!isAdmin && !session.user.judgeId) {
    redirect("/login?error=CredentialsSignin");
  }

  return (
    <JudgingPage
      lockedJudgeId={isAdmin ? undefined : session.user.judgeId!}
      showAdminLink={isAdmin}
    />
  );
}
