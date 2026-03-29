import { NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth/authOptions";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";

type ExerciseDto = {
  id: string;
  name: string;
  category: string | null;
};

async function getAuthedUserId() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim() ?? null;

  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user?.id ?? null;
}

function normalizeExerciseName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function orderByRelevance(exercises: ExerciseDto[], query: string) {
  const normalizedQuery = query.toLowerCase();

  return exercises.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    const aStartsWith = aName.startsWith(normalizedQuery);
    const bStartsWith = bName.startsWith(normalizedQuery);

    if (aStartsWith !== bStartsWith) {
      return aStartsWith ? -1 : 1;
    }

    return aName.localeCompare(bName);
  });
}

export async function GET(req: Request) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = normalizeExerciseName(searchParams.get("query") ?? "");

  const exercises = await prisma.exercise.findMany({
    where: query
      ? {
          OR: [
            { name: { startsWith: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
    take: 50,
  });

  const ordered = query ? orderByRelevance(exercises, query) : exercises;

  return NextResponse.json({ exercises: ordered });
}

export async function POST(req: Request) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const name = typeof body?.name === "string" ? normalizeExerciseName(body.name) : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Exercise name must be at least 2 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.exercise.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      category: true,
    },
  });

  if (existing) {
    return NextResponse.json({ exercise: existing });
  }

  const created = await prisma.exercise.create({
    data: {
      name,
      category: category.length > 0 ? category : "accessory",
    },
    select: {
      id: true,
      name: true,
      category: true,
    },
  });

  return NextResponse.json({ exercise: created }, { status: 201 });
}
