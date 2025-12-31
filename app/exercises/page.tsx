import Link from "next/link";
import { getExercises } from "@/lib/data/exercises";
export const runtime = "nodejs";

export default async function ExercisesPage() {
  const exercises = await getExercises();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Exercises</h1>
        <p className="text-sm text-gray-600">Loaded from your database seed.</p>
      </div>

      <div className="rounded-xl border">
        {exercises.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">
            No exercises found. Run:
            <span className="ml-2 rounded bg-gray-100 px-2 py-1 font-mono">
              npm run seed
            </span>
          </div>
        ) : (
          <ul className="divide-y">
            {exercises.map((ex: any) => (
              <li key={String(ex.id)}>
                <Link
                  href={`/exercises/${String(ex.id)}`}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="font-medium">{ex.name ?? "(no name)"}</div>
                  <div className="text-xs text-gray-500">
                    id: {String(ex.id)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
