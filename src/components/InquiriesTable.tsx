import Link from "next/link";
import type { Inquiry } from "@prisma/client";
import InquiryStatusMenu from "./InquiryStatusMenu";

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

function Status({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        className={`h-2.5 w-2.5 rounded-full ${DOT[status] ?? "bg-gray-400"}`}
      />
      {LABEL[status] ?? status}
    </span>
  );
}

export default function InquiriesTable({
  inquiries,
  startIndex = 0,
}: {
  inquiries: Inquiry[];
  startIndex?: number;
}) {
  return (
    <div>
      {/* Phones and tablets: cards */}
      <ul className="divide-y divide-(--border) lg:hidden">
        {inquiries.map((inq) => (
          <li key={inq.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--ink) text-sm font-semibold text-(--paper)">
                  {inq.name.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/inquiries/${inq.id}`}
                    className={`block truncate hover:underline ${
                      inq.status === "new" ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {inq.name}
                  </Link>
                  <p className="truncate text-xs text-(--muted)">
                    {inq.unternehmen || "-"}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs">
                <Status status={inq.status} />
              </span>
            </div>

            <p className="line-clamp-2 wrap-break-word text-sm text-(--muted)">
              {inq.nachricht}
            </p>

            <div className="space-y-0.5 text-xs text-(--muted)">
              <p className="break-all">{inq.email}</p>
              {inq.telefon && <p>{inq.telefon}</p>}
              <p>
                {inq.paket} ·{" "}
                {new Date(inq.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/inquiries/${inq.id}`}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-(--border) bg-white px-3 text-sm font-medium text-(--ink) transition hover:bg-black/5"
              >
                View
              </Link>
              <InquiryStatusMenu id={inq.id} status={inq.status} />
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/3 text-xs uppercase tracking-wide text-(--muted)">
            <tr>
              <th className="hidden px-4 py-3 font-medium xl:table-cell">#</th>
              <th className="px-4 py-3 font-medium">Name / Company</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Package</th>
              <th className="hidden px-4 py-3 font-medium xl:table-cell">
                Message
              </th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Received</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border)">
            {inquiries.map((inq, i) => (
              <tr key={inq.id} className="transition hover:bg-black/2">
                <td className="hidden px-4 py-3 align-middle text-(--muted) xl:table-cell">
                  {startIndex + i + 1}
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
                          inq.status === "new" ? "font-semibold" : "font-medium"
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
                <td className="whitespace-nowrap px-4 py-3 align-middle">
                  {inq.paket}
                </td>
                <td className="hidden max-w-xs px-4 py-3 align-middle xl:table-cell">
                  <p className="line-clamp-1 wrap-break-word text-(--muted)">
                    {inq.nachricht}
                  </p>
                </td>
                <td className="px-4 py-3 align-middle">
                  <Status status={inq.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-middle ttext-(--muted)">
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
      </div>

      {inquiries.length === 0 && (
        <p className="px-4 py-12 text-center text-(--muted)">
          No inquiries found.
        </p>
      )}
    </div>
  );
}
