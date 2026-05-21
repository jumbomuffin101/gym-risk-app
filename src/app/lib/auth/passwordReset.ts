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

  const user = await prisma.user.findUnique({
    where: { resetToken: tokenHash },
    select: { id: true, resetTokenExpiry: true },
  });

  if (!user || !user.resetTokenExpiry) {
    return { ok: false as const, reason: "Invalid reset link" };
  }

  if (user.resetTokenExpiry.getTime() < Date.now()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: null, resetTokenExpiry: null },
    });
    return { ok: false as const, reason: "Reset link expired" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return { ok: true as const };
}

export async function createPasswordResetToken(userId: string, minutes = 30) {
  const token = newToken();
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      resetToken: tokenHash,
      resetTokenExpiry: expiresAt,
    },
  });

  return { token, expiresAt };
}
