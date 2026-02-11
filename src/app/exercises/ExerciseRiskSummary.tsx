"use client";

import { useEffect, useState } from "react";

type RiskResponse = { score: number | null; label: string; drivers: string[] };

export default function ExerciseRiskSummary({ exerciseId }: { exerciseId: string }) {
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/exercises/risk?exerciseId=${exerciseId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setRisk(data);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setRisk({ score: null, label: "No estimate", drivers: [] });
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [exerciseId]);

  if (loading) return <div className="text-xs text-white/60">Loading risk…</div>;
  if (!risk || risk.score == null) return <div className="text-sm text-white/70">No estimate</div>;

  return (
    <div className="text-sm text-white/80">
      <div className="text-xs uppercase tracking-wide text-white/60">Exercise risk score</div>
      <div className="mt-1 text-2xl font-semibold text-white/95">{risk.score} ({risk.label})</div>
      <div className="mt-2 text-xs text-white/60">{risk.drivers.join(" • ") || "No drivers"}</div>
    </div>
  );
}
