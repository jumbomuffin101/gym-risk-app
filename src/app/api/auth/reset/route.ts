import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { createPasswordResetToken } from "@/app/lib/auth/passwordReset";
import { sendResetEmail } from "@/app/lib/email/sendResetEmail";

const RESET_EMAIL_SENT = "Reset email sent. Check your inbox and spam folder.";
const EMAIL_NOT_FOUND = "We couldn't find an account with that email.";
const EMAIL_SEND_FAILED = "We couldn't send the reset email. Please try again.";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getResetBaseUrl() {
  const configuredUrl = process.env.NEXTAUTH_URL;

  if (!configuredUrl) {
    throw new Error("Missing NEXTAUTH_URL");
  }

  let parsed: URL;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new Error("Invalid NEXTAUTH_URL");
  }

  if (
    process.env.NODE_ENV === "production" &&
    ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)
  ) {
    throw new Error("Password reset base URL points to localhost in production");
  }

  return parsed.origin;
}

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };

  const e = String(email ?? "").toLowerCase().trim();
  if (!e || !isValidEmail(e)) {
    return NextResponse.json(
      { success: false, code: "INVALID_EMAIL", message: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: e },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, code: "EMAIL_NOT_FOUND", message: EMAIL_NOT_FOUND },
      { status: 404 },
    );
  }

  try {
    const baseUrl = getResetBaseUrl();
    const { token: rawToken } = await createPasswordResetToken(user.id, 30);
    const resetUrl = `${baseUrl}/reset-password/confirm?token=${rawToken}`;

    const emailResult = await sendResetEmail({ to: user.email, resetUrl });

    if (!emailResult.ok) {
      console.error("[reset] Password reset email was not sent:", emailResult.reason);
      return NextResponse.json(
        { success: false, code: "EMAIL_SEND_FAILED", message: EMAIL_SEND_FAILED },
        { status: 500 },
      );
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown reset error";
    console.error("[reset] Password reset email failed:", message);
    return NextResponse.json(
      { success: false, code: "EMAIL_SEND_FAILED", message: EMAIL_SEND_FAILED },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, message: RESET_EMAIL_SENT });
}
