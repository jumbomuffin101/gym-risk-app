import { prisma } from "@/app/lib/prisma";

export type ExternalExercise = {
  id: string;
  name: string;
  category: string | null;
  equipment: string | null;
};

type WgerExercise = {
  id?: number;
  name?: string;
  category?: { name?: string | null } | null;
  equipment?: Array<{ name?: string | null }> | null;
};

const EXTERNAL_URL = "https://wger.de/api/v2/exercise/?language=2&limit=200";

export async function fetchExternalExercises(): Promise<ExternalExercise[]> {
  try {
    const response = await fetch(EXTERNAL_URL, {
      next: { revalidate: 60 * 60 * 24 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as { results?: WgerExercise[] };
    const results = Array.isArray(payload.results) ? payload.results : [];

    return results
      .map((item) => {
        if (typeof item.id !== "number" || typeof item.name !== "string") return null;
        const name = item.name.trim();
        if (!name) return null;
        return {
          id: `wger-${item.id}`,
          name,
          category: item.category?.name?.trim() || null,
          equipment:
            Array.isArray(item.equipment) && item.equipment.length > 0
              ? item.equipment
                  .map((equipment) => equipment.name?.trim() || "")
                  .filter(Boolean)
                  .join(", ") || null
              : null,
        };
      })
      .filter((item): item is ExternalExercise => item !== null);
  } catch {
    return [];
  }
}

export async function syncExternalExercisesIntoDb(externalExercises: ExternalExercise[]) {
  for (const exercise of externalExercises) {
    await prisma.exercise.upsert({
      where: { externalId: exercise.id },
      update: {
        name: exercise.name,
        category: exercise.category,
        equipment: exercise.equipment,
        source: "external",
      },
      create: {
        name: exercise.name,
        category: exercise.category,
        equipment: exercise.equipment,
        source: "external",
        externalId: exercise.id,
      },
    });
  }
}
