import { endWorkoutSessionAction } from "@/app/exercises/[id]/actions";

export default function ActiveSessionBanner({
  sessionId,
}: {
  sessionId: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-center justify-between">
      <div>
        <div className="text-sm text-zinc-400">Active workout</div>
        <div className="font-medium text-zinc-100">
          Session in progress
        </div>
      </div>

      <form action={endWorkoutSessionAction.bind(null, sessionId)}>
        <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500">
          End session
        </button>
      </form>
    </div>
  );
}
