import { prisma } from "@/lib/prisma";

export async function getExercises() {
  return prisma.exercise.findMany({
    select: {
      id: true,
      name: true,
      category: true,
    },
    orderBy: { name: "asc" },
  });
}
