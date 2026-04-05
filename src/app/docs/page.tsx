import Link from "next/link";

export const runtime = "nodejs";

const sections = [
  {
    title: "Workout Flow",
    body: "Build a session queue, pick the exercises you want, then move into logging one exercise at a time.",
  },
  {
    title: "Logging",
    body: "Enter reps, load, effort, and pain. Conditioning and core movements can also use time or distance when supported.",
  },
  {
    title: "Session Result",
    body: "See the whole session at once so you can judge overall strain, not just one exercise in isolation.",
  },
  {
    title: "History",
    body: "Use the history timeline for a quick scan, then open a session when you need the full breakdown.",
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="lab-card rounded-2xl p-5 space-y-2">
        <div className="text-xs uppercase tracking-wide lab-muted">Docs</div>
        <h1 className="text-2xl font-semibold tracking-tight text-white/95">Using Gym-Risk</h1>
        <p className="text-sm text-white/70">
          Gym-Risk is built around one loop: plan the session, log the work, read the result, then review history later.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className="lab-card rounded-2xl p-5 space-y-2">
            <div className="text-lg font-semibold text-white/90">{section.title}</div>
            <p className="text-sm text-white/70">{section.body}</p>
          </div>
        ))}
      </section>

      <div className="lab-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white/90">Need the product flow?</div>
          <div className="mt-1 text-xs text-white/60">Start from Workout Flow and the app will carry the session through.</div>
        </div>
        <Link
          href="/workouts/new"
          className="rounded-xl border border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.1)] px-4 py-2 text-sm font-medium text-white hover:bg-[rgba(34,197,94,0.15)]"
        >
          Open Workout Flow
        </Link>
      </div>
    </div>
  );
}
