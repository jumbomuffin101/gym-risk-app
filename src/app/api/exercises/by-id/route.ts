import { NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth/authOptions";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";

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
  const id = searchParams.get("id")?.trim() ?? "";

  if (!id) {
    return NextResponse.json({ exists: false });
  }

  const exercise = await prisma.exercise.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      createdAt: true,
    },
  });

  if (!exercise) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    exercise,
  });
}
