import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "src/app/lib/prisma";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  const session = await prisma.workoutSession.findUnique({
    where: { id },
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      note: true,
      _count: { select: { sets: true } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}
