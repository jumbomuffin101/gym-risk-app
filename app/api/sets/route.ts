import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/db";
import { writeRiskEventsForSession } from "@/lib/riskEngine";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const sessionId = body?.sessionId;
  const exerciseId = body?.exerciseId;

  const weight = Number(body?.weight);
  const reps = Number(body?.reps);
  const rpe = body?.rpe == null || body?.rpe === "" ? null : Number(body?.rpe);
  const pain = body?.pain == null || body?.pain === "" ? null : Number(body?.pain);

  if (!sessionId || !exerciseId || !Number.isFinite(weight) || !Number.isFinite(reps)) {
    return NextResponse.json({ error: "Missing/invalid fields." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ws = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!ws || ws.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (rpe != null && (rpe < 1 || rpe > 10)) {
    return NextResponse.json({ error: "RPE must be 1-10." }, { status: 400 });
  }

  if (pain != null && (pain < 0 || pain > 10)) {
    return NextResponse.json({ error: "Pain must be 0-10." }, { status: 400 });
  }

  const created = await prisma.setEntry.create({
    data: { sessionId, exerciseId, weight, reps, rpe, pain },
  });

  // 🔥 Recompute risk after each set
  await writeRiskEventsForSession(user.id, sessionId);

  return NextResponse.json({ set: created }, { status: 201 });
}
