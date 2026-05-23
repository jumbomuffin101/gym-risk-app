import crypto from "crypto";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function POST(req: Request) {
  console.log("[reset-confirm] request received");

  try {
    const body = (await req.json().catch(() => ({}))) as {
      token?: string;
      newPassword?: string;
      password?: string;
    };

    const token = String(body.token ?? "").trim();
    const password = String(body.newPassword ?? body.password ?? "");

    console.log("[reset-confirm] token present:", !!token);
    console.log("[reset-confirm] password present:", !!password);

    if (!token) {
      return NextResponse.json({ ok: false, reason: "Invalid reset link" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ ok: false, reason: "Password is required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ ok: false, reason: "Password too short" }, { status: 400 });
    }

    console.log("[reset-confirm] hashing token");
    const tokenHash = hashToken(token);

    console.log("[reset-confirm] token lookup");
    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    console.log("[reset-confirm] token found:", !!resetTokenRecord);

    const existingToken = resetTokenRecord
      ? resetTokenRecord
      : await prisma.passwordResetToken.findUnique({
          where: { tokenHash },
          select: { expiresAt: true, usedAt: true },
        });

    const expired = existingToken ? existingToken.expiresAt.getTime() <= Date.now() : false;
    const used = existingToken ? existingToken.usedAt !== null : false;

    console.log("[reset-confirm] expired:", expired);
    console.log("[reset-confirm] used:", used);

    if (!resetTokenRecord) {
      if (existingToken?.usedAt) {
        return NextResponse.json({ ok: false, reason: "Invalid reset link" }, { status: 400 });
      }

      if (existingToken && existingToken.expiresAt.getTime() <= Date.now()) {
        return NextResponse.json({ ok: false, reason: "Reset link expired" }, { status: 400 });
      }

      return NextResponse.json({ ok: false, reason: "Invalid reset link" }, { status: 400 });
    }

    console.log("[reset-confirm] updating password");
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: resetTokenRecord.user.id },
      data: {
        passwordHash: hashedPassword,
      },
    });

    await prisma.passwordResetToken.update({
      where: { id: resetTokenRecord.id },
      data: { usedAt: new Date() },
    });

    console.log("[reset-confirm] success");
    return NextResponse.json({ ok: true, message: "Password updated successfully" });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    console.error("[reset-confirm] server error:", message);
    return NextResponse.json(
      { ok: false, reason: "Reset failed. Please try again." },
      { status: 500 },
    );
  }
}
