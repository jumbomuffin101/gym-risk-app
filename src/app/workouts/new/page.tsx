import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import { readSessionPlan } from "@/app/lib/sessionPlan";
import NewWorkoutClient from "./NewWorkoutClient";
import StartWorkoutSessionForm from "./StartWorkoutSessionForm";

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
              selectedExerciseIds: readSessionPlan(activeSession.note).selectedExerciseIds,
            }
          : null
      }
      startSessionForm={<StartWorkoutSessionForm />}
    />
  );
}
