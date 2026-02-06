import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOptionalDbUserId } from "@/app/lib/auth/requireUser";
import { computeExerciseRisk } from "@/app/lib/exerciseRisk";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await getOptionalDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get("exerciseId")?.trim() || null;

  if (exerciseId) {
    const sets = await prisma.setEntry.findMany({
      where: { userId, exerciseId },
      select: { performedAt: true, reps: true, weight: true, rpe: true, pain: true },
    });

    const risk = computeExerciseRisk(sets);
    return NextResponse.json({ exerciseId, risk });
  }

  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });

  const sets = await prisma.setEntry.findMany({
    where: { userId },
    select: { exerciseId: true, performedAt: true, reps: true, weight: true, rpe: true, pain: true },
  });

  const setsByExercise = new Map<string, typeof sets>();
  for (const set of sets) {
    const list = setsByExercise.get(set.exerciseId) ?? [];
    list.push(set);
    setsByExercise.set(set.exerciseId, list);
  }

  const items = exercises.map((exercise) => {
    const risk = computeExerciseRisk(setsByExercise.get(exercise.id) ?? []);
    return {
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      risk,
    };
  });

  return NextResponse.json({ items });
}
