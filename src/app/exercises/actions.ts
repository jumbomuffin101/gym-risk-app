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
  const rawRpe = parseOptionalNumber(formData.get("rpe"));
  const rawPain = parseOptionalNumber(formData.get("pain"));
  const rpe = rawRpe == null ? null : Math.max(1, Math.min(10, rawRpe));
  const pain = rawPain == null ? null : Math.max(0, Math.min(10, Math.round(rawPain)));
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
      rpe,
      pain,
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
  const userId = await getOrCreateDbUserId();

  const exercise = await prisma.exercise.create({
    data: {
      name: name.trim(),
      category: category?.trim() || null,
      source: "custom",
      createdByUserId: userId,
    },
  });

  revalidatePath("/exercises");
  return { ok: true as const, id: exercise.id };
}
