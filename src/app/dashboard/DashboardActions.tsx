"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function DashboardActions() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Link
        href="/workouts/new"
        className="btn-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lab-accent-strong)]"
      >
        New workout
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="btn-secondary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lab-accent-strong)]"
      >
        Sign out
      </button>

      <button
        type="button"
        onClick={() => alert("Switch user coming next")}
        className="btn-secondary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lab-accent-strong)]"
      >
        Switch user
      </button>
    </div>
  );
}
