"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ExerciseRiskPayload } from "@/app/lib/exerciseRisk";

export default function ExerciseRiskSummary({ exerciseId }: { exerciseId: string }) {
  const [risk, setRisk] = useState<ExerciseRiskPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/exercises/risk?exerciseId=${exerciseId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setRisk(data?.risk ?? { hasData: false });
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setRisk({ hasData: false });
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [exerciseId]);

  if (loading) {
    return <div className="text-xs text-white/60">Loading risk…</div>;
  }

  if (!risk || !risk.hasData) {
    return (
      <div className="text-sm text-white/70">
        No data yet. <Link href="#log-sets" className="text-white underline">Log a set</Link> to calculate risk.
      </div>
    );
  }

  return (
    <div className="text-sm text-white/80">
      <div className="text-xs uppercase tracking-wide text-white/60">Exercise risk score</div>
      <div className="mt-1 text-2xl font-semibold text-white/95">
        {risk.score} <span className="text-sm font-medium text-white/70">({risk.label})</span>
      </div>
      <div className="mt-2 text-xs text-white/60">
        Recent volume {risk.recentVolume.toLocaleString()} • RPE {risk.recentRpe ?? "—"}
      </div>
    </div>
  );
}
