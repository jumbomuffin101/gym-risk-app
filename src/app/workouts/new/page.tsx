import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import NewWorkoutClient from "./NewWorkoutClient";

export const runtime = "nodejs";

export default async function NewWorkoutPage() {
  const userId = await requireDbUserId();
  const activeSession = await getActiveWorkoutSession(userId);

  return (
    <NewWorkoutClient
      initialActiveSession={
        activeSession
          ? {
              id: activeSession.id,
              startedAt: activeSession.startedAt.toISOString(),
            }
          : null
      }
    />
  );
}