import React, { type ElementType } from "react";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  size = "lg",
  as,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  size?: "lg" | "md";
  as?: ElementType;
}) {
  const titleClass =
    size === "lg"
      ? "text-2xl font-semibold tracking-tight text-white/95"
      : "text-lg font-semibold text-white/90";
  const Heading = as ?? "h2";

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="text-xs uppercase tracking-wide lab-muted">{eyebrow}</div>
        ) : null}
        <Heading className={`mt-1 ${titleClass}`}>{title}</Heading>
        {subtitle ? <div className="mt-2 text-sm lab-muted">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
