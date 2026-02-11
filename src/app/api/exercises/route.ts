import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { syncExternalExercisesIntoDb } from "@/app/lib/exerciseSource";
import { getOptionalDbUserId } from "@/app/lib/auth/requireUser";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await getOptionalDbUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sync = searchParams.get("sync") === "1";
  if (sync) {
    await syncExternalExercisesIntoDb();
  }

  const [exercises, counts] = await Promise.all([
    prisma.exercise.findMany({ orderBy: [{ name: "asc" }]}),
    prisma.setEntry.groupBy({ by: ["exerciseId"], where: { userId }, _count: { _all: true } }),
  ]);

  const countMap = new Map(counts.map((c) => [c.exerciseId, c._count._all]));

  return NextResponse.json({
    items: exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      source: exercise.source,
      externalId: exercise.externalId,
      primaryMuscles: exercise.primaryMuscles,
      equipment: exercise.equipment,
      instructions: exercise.instructions,
      setCount: countMap.get(exercise.id) ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const userId = await getOptionalDbUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const primaryMuscles = typeof body?.primaryMuscles === "string" ? body.primaryMuscles.trim() : "";
  const equipment = typeof body?.equipment === "string" ? body.equipment.trim() : "";
  const instructions = typeof body?.instructions === "string" ? body.instructions.trim() : "";

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const exercise = await prisma.exercise.create({
    data: {
      name,
      category: category || null,
      source: "custom",
      createdByUserId: userId,
      primaryMuscles: primaryMuscles || null,
      equipment: equipment || null,
      instructions: instructions || null,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: exercise.id }, { status: 201 });
}
