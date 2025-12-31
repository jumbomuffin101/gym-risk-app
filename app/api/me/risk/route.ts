import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const risks = await prisma.riskEvent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      createdAt: true,
      riskScore: true,
      kind: true,
      title: true,
      detailsJson: true,
      sessionId: true,
      session: { select: { startedAt: true, note: true } },
    },
  });

  return NextResponse.json({ risks });
}
