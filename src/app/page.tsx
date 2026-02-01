"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  BarChart3,
  ChevronRight,
  ClipboardList,
  Flame,
  Gauge,
  LineChart,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";

type PreviewMode = "balanced" | "overload";

type PreviewData = {
  risk: number;
  status: string;
  weeklyLoad: number;
  loadDelta: string;
  graph: string;
  log: Array<{ date: string; session: string; note: string }>;
  recoveryFlag?: string;
};

const previewModes: Record<PreviewMode, PreviewData> = {
  balanced: {
    risk: 72,
    status: "Moderate risk",
    weeklyLoad: 415,
    loadDelta: "+4% vs last week",
    graph: "M2,58 C18,50 34,42 50,38 C66,34 82,36 98,28 C114,22 130,26 146,20",
    log: [
      { date: "Tue", session: "Lower body strength", note: "RPE 7 · Pain 1/10" },
      { date: "Thu", session: "Tempo run + mobility", note: "RPE 7 · Pain 1/10" },
      { date: "Sat", session: "Upper body volume", note: "RPE 8 · Pain 1/10" },
    ],
  },
  overload: {
    risk: 86,
    status: "High risk",
    weeklyLoad: 620,
    loadDelta: "+22% vs last week",
    graph: "M2,58 C18,52 34,48 50,44 C66,40 82,36 98,26 C114,16 130,10 146,6",
    log: [
      { date: "Tue", session: "Lower body strength", note: "RPE 8 · Pain 2/10" },
      { date: "Thu", session: "Sprint intervals", note: "RPE 9 · Pain 3/10" },
      { date: "Sat", session: "Upper body volume", note: "RPE 9 · Pain 3/10" },
    ],
    recoveryFlag: "Recovery flag: load spike + elevated pain signals",
  },
};

const sections = [
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "metrics", label: "Metrics" },
  { id: "built-with", label: "Built with" },
  { id: "faq", label: "FAQ" },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(media.matches);
    handler();
    if (media.addEventListener) {
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
    media.addListener(handler);
    return () => media.removeListener(handler);
  }, []);

  return reduced;
}

function useAnimatedNumber(value: number, reducedMotion: boolean) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    const start = previous.current;
    const diff = value - start;
    const duration = 420;
    let startTime = 0;

    const tick = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const next = Math.round(start + diff * progress);
      setDisplay(next);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        previous.current = value;
      }
    };

    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reducedMotion]);

  return display;
}

export default function WelcomePage() {
  const [mode, setMode] = useState<PreviewMode>("balanced");
  const reducedMotion = useReducedMotion();
  const activeData = previewModes[mode];
  const animatedRisk = useAnimatedNumber(activeData.risk, reducedMotion);
  const animatedLoad = useAnimatedNumber(activeData.weeklyLoad, reducedMotion);
  const [activeSection, setActiveSection] = useState("features");

  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.style.scrollBehavior = "auto";
      return;
    }
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, [reducedMotion]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0.1 }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.add("welcome-hide-widget");
    return () => document.body.classList.remove("welcome-hide-widget");
  }, []);

  const heroChips = useMemo(
    () => [
      {
        icon: ShieldCheck,
        text: "Based on sports science load metrics",
      },
      {
        icon: Trophy,
        text: "Built by athletes for athletes",
      },
      {
        icon: Activity,
        text: "Tracks load, fatigue, and pain signals",
      },
    ],
    []
  );

  const features = useMemo(
    () => [
      {
        icon: ClipboardList,
        title: "Log fast",
        highlight: "Log",
        description: "Capture sets, RPE, and pain in seconds with a focused workflow.",
        chip: "Fast inputs",
      },
      {
        icon: LineChart,
        title: "Spot trends",
        highlight: "Trends",
        description: "Weekly load, spikes, and recovery signals stay visible at a glance.",
        chip: "Trend lines",
      },
      {
        icon: Gauge,
        title: "Train smarter",
        highlight: "Smarter",
        description: "See risk signals before they become setbacks so you can adjust.",
        chip: "Risk signals",
      },
    ],
    []
  );

  const howItWorks = useMemo(
    () => [
      {
        icon: ClipboardList,
        title: "Log sessions",
        description: "Record sets, RPE, and pain in under a minute after training.",
      },
      {
        icon: BarChart3,
        title: "See weekly load",
        description: "Your dashboard aggregates volume + intensity into clear trends.",
      },
      {
        icon: Sparkles,
        title: "Act on signals",
        description: "Recovery flags call attention to spikes so you can adjust early.",
      },
    ],
    []
  );

  const metrics = useMemo(
    () => [
      {
        title: "Session load",
        description: "Calculated from RPE × duration for every session.",
      },
      {
        title: "Weekly load trend",
        description: "Tracks baseline vs. weekly total to highlight spikes.",
      },
      {
        title: "Fatigue indicators",
        description: "Looks for elevated effort and reduced recovery signals.",
      },
      {
        title: "Pain & recovery flags",
        description: "Surface rising pain notes so you can adjust your plan.",
      },
    ],
    []
  );

  const faqItems = useMemo(
    () => [
      {
        question: "Is Gym-Risk medical advice?",
        answer:
          "No. Gym-Risk provides informational signals based on training load and logs, not clinical guidance.",
      },
      {
        question: "Can I export my data?",
        answer:
          "Yes. You can export your training logs and metrics from the dashboard when needed.",
      },
      {
        question: "Is this for coaches or clinicians?",
        answer:
          "It can support coach collaboration, but it is not a substitute for professional medical advice.",
      },
      {
        question: "What training styles are supported?",
        answer:
          "Strength, conditioning, hybrid, and endurance sessions are supported as long as you log RPE and duration.",
      },
      {
        question: "How long does logging take?",
        answer:
          "Most athletes log a session in under a minute thanks to focused inputs.",
      },
      {
        question: "Is it mobile friendly?",
        answer:
          "Yes. The UI is responsive so you can log on the go.",
      },
    ],
    []
  );

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleModeKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, next: PreviewMode) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      setMode(next);
    }
  };

  return (
    <main className="relative mx-auto max-w-6xl px-6 py-12 md:py-16">
      <style jsx global>{`
        body.welcome-hide-widget #vercel-toolbar,
        body.welcome-hide-widget .vercel-feedback-button,
        body.welcome-hide-widget .vercel-live-feedback,
        body.welcome-hide-widget [data-vercel-feedback],
        body.welcome-hide-widget [data-floating-widget],
        body.welcome-hide-widget .floating-widget,
        body.welcome-hide-widget .bottom-left-widget {
          display: none !important;
        }
      `}</style>

      <header className="sticky top-0 z-40 -mx-6 mb-10 border-b border-white/10 bg-[rgba(8,12,20,0.75)] px-6 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
            Gym-Risk
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs text-white/80 md:flex">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`rounded-full px-3 py-1 transition ${
                  activeSection === section.id
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white"
                }`}
                aria-current={activeSection === section.id ? "page" : undefined}
              >
                {section.label}
              </a>
            ))}
          </nav>
          <Link
            href="/signin"
            className="text-xs font-medium uppercase tracking-[0.2em] text-white/60 transition hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.25),_transparent_65%)] blur-3xl opacity-70 motion-safe:animate-pulse motion-reduce:animate-none" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,255,255,0.04)_0,_transparent_35%,_transparent_65%,_rgba(255,255,255,0.04)_100%)] opacity-70" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(120deg,_rgba(255,255,255,0.05)_0,_rgba(255,255,255,0.05)_1px,_transparent_1px,_transparent_10px)] opacity-[0.18]" />
        </div>

        <div className="hero-card lab-card rounded-[28px] p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-8">
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <Image
                    src="/brand/logo.jpg"
                    alt="gym-risk"
                    width={520}
                    height={200}
                    priority
                    className="h-auto w-[200px] md:w-[240px] opacity-95 object-contain"
                  />
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                    Athlete-grade
                  </span>
                </div>
                <h1 className="hero-title text-left text-4xl font-semibold tracking-tight md:text-5xl">
                  Train harder without guessing your injury risk.
                </h1>
                <p className="hero-sub mt-4 text-left text-base text-white/75 md:text-lg">
                  Gym-Risk turns your training logs into load trends, recovery flags, and a clear risk score—so you can
                  stay consistent and proactive.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/signup" className="btn-primary">
                  Start tracking workouts free
                </Link>
                <Link href="/signup" className="btn-secondary">
                  Get your injury risk score
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {heroChips.map((chip) => (
                  <div
                    key={chip.text}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80"
                  >
                    <chip.icon className="h-4 w-4 text-[rgba(56,189,248,0.9)]" />
                    <span>{chip.text}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-xs uppercase tracking-wide text-white/60">Your dashboard shows</div>
                <ul className="mt-3 grid gap-2 text-sm text-white/80">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--lab-safe)]" />
                    Risk score + status based on weekly load and pain notes.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--lab-watch)]" />
                    Load trendline with spikes called out before they stick.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--lab-danger)]" />
                    Session logs with RPE and recovery context for every lift.
                  </li>
                </ul>
              </div>
            </div>

            <div className="lab-card relative overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(11,16,26,0.7)] p-5 shadow-[0_0_30px_rgba(56,189,248,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/60">Dashboard preview</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">Strength cycle · Week 6</div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-white/70">
                  <span className="text-[10px] uppercase tracking-[0.2em]">Sample week</span>
                  <div
                    role="radiogroup"
                    aria-label="Sample week"
                    className="flex rounded-full border border-white/10 bg-black/30 p-1"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={mode === "balanced"}
                      tabIndex={mode === "balanced" ? 0 : -1}
                      onClick={() => setMode("balanced")}
                      onKeyDown={(event) => handleModeKeyDown(event, "overload")}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.6)] motion-reduce:transition-none ${
                        mode === "balanced"
                          ? "bg-white/15 text-white"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      Balanced
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={mode === "overload"}
                      tabIndex={mode === "overload" ? 0 : -1}
                      onClick={() => setMode("overload")}
                      onKeyDown={(event) => handleModeKeyDown(event, "balanced")}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.6)] motion-reduce:transition-none ${
                        mode === "overload"
                          ? "bg-white/15 text-white"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      Overload
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition motion-reduce:transition-none">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Risk score</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]">
                        Weekly
                      </span>
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div className="text-3xl font-semibold text-white/90">
                        {animatedRisk}
                        <span className="text-sm font-medium text-white/50">/100</span>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                        {activeData.status}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-[rgba(56,189,248,0.45)] transition-all duration-500 motion-reduce:transition-none"
                        style={{ width: `${activeData.risk}%` }}
                      />
                    </div>
                    {activeData.recoveryFlag ? (
                      <div className="mt-3 rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-xs text-white/75">
                        {activeData.recoveryFlag}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Weekly load</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">AU</span>
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div className="text-3xl font-semibold text-white/90">
                        {animatedLoad}
                        <span className="text-sm font-medium text-white/50"> AU</span>
                      </div>
                      <span className="text-xs text-white/70">{activeData.loadDelta}</span>
                    </div>
                    <div className="mt-4 rounded-xl border border-white/10 bg-[rgba(10,14,22,0.7)] p-3">
                      <div className="flex items-center justify-between text-[11px] text-white/60">
                        <span>Weekly load graph</span>
                        <span>Mon → Sun</span>
                      </div>
                      <svg viewBox="0 0 150 64" className="mt-3 h-16 w-full">
                        <path
                          d="M2,58 L2,58 146,58"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="2"
                          fill="none"
                        />
                        <path
                          d={activeData.graph}
                          stroke="rgba(56,189,248,0.85)"
                          strokeWidth="3"
                          fill="none"
                          className="transition-all duration-500 motion-reduce:transition-none"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Training log</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">3 sessions</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {activeData.log.map((row) => (
                      <div
                        key={`${row.date}-${row.session}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[rgba(10,14,22,0.65)] px-3 py-2 text-xs text-white/80 transition motion-reduce:transition-none"
                      >
                        <div>
                          <div className="text-white/90">{row.session}</div>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">{row.date}</div>
                        </div>
                        <div className="text-right text-white/65">{row.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mt-16">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">Features</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white/90">
              Train with clarity, not guesswork.
            </h2>
          </div>
          <Flame className="hidden h-8 w-8 text-[rgba(56,189,248,0.8)] md:block" />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group lab-card rounded-2xl border border-white/10 bg-[rgba(15,21,32,0.6)] p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.35)]"
            >
              <div className="flex items-center justify-between">
                <feature.icon className="h-9 w-9 text-[rgba(56,189,248,0.85)]" />
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/70">
                  {feature.chip}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white/95">
                <span className="text-white">{feature.highlight}</span> {feature.title.replace(feature.highlight, "")}
              </h3>
              <p className="mt-2 text-sm text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mt-16">
        <div className="text-xs uppercase tracking-[0.2em] text-white/50">How it works</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white/90">
          A tight loop from log → load → action.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {howItWorks.map((step, index) => (
            <div key={step.title} className="lab-card rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <step.icon className="h-8 w-8 text-[rgba(56,189,248,0.85)]" />
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white/90">{step.title}</h3>
              <p className="mt-2 text-sm text-white/70">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="metrics" className="mt-16">
        <div className="text-xs uppercase tracking-[0.2em] text-white/50">Metrics Gym-Risk uses</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white/90">
          Signals built for training load context.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {metrics.map((metric) => (
            <div key={metric.title} className="lab-card rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-lg font-semibold text-white/90">{metric.title}</div>
              <p className="mt-2 text-sm text-white/70">{metric.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/40">
          Not medical advice. Signals are informational.
        </p>
      </section>

      <section id="built-with" className="mt-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">Built with</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white/90">
              Product-grade foundation and engineering craft.
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "Next.js",
                "React",
                "TypeScript",
                "TailwindCSS",
                "Prisma",
                "NextAuth",
                "Zod",
                "Radix UI",
                "PostgreSQL",
              ].map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/70"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div className="lab-card rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <BarChart3 className="h-4 w-4 text-[rgba(56,189,248,0.8)]" /> Engineering highlights
            </div>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li className="flex gap-2">
                <ChevronRight className="mt-1 h-3 w-3 text-white/50" />
                Component-driven UI with reusable landing sections.
              </li>
              <li className="flex gap-2">
                <ChevronRight className="mt-1 h-3 w-3 text-white/50" />
                Accessible patterns with clear focus states and semantic headings.
              </li>
              <li className="flex gap-2">
                <ChevronRight className="mt-1 h-3 w-3 text-white/50" />
                Lightweight landing experience (no chart or animation libraries).
              </li>
              <li className="flex gap-2">
                <ChevronRight className="mt-1 h-3 w-3 text-white/50" />
                Type-safe validation and auth flows powered by Zod + NextAuth.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="faq" className="mt-16">
        <div className="text-xs uppercase tracking-[0.2em] text-white/50">FAQ</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white/90">
          Your questions, answered clearly.
        </h2>
        <div className="mt-6 space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={item.question} className="rounded-2xl border border-white/10 bg-white/[0.02]">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.6)]"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  {item.question}
                  <span className={`text-lg transition ${isOpen ? "rotate-45" : "rotate-0"}`}>+</span>
                </button>
                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-hidden={!isOpen}
                  className={`px-5 pb-4 text-sm text-white/70 transition ${
                    isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  } motion-reduce:transition-none`}
                  style={{ overflow: "hidden" }}
                >
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-16">
        <div className="lab-card rounded-[24px] border border-white/10 bg-[rgba(15,21,32,0.7)] p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">Ready to train smarter?</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white/90">
                Get clarity on load, fatigue, and risk signals.
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Signals are informational and help you stay proactive—never a replacement for medical advice.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary">
                Start tracking workouts free
              </Link>
              <Link href="/signup" className="btn-secondary">
                Get your injury risk score
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-16 border-t border-white/10 pt-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Gym-Risk</div>
            <p className="mt-2 text-sm text-white/60">Load-aware training insights for committed athletes.</p>
            <p className="mt-2 text-xs text-white/45">Created by Aryan Rawat.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/60">
            <Link href="https://github.com" className="hover:text-white">
              GitHub
            </Link>
            <Link href="/docs" className="hover:text-white">
              Docs
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
