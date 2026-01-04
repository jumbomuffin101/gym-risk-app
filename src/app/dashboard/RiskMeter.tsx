"use client";

import React from "react";

function riskTone(score: number) {
  if (score >= 70) return "danger";
  if (score >= 40) return "watch";
  return "safe";
}

function toneToColor(tone: "safe" | "watch" | "danger") {
  if (tone === "danger") return "var(--lab-danger)";
  if (tone === "watch") return "var(--lab-watch)";
  return "var(--lab-safe)";
}

function toneLabel(tone: "safe" | "watch" | "danger") {
  if (tone === "danger") return "HIGH";
  if (tone === "watch") return "MODERATE";
  return "LOW";
}

export function RiskMeter({ score }: { score: number }) {
  const s = Math.max(0, Math.min(100, score));
  const tone = riskTone(s);
  const color = toneToColor(tone);

  // compute inline (no memo) to satisfy React Compiler
  const sweep = Math.round((s / 100) * 240);
  const conic = `conic-gradient(from 210deg, ${color} ${sweep}deg, rgba(255,255,255,0.08) 0deg)`;

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative grid h-20 w-20 place-items-center rounded-full"
        style={{
          background: conic,
          boxShadow:
            tone === "safe"
              ? "0 0 0 1px rgba(34,197,94,0.18), 0 18px 50px rgba(34,197,94,0.10)"
              : tone === "watch"
              ? "0 0 0 1px rgba(245,158,11,0.16), 0 18px 50px rgba(245,158,11,0.08)"
              : "0 0 0 1px rgba(239,68,68,0.14), 0 18px 50px rgba(239,68,68,0.06)",
          transition: "background 220ms ease, box-shadow 220ms ease",
        }}
      >
        <div className="grid h-[74px] w-[74px] place-items-center rounded-full bg-[rgba(11,15,20,0.92)]">
          <div className="text-xs font-semibold lab-num" style={{ color }}>
            {s}
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold tracking-tight" style={{ color }}>
            {toneLabel(tone)}
          </div>
          <div
            className="h-2 w-2 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 18px ${color}`,
              animation: "lab-soft-pulse 1.8s ease-in-out infinite",
            }}
          />
        </div>
        <div className="mt-1 text-xs lab-muted">Updates as sets are logged</div>
      </div>
    </div>
  );
}
