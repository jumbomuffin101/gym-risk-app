// src/app/lib/auth/passwordReset.ts
import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "@/app/lib/prisma";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function newToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function consumePasswordReset(token: string, newPassword: string) {
  const tokenHash = sha256(token);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record) return { ok: false as const, reason: "Invalid or expired token" };
  if (record.usedAt) return { ok: false as const, reason: "Token already used" };
  if (record.expiresAt.getTime() < Date.now())
    return { ok: false as const, reason: "Token expired" };

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true as const };
}

export async function createPasswordResetToken(userId: string, minutes = 30) {
  const token = newToken();
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return { token, expiresAt };
}
