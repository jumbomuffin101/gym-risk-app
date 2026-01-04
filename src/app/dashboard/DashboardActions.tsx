"use client";

import { signOut } from "next-auth/react";

export default function DashboardActions() {
  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className={[
          "group inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium",
          "border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.10)] text-white/90",
          "hover:bg-[rgba(239,68,68,0.14)] hover:border-[rgba(239,68,68,0.40)]",
          "transition",
        ].join(" ")}
        style={{
          boxShadow:
            "0 0 0 1px rgba(239,68,68,0.14), 0 18px 55px rgba(239,68,68,0.10)",
        }}
      >
        Sign out
      </button>

      <button
        type="button"
        onClick={() => alert("Switch user coming next")}
        className={[
          "inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm",
          "border-white/10 bg-white/[0.03] text-white/70 hover:text-white/85 hover:bg-white/[0.06]",
          "transition",
        ].join(" ")}
      >
        Switch user
      </button>
    </div>
  );
}
