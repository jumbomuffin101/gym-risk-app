"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOrCreateDbUserId } from "@/app/lib/auth/getUserId";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import { redirect } from "next/navigation";

export async function startOrResumeWorkoutAction() {
  const userId = await getOrCreateDbUserId();
  const active = await getActiveWorkoutSession(userId);

  const session =
    active ??
    (await prisma.workoutSession.create({
      data: { userId },
    }));

  revalidatePath("/dashboard");
  revalidatePath("/workouts");
  revalidatePath("/workouts/new");

  redirect(`/workouts/new?sessionId=${session.id}`);
}

export async function endWorkoutAction(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const userId = await getOrCreateDbUserId();
  if (!sessionId) return;

  await prisma.workoutSession.updateMany({
    where: { id: sessionId, userId, endedAt: null },
    data: { endedAt: new Date() },
  });

  revalidatePath("/dashboard");
  revalidatePath("/workouts");
  revalidatePath("/workouts/new");
  revalidatePath("/history");

  redirect("/dashboard");
}
