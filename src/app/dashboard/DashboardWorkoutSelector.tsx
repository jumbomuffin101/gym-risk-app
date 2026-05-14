"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type WorkoutOption = {
  id: string;
  label: string;
};

export function DashboardWorkoutSelector({
  options,
  selectedId,
}: {
  options: WorkoutOption[];
  selectedId: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectWorkout(workoutId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (workoutId) {
      params.set("workoutId", workoutId);
    } else {
      params.delete("workoutId");
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <label className="block min-w-0 sm:min-w-80">
      <span className="text-xs uppercase tracking-wide lab-muted">Analyze workout</span>
      <select
        value={selectedId ?? ""}
        onChange={(event) => selectWorkout(event.target.value)}
        disabled={options.length === 0}
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1722] px-3 py-3 text-sm text-white/90 outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-[rgba(34,197,94,0.35)]"
      >
        {options.length === 0 ? <option value="">No completed workouts</option> : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

