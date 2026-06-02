"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import { prisma } from "../prisma";

function normalizeName(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function requireDbUserId() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim() ?? null;

  if (!email) {
    redirect("/signin");
  }

  const name = normalizeName(session?.user?.name);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  if (!user) {
    redirect("/signin");
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

export async function getOptionalDbUserId() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim() ?? null;
  if (!email) return null;

  const name = normalizeName(session?.user?.name);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  if (!user) return null;

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
