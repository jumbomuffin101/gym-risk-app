// prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Create a .env file with DATABASE_URL=... (Neon connection string)."
  );
}

const prisma = new PrismaClient();

const exercises = [
  // Squat / legs
  { name: "Back Squat", category: "squat" },
  { name: "Front Squat", category: "squat" },
  { name: "Goblet Squat", category: "squat" },
  { name: "Leg Press", category: "squat" },
  { name: "Walking Lunge", category: "squat" },
  { name: "Bulgarian Split Squat", category: "squat" },

  // Hinge
  { name: "Deadlift", category: "hinge" },
  { name: "Romanian Deadlift", category: "hinge" },
  { name: "Hip Thrust", category: "hinge" },
  { name: "Good Morning", category: "hinge" },
  { name: "Back Extension", category: "hinge" },

  // Push
  { name: "Bench Press", category: "push" },
  { name: "Incline Bench Press", category: "push" },
  { name: "Overhead Press", category: "push" },
  { name: "Dumbbell Bench Press", category: "push" },
  { name: "Dips", category: "push" },
  { name: "Push-Up", category: "push" },

  // Pull
  { name: "Pull-Up", category: "pull" },
  { name: "Lat Pulldown", category: "pull" },
  { name: "Barbell Row", category: "pull" },
  { name: "Dumbbell Row", category: "pull" },
  { name: "Seated Cable Row", category: "pull" },
  { name: "Face Pull", category: "pull" },

  // Arms
  { name: "Bicep Curl", category: "arms" },
  { name: "Hammer Curl", category: "arms" },
  { name: "Tricep Pushdown", category: "arms" },
  { name: "Skull Crushers", category: "arms" },

  // Core
  { name: "Plank", category: "core" },
  { name: "Hanging Leg Raise", category: "core" },
  { name: "Cable Crunch", category: "core" },

  // Calves
  { name: "Standing Calf Raise", category: "calves" },
  { name: "Seated Calf Raise", category: "calves" },

  // Conditioning
  { name: "Rowing Machine", category: "conditioning" },
  { name: "Assault Bike", category: "conditioning" },
  { name: "Treadmill Run", category: "conditioning" },
];

async function main() {
  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: { category: ex.category },
      create: { name: ex.name, category: ex.category },
    });
  }

  console.log(`Seeded ${exercises.length} exercises`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
