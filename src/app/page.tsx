"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
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
  riskState: string;
  riskStateTone: "amber" | "red";
  weeklyLoad: number;
  weeklyStatus: string;
  weeklyStatusTone: "green" | "amber" | "red";
  acuteLoad: number;
  chronicLoad: number;
  ratio: string;
  ratioThreshold: string;
  ratioThresholdTone: "amber" | "red";
  loadDelta: string;
  graph: string;
};

const previewModes: Record<PreviewMode, PreviewData> = {
  balanced: {
    risk: 72,
    riskState: "Moderate",
    riskStateTone: "amber",
    weeklyLoad: 415,
    weeklyStatus: "Stable",
    weeklyStatusTone: "green",
    acuteLoad: 415,
    chronicLoad: 430,
    ratio: "0.97",
    ratioThreshold: "Monitor",
    ratioThresholdTone: "amber",
    loadDelta: "+4% vs last week",
    graph: "M2,58 C18,50 34,42 50,38 C66,34 82,36 98,28 C114,22 130,26 146,20",
  },
  overload: {
    risk: 86,
    riskState: "Exceeded",
    riskStateTone: "red",
    weeklyLoad: 620,
    weeklyStatus: "Monitor",
    weeklyStatusTone: "amber",
    acuteLoad: 620,
    chronicLoad: 500,
    ratio: "1.24",
    ratioThreshold: "Exceeded",
    ratioThresholdTone: "red",
    loadDelta: "+22% vs last week",
    graph: "M2,58 C18,52 34,48 50,44 C66,40 82,36 98,26 C114,16 130,10 146,6",
  },
};

const toneClass: Record<"green" | "amber" | "red", string> = {
  green: "border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.12)] text-[rgb(134,239,172)]",
  amber: "border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.12)] text-[rgb(253,230,138)]",
  red: "border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.12)] text-[rgb(252,165,165)]",
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
  const frameRef = useRef<number | null>(null);
  const displayRef = useRef(display);

  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    // If reduced motion is on, skip animation work.
    // We still keep "previous" updated so that when reducedMotion flips off,
    // we animate from the correct starting point.
    if (reducedMotion) {
      previous.current = value;
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    // Cancel any in-flight animation
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const start = previous.current;
    if (start === value) {
      if (displayRef.current !== value) {
        frameRef.current = requestAnimationFrame(() => {
          setDisplay(value);
          frameRef.current = null;
        });
      }
      previous.current = value;
      return () => {
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      };
    }

    const diff = value - start;
    const duration = 420;
    let startTime: number | null = null;

    const tick = (time: number) => {
      if (startTime === null) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const next = Math.round(start + diff * progress);

      setDisplay((current) => (current === next ? current : next));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        previous.current = value;
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [value, reducedMotion]);

  // If reduced motion, render the raw value (no setState needed)
  return reducedMotion ? value : display;
}


export default function WelcomePage() {
  const { status } = useSession();
  const [mode, setMode] = useState<PreviewMode>("balanced");
  const reducedMotion = useReducedMotion();
  const activeData = previewModes[mode];
  const animatedRisk = useAnimatedNumber(activeData.risk, reducedMotion);
  const animatedLoad = useAnimatedNumber(activeData.weeklyLoad, reducedMotion);
  const [activeSection, setActiveSection] = useState("features");
  const chipClass =
    "rounded-full border border-[color:var(--lab-accent-border)] bg-[var(--lab-surface-2)] px-3 py-1 text-xs font-medium text-white/70";
  const signedIn = status === "authenticated";
  const primaryCtaHref = signedIn ? "/dashboard" : "/signin";
  const secondaryCtaHref = signedIn ? "/dashboard" : "/signin";

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
        text: "Science-backed metrics",
      },
      {
        icon: Trophy,
        text: "Built by athletes",
      },
      {
        icon: Activity,
        text: "Recovery-aware signals",
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
        description: "Capture sets, RPE, and pain in under a minute today.",
      },
      {
        icon: LineChart,
        title: "Spot trends",
        highlight: "Trends",
        description: "See weekly load shifts without digging through logs or spreadsheets.",
      },
      {
        icon: Gauge,
        title: "Train smarter",
        highlight: "Smarter",
        description: "Adjust intensity before fatigue compounds into avoidable in-season setbacks.",
      },
    ],
    []
  );

  const howItWorks = useMemo(
    () => [
      {
        icon: ClipboardList,
        title: "Log sessions",
        description: "Record sets, RPE, and pain in minutes, not hours.",
      },
      {
        icon: BarChart3,
        title: "See weekly load",
        description: "Trends surface weekly volume and intensity shifts quickly.",
      },
      {
        icon: Sparkles,
        title: "Act on signals",
        description: "Flags highlight spikes so you adjust before fatigue builds.",
      },
    ],
    []
  );

  const metrics = useMemo(
    () => [
      {
        title: "Acute Load (7d)",
        description: "Total session load across the last 7 days (AU).",
      },
      {
        title: "Chronic Load (28d)",
        description: "28-day rolling baseline (AU).",
      },
      {
        title: "Load Ratio",
        description: "Acute / Chronic.",
      },
      {
        title: "Risk Index",
        description: "Combined view of load ratio, trend, and thresholds.",
      },
    ],
    []
  );

  const faqItems = useMemo(
    () => [
      {
        question: "Is Gym-Risk medical advice?",
        answer: "No. It provides training signals, not clinical guidance.",
      },
      {
        question: "Can I export my data?",
        answer: "Yes. Export logs and metrics from the dashboard.",
      },
      {
        question: "What training styles are supported?",
        answer: "Strength, conditioning, hybrid, and endurance with RPE + duration.",
      },
      {
        question: "How long does logging take?",
        answer: "Most athletes log a session in under a minute.",
      },
      {
        question: "Is it mobile friendly?",
        answer: "Yes. The UI is responsive for on-the-go logging.",
      },
    ],
    []
  );

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleModeKeyDown = (event: KeyboardEvent<HTMLButtonElement>, next: PreviewMode) => {
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

      <header className="sticky top-0 z-40 -mx-6 mb-10 border-b border-[color:var(--lab-accent-border)] bg-[var(--lab-bg)] px-6 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <Image
              src="/brand/gym-risk-icon-v2.svg"
              alt="Gym-Risk logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            Gym-Risk
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-[color:var(--lab-accent-border)] bg-[var(--lab-bg)] p-1 text-xs font-medium text-white/80 md:flex">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`rounded-full px-3 py-1 transition ${
                  activeSection === section.id
                    ? "bg-[var(--lab-surface-2)] text-white"
                    : "text-white/70 hover:text-white"
                }`}
                aria-current={activeSection === section.id ? "page" : undefined}
              >
                {section.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/signin"
              className="rounded-full border border-[color:var(--lab-accent-border)] px-4 py-2 text-xs font-semibold text-white/70 transition hover:text-white"
            >
              Sign in
            </Link>
            <Link href="/signup" className="rounded-full bg-[var(--lab-safe)] px-4 py-2 text-xs font-semibold text-black/90 shadow-[0_0_0_1px_rgba(34,197,94,0.4),0_12px_30px_rgba(34,197,94,0.18)] transition hover:brightness-105">
              Create account
            </Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="hero-card lab-card rounded-[28px] p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-8">
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <Image
                    src="/brand/gym-risk-icon-v2.svg"
                    alt="Gym-Risk logo"
                    width={48}
                    height={48}
                    priority
                    className="h-11 w-11 md:h-12 md:w-12 opacity-95 object-contain"
                  />
                  <span className={`${chipClass} text-[var(--lab-analytics)]`}>
                    Athlete tested
                  </span>
                </div>
                <h1 className="hero-title text-left text-4xl font-semibold tracking-tight md:text-5xl">
                  Train harder without guessing your injury risk.
                </h1>
                <p className="hero-sub mt-4 text-left text-base text-white/75 md:text-lg">
                  Gym-Risk turns training logs into clear readiness guidance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href={primaryCtaHref} className="btn-primary">
                  Start tracking workouts free
                </Link>
                <Link href={secondaryCtaHref} className="btn-secondary">
                  Open existing workspace
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {heroChips.map((chip) => (
                  <div
                    key={chip.text}
                    className="flex items-center gap-2 rounded-xl border border-[color:var(--lab-accent-border)] bg-[var(--lab-surface)] px-3 py-2 text-xs font-medium text-white/80"
                  >
                    <chip.icon className="h-4 w-4 text-[var(--lab-accent)]" />
                    <span>{chip.text}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[color:var(--lab-accent-border)] bg-[var(--lab-surface)] p-4">
                <div className="text-xs font-semibold text-[var(--lab-analytics)]">Your dashboard shows</div>
                <ul className="mt-3 grid gap-2 text-sm text-white/80">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--lab-safe)]" />
                    Risk score + status.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--lab-watch)]" />
                    Weekly load trendlines.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--lab-accent)]" />
                    Session notes + RPE.
                  </li>
                </ul>
              </div>
            </div>

            <div className="lab-card relative overflow-hidden rounded-[24px] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-[var(--lab-analytics)]">Dashboard preview</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">Strength cycle | Week 6</div>
                  <div className="mt-1 text-xs text-white/55">A cleaner look at load, strain, and weekly trend.</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={chipClass}>Sample week</span>
                  <div
                    role="radiogroup"
                    aria-label="Sample week"
                    className="flex rounded-full border border-[color:var(--lab-accent-border)] bg-[var(--lab-bg)] p-1"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={mode === "balanced"}
                      tabIndex={mode === "balanced" ? 0 : -1}
                      onClick={() => setMode("balanced")}
                      onKeyDown={(event) => handleModeKeyDown(event, "overload")}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lab-accent-strong)] motion-reduce:transition-none ${
                        mode === "balanced"
                          ? "bg-white/15 text-white shadow-[0_0_0_1px_var(--lab-accent-strong)]"
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
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lab-accent-strong)] motion-reduce:transition-none ${
                        mode === "overload"
                          ? "bg-white/15 text-white shadow-[0_0_0_1px_var(--lab-accent-strong)]"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      Overload
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid auto-rows-fr gap-3 md:grid-cols-2">
                <div className="flex min-h-[15.5rem] flex-col justify-between rounded-2xl border border-[color:var(--lab-accent-border)] bg-[var(--lab-surface-2)] p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 text-xs font-medium text-white/60">
                      <span>Risk Index</span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneClass[activeData.riskStateTone]}`}
                      >
                        State: {activeData.riskState}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <div className="text-3xl font-semibold text-white/90">
                        {animatedRisk}
                        <span className="text-sm font-medium text-white/50">/100</span>
                      </div>
                      <span className="max-w-[8rem] text-right text-xs text-white/65">Load balance + trend</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-[rgba(125,211,252,0.45)] transition-all duration-500 motion-reduce:transition-none"
                        style={{ width: `${activeData.risk}%` }}
                      />
                    </div>
                    <div className="text-xs text-white/50">Higher values mean the week needs closer attention.</div>
                  </div>
                </div>

                <div className="flex min-h-[15.5rem] flex-col justify-between rounded-2xl border border-[color:var(--lab-accent-border)] bg-[var(--lab-surface-2)] p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 text-xs font-medium text-white/60">
                      <span>Weekly Load</span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneClass[activeData.weeklyStatusTone]}`}
                      >
                        Status: {activeData.weeklyStatus}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <div className="text-3xl font-semibold text-white/90">
                        {animatedLoad}
                        <span className="text-sm font-medium text-white/50"> AU</span>
                      </div>
                      <span className="max-w-[7rem] text-right text-xs text-white/70">{activeData.loadDelta}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/65">
                    <div className="rounded-lg border border-[color:var(--lab-accent-border)] bg-[rgba(255,255,255,0.02)] px-2.5 py-2">
                      This week
                    </div>
                    <span
                      className="rounded-lg border border-[color:var(--lab-accent-border)] bg-[rgba(255,255,255,0.02)] px-2.5 py-2 text-right"
                    >
                      Load scale
                    </span>
                  </div>
                </div>

                <div className="flex min-h-[15.5rem] flex-col justify-between rounded-2xl border border-[color:var(--lab-accent-border)] bg-[var(--lab-surface-2)] p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 text-xs font-medium text-white/60">
                      <span>Acute:Chronic</span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneClass[activeData.ratioThresholdTone]}`}
                      >
                        Threshold: {activeData.ratioThreshold}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 items-end gap-3">
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-white/45">Acute</div>
                        <div className="mt-1 text-xl font-semibold text-white/90">{activeData.acuteLoad}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-white/45">Chronic</div>
                        <div className="mt-1 text-xl font-semibold text-white/90">{activeData.chronicLoad}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-medium uppercase tracking-wide text-white/45">Ratio</div>
                        <div className="mt-1 text-2xl font-semibold text-white/90">{activeData.ratio}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-white/50">Used to compare short-term load against your rolling baseline.</div>
                </div>

                <div className="flex min-h-[15.5rem] flex-col justify-between rounded-2xl border border-[color:var(--lab-accent-border)] bg-[var(--lab-surface-2)] p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 text-xs font-medium text-white/60">
                      <span>Load analytics</span>
                      <span className={chipClass}>Model: Rolling</span>
                    </div>
                    <div className="rounded-xl border border-[color:var(--lab-accent-border)] bg-[rgba(255,255,255,0.02)] p-3">
                      <div className="flex items-center justify-between text-[11px] font-medium text-white/60">
                        <span>Session trend</span>
                        <span>Mon to Sun</span>
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
                          stroke="var(--lab-analytics)"
                          strokeWidth="3"
                          fill="none"
                          className="transition-all duration-500 motion-reduce:transition-none"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-white/60">Preview computed from sample session data.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mt-16">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[var(--lab-analytics)]">Features</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white/90">
              Train with clarity, not guesswork.
            </h2>
          </div>
          <Flame className="hidden h-8 w-8 text-[var(--lab-accent)] md:block" />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group lab-card rounded-2xl p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[color:var(--lab-accent-border-strong)]"
            >
              <div className="flex items-center justify-between">
                <feature.icon className="h-9 w-9 text-[var(--lab-accent)]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white/95">
                <span className="text-[var(--lab-accent)]">{feature.highlight}</span>{" "}
                {feature.title.replace(feature.highlight, "")}
              </h3>
              <p className="mt-2 text-sm text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mt-16">
        <div className="text-xs font-semibold text-[var(--lab-analytics)]">How it works</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white/90">
          A tight loop from log to load to action.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {howItWorks.map((step) => (
            <div key={step.title} className="lab-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <step.icon className="h-8 w-8 text-[var(--lab-accent)]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white/90">{step.title}</h3>
              <p className="mt-2 text-sm text-white/70">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="metrics" className="mt-16">
        <div className="text-xs font-semibold text-[var(--lab-analytics)]">Metrics Gym-Risk uses</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white/90">
          Signals built for training load context.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {metrics.map((metric) => (
            <div key={metric.title} className="lab-card rounded-2xl p-5">
              <div className="text-lg font-semibold text-white/90">{metric.title}</div>
              <p className="mt-2 text-sm text-white/70">{metric.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs font-medium text-white/50">Informational only, not medical advice.</p>
      </section>

      <section id="built-with" className="mt-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="text-xs font-semibold text-[var(--lab-analytics)]">Built with</div>
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
                  className="rounded-full border border-[color:var(--lab-accent-border)] bg-[var(--lab-surface-2)] px-3 py-1 text-xs text-white/70"
                >
                  {tech}
                </span>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[color:var(--lab-accent-border)] bg-[var(--lab-surface)] p-5">
              <div className="text-xs font-semibold text-[var(--lab-analytics)]">System model</div>
              <p className="mt-2 text-sm text-white/70">
                Deterministic load scoring combines rolling exposure and threshold checks into an interpretable readiness state.
              </p>
            </div>
          </div>
          <div className="lab-card rounded-2xl p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <BarChart3 className="h-4 w-4 text-[var(--lab-accent)]" /> Engineering highlights
            </div>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li className="flex gap-2">
                <ChevronRight className="mt-1 h-3 w-3 text-[var(--lab-accent)]" />
                Consistent spacing and systemized layout.
              </li>
              <li className="flex gap-2">
                <ChevronRight className="mt-1 h-3 w-3 text-[var(--lab-accent)]" />
                Semantic headings and accessible focus.
              </li>
              <li className="flex gap-2">
                <ChevronRight className="mt-1 h-3 w-3 text-[var(--lab-accent)]" />
                Lightweight charts built with SVG.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="faq" className="mt-16">
        <div className="text-xs font-semibold text-[var(--lab-analytics)]">FAQ</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white/90">
          Your questions, answered clearly.
        </h2>
        <div className="mt-6 space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={item.question} className="rounded-2xl border border-[color:var(--lab-accent-border)] bg-[var(--lab-surface)]">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lab-accent-strong)]"
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
        <div className="lab-card rounded-[24px] p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-semibold text-[var(--lab-analytics)]">Ready to train smarter?</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white/90">
                Get clarity on load, fatigue, and readiness.
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Signals are informational, not a replacement for medical advice.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={primaryCtaHref} className="btn-primary">
                Start tracking workouts free
              </Link>
              <Link href={secondaryCtaHref} className="btn-secondary">
                Open existing workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-16 border-t border-[color:var(--lab-accent-border)] pt-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-white/80">Gym-Risk</div>
            <p className="mt-2 text-sm text-white/60">Load-aware training insights for committed athletes.</p>
            <p className="mt-2 text-xs text-white/45">Created by Aryan Rawat.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/60">
            <Link href="https://github.com/jumbomuffin101/gym-risk-app" className="hover:text-white">
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
