import "dotenv/config";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Create a .env file with DATABASE_URL=... (Neon connection string)."
  );
}

const prisma = new PrismaClient();

const exercises = [
  { name: "Squat", category: "competition" },
  { name: "Bench Press", category: "competition" },
  { name: "Deadlift", category: "competition" },

  { name: "Paused Squat", category: "variation" },
  { name: "Front Squat", category: "variation" },
  { name: "Tempo Squat", category: "variation" },
  { name: "Box Squat", category: "variation" },

  { name: "Paused Bench", category: "variation" },
  { name: "Close Grip Bench", category: "variation" },
  { name: "Incline Bench", category: "variation" },
  { name: "Spoto Press", category: "variation" },

  { name: "Paused Deadlift", category: "variation" },
  { name: "Romanian Deadlift", category: "variation" },
  { name: "Block Pull", category: "variation" },
  { name: "Deficit Deadlift", category: "variation" },

  { name: "Overhead Press", category: "upper" },
  { name: "Barbell Row", category: "upper" },
  { name: "Dumbbell Row", category: "upper" },
  { name: "Pull-ups", category: "upper" },
  { name: "Lat Pulldown", category: "upper" },
  { name: "Skull Crushers", category: "upper" },
  { name: "Triceps Pushdown", category: "upper" },
  { name: "Barbell Curl", category: "upper" },
  { name: "Dumbbell Curl", category: "upper" },

  { name: "Leg Press", category: "lower" },
  { name: "Bulgarian Split Squat", category: "lower" },
  { name: "Hamstring Curl", category: "lower" },
  { name: "Back Extension", category: "lower" },
  { name: "Hip Thrust", category: "lower" },
] as const;

async function main() {
  let upsertedCount = 0;

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: { category: exercise.category },
      create: { name: exercise.name, category: exercise.category },
    });

    upsertedCount += 1;
  }

  console.log(`Seed complete: ${upsertedCount} exercises upserted.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
