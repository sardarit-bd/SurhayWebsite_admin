"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "new", label: "Unchecked" },
  { value: "checked", label: "Checked" },
  { value: "solved", label: "Solved" },
] as const;

type Props = {
  id: string;
  status: string;
  note?: string | null;
};

export default function InquiryActions({ id, status, note }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [noteText, setNoteText] = useState(note ?? "");
  const [noteSaved, setNoteSaved] = useState(false);

  async function send(body: { status?: string; note?: string }) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(res.status === 401 ? "Session expired, please log in again." : "Could not save.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Could not reach the server.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-(--muted)">
          Set status
        </p>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-(--border) bg-black/3 p-1">
          {OPTIONS.map((opt) => {
            const active = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={busy || active}
                onClick={() => send({ status: opt.value })}
                className={`rounded-lg px-2 py-2 text-sm font-medium transition disabled:cursor-default ${
                  active
                    ? "bg-(--ink) text-(--paper) shadow-sm"
                    : "text-(--muted) hover:bg-white hover:text-(--ink)"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor={`note-${id}`}
          className="mb-2 block text-xs font-medium uppercase tracking-wide text-(--muted)"
        >
          Internal note
        </label>
        <textarea
          id={`note-${id}`}
          value={noteText}
          onChange={(e) => {
            setNoteText(e.target.value);
            setNoteSaved(false);
          }}
          rows={4}
          className="w-full rounded-lg border border-(--border) bg-white p-3 text-sm outline-none focus:border-(--accent)"
          placeholder="Only visible to admins"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={async () => setNoteSaved(await send({ note: noteText }))}
            className="rounded-lg bg-(--accent) px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Save note
          </button>
          {noteSaved && <span className="text-sm text-green-700">Saved</span>}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}