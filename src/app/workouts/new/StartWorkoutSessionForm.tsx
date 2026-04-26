import { startWorkoutSession } from "@/app/exercises/actions";

export default function StartWorkoutSessionForm() {
  return (
    <form action={startWorkoutSession}>
      <input type="hidden" name="redirectTo" value="/workouts/new" />
      <button
        className="lab-hover rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black"
        style={{
          boxShadow: "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.12)",
        }}
      >
        Start session
      </button>
    </form>
  );
}
