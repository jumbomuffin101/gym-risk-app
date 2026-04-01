import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth/authOptions";
import { readSessionPlan, writeSessionPlan } from "@/app/lib/sessionPlan";

async function getAuthedUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim() ?? null;

  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user ?? null;
}

export async function GET() {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeSession = await prisma.workoutSession.findFirst({
    where: { userId: user.id, endedAt: null },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      startedAt: true,
      note: true,
    },
  });

  return NextResponse.json({
    activeSession: activeSession
      ? {
          id: activeSession.id,
          startedAt: activeSession.startedAt,
          selectedExerciseIds: readSessionPlan(activeSession.note).selectedExerciseIds,
        }
      : null,
  });
}

export async function PATCH(req: Request) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const selectedExerciseIds = Array.isArray(body?.selectedExerciseIds)
    ? body.selectedExerciseIds.filter((item: unknown): item is string => typeof item === "string")
    : null;

  if (!selectedExerciseIds) {
    return NextResponse.json({ error: "selectedExerciseIds is required" }, { status: 400 });
  }

  const activeSession = await prisma.workoutSession.findFirst({
    where: { userId: user.id, endedAt: null },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });

  if (!activeSession) {
    return NextResponse.json({ error: "No active session" }, { status: 404 });
  }

  await prisma.workoutSession.update({
    where: { id: activeSession.id },
    data: {
      note: writeSessionPlan(selectedExerciseIds),
    },
  });

  return NextResponse.json({ ok: true });
}
