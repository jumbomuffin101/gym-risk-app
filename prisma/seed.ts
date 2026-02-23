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
  { name: "Paused Squat", category: "variation" },
  { name: "Front Squat", category: "variation" },
  { name: "Tempo Squat", category: "variation" },
  { name: "Bench Press", category: "competition" },
  { name: "Paused Bench", category: "variation" },
  { name: "Close Grip Bench", category: "variation" },
  { name: "Incline Bench", category: "upper" },
  { name: "Deadlift", category: "competition" },
  { name: "Paused Deadlift", category: "variation" },
  { name: "Romanian Deadlift", category: "accessory" },
  { name: "Block Pull", category: "variation" },
  { name: "Overhead Press", category: "upper" },
  { name: "Barbell Row", category: "upper" },
  { name: "Dumbbell Row", category: "upper" },
  { name: "Pull-Ups", category: "upper" },
  { name: "Lat Pulldown", category: "upper" },
  { name: "Hamstring Curl", category: "lower" },
  { name: "Leg Press", category: "lower" },
  { name: "Split Squat", category: "lower" },
  { name: "Triceps Pushdown", category: "accessory" },
  { name: "Skull Crushers", category: "accessory" },
  { name: "Bicep Curl", category: "accessory" },
  { name: "Back Extensions", category: "lower" },
];

async function main() {
  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: { category: ex.category },
      create: { name: ex.name, category: ex.category },
    });
  }

  console.log(`Seeded ${exercises.length} powerlifting exercises`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
