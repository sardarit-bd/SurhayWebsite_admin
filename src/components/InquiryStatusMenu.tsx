"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "new", label: "Mark as Unchecked" },
  { value: "checked", label: "Mark as Checked" },
  { value: "solved", label: "Mark as Solved" },
] as const;

export default function InquiryStatusMenu({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(8, r.right - 208) });
    }
    setOpen((v) => !v);
  }

  async function choose(value: string) {
    setOpen(false);
    if (value === status) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: value }),
      });
      if (res.ok) router.refresh();
      else if (res.status === 401) window.location.href = "/login";
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-(--border) bg-white text-(--muted) transition hover:bg-black/5 hover:text-(--ink) disabled:opacity-50"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <circle cx="8" cy="3" r="1.4" />
          <circle cx="8" cy="8" r="1.4" />
          <circle cx="8" cy="13" r="1.4" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: pos.top, left: pos.left, width: 208 }}
          className="z-50 overflow-hidden rounded-xl border border-(--border) bg-white py-1 shadow-lg"
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="menuitem"
              onClick={() => choose(opt.value)}
              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-(--ink) hover:bg-black/5"
            >
              {opt.label}
              {status === opt.value && <span className="text-(--accent)">✓</span>}
            </button>
          ))}
        </div>
      )}
    </>
  );
}