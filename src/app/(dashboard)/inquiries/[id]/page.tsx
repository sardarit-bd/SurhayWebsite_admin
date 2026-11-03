import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import InquiryActions from "../../../../components/InquiryActions";

export const dynamic = "force-dynamic";

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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-(--muted)">
        {label}
      </dt>
      <dd className="mt-1 wrap-break-word text-sm">{children}</dd>
    </div>
  );
}

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inq = await prisma.inquiry.findUnique({ where: { id } });
  if (!inq) notFound();

  const leistung: string[] = Array.isArray(inq.leistung)
    ? (inq.leistung as string[])
    : [];

  const received = new Date(inq.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/inquiries"
          className="inline-flex items-center gap-2 rounded-lg border border-(--border) bg-white px-4 py-2 text-sm font-medium text-(--ink) shadow-sm transition hover:bg-(--ink) hover:text-(--paper)"
        >
          <svg
            viewBox="0 0 16 16"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 3 5 8l5 5" />
          </svg>
          Back to inquiries
        </Link>
        <nav className="flex min-w-0 items-center gap-2 text-sm text-(--muted)">
          <span>Inquiries</span>
          <span aria-hidden="true">/</span>
          <span className="truncate text-(--ink)">{inq.name}</span>
        </nav>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-(--ink) text-xl font-semibold text-(--paper)">
            {inq.name.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <div>
            <h1 className="wrap-break-word text-xl font-bold sm:text-2xl">
              {inq.name}
            </h1>
            <p className="text-sm text-(--muted)">
              {inq.unternehmen ? `${inq.unternehmen} · ` : ""}
              Received {received}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-(--border) bg-white px-4 py-1.5 text-sm font-medium">
          <span
            className={`h-2.5 w-2.5 rounded-full ${DOT[inq.status] ?? "bg-gray-400"}`}
          />
          {LABEL[inq.status] ?? inq.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card">
            <h2 className="mb-4 text-base font-semibold">Message</h2>
            <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
              {inq.nachricht}
            </p>
          </section>

          <section className="card">
            <h2 className="mb-4 text-base font-semibold">Request details</h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <Field label="Package">{inq.paket}</Field>
              <Field label="Language">{inq.sprache.toUpperCase()}</Field>
              <div className="sm:col-span-2">
                <Field label="Services">
                  {leistung.length > 0 ? (
                    <span className="flex flex-wrap gap-2">
                      {leistung.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-(--border) bg-black/3 px-3 py-1 text-xs font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </span>
                  ) : (
                    "-"
                  )}
                </Field>
              </div>
            </dl>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card">
            <h2 className="mb-4 text-base font-semibold">Manage</h2>
            <InquiryActions id={inq.id} status={inq.status} note={inq.note} />
          </section>

          <section className="card">
            <h2 className="mb-4 text-base font-semibold">Contact</h2>
            <dl className="space-y-4">
              <Field label="Email">
                <a
                  href={`mailto:${inq.email}`}
                  className="text-(--accent) hover:underline"
                >
                  {inq.email}
                </a>
              </Field>
              <Field label="Phone">
                {inq.telefon ? (
                  <a
                    href={`tel:${inq.telefon}`}
                    className="text-(--accent) hover:underline"
                  >
                    {inq.telefon}
                  </a>
                ) : (
                  "-"
                )}
              </Field>
              <Field label="Company">{inq.unternehmen || "-"}</Field>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`mailto:${inq.email}`}
                className="rounded-lg bg-(--accent) px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Reply by email
              </a>
              {inq.telefon && (
                <a
                  href={`tel:${inq.telefon}`}
                  className="rounded-lg border border-(--border) bg-white px-4 py-2 text-sm font-medium transition hover:bg-black/5"
                >
                  Call
                </a>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}