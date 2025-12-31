import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = ctx.params.id;

  const ws = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true },
  });

  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ws.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sets = await prisma.setEntry.findMany({
    where: { sessionId },
    orderBy: { performedAt: "desc" },
    select: {
      id: true,
      performedAt: true,
      weight: true,
      reps: true,
      rpe: true,
      pain: true,
      exercise: { select: { id: true, name: true, category: true } },
    },
  });

  return NextResponse.json({ sets });
}
