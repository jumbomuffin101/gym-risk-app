import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getOptionalDbUserId } from "@/app/lib/auth/requireUser";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getOptionalDbUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [exercises, counts] = await Promise.all([
    prisma.exercise.findMany({ orderBy: [{ name: "asc" }] }),
    prisma.setEntry.groupBy({ by: ["exerciseId"], where: { userId }, _count: { _all: true } }),
  ]);

  const countMap = new Map(counts.map((c) => [c.exerciseId, c._count._all]));

  return NextResponse.json({
    items: exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      source: exercise.source,
      equipment: exercise.equipment,
      externalId: exercise.externalId,
      setCount: countMap.get(exercise.id) ?? 0,
    })),
  });
}

const CreateExerciseSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  equipment: z.string().optional(),
});

export async function POST(request: Request) {
  const userId = await getOptionalDbUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = CreateExerciseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const name = parsed.data.name.trim();
  const category = parsed.data.category?.trim() ?? "";
  const equipment = parsed.data.equipment?.trim() ?? "";


  const created = await prisma.exercise.create({
    data: {
      name,
      category: category || null,
      equipment: equipment || null,
      source: "custom",
      createdByUserId: userId,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
