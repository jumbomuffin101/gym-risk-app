import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/signin?callbackUrl=/dashboard");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/signin?callbackUrl=/dashboard");

  const [sessions, risks] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      take: 8,
      select: { id: true, startedAt: true, note: true, _count: { select: { sets: true } } },
    }),
    prisma.riskEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, createdAt: true, riskScore: true, title: true, kind: true, sessionId: true },
    }),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-gray-600">Logged in as {session.user.email}</p>
        <div className="flex gap-4 text-sm">
          <Link className="underline" href="/log">Go to Logger</Link>
        </div>
      </header>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="font-medium">Recent sessions</h2>
          {sessions.length === 0 ? <p className="text-sm text-gray-600">No sessions yet.</p> : null}
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{new Date(s.startedAt).toLocaleString()}</div>
                  <div className="text-xs text-gray-600">{s._count.sets} sets</div>
                </div>
                {s.note ? <div className="text-xs text-gray-600 mt-1">{s.note}</div> : null}
                <div className="text-xs text-gray-500 mt-1">{s.id}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="font-medium">Risk feed (v0)</h2>
          {risks.length === 0 ? (
            <p className="text-sm text-gray-600">
              No risk events yet. Log a session with high RPE/pain or a volume spike.
            </p>
          ) : null}

          <div className="space-y-2">
            {risks.map((r) => (
              <div key={r.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-xs font-semibold">{r.riskScore}/100</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(r.createdAt).toLocaleString()} • kind: {r.kind}
                </div>
                {r.sessionId ? <div className="text-xs text-gray-500 mt-1">session: {r.sessionId}</div> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-medium">How to trigger risk events (quick test)</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 mt-2 space-y-1">
          <li>Log 3+ sets with <b>RPE ≥ 9</b> in one session.</li>
          <li>Log a set with <b>Pain ≥ 7</b>.</li>
          <li>Do a big tonnage spike in a category compared to recent 7-day baseline (after you have enough data).</li>
        </ul>
      </section>
    </div>
  );
}
