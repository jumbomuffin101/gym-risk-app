"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createExerciseDetailSetEntryAction } from "@/app/exercises/actions";

type SessionSet = {
  performedAt: string;
  reps: number;
  weight: number;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rpe: number | null;
  pain: number | null;
  notes: string | null;
};

type LoggingProfile = {
  name: string;
  summary: string;
  repsLabel: string;
  weightLabel: string;
  quickRepValues: number[];
  quickWeightValues: number[];
  emptyState: string;
  durationLabel?: string;
  quickDurationValues?: number[];
  distanceLabel?: string;
  quickDistanceValues?: number[];
  notesPlaceholder?: string;
};

type ActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
    };

export default function ExerciseQuickLogger({
  exerciseId,
  activeSession,
  lastSet,
  sessionSets,
  profile,
  nextExerciseHref,
}: {
  exerciseId: string;
  activeSession: boolean;
  lastSet: SessionSet | null;
  sessionSets: SessionSet[];
  profile: LoggingProfile;
  nextExerciseHref?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recentSessionSets, setRecentSessionSets] = useState<SessionSet[]>(sessionSets);
  const [reps, setReps] = useState(lastSet?.reps ? String(lastSet.reps) : "");
  const [weight, setWeight] = useState(lastSet?.weight ? String(lastSet.weight) : "");
  const [durationSeconds, setDurationSeconds] = useState(
    lastSet?.durationSeconds ? String(lastSet.durationSeconds) : ""
  );
  const [distanceMeters, setDistanceMeters] = useState(
    lastSet?.distanceMeters ? String(lastSet.distanceMeters) : ""
  );
  const [rpe, setRpe] = useState(lastSet?.rpe ? String(lastSet.rpe) : "");
  const [pain, setPain] = useState(lastSet?.pain !== null && lastSet?.pain !== undefined ? String(lastSet.pain) : "");
  const [notes, setNotes] = useState(lastSet?.notes ?? "");
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(
      lastSet?.durationSeconds !== null ||
        lastSet?.distanceMeters !== null ||
        lastSet?.notes ||
        lastSet?.rpe !== null ||
        lastSet?.pain !== null
    )
  );

  function applySet(set: SessionSet) {
    setReps(String(set.reps));
    setWeight(String(set.weight));
    setDurationSeconds(set.durationSeconds !== null ? String(set.durationSeconds) : "");
    setDistanceMeters(set.distanceMeters !== null ? String(set.distanceMeters) : "");
    setRpe(set.rpe !== null ? String(set.rpe) : "");
    setPain(set.pain !== null ? String(set.pain) : "");
    setNotes(set.notes ?? "");
  }

  function bumpNumeric(value: string, delta: number, min = 0) {
    const current = Number(value || 0);
    const next = Math.max(min, current + delta);
    return String(Number.isFinite(next) ? next : min);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide lab-muted">Logging mode</div>
          <div className="mt-1 text-sm font-semibold text-white/90">{profile.name}</div>
        </div>
        <div className="max-w-md text-sm text-white/60">{profile.summary}</div>
      </div>

      {recentSessionSets.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide lab-muted">Sets already logged</div>
          <div className="grid gap-2">
            {recentSessionSets.slice(0, 4).map((set, index) => (
              <button
                key={`${set.performedAt}-${index}`}
                type="button"
                onClick={() => applySet(set)}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-white/80 hover:bg-white/[0.06]"
              >
                <span>{formatSetPreview(set, profile)}</span>
                <span className="text-xs text-white/45">Use</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-sm text-white/65">
          {profile.emptyState}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => lastSet && applySet(lastSet)}
          disabled={!lastSet}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06] disabled:opacity-40"
        >
          Repeat last set
        </button>
        <button
          type="button"
          onClick={() => setReps((value) => bumpNumeric(value, 1, 1))}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
        >
          +1 rep
        </button>
        <button
          type="button"
          onClick={() => setReps((value) => bumpNumeric(value, -1, 1))}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
        >
          -1 rep
        </button>
        <button
          type="button"
          onClick={() => setWeight((value) => bumpNumeric(value, 5, 0))}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
        >
          +5 load
        </button>
        <button
          type="button"
          onClick={() => setWeight((value) => bumpNumeric(value, -5, 0))}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
        >
          -5 load
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <PresetGroup
          label={`${profile.repsLabel} presets`}
          values={profile.quickRepValues}
          selectedValue={reps}
          onSelect={setReps}
        />
        <PresetGroup
          label={`${profile.weightLabel} presets`}
          values={profile.quickWeightValues}
          selectedValue={weight}
          onSelect={setWeight}
        />
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setSuccess(null);

          const form = event.currentTarget;
          const formData = new FormData(form);

          startTransition(async () => {
            const result = (await createExerciseDetailSetEntryAction(formData)) as ActionResult;
            if (!result.ok) {
              setError(result.error || "Could not save set.");
              return;
            }

            const nextSet: SessionSet = {
              performedAt: new Date().toISOString(),
              reps: Number(reps),
              weight: Number(weight),
              durationSeconds: durationSeconds ? Number(durationSeconds) : null,
              distanceMeters: distanceMeters ? Number(distanceMeters) : null,
              rpe: rpe ? Number(rpe) : null,
              pain: pain ? Number(pain) : null,
              notes: notes.trim() || null,
            };

            setRecentSessionSets((prev) => [nextSet, ...prev]);
            applySet(nextSet);
            setSuccess("Set logged.");
          });
        }}
      >
        <input type="hidden" name="exerciseId" value={exerciseId} />

        <fieldset disabled={!activeSession || pending} className="space-y-4 disabled:opacity-50">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <div className="text-xs lab-muted">{profile.repsLabel}</div>
              <input
                name="reps"
                type="number"
                min={1}
                required
                value={reps}
                onChange={(event) => setReps(event.target.value)}
                placeholder={profile.repsLabel}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35"
              />
            </label>

            <label className="space-y-1">
              <div className="text-xs lab-muted">{profile.weightLabel}</div>
              <input
                name="weight"
                type="number"
                min={0}
                step="0.5"
                required
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                placeholder={profile.weightLabel}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
          >
            {showAdvanced ? "Hide extra fields" : "More fields"}
          </button>

          {showAdvanced ? (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="grid gap-3 lg:grid-cols-2">
                {profile.durationLabel ? (
                  <PresetGroup
                    label={`${profile.durationLabel} presets`}
                    values={profile.quickDurationValues ?? []}
                    selectedValue={durationSeconds}
                    onSelect={setDurationSeconds}
                  />
                ) : null}
                {profile.distanceLabel ? (
                  <PresetGroup
                    label={`${profile.distanceLabel} presets`}
                    values={profile.quickDistanceValues ?? []}
                    selectedValue={distanceMeters}
                    onSelect={setDistanceMeters}
                  />
                ) : null}
              </div>

              <div
                className={`grid gap-3 ${
                  profile.durationLabel || profile.distanceLabel ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2"
                }`}
              >
                {profile.durationLabel ? (
                  <label className="space-y-1">
                    <div className="text-xs lab-muted">{profile.durationLabel}</div>
                    <input
                      name="durationSeconds"
                      type="number"
                      min={1}
                      step={1}
                      value={durationSeconds}
                      onChange={(event) => setDurationSeconds(event.target.value)}
                      placeholder={profile.durationLabel}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35"
                    />
                  </label>
                ) : null}

                {profile.distanceLabel ? (
                  <label className="space-y-1">
                    <div className="text-xs lab-muted">{profile.distanceLabel}</div>
                    <input
                      name="distanceMeters"
                      type="number"
                      min={0}
                      step="1"
                      value={distanceMeters}
                      onChange={(event) => setDistanceMeters(event.target.value)}
                      placeholder={profile.distanceLabel}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35"
                    />
                  </label>
                ) : null}

                <label className="space-y-1">
                  <div className="text-xs lab-muted">RPE</div>
                  <input
                    name="rpe"
                    type="number"
                    min={1}
                    max={10}
                    step="0.5"
                    value={rpe}
                    onChange={(event) => setRpe(event.target.value)}
                    placeholder="6-10"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-xs lab-muted">Pain</div>
                  <input
                    name="pain"
                    type="number"
                    min={0}
                    max={10}
                    step={1}
                    value={pain}
                    onChange={(event) => setPain(event.target.value)}
                    placeholder="0-10"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35"
                  />
                </label>
              </div>

              {profile.notesPlaceholder ? (
                <label className="space-y-1">
                  <div className="text-xs lab-muted">Notes</div>
                  <textarea
                    name="notes"
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder={profile.notesPlaceholder}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35"
                  />
                </label>
              ) : null}

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wide lab-muted">RPE quick picks</div>
                  <div className="flex flex-wrap gap-2">
                    {[6, 7, 8, 9, 10].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRpe(String(value))}
                        className={`rounded-xl border px-3 py-1.5 text-xs ${
                          rpe === String(value)
                            ? "border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.12)] text-white"
                            : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wide lab-muted">Pain quick picks</div>
                  <div className="flex flex-wrap gap-2">
                    {[0, 2, 4, 6, 8].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPain(String(value))}
                        className={`rounded-xl border px-3 py-1.5 text-xs ${
                          pain === String(value)
                            ? "border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.12)] text-white"
                            : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <input type="hidden" name="rpe" value={rpe} />
              <input type="hidden" name="pain" value={pain} />
              <input type="hidden" name="durationSeconds" value={durationSeconds} />
              <input type="hidden" name="distanceMeters" value={distanceMeters} />
              <input type="hidden" name="notes" value={notes} />
            </>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button className="lab-hover rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
              {pending ? "Logging..." : "Log set"}
            </button>
            {nextExerciseHref ? (
              <Link
                href={nextExerciseHref}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
              >
                Next exercise
              </Link>
            ) : null}
          </div>
        </fieldset>
      </form>

      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      {success ? <div className="text-sm text-emerald-300">{success}</div> : null}
    </div>
  );
}

function PresetGroup({
  label,
  values,
  selectedValue,
  onSelect,
}: {
  label: string;
  values: number[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-wide lab-muted">{label}</div>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={`${label}-${value}`}
            type="button"
            onClick={() => onSelect(String(value))}
            className={`rounded-xl border px-3 py-1.5 text-xs ${
              selectedValue === String(value)
                ? "border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.12)] text-white"
                : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatSetPreview(set: SessionSet, profile: LoggingProfile) {
  const parts = [`${set.reps} ${profile.repsLabel.toLowerCase()}`, `${set.weight} ${profile.weightLabel.toLowerCase()}`];

  if (set.durationSeconds !== null) {
    parts.push(`${set.durationSeconds}s`);
  }

  if (set.distanceMeters !== null) {
    parts.push(`${set.distanceMeters}m`);
  }

  if (set.rpe !== null) {
    parts.push(`RPE ${set.rpe}`);
  }

  if (set.pain !== null) {
    parts.push(`Pain ${set.pain}`);
  }

  if (set.notes) {
    parts.push(set.notes);
  }

  return parts.join(" | ");
}
