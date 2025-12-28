"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Signup failed.");
      return;
    }

    router.push("/signin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Create account</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border rounded-md p-2" name="name" placeholder="Name (optional)" />
          <input className="w-full border rounded-md p-2" name="email" placeholder="Email" type="email" required />
          <input className="w-full border rounded-md p-2" name="password" placeholder="Password (min 8 chars)" type="password" required />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button className="w-full rounded-md bg-black text-white p-2" disabled={loading} type="submit">
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-gray-600">
          Already have an account? <Link className="underline" href="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
