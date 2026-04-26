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

type SeedSet = {
  reps: number;
  weight: number;
  rpe: number;
};

type SeedExercise = {
  name: (typeof exercises)[number]["name"];
  sets: SeedSet[];
};

type SessionTemplate = {
  label: string;
  exercises: SeedExercise[];
};

const sessionTemplates: SessionTemplate[] = [
  {
    label: "Push A",
    exercises: [
      { name: "Bench Press", sets: [{ weight: 225, reps: 6, rpe: 8 }, { weight: 235, reps: 5, rpe: 8.5 }, { weight: 240, reps: 4, rpe: 9 }, { weight: 225, reps: 6, rpe: 8.5 }] },
      { name: "Incline Dumbbell Press", sets: [{ weight: 75, reps: 10, rpe: 8 }, { weight: 80, reps: 8, rpe: 8.5 }, { weight: 80, reps: 8, rpe: 8.5 }] },
      { name: "Seated DB Press", sets: [{ weight: 60, reps: 10, rpe: 8 }, { weight: 65, reps: 8, rpe: 8.5 }, { weight: 65, reps: 8, rpe: 9 }] },
      { name: "Cable Fly", sets: [{ weight: 35, reps: 15, rpe: 7.5 }, { weight: 40, reps: 12, rpe: 8 }, { weight: 40, reps: 12, rpe: 8.5 }] },
      { name: "Lateral Raise", sets: [{ weight: 20, reps: 16, rpe: 8 }, { weight: 20, reps: 15, rpe: 8.5 }, { weight: 25, reps: 12, rpe: 9 }] },
      { name: "Rope Pushdown", sets: [{ weight: 55, reps: 14, rpe: 8 }, { weight: 60, reps: 12, rpe: 8.5 }, { weight: 60, reps: 12, rpe: 9 }] },
    ],
  },
  {
    label: "Pull A",
    exercises: [
      { name: "Conventional Deadlift", sets: [{ weight: 315, reps: 5, rpe: 8 }, { weight: 325, reps: 4, rpe: 8.5 }, { weight: 335, reps: 3, rpe: 9 }, { weight: 315, reps: 5, rpe: 8.5 }] },
      { name: "Chest Supported Row", sets: [{ weight: 90, reps: 10, rpe: 8 }, { weight: 100, reps: 8, rpe: 8.5 }, { weight: 100, reps: 8, rpe: 9 }] },
      { name: "Lat Pulldown", sets: [{ weight: 150, reps: 10, rpe: 8 }, { weight: 160, reps: 8, rpe: 8.5 }, { weight: 160, reps: 8, rpe: 8.5 }] },
      { name: "Face Pull", sets: [{ weight: 40, reps: 15, rpe: 7.5 }, { weight: 45, reps: 15, rpe: 8 }, { weight: 45, reps: 14, rpe: 8.5 }] },
      { name: "Hammer Curl", sets: [{ weight: 35, reps: 12, rpe: 8 }, { weight: 40, reps: 10, rpe: 8.5 }, { weight: 40, reps: 10, rpe: 9 }] },
    ],
  },
  {
    label: "Legs A",
    exercises: [
      { name: "High Bar Squat", sets: [{ weight: 275, reps: 6, rpe: 8 }, { weight: 285, reps: 5, rpe: 8.5 }, { weight: 295, reps: 4, rpe: 9 }, { weight: 275, reps: 6, rpe: 8.5 }] },
      { name: "Romanian Deadlift", sets: [{ weight: 225, reps: 8, rpe: 8 }, { weight: 235, reps: 8, rpe: 8.5 }, { weight: 245, reps: 6, rpe: 9 }] },
      { name: "Bulgarian Split Squat", sets: [{ weight: 55, reps: 10, rpe: 8 }, { weight: 60, reps: 8, rpe: 8.5 }, { weight: 60, reps: 8, rpe: 9 }] },
      { name: "Leg Extension", sets: [{ weight: 120, reps: 15, rpe: 8 }, { weight: 130, reps: 12, rpe: 8.5 }, { weight: 130, reps: 12, rpe: 9 }] },
      { name: "Seated Leg Curl", sets: [{ weight: 110, reps: 14, rpe: 8 }, { weight: 120, reps: 12, rpe: 8.5 }, { weight: 120, reps: 12, rpe: 9 }] },
      { name: "Standing Calf Raise", sets: [{ weight: 180, reps: 15, rpe: 8 }, { weight: 190, reps: 14, rpe: 8.5 }, { weight: 190, reps: 14, rpe: 9 }] },
    ],
  },
  {
    label: "Push B",
    exercises: [
      { name: "Paused Bench", sets: [{ weight: 225, reps: 5, rpe: 8 }, { weight: 235, reps: 4, rpe: 8.5 }, { weight: 245, reps: 3, rpe: 9 }, { weight: 225, reps: 5, rpe: 8.5 }] },
      { name: "Overhead Press", sets: [{ weight: 135, reps: 8, rpe: 8 }, { weight: 145, reps: 6, rpe: 8.5 }, { weight: 145, reps: 6, rpe: 9 }] },
      { name: "Machine Chest Press", sets: [{ weight: 160, reps: 10, rpe: 8 }, { weight: 170, reps: 8, rpe: 8.5 }, { weight: 170, reps: 8, rpe: 9 }] },
      { name: "Cable Lateral Raise", sets: [{ weight: 15, reps: 16, rpe: 8 }, { weight: 17.5, reps: 14, rpe: 8.5 }, { weight: 17.5, reps: 14, rpe: 9 }] },
      { name: "Pec Deck", sets: [{ weight: 135, reps: 12, rpe: 8 }, { weight: 145, reps: 10, rpe: 8.5 }, { weight: 145, reps: 10, rpe: 9 }] },
      { name: "Skull Crusher", sets: [{ weight: 75, reps: 12, rpe: 8 }, { weight: 80, reps: 10, rpe: 8.5 }, { weight: 80, reps: 10, rpe: 9 }] },
    ],
  },
  {
    label: "Pull B",
    exercises: [
      { name: "Barbell Row", sets: [{ weight: 205, reps: 8, rpe: 8 }, { weight: 215, reps: 8, rpe: 8.5 }, { weight: 225, reps: 6, rpe: 9 }] },
      { name: "Pull-Up", sets: [{ weight: 25, reps: 8, rpe: 8 }, { weight: 35, reps: 6, rpe: 8.5 }, { weight: 35, reps: 6, rpe: 9 }] },
      { name: "Single-Arm Dumbbell Row", sets: [{ weight: 95, reps: 10, rpe: 8 }, { weight: 100, reps: 8, rpe: 8.5 }, { weight: 100, reps: 8, rpe: 9 }] },
      { name: "Shrug", sets: [{ weight: 275, reps: 12, rpe: 8 }, { weight: 295, reps: 10, rpe: 8.5 }, { weight: 295, reps: 10, rpe: 9 }] },
      { name: "EZ-Bar Curl", sets: [{ weight: 85, reps: 12, rpe: 8 }, { weight: 95, reps: 10, rpe: 8.5 }, { weight: 95, reps: 10, rpe: 9 }] },
    ],
  },
  {
    label: "Legs B",
    exercises: [
      { name: "Front Squat", sets: [{ weight: 225, reps: 6, rpe: 8 }, { weight: 235, reps: 5, rpe: 8.5 }, { weight: 245, reps: 4, rpe: 9 }] },
      { name: "Romanian Deadlift", sets: [{ weight: 235, reps: 8, rpe: 8 }, { weight: 245, reps: 8, rpe: 8.5 }, { weight: 255, reps: 6, rpe: 9 }] },
      { name: "Leg Press", sets: [{ weight: 405, reps: 12, rpe: 8 }, { weight: 455, reps: 10, rpe: 8.5 }, { weight: 455, reps: 10, rpe: 9 }] },
      { name: "Walking Lunge", sets: [{ weight: 40, reps: 12, rpe: 8 }, { weight: 45, reps: 10, rpe: 8.5 }, { weight: 45, reps: 10, rpe: 9 }] },
      { name: "Lying Leg Curl", sets: [{ weight: 110, reps: 14, rpe: 8 }, { weight: 120, reps: 12, rpe: 8.5 }, { weight: 120, reps: 12, rpe: 9 }] },
      { name: "Seated Calf Raise", sets: [{ weight: 135, reps: 15, rpe: 8 }, { weight: 145, reps: 14, rpe: 8.5 }, { weight: 145, reps: 14, rpe: 9 }] },
    ],
  },
];

const timeSlots = [
  { hour: 7, minute: 15 },
  { hour: 12, minute: 10 },
  { hour: 17, minute: 40 },
  { hour: 18, minute: 25 },
  { hour: 19, minute: 5 },
] as const;

function dayStart(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function buildSessionDates() {
  const today = dayStart(new Date());
  const dates: Date[] = [];
  const skipOffsets = new Set([3, 10, 17, 24, 27]);

  for (let offset = 27; offset >= 0; offset -= 1) {
    if (skipOffsets.has(offset)) continue;

    const date = addDays(today, -offset);
    if (date.getDay() === 0) continue;
    dates.push(date);
  }

  return dates;
}

function jitterSet(base: SeedSet, sessionIndex: number, exerciseIndex: number, setIndex: number): SeedSet {
  const seed = sessionIndex + exerciseIndex * 3 + setIndex;
  const weightDelta = ((seed % 3) - 1) * (base.weight >= 200 ? 5 : base.weight >= 80 ? 2.5 : 0);
  const repsDelta = seed % 5 === 0 ? -1 : 0;
  const rpeDelta = (seed % 4) * 0.25 - 0.25;

  return {
    weight: Number(Math.max(0, base.weight + weightDelta).toFixed(1)),
    reps: Math.max(3, base.reps + repsDelta),
    rpe: Number(Math.min(9.5, Math.max(7, base.rpe + rpeDelta)).toFixed(1)),
  };
}

async function seedRyanWorkoutHistory() {
  const user = await prisma.user.findUnique({
    where: { email: "ryanrawat@gmail.com" },
    select: { id: true },
  });

  if (!user) {
    return;
  }

  const exerciseRecords = await prisma.exercise.findMany({
    where: {
      name: {
        in: Array.from(new Set(sessionTemplates.flatMap((template) => template.exercises.map((exercise) => exercise.name)))),
      },
    },
    select: { id: true, name: true },
  });

  const exerciseByName = new Map(exerciseRecords.map((exercise) => [exercise.name, exercise.id]));
  const existingSessions = await prisma.workoutSession.findMany({
    where: {
      userId: user.id,
      startedAt: {
        gte: addDays(dayStart(new Date()), -28),
      },
    },
    select: { startedAt: true },
  });

  const existingDateKeys = new Set(existingSessions.map((session) => dayStart(session.startedAt).toISOString()));
  let createdCount = 0;

  for (const [index, date] of buildSessionDates().entries()) {
    const dateKey = dayStart(date).toISOString();
    if (existingDateKeys.has(dateKey)) {
      continue;
    }

    const template = sessionTemplates[index % sessionTemplates.length];
    const slot = timeSlots[index % timeSlots.length];
    const startedAt = new Date(date);
    startedAt.setHours(slot.hour, slot.minute, 0, 0);

    const endedAt = new Date(startedAt.getTime() + (60 + ((index * 7) % 31)) * 60 * 1000);

    await prisma.workoutSession.create({
      data: {
        userId: user.id,
        startedAt,
        endedAt,
        note: `${template.label} - lean bulk block`,
        sets: {
          create: template.exercises.flatMap((exercise, exerciseIndex) => {
            const exerciseId = exerciseByName.get(exercise.name);
            if (!exerciseId) return [];

            return exercise.sets.map((baseSet, setIndex) => {
              const adjustedSet = jitterSet(baseSet, index, exerciseIndex, setIndex);
              return {
                userId: user.id,
                exerciseId,
                reps: adjustedSet.reps,
                weight: adjustedSet.weight,
                rpe: adjustedSet.rpe,
                performedAt: new Date(startedAt.getTime() + (exerciseIndex * 10 + setIndex * 3) * 60 * 1000),
              };
            });
          }),
        },
      },
    });

    createdCount += 1;
  }

  if (createdCount > 0) {
    console.log(`Seeded ${createdCount} workout sessions for ryanrawat@gmail.com.`);
  }
}

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
  await seedRyanWorkoutHistory();
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
