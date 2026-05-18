"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { normalizeWorkoutName } from "@/app/lib/workouts";

type SaveWorkoutResult = {
  ok: false;
  error: string;
};

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      return Number(value);
    },
    z.number().min(min).max(max).optional()
  );

const WorkoutSetSchema = z.object({
  reps: z.coerce.number().int().min(1, "Reps must be greater than 0."),
  weight: z.coerce.number().min(0, "Weight must be 0 or greater."),
  rpe: optionalNumber(1, 10),
  pain: optionalNumber(0, 10),
});

const WorkoutExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.array(WorkoutSetSchema).min(1, "Each exercise needs at least one set."),
});

const WorkoutDateSchema = z.string().trim().min(1, "Workout date is required.").refine(
  (value) => Number.isFinite(new Date(value).getTime()),
  "Enter a valid workout date."
);

const SaveWorkoutSchema = z.object({
  workoutName: z.string().trim().max(120, "Workout name must be 120 characters or fewer.").optional(),
  workoutDate: WorkoutDateSchema,
  redirectTo: z.enum(["/dashboard", "/workouts", "/log"]).optional(),
  exercises: z.array(WorkoutExerciseSchema).min(1, "Select at least one exercise."),
});

const SaveTemplateSchema = z.object({
  workoutName: z.string().trim().min(1, "Workout name is required.").max(120, "Workout name must be 120 characters or fewer."),
  redirectTo: z.enum(["/dashboard", "/workouts", "/log"]).optional(),
  exercises: z.array(WorkoutExerciseSchema).min(1, "Select at least one exercise."),
});

async function validateExerciseIds(exerciseIds: string[]) {
  const existingExercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds } },
    select: { id: true },
  });
  const existingIds = new Set(existingExercises.map((exercise) => exercise.id));

  return existingIds.size === exerciseIds.length;
}

export async function saveWorkoutLogAction(input: unknown): Promise<SaveWorkoutResult> {
  const parsed = SaveWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the workout and try again.",
    };
  }

  const userId = await requireDbUserId();
  const exerciseIds = Array.from(new Set(parsed.data.exercises.map((exercise) => exercise.exerciseId)));

  if (!(await validateExerciseIds(exerciseIds))) {
    return { ok: false, error: "One or more selected exercises could not be found." };
  }

  const workoutStartedAt = new Date(parsed.data.workoutDate);
  const workoutEndedAt = new Date(workoutStartedAt.getTime() + 60 * 1000);
  const note = normalizeWorkoutName(parsed.data.workoutName);

  await prisma.$transaction(async (tx) => {
    const session = await tx.workoutSession.create({
      data: {
        userId,
        startedAt: workoutStartedAt,
        endedAt: workoutEndedAt,
        note,
      },
      select: { id: true },
    });

    await tx.setEntry.createMany({
      data: parsed.data.exercises.flatMap((exercise) =>
        exercise.sets.map((set) => ({
          userId,
          sessionId: session.id,
          exerciseId: exercise.exerciseId,
          reps: set.reps,
          weight: set.weight,
          rpe: set.rpe ?? null,
          pain: set.pain ?? null,
          performedAt: workoutStartedAt,
        }))
      ),
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/workouts");
  revalidatePath("/workouts/new");
  revalidatePath("/log");
  revalidatePath("/exercises");
  for (const exerciseId of exerciseIds) {
    revalidatePath(`/exercises/${exerciseId}`);
  }

  redirect(parsed.data.redirectTo ?? "/workouts");
}

export async function saveWorkoutTemplateAction(input: unknown): Promise<SaveWorkoutResult> {
  const parsed = SaveTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the workout template and try again.",
    };
  }

  const userId = await requireDbUserId();
  const exerciseIds = Array.from(new Set(parsed.data.exercises.map((exercise) => exercise.exerciseId)));

  if (!(await validateExerciseIds(exerciseIds))) {
    return { ok: false, error: "One or more selected exercises could not be found." };
  }

  const name = normalizeWorkoutName(parsed.data.workoutName);
  if (!name) {
    return { ok: false, error: "Workout name is required." };
  }

  const plannedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const session = await tx.workoutSession.create({
      data: {
        userId,
        startedAt: plannedAt,
        endedAt: null,
        note: name,
      },
      select: { id: true },
    });

    await tx.setEntry.createMany({
      data: parsed.data.exercises.flatMap((exercise) =>
        exercise.sets.map((set) => ({
          userId,
          sessionId: session.id,
          exerciseId: exercise.exerciseId,
          reps: set.reps,
          weight: set.weight,
          rpe: set.rpe ?? null,
          pain: set.pain ?? null,
          performedAt: plannedAt,
        }))
      ),
    });
  });

  revalidatePath("/workouts");
  revalidatePath("/workouts/new");
  revalidatePath("/log");

  redirect(parsed.data.redirectTo ?? "/workouts");
}

export async function saveWorkoutBuilderAction(input: unknown): Promise<SaveWorkoutResult> {
  return saveWorkoutLogAction(input);
}

export async function saveWorkoutAction(input: unknown): Promise<SaveWorkoutResult> {
  return saveWorkoutLogAction(input);
}
