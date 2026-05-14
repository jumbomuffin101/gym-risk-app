"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";

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

const SaveWorkoutSchema = z.object({
  note: z.string().trim().max(500).optional(),
  exercises: z.array(WorkoutExerciseSchema).min(1, "Select at least one exercise."),
});

export async function saveWorkoutAction(input: unknown): Promise<SaveWorkoutResult> {
  const parsed = SaveWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the workout and try again.",
    };
  }

  const userId = await requireDbUserId();
  const exerciseIds = Array.from(new Set(parsed.data.exercises.map((exercise) => exercise.exerciseId)));
  const existingExercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds } },
    select: { id: true },
  });
  const existingIds = new Set(existingExercises.map((exercise) => exercise.id));

  if (existingIds.size !== exerciseIds.length) {
    return { ok: false, error: "One or more selected exercises could not be found." };
  }

  const now = new Date();
  const note = parsed.data.note?.trim() || null;

  await prisma.$transaction(async (tx) => {
    const session = await tx.workoutSession.create({
      data: {
        userId,
        startedAt: now,
        endedAt: now,
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
          performedAt: now,
        }))
      ),
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/workouts");
  revalidatePath("/workouts/new");
  revalidatePath("/exercises");
  for (const exerciseId of exerciseIds) {
    revalidatePath(`/exercises/${exerciseId}`);
  }

  redirect("/workouts");
}
