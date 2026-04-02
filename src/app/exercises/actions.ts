"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOrCreateDbUserId } from "@/app/lib/auth/getUserId";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import { redirect } from "next/navigation";

export async function startWorkoutSession(formData: FormData) {
  const userId = await getOrCreateDbUserId();

  const existing = await getActiveWorkoutSession(userId);
  if (!existing) {
    await prisma.workoutSession.create({
      data: { userId },
    });
  }

  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/exercises");
  revalidatePath("/workouts/new");

  const redirectTo = String(formData.get("redirectTo") ?? "/workouts");
  redirect(redirectTo || "/workouts");
}

export async function endWorkoutSessionAction(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) return;

  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });

  revalidatePath("/workouts");
  revalidatePath("/");

  redirect("/workouts");
}

const CreateSetSchema = z.object({
  exerciseId: z.string().min(1),
  reps: z.coerce.number().int().min(1),
  weight: z.coerce.number().min(0),
  durationSeconds: z.coerce.number().int().min(1).optional().or(z.nan().transform(() => undefined)),
  distanceMeters: z.coerce.number().min(0).optional().or(z.nan().transform(() => undefined)),
  rpe: z.coerce.number().min(1).max(10).optional().or(z.nan().transform(() => undefined)),
  pain: z.coerce.number().int().min(0).max(10).optional().or(z.nan().transform(() => undefined)),
  notes: z
    .string()
    .trim()
    .max(240)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export async function createSetEntryAction(formData: FormData) {
  const parsed = CreateSetSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    reps: formData.get("reps"),
    weight: formData.get("weight"),
    durationSeconds: formData.get("durationSeconds"),
    distanceMeters: formData.get("distanceMeters"),
    rpe: formData.get("rpe"),
    pain: formData.get("pain"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { exerciseId, reps, weight, durationSeconds, distanceMeters, rpe, pain, notes } = parsed.data;

  const userId = await getOrCreateDbUserId();
  let session = await getActiveWorkoutSession(userId);
  if (!session) {
    session = await prisma.workoutSession.create({ data: { userId } });
  }

  const volume = reps * weight;

  try {
    await prisma.setEntry.create({
      data: {
        userId,
        sessionId: session.id,
        exerciseId,
        reps,
        weight,
        durationSeconds: durationSeconds ?? null,
        distanceMeters: distanceMeters ?? null,
        rpe: rpe ?? null,
        pain: pain ?? null,
        notes: notes ?? null,
      },
    });
  } catch (error) {
    if (!isMissingSetEntryColumnError(error)) {
      throw error;
    }

    await prisma.setEntry.create({
      data: {
        userId,
        sessionId: session.id,
        exerciseId,
        reps,
        weight,
        rpe: rpe ?? null,
        pain: pain ?? null,
      },
    });
  }

  revalidatePath(`/exercises/${exerciseId}`);
  revalidatePath("/exercises");
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  revalidatePath("/history");

  return { ok: true as const, volume, risk: 0, label: "Logged" };
}

export async function createExerciseDetailSetEntryAction(formData: FormData) {
  const parsed = CreateSetSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    reps: formData.get("reps"),
    weight: formData.get("weight"),
    durationSeconds: formData.get("durationSeconds"),
    distanceMeters: formData.get("distanceMeters"),
    rpe: formData.get("rpe"),
    pain: formData.get("pain"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues.map((issue) => issue.message).join(", ") || "Invalid set input.",
    };
  }

  const { exerciseId, reps, weight, durationSeconds, distanceMeters, rpe, pain, notes } = parsed.data;
  const userId = await getOrCreateDbUserId();
  const activeSession = await getActiveWorkoutSession(userId);

  if (!activeSession) {
    return { ok: false as const, error: "No active session." };
  }

  try {
    await prisma.setEntry.create({
      data: {
        userId,
        sessionId: activeSession.id,
        exerciseId,
        reps,
        weight,
        durationSeconds: durationSeconds ?? null,
        distanceMeters: distanceMeters ?? null,
        rpe: rpe ?? null,
        pain: pain ?? null,
        notes: notes ?? null,
      },
    });
  } catch (error) {
    if (!isMissingSetEntryColumnError(error)) {
      throw error;
    }

    await prisma.setEntry.create({
      data: {
        userId,
        sessionId: activeSession.id,
        exerciseId,
        reps,
        weight,
        rpe: rpe ?? null,
        pain: pain ?? null,
      },
    });
  }

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${exerciseId}`);
  revalidatePath("/dashboard");
  revalidatePath("/workouts");
  revalidatePath("/workouts/new");

  return { ok: true as const };
}

function isMissingSetEntryColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("durationSeconds") || message.includes("distanceMeters") || message.includes("notes");
}
