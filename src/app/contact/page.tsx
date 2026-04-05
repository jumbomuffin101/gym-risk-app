import Link from "next/link";

export const runtime = "nodejs";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="lab-card rounded-2xl p-5 space-y-2">
        <div className="text-xs uppercase tracking-wide lab-muted">Contact</div>
        <h1 className="text-2xl font-semibold tracking-tight text-white/95">Project links</h1>
        <p className="text-sm text-white/70">
          The cleanest way to follow up on Gym-Risk right now is through the repository.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="https://github.com/jumbomuffin101/gym-risk-app"
          className="lab-card rounded-2xl p-5 space-y-2 hover:bg-white/[0.04]"
        >
          <div className="text-lg font-semibold text-white/90">GitHub repository</div>
          <p className="text-sm text-white/70">
            Browse the code, follow updates, or open an issue for product feedback and bugs.
          </p>
        </Link>

        <Link
          href="https://github.com/jumbomuffin101/gym-risk-app/issues"
          className="lab-card rounded-2xl p-5 space-y-2 hover:bg-white/[0.04]"
        >
          <div className="text-lg font-semibold text-white/90">Issue tracker</div>
          <p className="text-sm text-white/70">
            Use this for broken flows, confusing UI, or ideas that should become tracked work.
          </p>
        </Link>
      </section>
    </div>
  );
}
