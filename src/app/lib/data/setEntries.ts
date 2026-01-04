import { prisma } from "@/app/lib/prisma";

export async function getRecentSetsForExercise(
  exerciseId: string,
  take = 10
) {
  return prisma.setEntry.findMany({
    where: { exerciseId },
    orderBy: { performedAt: "desc" },
    take,
  });
}
