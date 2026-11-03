import Link from "next/link";
import { prisma } from "@/lib/db";
import InquiriesTable from "../../components/InquiriesTable";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    total,
    newCount,
    checkedCount,
    solvedCount,
    todayCount,
    weekCount,
    latest,
  ] = await Promise.all([
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: "new" } }),
    prisma.inquiry.count({ where: { status: "checked" } }),
    prisma.inquiry.count({ where: { status: "solved" } }),
    prisma.inquiry.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.inquiry.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.inquiry.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
  ]);

  const resolutionRate =
    total > 0 ? Math.round((solvedCount / total) * 100) : 0;

  const mainStats = [
    {
      label: "Total inquiries",
      count: total,
      href: "/inquiries",
      dot: "bg-[var(--ink)]",
    },
    {
      label: "Unchecked",
      count: newCount,
      href: "/inquiries?status=new",
      dot: "bg-blue-500",
    },
    {
      label: "Checked",
      count: checkedCount,
      href: "/inquiries?status=checked",
      dot: "bg-amber-500",
    },
    {
      label: "Solved",
      count: solvedCount,
      href: "/inquiries?status=solved",
      dot: "bg-green-600",
    },
  ];

  const secondaryStats = [
    { label: "Received today", value: String(todayCount) },
    { label: "Last 7 days", value: String(weekCount) },
    { label: "Resolution rate", value: `${resolutionRate}%` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="mt-1 text-sm text-(--muted)">
          A summary of the messages from your website contact form.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {mainStats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-2 text-sm text-(--muted)">
              <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
              {s.label}
            </div>
            <p className="mt-3 text-4xl font-bold">{s.count}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {secondaryStats.map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-(--muted)">{s.label}</p>
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-0! overflow-hidden">
        <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
          <h2 className="text-base font-semibold">Latest inquiries</h2>
          <Link
            href="/inquiries"
            className="text-sm font-medium text-(--accent) hover:underline"
          >
            View all
          </Link>
        </div>
        <InquiriesTable inquiries={latest} />
      </div>
    </div>
  );
}
