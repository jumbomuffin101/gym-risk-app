import "dotenv/config";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Create a .env file with DATABASE_URL=... (Neon connection string).",
  );
}

const prisma = new PrismaClient();

const exercises = [
  { name: "High Bar Squat", category: "squat" },
  { name: "Low Bar Squat", category: "squat" },
  { name: "Paused Squat", category: "squat" },
  { name: "Tempo Squat", category: "squat" },
  { name: "Box Squat", category: "squat" },
  { name: "Pin Squat", category: "squat" },
  { name: "Safety Bar Squat", category: "squat" },
  { name: "Zercher Squat", category: "squat" },
  { name: "Front Squat", category: "squat" },
  { name: "Goblet Squat", category: "squat" },
  { name: "Hack Squat", category: "squat" },
  { name: "Leg Press", category: "squat" },
  { name: "Split Squat", category: "squat" },
  { name: "Bulgarian Split Squat", category: "squat" },
  { name: "Step-Up", category: "squat" },
  { name: "Reverse Lunge", category: "squat" },
  { name: "Walking Lunge", category: "squat" },

  { name: "Conventional Deadlift", category: "hinge" },
  { name: "Sumo Deadlift", category: "hinge" },
  { name: "Deficit Deadlift", category: "hinge" },
  { name: "Block Pull", category: "hinge" },
  { name: "Stiff-Leg Deadlift", category: "hinge" },
  { name: "Snatch-Grip Deadlift", category: "hinge" },
  { name: "Rack Pull", category: "hinge" },
  { name: "Romanian Deadlift", category: "hinge" },
  { name: "Paused Deadlift", category: "hinge" },
  { name: "Good Morning", category: "hinge" },
  { name: "Back Extension", category: "hinge" },
  { name: "Hip Thrust", category: "hinge" },
  { name: "Cable Pull Through", category: "hinge" },
  { name: "Kettlebell Swing", category: "hinge" },
  { name: "Glute Bridge", category: "hinge" },

  { name: "Bench Press", category: "push" },
  { name: "Paused Bench", category: "push" },
  { name: "Close Grip Bench", category: "push" },
  { name: "Spoto Press", category: "push" },
  { name: "Larsen Press", category: "push" },
  { name: "Incline Bench", category: "push" },
  { name: "Decline Bench", category: "push" },
  { name: "Board Press", category: "push" },
  { name: "Slingshot Bench", category: "push" },
  { name: "Dumbbell Bench Press", category: "push" },
  { name: "Incline Dumbbell Press", category: "push" },
  { name: "Machine Chest Press", category: "push" },
  { name: "Overhead Press", category: "push" },
  { name: "Seated DB Press", category: "push" },
  { name: "Arnold Press", category: "push" },
  { name: "Push Press", category: "push" },
  { name: "Dip", category: "push" },
  { name: "Close-Grip Push-Up", category: "push" },
  { name: "Weighted Push-Up", category: "push" },
  { name: "Push-Up", category: "push" },
  { name: "Deficit Push-Up", category: "push" },
  { name: "Pike Push-Up", category: "push" },
  { name: "Cable Fly", category: "push" },
  { name: "Pec Deck", category: "push" },
  { name: "Lateral Raise", category: "push" },
  { name: "Cable Lateral Raise", category: "push" },
  { name: "Rear Delt Fly", category: "push" },
  { name: "Reverse Pec Deck", category: "push" },

  { name: "Barbell Row", category: "pull" },
  { name: "Pendlay Row", category: "pull" },
  { name: "Chest Supported Row", category: "pull" },
  { name: "T-Bar Row", category: "pull" },
  { name: "Machine Row", category: "pull" },
  { name: "Meadows Row", category: "pull" },
  { name: "Inverted Row", category: "pull" },
  { name: "Single-Arm Dumbbell Row", category: "pull" },
  { name: "Seal Row", category: "pull" },
  { name: "Lat Pulldown", category: "pull" },
  { name: "Single-Arm Lat Pulldown", category: "pull" },
  { name: "Straight-Arm Pulldown", category: "pull" },
  { name: "Pull-Up", category: "pull" },
  { name: "Neutral-Grip Pull-Up", category: "pull" },
  { name: "Chin-Up", category: "pull" },
  { name: "Face Pull", category: "pull" },
  { name: "Shrug", category: "pull" },

  { name: "EZ-Bar Curl", category: "arms" },
  { name: "Barbell Curl", category: "arms" },
  { name: "Incline DB Curl", category: "arms" },
  { name: "Preacher Curl", category: "arms" },
  { name: "Cable Curl", category: "arms" },
  { name: "Hammer Curl", category: "arms" },
  { name: "Concentration Curl", category: "arms" },
  { name: "Skull Crusher", category: "arms" },
  { name: "Overhead Tricep Extension", category: "arms" },
  { name: "Rope Pushdown", category: "arms" },
  { name: "Tricep Kickback", category: "arms" },
  { name: "JM Press", category: "arms" },

  { name: "Leg Extension", category: "calves" },
  { name: "Seated Leg Curl", category: "calves" },
  { name: "Lying Leg Curl", category: "calves" },
  { name: "Nordic Curl", category: "calves" },
  { name: "Glute Ham Raise", category: "calves" },
  { name: "Hip Abduction", category: "calves" },
  { name: "Hip Adduction", category: "calves" },
  { name: "Standing Calf Raise", category: "calves" },
  { name: "Seated Calf Raise", category: "calves" },
  { name: "Donkey Calf Raise", category: "calves" },
  { name: "Tibialis Raise", category: "calves" },

  { name: "Ab Wheel Rollout", category: "core" },
  { name: "Reverse Crunch", category: "core" },
  { name: "Decline Sit-Up", category: "core" },
  { name: "Hanging Knee Raise", category: "core" },
  { name: "Hanging Leg Raise", category: "core" },
  { name: "Pallof Press", category: "core" },
  { name: "Cable Woodchop", category: "core" },
  { name: "Plank", category: "core" },
  { name: "Side Plank", category: "core" },
  { name: "Dead Bug", category: "core" },

  { name: "Farmer Carry", category: "conditioning" },
  { name: "Suitcase Carry", category: "conditioning" },
  { name: "Sled Push", category: "conditioning" },
  { name: "Sled Pull", category: "conditioning" },
  { name: "Battle Rope", category: "conditioning" },
  { name: "Assault Bike", category: "conditioning" },
  { name: "RowErg", category: "conditioning" },
  { name: "Stairmaster", category: "conditioning" },
  { name: "Jump Rope", category: "conditioning" },
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
