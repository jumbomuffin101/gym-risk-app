const SESSION_PLAN_PREFIX = "__session_plan__:";

type SessionPlanPayload = {
  selectedExerciseIds: string[];
};

export function readSessionPlan(note: string | null | undefined): SessionPlanPayload {
  if (!note || !note.startsWith(SESSION_PLAN_PREFIX)) {
    return { selectedExerciseIds: [] };
  }

  try {
    const parsed = JSON.parse(note.slice(SESSION_PLAN_PREFIX.length)) as Partial<SessionPlanPayload>;
    const selectedExerciseIds = Array.isArray(parsed.selectedExerciseIds)
      ? Array.from(
          new Set(
            parsed.selectedExerciseIds
              .map((item) => (typeof item === "string" ? item.trim() : ""))
              .filter(Boolean)
          )
        )
      : [];

    return { selectedExerciseIds };
  } catch {
    return { selectedExerciseIds: [] };
  }
}

export function writeSessionPlan(selectedExerciseIds: string[]) {
  return `${SESSION_PLAN_PREFIX}${JSON.stringify({
    selectedExerciseIds: Array.from(new Set(selectedExerciseIds.map((item) => item.trim()).filter(Boolean))),
  })}`;
}
