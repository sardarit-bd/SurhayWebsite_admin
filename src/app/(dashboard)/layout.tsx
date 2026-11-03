import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminShell from "../../components/AdminShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.isAdmin) {
    redirect("/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
