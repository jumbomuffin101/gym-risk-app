// lib/auth/getUserId.ts
"use server";

import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth/authOptions";

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

  const name = session?.user?.name ?? null;

  // Requires: `User.email` is UNIQUE in your Prisma schema.
  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
    select: { id: true },
  });

  return user.id;
}
