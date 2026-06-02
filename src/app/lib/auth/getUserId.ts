// lib/auth/getUserId.ts
"use server";

import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth/authOptions";

function normalizeName(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/**
 * MUST be called only during a request (server action / route handler / server component).
 * Do NOT call this at module top-level.
 */
export async function getOrCreateDbUserId(): Promise<string> {
  const session = await getServerSession(authOptions);

  const email = session?.user?.email ?? null;
  if (!email) {
    throw new Error("Not signed in (missing session email).");
  }

  const name = normalizeName(session?.user?.name);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  if (!user) {
    throw new Error("Signed-in user was not found.");
  }

  if (name && user.name !== name) {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name },
      select: { id: true },
    });

    return updatedUser.id;
  }

  return user.id;
}
