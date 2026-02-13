import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth/authOptions";
import { prisma } from "@/app/lib/prisma";

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

export async function GET(req: Request) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() ?? "";

  const exercises = await prisma.exercise.findMany({
    where: query
      ? {
          name: {
            contains: query,
            mode: "insensitive",
          },
        }
      : undefined,
    select: { id: true, name: true, category: true },
    take: 40,
  });

  const normalized = query.toLowerCase();

  const ordered = exercises.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    const aStarts = normalized ? aName.startsWith(normalized) : false;
    const bStarts = normalized ? bName.startsWith(normalized) : false;

    if (aStarts !== bStarts) {
      return aStarts ? -1 : 1;
    }

    const aIndex = normalized ? aName.indexOf(normalized) : 0;
    const bIndex = normalized ? bName.indexOf(normalized) : 0;

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    return aName.localeCompare(bName);
  });

  return NextResponse.json({ exercises: ordered });
}

export async function POST(req: Request) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Exercise name must be at least 2 characters." }, { status: 400 });
  }

  const createdCategory = category.length > 0 ? category : "accessory";

  try {
    const exercise = await prisma.exercise.create({
      data: {
        name,
        category: createdCategory,
      },
      select: {
        id: true,
        name: true,
        category: true,
      },
    });

    return NextResponse.json({ exercise }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.exercise.findUnique({
        where: { name },
        select: { id: true, name: true, category: true },
      });

      return NextResponse.json(
        {
          error: "Exercise already exists.",
          exercise: existing,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Failed to create exercise." }, { status: 500 });
  }
}
