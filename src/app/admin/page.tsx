import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminDashboard />;
}
