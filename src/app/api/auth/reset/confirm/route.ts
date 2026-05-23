import crypto from "crypto";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function POST(req: Request) {
  try {
    console.log("[reset-confirm] request received");

    const body = (await req.json().catch(() => ({}))) as {
      token?: string;
      newPassword?: string;
      password?: string;
    };
    console.log("[reset-confirm] body parsed");

    const token = String(body.token ?? "").trim();
    const password = String(body.newPassword ?? body.password ?? "");

    console.log("[reset-confirm] token present:", !!token);
    console.log("[reset-confirm] password present:", !!password);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Invalid reset link" },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Password is required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password too short" },
        { status: 400 },
      );
    }

    console.log("[reset-confirm] hashing token");
    const tokenHash = hashToken(token);

    console.log("[reset-confirm] looking up token");
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    console.log("[reset-confirm] token found:", !!resetTokenRecord);

    if (!resetTokenRecord) {
      console.log("[reset-confirm] token not found");
      return NextResponse.json(
        { success: false, message: "Invalid reset link" },
        { status: 400 },
      );
    }

    const expired = resetTokenRecord.expiresAt.getTime() <= Date.now();
    const used = resetTokenRecord.usedAt !== null;

    console.log("[reset-confirm] token expired:", expired);
    console.log("[reset-confirm] expired:", expired);
    console.log("[reset-confirm] token used:", used);
    console.log("[reset-confirm] used:", used);

    if (expired) {
      return NextResponse.json(
        { success: false, message: "Reset link expired" },
        { status: 400 },
      );
    }

    if (used) {
      return NextResponse.json(
        { success: false, message: "Invalid reset link" },
        { status: 400 },
      );
    }

    console.log("[reset-confirm] hashing password");
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log("[reset-confirm] updating user password");
    await prisma.user.update({
      where: { id: resetTokenRecord.user.id },
      data: {
        passwordHash: hashedPassword,
      },
    });

    console.log("[reset-confirm] marking token used");
    await prisma.passwordResetToken.update({
      where: { id: resetTokenRecord.id },
      data: { usedAt: new Date() },
    });

    console.log("[reset-confirm] success");
    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err: unknown) {
    console.error("[reset-confirm] unexpected error:", err);
    return NextResponse.json(
      { success: false, message: "Reset failed. Please try again." },
      { status: 500 },
    );
  }
}
