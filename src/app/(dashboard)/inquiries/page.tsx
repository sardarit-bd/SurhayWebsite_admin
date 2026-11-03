import Link from "next/link";
import { prisma } from "@/lib/db";
import InquiryStatusMenu from "../../../components/InquiryStatusMenu";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const DOT: Record<string, string> = {
  new: "bg-blue-500",
  checked: "bg-amber-500",
  solved: "bg-green-600",
};
const LABEL: Record<string, string> = {
  new: "Unchecked",
  checked: "Checked",
  solved: "Solved",
};
const TABS = [
  { value: "", label: "All" },
  { value: "new", label: "Unchecked" },
  { value: "checked", label: "Checked" },
  { value: "solved", label: "Solved" },
];

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const filter =
    sp.status && ["new", "checked", "solved"].includes(sp.status)
      ? sp.status
      : "";
  const q = (sp.q ?? "").trim();
  const requestedPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const searchWhere = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { unternehmen: { contains: q, mode: "insensitive" as const } },
          { nachricht: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const where = { ...searchWhere, ...(filter ? { status: filter } : {}) };

  const [total, grouped] = await Promise.all([
    prisma.inquiry.count({ where }),
    prisma.inquiry.groupBy({
      by: ["status"],
      where: searchWhere,
      _count: { _all: true },
    }),
  ]);

  const counts: Record<string, number> = {};
  let allCount = 0;
  for (const g of grouped) {
    counts[g.status] = g._count._all;
    allCount += g._count._all;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const inquiries = await prisma.inquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  function href(next: { status?: string; page?: number }) {
    const p = new URLSearchParams();
    const s = next.status !== undefined ? next.status : filter;
    if (s) p.set("status", s);
    if (q) p.set("q", q);
    if (next.page && next.page > 1) p.set("page", String(next.page));
    const str = p.toString();
    return str ? `/inquiries?${str}` : "/inquiries";
  }

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const pageNumbers: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++)
    pageNumbers.push(i);

  const pageBtn =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm transition";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Contact Inquiries</h1>
          <p className="mt-1 text-sm text-(--muted)">
            Messages sent through the website contact form.
          </p>
        </div>
      </div>

      <div className="card p-0! overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border) px-4 py-3">
          <div className="flex flex-wrap items-center gap-1">
            {TABS.map((tab) => {
              const active = filter === tab.value;
              const count =
                tab.value === "" ? allCount : (counts[tab.value] ?? 0);
              return (
                <Link
                  key={tab.value || "all"}
                  href={href({ status: tab.value, page: 1 })}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-(--ink) text-(--paper)"
                      : "text-(--muted) hover:bg-black/5 hover:text-(--ink)"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-2 text-xs ${
                      active ? "bg-white/20" : "bg-black/5"
                    }`}
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>

          <form
            action="/inquiries"
            method="GET"
            className="flex w-full items-center gap-2 sm:w-auto"
          >
            {filter && <input type="hidden" name="status" value={filter} />}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search name, email, message…"
              className="min-w-0 flex-1 rounded-lg border border-(--border) bg-white px-3 py-2 text-sm outline-none focus:border-(--accent) sm:w-64 sm:flex-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-(--accent) px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Search
            </button>
            {q && (
              <Link
                href={
                  href({ page: 1 })
                    .replace(/([?&])q=[^&]*&?/, "$1")
                    .replace(/[?&]$/, "") || "/inquiries"
                }
                className="text-sm text-(--muted) hover:text-(--ink)"
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/3 text-xs uppercase tracking-wide text-(--muted)">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Name / Company</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Package</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border)">
              {inquiries.map((inq, i) => (
                <tr key={inq.id} className="transition hover:bg-black/2">
                  <td className="px-4 py-3 align-middle text-(--muted)">
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--ink) text-sm font-semibold text-(--paper)">
                        {inq.name.trim().charAt(0).toUpperCase() || "?"}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/inquiries/${inq.id}`}
                          className={`block truncate hover:underline ${
                            inq.status === "new"
                              ? "font-semibold"
                              : "font-medium"
                          }`}
                        >
                          {inq.name}
                        </Link>
                        <p className="truncate text-xs text-(--muted)">
                          {inq.unternehmen || "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <p>{inq.email}</p>
                    <p className="text-xs text-(--muted)">
                      {inq.telefon || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    {inq.paket}
                  </td>
                  <td className="max-w-xs px-4 py-3 align-middle">
                    <p className="line-clamp-1 wrap-break-word text-(--muted)">
                      {inq.nachricht}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${DOT[inq.status] ?? "bg-gray-400"}`}
                      />
                      {LABEL[inq.status] ?? inq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-(--muted)">
                    {new Date(inq.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/inquiries/${inq.id}`}
                        className="inline-flex h-8 items-center rounded-lg border border-(--border) bg-white px-3 text-sm font-medium text-(--ink) transition hover:bg-black/5"
                      >
                        View
                      </Link>
                      <InquiryStatusMenu id={inq.id} status={inq.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {inquiries.length === 0 && (
            <p className="px-4 py-12 text-center text-(--muted)">
              No inquiries found.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--border) px-4 py-3">
          <p className="text-sm text-(--muted)">
            Showing {from}–{to} of {total}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {page > 1 ? (
                <Link
                  href={href({ page: page - 1 })}
                  className={`${pageBtn} border-(--border) bg-white hover:bg-black/5`}
                >
                  ‹
                </Link>
              ) : (
                <span className={`${pageBtn} border-(--border) opacity-40`}>
                  ‹
                </span>
              )}
              {pageNumbers.map((n) => (
                <Link
                  key={n}
                  href={href({ page: n })}
                  className={`${pageBtn} ${
                    n === page
                      ? "border-(--accent) bg-(--accent) text-white"
                      : "border-(--border) bg-white hover:bg-black/5"
                  }`}
                >
                  {n}
                </Link>
              ))}
              {page < totalPages ? (
                <Link
                  href={href({ page: page + 1 })}
                  className={`${pageBtn} border-(--border) bg-white hover:bg-black/5`}
                >
                  ›
                </Link>
              ) : (
                <span className={`${pageBtn} border-(--border) opacity-40`}>
                  ›
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
