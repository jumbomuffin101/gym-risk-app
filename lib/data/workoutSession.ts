import { prisma } from "@/lib/prisma";

export async function getActiveWorkoutSession(userId: string) {
  return prisma.workoutSession.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
}

export async function endWorkoutSession(sessionId: string) {
  return prisma.workoutSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });
}
