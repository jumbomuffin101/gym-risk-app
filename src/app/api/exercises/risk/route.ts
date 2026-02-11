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
  const exerciseId = searchParams.get("exerciseId")?.trim();

  if (!exerciseId) {
    return NextResponse.json({ error: "exerciseId is required" }, { status: 400 });
  }

  const sets = await prisma.setEntry.findMany({
    where: { userId, exerciseId },
    select: { performedAt: true, reps: true, weight: true, rpe: true, pain: true },
    orderBy: { performedAt: "desc" },
  });

  const result = computeExerciseRisk(sets);
  if (!result) {
    return NextResponse.json({ score: null, label: "No estimate", drivers: [] });
  }

  return NextResponse.json(result);
}
