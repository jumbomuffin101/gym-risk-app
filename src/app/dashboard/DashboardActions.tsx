"use client";

import { signOut } from "next-auth/react";

export default function DashboardActions() {
  return (
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="lab-button lab-button--danger"
      >
        Sign out
      </button>

      <button
        type="button"
        onClick={() => alert("Switch user coming next")}
        className="lab-button lab-button--ghost"
      >
        Switch user
      </button>
    </div>
  );
}
