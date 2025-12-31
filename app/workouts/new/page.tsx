import Link from "next/link";

export default function NewWorkoutPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">New Workout</h1>
        <p className="text-sm text-gray-600">
          This is the starting point for building workouts.
        </p>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm">Next we’ll add:</div>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Select exercises</li>
          <li>Add sets/reps/weight</li>
          <li>Compute risk score</li>
        </ul>

        <Link
          href="/exercises"
          className="inline-block rounded-lg bg-black px-4 py-2 text-sm text-white"
        >
          Pick exercises from library
        </Link>
      </div>
    </div>
  );
}
