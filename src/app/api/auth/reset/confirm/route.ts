import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { hashResetToken } from "@/app/lib/auth/passwordReset";

type DebugStep =
  | "BODY_PARSED"
  | "TOKEN_MISSING"
  | "PASSWORD_MISSING"
  | "TOKEN_NOT_FOUND"
  | "TOKEN_EXPIRED"
  | "TOKEN_USED"
  | "PASSWORD_UPDATE_FAILED"
  | "SUCCESS";

type ConfirmResponse = {
  success: boolean;
  code?: string;
  message: string;
  debugStep?: DebugStep;
};

function shouldIncludeDebugStep(): boolean {
  return process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production";
}

function jsonResponse(
  response: Omit<ConfirmResponse, "debugStep">,
  status: number,
  debugStep: DebugStep,
) {
  const responseBody: ConfirmResponse = { ...response };

  if (shouldIncludeDebugStep()) {
    responseBody.debugStep = debugStep;
  }

  return NextResponse.json(responseBody, { status });
}

export async function POST(request: Request) {
  let unexpectedErrorStep: DebugStep = "BODY_PARSED";

  try {
    const parsedBody: unknown = await request.json().catch(() => ({}));
    const body =
      parsedBody && typeof parsedBody === "object"
        ? (parsedBody as Record<string, unknown>)
        : {};

    console.log("[reset-confirm] BODY_PARSED");

    const token = typeof body.token === "string" ? body.token.trim() : "";
    const submittedPassword = body.password ?? body.newPassword;
    const submittedConfirmPassword =
      body.confirmPassword ?? body.confirmNewPassword ?? submittedPassword;
    const password = typeof submittedPassword === "string" ? submittedPassword : "";
    const confirmPassword =
      typeof submittedConfirmPassword === "string" ? submittedConfirmPassword : "";

    if (!token) {
      return jsonResponse(
        { success: false, code: "TOKEN_MISSING", message: "Invalid or expired reset link." },
        400,
        "TOKEN_MISSING",
      );
    }

    if (!password) {
      return jsonResponse(
        { success: false, code: "PASSWORD_MISSING", message: "Password is required." },
        400,
        "PASSWORD_MISSING",
      );
    }

    if (password.length < 8) {
      return jsonResponse(
        {
          success: false,
          code: "PASSWORD_TOO_SHORT",
          message: "Password must be at least 8 characters.",
        },
        400,
        "BODY_PARSED",
      );
    }

    if (confirmPassword !== password) {
      return jsonResponse(
        { success: false, code: "PASSWORD_MISMATCH", message: "Passwords do not match." },
        400,
        "BODY_PARSED",
      );
    }

    const tokenHash = hashResetToken(token);
    console.log("[reset-confirm] TOKEN_HASHED");

    console.log("[reset-confirm] TOKEN_LOOKUP");
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    console.log("[reset-confirm] TOKEN_FOUND", Boolean(resetToken));

    if (!resetToken) {
      return jsonResponse(
        { success: false, code: "TOKEN_NOT_FOUND", message: "Invalid or expired reset link." },
        400,
        "TOKEN_NOT_FOUND",
      );
    }

    if (resetToken.usedAt !== null) {
      return jsonResponse(
        {
          success: false,
          code: "TOKEN_USED",
          message: "This reset link has already been used.",
        },
        400,
        "TOKEN_USED",
      );
    }

    if (resetToken.expiresAt < new Date()) {
      return jsonResponse(
        {
          success: false,
          code: "TOKEN_EXPIRED",
          message: "Reset link expired. Please request a new one.",
        },
        400,
        "TOKEN_EXPIRED",
      );
    }

    unexpectedErrorStep = "PASSWORD_UPDATE_FAILED";
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

    console.log("[reset-confirm] PASSWORD_UPDATED");
    console.log("[reset-confirm] TOKEN_USED_MARKED");
    return jsonResponse({ success: true, message: "Password updated successfully." }, 200, "SUCCESS");
  } catch {
    console.error("[reset-confirm] unexpected error");
    return jsonResponse(
      {
        success: false,
        code: "RESET_CONFIRM_FAILED",
        message: "Reset failed. Please try again.",
      },
      500,
      unexpectedErrorStep,
    );
  }
}
