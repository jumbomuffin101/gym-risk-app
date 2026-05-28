import { randomBytes } from "crypto";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { hashResetToken } from "@/app/lib/auth/passwordReset";

const RESET_EMAIL_SENT = "Reset email sent. Check your inbox and spam folder.";
const EMAIL_NOT_FOUND = "We couldn't find an account with that email.";
const EMAIL_SEND_FAILED = "We couldn't send the reset email. Please try again.";
const RESET_LINK_CREATE_FAILED = "We couldn't create a reset link. Please try again.";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function POST(request: Request) {
  try {
    console.log("[reset] request received");

    const parsedBody: unknown = await request.json().catch(() => ({}));
    const body =
      parsedBody && typeof parsedBody === "object"
        ? (parsedBody as Record<string, unknown>)
        : {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, code: "INVALID_EMAIL", message: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, code: "EMAIL_NOT_FOUND", message: EMAIL_NOT_FOUND },
        { status: 404 },
      );
    }

    console.log("[reset] user found");

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(rawToken);

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      },
    });

    console.log("[reset] token row created");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: "App URL is not configured." },
        { status: 500 },
      );
    }

    const appUrl = baseUrl.replace(/\/$/, "");
    const resetLink = `${appUrl}/reset-password/confirm?token=${encodeURIComponent(rawToken)}`;
    console.log("[reset] appUrl host:", new URL(appUrl).host);

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;

    if (!apiKey || !from) {
      console.error("[reset] resend failed");
      return NextResponse.json(
        { success: false, code: "EMAIL_SEND_FAILED", message: EMAIL_SEND_FAILED },
        { status: 500 },
      );
    }

    try {
      const resend = new Resend(apiKey);
      const result = await resend.emails.send({
        from,
        to: user.email,
        subject: "Reset your Gym-Risk password",
        text:
          `Use this link to reset your Gym-Risk password:\n\n${resetLink}\n\n` +
          "This link expires in 30 minutes. If you did not request this, you can ignore this email.",
        html:
          "<p>Use this link to reset your Gym-Risk password:</p>" +
          `<p><a href="${escapeHtml(resetLink)}">Reset your password</a></p>` +
          "<p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>",
      });

      if (result.error) {
        console.error("[reset] resend failed");
        return NextResponse.json(
          { success: false, code: "EMAIL_SEND_FAILED", message: EMAIL_SEND_FAILED },
          { status: 500 },
        );
      }
    } catch {
      console.error("[reset] resend failed");
      return NextResponse.json(
        { success: false, code: "EMAIL_SEND_FAILED", message: EMAIL_SEND_FAILED },
        { status: 500 },
      );
    }

    console.log("[reset] email sent");
    return NextResponse.json({ success: true, message: RESET_EMAIL_SENT });
  } catch {
    console.error("[reset] unexpected error");
    return NextResponse.json(
      {
        success: false,
        code: "RESET_LINK_CREATE_FAILED",
        message: RESET_LINK_CREATE_FAILED,
      },
      { status: 500 },
    );
  }
}
