import Link from "next/link";
import { AuthButtons } from "./components/AuthButtons";

export default function HomePage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Gym Risk App</h1>
          <p className="text-muted-foreground mt-2">
            Log workouts, detect risky spikes in training load, and get explainable injury-risk warnings.
          </p>
        </div>

	<AuthButtons />


        <div className="rounded-xl border p-4">
          <h2 className="font-medium">Next steps</h2>
          <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
            <li>Seed the exercise catalog</li>
            <li>Build workout logging flow</li>
            <li>Implement Risk Engine v0 (rule-based + explainable)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
