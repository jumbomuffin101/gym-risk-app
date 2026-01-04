import { requireDbUserId } from "@/app/lib/auth/requireUser";

export default async function HistoryPage() {
  await requireDbUserId();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">History</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
          Session history
        </h1>
        <p className="mt-1 text-sm lab-muted">
          Session logs and risk events will appear here.
        </p>
      </header>

      <div className="lab-card lab-hover rounded-2xl p-5">
        <div className="text-sm font-semibold text-white/90">Nothing yet</div>
        <p className="mt-1 text-sm lab-muted">
          Once you log a few sessions, this will turn into a searchable timeline.
        </p>
      </div>
    </div>
  );
}
