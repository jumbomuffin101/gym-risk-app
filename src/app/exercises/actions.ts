"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getOrCreateDbUserId } from "@/app/lib/auth/getUserId";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import { redirect } from "next/navigation";

export async function startWorkoutSession(_formData: FormData) {
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

  redirect("/workouts");
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
});

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createSetEntryAction(formData: FormData) {
  const parsed = CreateSetSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    reps: formData.get("reps"),
    weight: formData.get("weight"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues.map(i => i.message).join(", ") };
  }

  const { exerciseId, reps, weight } = parsed.data;
  const rpe = parseOptionalNumber(formData.get("rpe"));
  const pain = parseOptionalNumber(formData.get("pain"));

  // Ensure we have a real DB user
  const userId = await getOrCreateDbUserId();

  // Ensure we have an active session (endedAt = null)
  let session = await getActiveWorkoutSession(userId);
  if (!session) {
    session = await prisma.workoutSession.create({ data: { userId } });
  }

  const volume = reps * weight;

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

  revalidatePath(`/exercises/${exerciseId}`);
  revalidatePath("/exercises");
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  revalidatePath("/history");

  return { ok: true as const, volume, risk: 0, label: "Logged" };
}

const CreateExerciseSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
});

export async function createExerciseAction(formData: FormData) {
  const parsed = CreateExerciseSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    await prisma.exercise.create({
      data: {
        name: parsed.data.name.trim(),
        category: parsed.data.category?.trim() || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const, error: "Exercise already exists." };
    }
    return { ok: false as const, error: "Unable to create exercise." };
  }

  revalidatePath("/exercises");
  revalidatePath("/dashboard");

  return { ok: true as const };
}
