import { NextResponse } from "next/server";
import { requireUser } from "src/app/lib/auth";
import { prisma } from "src/app/lib/db";

export async function GET() {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.workoutSession.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    take: 20,
    select: {
      id: true,
      startedAt: true,
      note: true,
      _count: { select: { sets: true } },
    },
  });

  return NextResponse.json({ sessions });
}
