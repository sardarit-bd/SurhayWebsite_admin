import { prisma } from "@/lib/db";
import ChangePasswordForm from "../../../components/ChangePasswordForm";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const admin = await prisma.admin.findUnique({
    where: { username: "admin" },
    select: { username: true, updatedAt: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="mt-1 text-sm text-(--muted)">
          Manage your admin account.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-1">
          <h2 className="mb-4 text-base font-semibold">Account</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-(--muted)">
                Username
              </dt>
              <dd className="mt-1 text-sm">{admin?.username ?? "admin"}</dd>
            </div>
            {admin && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-(--muted)">
                  Last updated
                </dt>
                <dd className="mt-1 text-sm">
                  {new Date(admin.updatedAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="card lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold">Change password</h2>
          <div className="max-w-md">
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </div>
  );
}
