"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOrCreateDbUserId } from "@/app/lib/auth/getUserId";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";

const CreateSetSchema = z.object({
  exerciseId: z.string().min(1),
  reps: z.coerce.number().int().min(1),
  weight: z.coerce.number().min(0).optional(),
  sessionId: z.string().optional(),
});

export type CreateSetEntryResult =
  | { ok: true }
  | { ok: false; error: string };

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createSetEntryAction(formData: FormData): Promise<CreateSetEntryResult> {
  const parsed = CreateSetSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    reps: formData.get("reps"),
    weight: formData.get("weight"),
    sessionId: formData.get("sessionId") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join(", ") };
  }

  const { exerciseId, reps, weight, sessionId } = parsed.data;
  const rpe = parseOptionalNumber(formData.get("rpe"));
  const pain = parseOptionalNumber(formData.get("pain"));
  const userId = await getOrCreateDbUserId();

  let session =
    sessionId != null
      ? await prisma.workoutSession.findFirst({ where: { id: sessionId, userId, endedAt: null } })
      : null;

  if (!session) {
    session = await getActiveWorkoutSession(userId);
  }
  if (!session) {
    session = await prisma.workoutSession.create({ data: { userId } });
  }

  await prisma.setEntry.create({
    data: {
      userId,
      sessionId: session.id,
      exerciseId,
      reps,
      weight: weight ?? 0,
      rpe: rpe ?? null,
      pain: pain ?? null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/workouts");
  revalidatePath("/workouts/new");
  revalidatePath("/history");
  revalidatePath("/exercises");
  revalidatePath(`/exercises/${exerciseId}`);

  return { ok: true };
}

const CreateExerciseSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional().or(z.literal("")),
});

export async function createExerciseAction(formData: FormData) {
  const parsed = CreateExerciseSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues.map((issue) => issue.message).join(", ") };
  }

  const { name, category } = parsed.data;
  await getOrCreateDbUserId();

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false as const, error: "Exercise name is required." };
  }

  const existing = await prisma.exercise.findUnique({ where: { name: trimmedName } });
  if (existing) {
    return { ok: false as const, error: "Exercise already exists." };
  }

  await prisma.exercise.create({
    data: { name: trimmedName, category: category?.trim() || null },
  });

  revalidatePath("/exercises");
  revalidatePath("/workouts");
  revalidatePath("/workouts/new");

  return { ok: true as const };
}
