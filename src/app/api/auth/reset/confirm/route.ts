import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/app/lib/prisma";
import { hashResetToken } from "@/app/lib/auth/passwordReset";

export async function POST(request: Request) {
  try {
    console.log("[reset-confirm] request received");

    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password =
      typeof body?.password === "string"
        ? body.password
        : typeof body?.newPassword === "string"
          ? body.newPassword
          : "";
    const confirmPassword =
      typeof body?.confirmPassword === "string"
        ? body.confirmPassword
        : typeof body?.confirmNewPassword === "string"
          ? body.confirmNewPassword
          : password;

    console.log("[reset-confirm] body parsed");
    console.log("[reset-confirm] token present", Boolean(token));
    console.log("[reset-confirm] password present", Boolean(password));

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Invalid reset link" },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Password is required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    if (confirmPassword !== password) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match." },
        { status: 400 },
      );
    }

    const tokenHash = hashResetToken(token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    console.log("[reset-confirm] token lookup", Boolean(resetToken));

    if (!resetToken) {
      return NextResponse.json(
        { success: false, message: "Invalid reset link" },
        { status: 400 },
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { success: false, message: "This reset link has already been used." },
        { status: 400 },
      );
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: "Reset link expired. Please request a new one." },
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

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: unknown) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : error instanceof Error
          ? error.name
          : "Unknown error";
    console.error("[reset-confirm] unexpected error", errorCode);

    return NextResponse.json(
      { success: false, message: "Reset failed. Please try again." },
      { status: 500 },
    );
  }
}
