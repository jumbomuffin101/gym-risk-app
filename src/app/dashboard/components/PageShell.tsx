import React from "react";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(900px 340px at 15% -10%, rgba(34,197,94,0.10), transparent 60%), radial-gradient(700px 280px at 90% 0%, rgba(56,189,248,0.08), transparent 55%)",
        }}
      />
      <div className="mx-auto max-w-6xl space-y-6">{children}</div>
    </div>
  );
}
