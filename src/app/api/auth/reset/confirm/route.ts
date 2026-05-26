import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { hashResetToken } from "@/app/lib/auth/passwordReset";

export async function POST(request: Request) {
  try {
    console.log("[reset-confirm] request received");

    const parsedBody: unknown = await request.json().catch(() => ({}));
    const body =
      parsedBody && typeof parsedBody === "object"
        ? (parsedBody as Record<string, unknown>)
        : {};

    console.log("[reset-confirm] body parsed");

    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password =
      typeof body.password === "string"
        ? body.password
        : typeof body.newPassword === "string"
          ? body.newPassword
          : "";
    const confirmPassword =
      typeof body.confirmPassword === "string" ? body.confirmPassword : undefined;

    if (!token) {
      console.log("[reset-confirm] token invalid");
      return NextResponse.json(
        { success: false, code: "INVALID_TOKEN", message: "Invalid or expired reset link." },
        { status: 400 },
      );
    }

    console.log("[reset-confirm] token present");

    if (!password) {
      return NextResponse.json(
        { success: false, code: "PASSWORD_REQUIRED", message: "Password is required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          code: "PASSWORD_TOO_SHORT",
          message: "Password must be at least 8 characters.",
        },
        { status: 400 },
      );
    }

    if (confirmPassword !== undefined && confirmPassword !== password) {
      return NextResponse.json(
        { success: false, code: "PASSWORD_MISMATCH", message: "Passwords do not match." },
        { status: 400 },
      );
    }

    const tokenHash = hashResetToken(token);

    console.log("[reset-confirm] token lookup started");
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      console.log("[reset-confirm] token invalid");
      return NextResponse.json(
        { success: false, code: "INVALID_TOKEN", message: "Invalid or expired reset link." },
        { status: 400 },
      );
    }

    console.log("[reset-confirm] token found");

    if (resetToken.usedAt !== null) {
      console.log("[reset-confirm] token already used");
      return NextResponse.json(
        {
          success: false,
          code: "TOKEN_USED",
          message: "This reset link has already been used.",
        },
        { status: 400 },
      );
    }

    if (resetToken.expiresAt < new Date()) {
      console.log("[reset-confirm] token expired");
      return NextResponse.json(
        {
          success: false,
          code: "TOKEN_EXPIRED",
          message: "Reset link expired. Please request a new one.",
        },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    console.log("[reset-confirm] password updated");
    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch {
    console.error("[reset-confirm] unexpected error");
    return NextResponse.json(
      {
        success: false,
        code: "RESET_CONFIRM_FAILED",
        message: "Reset failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
