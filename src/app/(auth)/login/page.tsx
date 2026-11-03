"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "../../../components/PasswordInput";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
    } else {
      setError("Invalid password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center text-(--ink)">
          Admin Login
        </h1>
        <PasswordInput
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          autoComplete="current-password"
          required
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button type="submit" className="btn-primary w-full">
          Sign In
        </button>
      </form>
    </div>
  );
}
