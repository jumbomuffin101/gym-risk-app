"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import { prisma } from "../prisma";

export async function requireDbUserId() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim() ?? null;

  if (!email) {
    redirect("/signin");
  }

  const name = session?.user?.name ?? null;

  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
    select: { id: true },
  });

  return user.id;
}

export async function getOptionalDbUserId() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim() ?? null;
  if (!email) return null;

  const name = session?.user?.name ?? null;

  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
    select: { id: true },
  });

  return user.id;
}
