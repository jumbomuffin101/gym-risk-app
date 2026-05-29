import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";

const VERIFICATION_EXPIRES_MS = 1000 * 60 * 60 * 24;

export function createSignupVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSignupVerificationToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function getSignupVerificationExpiresAt(): Date {
  return new Date(Date.now() + VERIFICATION_EXPIRES_MS);
}

export function getAppBaseUrl(): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  return baseUrl ? baseUrl.replace(/\/$/, "") : null;
}

export function buildVerificationLink(rawToken: string): string | null {
  const appUrl = getAppBaseUrl();

  if (!appUrl) {
    return null;
  }

  return `${appUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendSignupVerificationEmail({
  to,
  verificationLink,
}: {
  to: string;
  verificationLink: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    return {
      ok: false as const,
      status: null,
      message: !apiKey ? "RESEND_API_KEY is not configured." : "RESEND_FROM is not configured.",
    };
  }

  const issuedAt = new Date();
  const issuedAtLabel = issuedAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
  const subjectTime = issuedAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/New_York",
  });

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to,
      subject: `Verify your Gym-Risk email - ${subjectTime}`,
      text:
        `Welcome to Gym-Risk.\n\n` +
        `This verification link was requested at ${issuedAtLabel}.\n\n` +
        `Verify your email here:\n\n${verificationLink}\n\n` +
        `This link expires in 24 hours. If you did not create an account, you can ignore this email.`,
      html:
        `<p>Welcome to Gym-Risk.</p>` +
        `<p>This verification link was requested at ${escapeHtml(issuedAtLabel)}.</p>` +
        `<p><a href="${escapeHtml(verificationLink)}">Verify your email</a></p>` +
        `<p>This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>`,
    });

    if (result.error) {
      return {
        ok: false as const,
        status: "statusCode" in result.error ? result.error.statusCode : null,
        message: result.error.message,
        name: result.error.name,
      };
    }

    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Resend error.";
    const name = error instanceof Error ? error.name : "UnknownError";

    return {
      ok: false as const,
      status: null,
      message,
      name,
    };
  }
}
