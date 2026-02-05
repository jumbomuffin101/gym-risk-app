import React from "react";

import { LabCard } from "./LabCard";

export function MetricCard({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <LabCard className={["rounded-2xl p-5", className].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? <div className="text-xs uppercase tracking-wide lab-muted">{eyebrow}</div> : null}
          <div className="mt-1 text-lg font-semibold text-white/90">{title}</div>
          {subtitle ? <div className="mt-2 text-sm lab-muted">{subtitle}</div> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </LabCard>
  );
}
