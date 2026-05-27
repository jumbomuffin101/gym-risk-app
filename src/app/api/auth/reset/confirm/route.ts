import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/app/lib/prisma";
import { hashResetToken } from "@/app/lib/auth/passwordReset";

type UpdateFailureStep = "USER_PASSWORD_UPDATE_FAILED" | "TOKEN_MARK_USED_FAILED";

class UpdateFailure extends Error {
  constructor(readonly step: UpdateFailureStep) {
    super(step);
    this.name = "UpdateFailure";
  }
}

function failure(reason: string, status = 400) {
  return NextResponse.json({ ok: false, reason }, { status });
}

function safeErrorType(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return error instanceof Error ? error.name : "UnknownError";
}

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
      return failure("Invalid reset link");
    }

    if (!password) {
      return failure("Password is required.");
    }

    if (password.length < 8) {
      return failure("Password must be at least 8 characters.");
    }

    if (confirmPassword !== password) {
      return failure("Passwords do not match.");
    }

    const tokenHash = hashResetToken(token);

    let resetToken;
    try {
      resetToken = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
    } catch (error: unknown) {
      console.error("[reset-confirm] TOKEN_LOOKUP_FAILED", safeErrorType(error));
      return failure("TOKEN_LOOKUP_FAILED", 500);
    }

    if (!resetToken) {
      console.log("[reset-confirm] TOKEN_NOT_FOUND");
      return failure("Invalid reset link");
    }

    if (resetToken.usedAt) {
      console.log("[reset-confirm] TOKEN_USED");
      return failure("This reset link has already been used.");
    }

    if (resetToken.expiresAt < new Date()) {
      console.log("[reset-confirm] TOKEN_EXPIRED");
      return failure("Reset link expired. Please request a new one.");
    }

    let passwordHash: string;
    try {
      passwordHash = await bcrypt.hash(password, 12);
    } catch (error: unknown) {
      console.error("[reset-confirm] PASSWORD_HASH_FAILED", safeErrorType(error));
      return failure("PASSWORD_HASH_FAILED", 500);
    }

    try {
      await prisma.$transaction(async (transaction) => {
        try {
          await transaction.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash },
          });
        } catch (error: unknown) {
          console.error("[reset-confirm] USER_PASSWORD_UPDATE_FAILED", safeErrorType(error));
          throw new UpdateFailure("USER_PASSWORD_UPDATE_FAILED");
        }

        try {
          await transaction.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { usedAt: new Date() },
          });
        } catch (error: unknown) {
          console.error("[reset-confirm] TOKEN_MARK_USED_FAILED", safeErrorType(error));
          throw new UpdateFailure("TOKEN_MARK_USED_FAILED");
        }
      });
    } catch (error: unknown) {
      if (error instanceof UpdateFailure) {
        return failure(error.step, 500);
      }

      console.error("[reset-confirm] USER_PASSWORD_UPDATE_FAILED", safeErrorType(error));
      return failure("USER_PASSWORD_UPDATE_FAILED", 500);
    }

    console.log("[reset-confirm] password updated");

    return NextResponse.json({
      ok: true,
      message: "Password updated successfully.",
    });
  } catch (error: unknown) {
    console.error("[reset-confirm] unexpected error", safeErrorType(error));
    return failure("Reset failed. Please try again.", 500);
  }
}
