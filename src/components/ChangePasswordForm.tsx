"use client";

import { useState } from "react";
import PasswordInput from "./PasswordInput";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else if (res.status === 401) {
        window.location.href = "/login";
      } else {
        setError(data.error || "Could not change the password.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="cp-current" className="mb-2 block text-sm font-medium">
          Current password
        </label>
        <PasswordInput
          id="cp-current"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
          autoComplete="current-password"
          required
        />
      </div>

      <div>
        <label htmlFor="cp-new" className="mb-2 block text-sm font-medium">
          New password
        </label>
        <PasswordInput
          id="cp-new"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="mt-1 text-xs text-(--muted)">At least 8 characters.</p>
      </div>

      <div>
        <label htmlFor="cp-confirm" className="mb-2 block text-sm font-medium">
          Confirm new password
        </label>
        <PasswordInput
          id="cp-confirm"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
          autoComplete="new-password"
          required
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          Password changed successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-(--accent) px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
