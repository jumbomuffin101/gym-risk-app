import { prisma } from "@/app/lib/prisma";
import seedExercises from "@/app/lib/data/externalExercises.seed.json";

export type NormalizedExercise = {
  externalId: string;
  name: string;
  category: string | null;
  primaryMuscles: string[];
  equipment: string | null;
  instructions: string | null;
};

type WgerNameObject = { name?: string | null; name_en?: string | null };
type WgerTranslation = { language?: number; description?: string | null };
type WgerExercise = {
  id?: number;
  name?: string;
  category?: WgerNameObject | null;
  muscles?: WgerNameObject[] | null;
  equipment?: WgerNameObject[] | null;
  translations?: WgerTranslation[] | null;
};

type SeedExercise = {
  externalId: string;
  name: string;
  category?: string;
  primaryMuscles?: string[];
  equipment?: string;
  instructions?: string;
};

const WGER_URL = "https://wger.de/api/v2/exerciseinfo/?language=2&limit=80";

function getName(value: WgerNameObject) {
  return String(value.name_en ?? value.name ?? "").trim();
}

function normalizeFromWger(item: WgerExercise): NormalizedExercise | null {
  const name = typeof item.name === "string" ? item.name.trim() : "";
  if (!name || typeof item.id !== "number") return null;

  return {
    externalId: `wger-${String(item.id)}`,
    name,
    category: item.category ? getName(item.category) || null : null,
    primaryMuscles: Array.isArray(item.muscles) ? item.muscles.map(getName).filter(Boolean) : [],
    equipment: Array.isArray(item.equipment) ? item.equipment.map(getName).filter(Boolean).join(", ") || null : null,
    instructions: Array.isArray(item.translations)
      ? item.translations.find((translation) => translation.language === 2)?.description ?? null
      : null,
  };
}

async function fetchExternalExercises(): Promise<NormalizedExercise[]> {
  try {
    const response = await fetch(WGER_URL, {
      next: { revalidate: 60 * 60 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`external api error: ${response.status}`);
    }

    const payload = (await response.json()) as { results?: WgerExercise[] };
    const results = Array.isArray(payload.results) ? payload.results : [];
    const normalized = results.map(normalizeFromWger).filter(Boolean) as NormalizedExercise[];

    if (normalized.length > 0) return normalized;
    throw new Error("external api returned no results");
  } catch {
    return (seedExercises as SeedExercise[]).map((item) => ({
      externalId: item.externalId,
      name: item.name,
      category: item.category ?? null,
      primaryMuscles: item.primaryMuscles ?? [],
      equipment: item.equipment ?? null,
      instructions: item.instructions ?? null,
    }));
  }
}

export async function syncExternalExercisesIntoDb() {
  const externalExercises = await fetchExternalExercises();

  for (const exercise of externalExercises) {
    await prisma.exercise.upsert({
      where: { externalId: exercise.externalId },
      update: {
        name: exercise.name,
        category: exercise.category,
        source: "external",
        primaryMuscles: exercise.primaryMuscles.join(", ") || null,
        equipment: exercise.equipment,
        instructions: exercise.instructions,
      },
      create: {
        name: exercise.name,
        category: exercise.category,
        source: "external",
        externalId: exercise.externalId,
        primaryMuscles: exercise.primaryMuscles.join(", ") || null,
        equipment: exercise.equipment,
        instructions: exercise.instructions,
      },
    });
  }

  return externalExercises.length;
}
