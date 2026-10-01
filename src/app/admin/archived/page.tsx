import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ArchivedCompetitionsPage } from "@/components/admin/ArchivedCompetitionsPage";

export default async function AdminArchivedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <ArchivedCompetitionsPage />;
}
