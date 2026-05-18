"use client";

import { useMemo, useState, useTransition } from "react";

import { saveWorkoutLogAction, saveWorkoutTemplateAction } from "./actions";

type ExerciseOption = {
  id: string;
  name: string;
  category: string | null;
};

type BuilderSet = {
  id: string;
  reps: string;
  weight: string;
  rpe: string;
  pain: string;
};

type BuilderExercise = ExerciseOption & {
  sets: BuilderSet[];
};

type PreviousWorkout = {
  id: string;
  label: string;
  name: string;
  exercises: BuilderExercise[];
};

type WorkoutBuilderCopy = {
  libraryLabel?: string;
  libraryPlaceholder?: string;
  builderEyebrow?: string;
  builderTitle?: string;
  saveLabel?: string;
  savingLabel?: string;
  workoutDateHelper?: string;
  previousLabel?: string;
  previousEmptyLabel?: string;
  previousSelectLabel?: string;
  previousUseLabel?: string;
  previousConfirm?: string;
  emptyMessage?: string;
  saveMode?: "log" | "template";
  redirectTo?: "/dashboard" | "/workouts" | "/log";
};

const defaultCopy: Required<WorkoutBuilderCopy> = {
  libraryLabel: "Exercise library",
  libraryPlaceholder: "Search exercises",
  builderEyebrow: "Workout log",
  builderTitle: "Log completed training",
  saveLabel: "Save log",
  savingLabel: "Saving...",
  workoutDateHelper: "Used for workload windows and baseline calculations.",
  previousLabel: "Log from previous workout",
  previousEmptyLabel: "No previous workouts",
  previousSelectLabel: "Select workout",
  previousUseLabel: "Use",
  previousConfirm: "Replace the current log with this previous workout?",
  emptyMessage: "Select exercises from the library or use a previous workout to log training.",
  saveMode: "log",
  redirectTo: "/dashboard",
};

function newSet(values?: Partial<Omit<BuilderSet, "id">>): BuilderSet {
  return {
    id: crypto.randomUUID(),
    reps: values?.reps ?? "",
    weight: values?.weight ?? "",
    rpe: values?.rpe ?? "",
    pain: values?.pain ?? "",
  };
}

function formatDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function WorkoutBuilder({
  exercises,
  previousWorkouts,
  copy,
}: {
  exercises: ExerciseOption[];
  previousWorkouts: PreviousWorkout[];
  copy?: WorkoutBuilderCopy;
}) {
  const ui = { ...defaultCopy, ...copy };
  const [query, setQuery] = useState("");
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState(() => formatDateTimeLocal(new Date()));
  const [previousWorkoutId, setPreviousWorkoutId] = useState("");
  const [selected, setSelected] = useState<BuilderExercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const normalizedQuery = query.trim().toLowerCase();
  const selectedIds = useMemo(() => new Set(selected.map((exercise) => exercise.id)), [selected]);
  const filteredExercises = useMemo(() => {
    const source = exercises.filter((exercise) => !selectedIds.has(exercise.id));
    if (!normalizedQuery) return source.slice(0, 12);

    return source
      .filter((exercise) => {
        const category = exercise.category ?? "uncategorized";
        return (
          exercise.name.toLowerCase().includes(normalizedQuery) ||
          category.toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 12);
  }, [exercises, normalizedQuery, selectedIds]);

  function addExercise(exercise: ExerciseOption) {
    setSelected((current) => [...current, { ...exercise, sets: [newSet()] }]);
    setQuery("");
    setError(null);
  }

  function removeExercise(exerciseId: string) {
    setSelected((current) => current.filter((exercise) => exercise.id !== exerciseId));
  }

  function addSet(exerciseId: string) {
    setSelected((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, sets: [...exercise.sets, newSet()] } : exercise
      )
    );
  }

  function duplicateSet(exerciseId: string, setId: string) {
    setSelected((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const setIndex = exercise.sets.findIndex((set) => set.id === setId);
        if (setIndex < 0) return exercise;

        const source = exercise.sets[setIndex];
        const duplicate = newSet({
          reps: source.reps,
          weight: source.weight,
          rpe: source.rpe,
          pain: source.pain,
        });
        const nextSets = [...exercise.sets];
        nextSets.splice(setIndex + 1, 0, duplicate);
        return { ...exercise, sets: nextSets };
      })
    );
  }

  function removeSet(exerciseId: string, setId: string) {
    setSelected((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const sets = exercise.sets.filter((set) => set.id !== setId);
        return { ...exercise, sets: sets.length > 0 ? sets : [newSet()] };
      })
    );
  }

  function updateSet(exerciseId: string, setId: string, field: keyof Omit<BuilderSet, "id">, value: string) {
    setSelected((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)),
        };
      })
    );
  }

  function usePreviousWorkout() {
    const workout = previousWorkouts.find((item) => item.id === previousWorkoutId);
    if (!workout) return;

    const hasCurrentWork = selected.length > 0 || workoutName.trim().length > 0;
    if (hasCurrentWork && !window.confirm(ui.previousConfirm)) {
      return;
    }

    setWorkoutName(workout.name);
    setSelected(
      workout.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) =>
          newSet({
            reps: set.reps,
            weight: set.weight,
            rpe: set.rpe,
            pain: set.pain,
          })
        ),
      }))
    );
    setError(null);
  }

  function saveWorkout() {
    setError(null);

    startTransition(async () => {
      const exercisesPayload = selected.map((exercise) => ({
        exerciseId: exercise.id,
        sets: exercise.sets.map((set) => ({
          reps: set.reps,
          weight: set.weight,
          rpe: set.rpe,
          pain: set.pain,
        })),
      }));
      const result =
        ui.saveMode === "template"
          ? await saveWorkoutTemplateAction({
              workoutName,
              redirectTo: ui.redirectTo,
              exercises: exercisesPayload,
            })
          : await saveWorkoutLogAction({
        workoutName,
        workoutDate,
        redirectTo: ui.redirectTo,
              exercises: exercisesPayload,
            });

      if (result?.ok === false) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="lab-card rounded-2xl p-5">
        <label className="block">
          <span className="text-xs uppercase tracking-wide lab-muted">{ui.libraryLabel}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ui.libraryPlaceholder}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[rgba(34,197,94,0.35)]"
          />
        </label>

        <div className="mt-4 space-y-2">
          {filteredExercises.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm lab-muted">
              No available exercises match your search.
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => addExercise(exercise)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left hover:bg-white/[0.04]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white/90">
                    {exercise.name}
                  </span>
                  <span className="mt-1 block text-xs lab-muted">
                    {exercise.category ?? "Uncategorized"}
                  </span>
                </span>
                <span className="text-xs text-[var(--lab-safe)]">Add</span>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="lab-card rounded-2xl p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">{ui.builderEyebrow}</div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white/95">
              {ui.builderTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={saveWorkout}
            disabled={pending || selected.length === 0}
            className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? ui.savingLabel : ui.saveLabel}
          </button>
        </div>

        <div className={`mt-5 grid gap-4 ${ui.saveMode === "template" ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "xl:grid-cols-[minmax(0,1fr)_260px_360px]"}`}>
          <label className="block">
            <span className="text-xs uppercase tracking-wide lab-muted">Workout name</span>
            <input
              value={workoutName}
              onChange={(event) => setWorkoutName(event.target.value)}
              placeholder="Workout name, e.g. Push B or Heavy Squat Day"
              maxLength={120}
              required={ui.saveMode === "template"}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[rgba(34,197,94,0.35)]"
            />
          </label>

          {ui.saveMode === "log" ? (
            <label className="block">
              <span className="text-xs uppercase tracking-wide lab-muted">Workout date</span>
              <input
                type="datetime-local"
                value={workoutDate}
                onChange={(event) => setWorkoutDate(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[rgba(34,197,94,0.35)]"
              />
              <span className="mt-2 block text-xs lab-muted">
                {ui.workoutDateHelper}
              </span>
            </label>
          ) : null}

          <label className="block">
            <span className="text-xs uppercase tracking-wide lab-muted">{ui.previousLabel}</span>
            <div className="mt-2 flex gap-2">
              <select
                value={previousWorkoutId}
                onChange={(event) => setPreviousWorkoutId(event.target.value)}
                disabled={previousWorkouts.length === 0}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0f1722] px-3 py-3 text-sm text-white/90 outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-[rgba(34,197,94,0.35)]"
              >
                <option value="">
                  {previousWorkouts.length === 0 ? ui.previousEmptyLabel : ui.previousSelectLabel}
                </option>
                {previousWorkouts.map((workout) => (
                  <option key={workout.id} value={workout.id}>
                    {workout.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={usePreviousWorkout}
                disabled={!previousWorkoutId}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/[0.04] hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ui.previousUseLabel}
              </button>
            </div>
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] p-3 text-sm text-white/85">
            {error}
          </div>
        ) : null}

        {selected.length === 0 ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm lab-muted">
            {ui.emptyMessage}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {selected.map((exercise) => (
              <div key={exercise.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-base font-semibold text-white/90">{exercise.name}</div>
                    <div className="mt-1 text-xs lab-muted">{exercise.category ?? "Uncategorized"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(exercise.id)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/65 hover:bg-white/[0.04] hover:text-white/85"
                  >
                    Remove exercise
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {exercise.sets.map((set, index) => (
                    <div key={set.id} className="grid gap-3 md:grid-cols-[48px_repeat(4,minmax(0,1fr))_150px] md:items-end">
                      <div className="text-xs lab-muted md:pb-3">Set {index + 1}</div>
                      <NumberField
                        label="Reps"
                        min={1}
                        step="1"
                        value={set.reps}
                        onChange={(value) => updateSet(exercise.id, set.id, "reps", value)}
                        required
                      />
                      <NumberField
                        label="Weight"
                        min={0}
                        step="0.5"
                        value={set.weight}
                        onChange={(value) => updateSet(exercise.id, set.id, "weight", value)}
                        required
                      />
                      <NumberField
                        label="RPE"
                        min={1}
                        max={10}
                        step="0.5"
                        value={set.rpe}
                        onChange={(value) => updateSet(exercise.id, set.id, "rpe", value)}
                      />
                      <NumberField
                        label="Pain"
                        min={0}
                        max={10}
                        step="1"
                        value={set.pain}
                        onChange={(value) => updateSet(exercise.id, set.id, "pain", value)}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => duplicateSet(exercise.id, set.id)}
                          className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 hover:bg-white/[0.04] hover:text-white/85"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSet(exercise.id, set.id)}
                          className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 hover:bg-white/[0.04] hover:text-white/85"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addSet(exercise.id)}
                  className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/75 hover:bg-white/[0.04] hover:text-white/90"
                >
                  Add set
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  required,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max?: number;
  step: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs lab-muted">
        {label}
        {required ? "" : " (optional)"}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[rgba(34,197,94,0.35)]"
      />
    </label>
  );
}
