"use client";

import { useEffect, useMemo, useState } from "react";

type Exercise = { id: string; name: string; category: string };

type SessionRow = {
  id: string;
  startedAt: string;
  note: string | null;
  _count: { sets: number };
};

type SetRow = {
  id: string;
  performedAt: string;
  weight: number;
  reps: number;
  rpe: number | null;
  pain: number | null;
  exercise: { id: string; name: string; category: string };
};

export default function LogPage() {
  const [error, setError] = useState<string | null>(null);

  // Exercises
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);

  // Sessions list
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Active session
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sets, setSets] = useState<SetRow[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);

  // Set form
  const [exerciseId, setExerciseId] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [pain, setPain] = useState("");

  useEffect(() => {
    async function init() {
      setError(null);

      setLoadingExercises(true);
      const exRes = await fetch("/api/exercises");
      const exData = await exRes.json().catch(() => ({}));
      setExercises(exData.exercises ?? []);
      setLoadingExercises(false);

      await refreshSessions();
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshSessions() {
    setLoadingSessions(true);
    const res = await fetch("/api/me/sessions");
    if (!res.ok) {
      setLoadingSessions(false);
      setError("Could not load your sessions. Are you signed in?");
      return;
    }
    const data = await res.json().catch(() => ({}));
    setSessions(data.sessions ?? []);
    setLoadingSessions(false);
  }

  const groupedExercises = useMemo(() => {
    const map: Record<string, Exercise[]> = {};
    for (const ex of exercises) {
      map[ex.category] ??= [];
      map[ex.category].push(ex);
    }
    return map;
  }, [exercises]);

  async function loadSets(forSessionId: string) {
    setLoadingSets(true);
    const res = await fetch(`/api/sessions/${forSessionId}/sets`);
    const data = await res.json().catch(() => ({}));
    setLoadingSets(false);

    if (!res.ok) {
      setError(data?.error ?? "Failed to load sets.");
      return;
    }

    setSets(data.sets ?? []);
  }

  async function startSession() {
    setError(null);

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.error ?? "Failed to start session (are you signed in?).");
      return;
    }

    const id = data.session.id as string;
    setSessionId(id);
    await refreshSessions();
    await loadSets(id);
  }

  async function pickSession(id: string) {
    setError(null);
    setSessionId(id);
    await loadSets(id);
  }

  async function addSet(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!sessionId) {
      setError("Start or select a session first.");
      return;
    }

    const res = await fetch("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        exerciseId,
        weight,
        reps,
        rpe: rpe === "" ? null : Number(rpe),
        pain: pain === "" ? null : Number(pain),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.error ?? "Failed to add set.");
      return;
    }

    // Reset inputs
    setWeight("");
    setReps("");
    setRpe("");
    setPain("");

    // Refresh DB state
    await refreshSessions();
    await loadSets(sessionId);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Workout Logger</h1>
        <p className="text-gray-600">
          Pick a recent session or start a new one, then log sets.
        </p>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="font-medium">Your recent sessions</h2>
          {loadingSessions ? <p className="text-sm text-gray-600">Loading…</p> : null}
          {!loadingSessions && sessions.length === 0 ? (
            <p className="text-sm text-gray-600">No sessions yet. Start one!</p>
          ) : null}

          <div className="space-y-2">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => pickSession(s.id)}
                className={`w-full text-left border rounded-lg p-3 hover:bg-gray-50 ${
                  sessionId === s.id ? "border-black" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">
                    {new Date(s.startedAt).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">{s._count.sets} sets</div>
                </div>
                {s.note ? <div className="text-xs text-gray-600 mt-1">{s.note}</div> : null}
                <div className="text-xs text-gray-500 mt-1">{s.id}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="font-medium">Start a new session</h2>
          <input
            className="w-full border rounded-md p-2"
            placeholder="Optional note (sleep, pain, goals...)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className="rounded-md bg-black text-white px-4 py-2" onClick={startSession}>
            Start session
          </button>
          {sessionId ? (
            <p className="text-sm text-green-700">Active session: {sessionId}</p>
          ) : (
            <p className="text-sm text-gray-600">Select a session to log sets.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="font-medium">Add set</h2>
        {loadingExercises ? <p className="text-sm text-gray-600">Loading exercises…</p> : null}

        <form onSubmit={addSet} className="space-y-3">
          <select
            className="w-full border rounded-md p-2"
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            required
            disabled={!sessionId}
          >
            <option value="">{sessionId ? "Select exercise" : "Select a session first"}</option>
            {Object.keys(groupedExercises)
              .sort()
              .map((cat) => (
                <optgroup key={cat} label={cat}>
                  {groupedExercises[cat].map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input
              className="border rounded-md p-2"
              placeholder="Weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              disabled={!sessionId}
            />
            <input
              className="border rounded-md p-2"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              required
              disabled={!sessionId}
            />
            <input
              className="border rounded-md p-2"
              placeholder="RPE (1-10 optional)"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              disabled={!sessionId}
            />
            <input
              className="border rounded-md p-2"
              placeholder="Pain (0-10 optional)"
              value={pain}
              onChange={(e) => setPain(e.target.value)}
              disabled={!sessionId}
            />
          </div>

          <button className="rounded-md bg-black text-white px-4 py-2" type="submit" disabled={!sessionId}>
            Add set
          </button>
        </form>
      </section>

      <section className="rounded-xl border p-4 space-y-2">
        <h2 className="font-medium">Sets in active session</h2>
        {loadingSets ? <p className="text-sm text-gray-600">Loading…</p> : null}
        {!loadingSets && sessionId && sets.length === 0 ? (
          <p className="text-sm text-gray-600">No sets yet.</p>
        ) : null}
        {!sessionId ? <p className="text-sm text-gray-600">Select a session.</p> : null}

        <ul className="space-y-2">
          {sets.map((s) => (
            <li key={s.id} className="border rounded-md p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">{s.exercise.name}</div>
                <div className="text-xs text-gray-600">{s.exercise.category}</div>
              </div>
              <div className="mt-1">
                <span className="font-semibold">{s.weight}</span> x{" "}
                <span className="font-semibold">{s.reps}</span>
                <span className="text-gray-600"> • RPE {s.rpe ?? "—"} • Pain {s.pain ?? "—"}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{new Date(s.performedAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
