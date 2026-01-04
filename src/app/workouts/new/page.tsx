import Link from "next/link";

export default function NewWorkoutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Workouts</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
          New workout
        </h1>
        <p className="mt-1 text-sm lab-muted">
          Build a session flow that feels fast and obvious.
        </p>
      </header>

      <div className="lab-card lab-hover rounded-2xl p-5">
        <div className="text-sm font-semibold text-white/90">Next we will add</div>
        <ul className="mt-3 list-disc pl-5 text-sm text-white/75 space-y-1">
          <li>Select exercises</li>
          <li>Add sets, reps, weight</li>
          <li>Compute a risk score</li>
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/exercises"
            className="lab-hover inline-flex rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black"
            style={{
              boxShadow:
                "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.12)",
            }}
          >
            Pick exercises
          </Link>

          <Link
            href="/workouts"
            className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
          >
            Back to workouts
          </Link>
        </div>
      </div>
    </div>
  );
}
