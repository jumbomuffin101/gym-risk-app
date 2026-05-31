import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";

const VERIFICATION_EXPIRES_MS = 1000 * 60 * 60 * 24;
export const DEMO_SIGNUP_VERIFICATION_EMAIL = "ryanrawat@gmail.com";
export const DEMO_EMAIL_UNSUPPORTED_MESSAGE =
  "Demo email verification only supports the configured test email.";
export const RESEND_TEST_MODE_MESSAGE =
  "Email verification is in demo mode. Please use the configured test email.";

type SignupVerificationEmailResult =
  | { ok: true }
  | {
      ok: false;
      status: number | string | null;
      message: string;
      name?: string;
      code?: "RESEND_TEST_MODE_RECIPIENT_RESTRICTED";
    };

export function createSignupVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSignupVerificationToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function getSignupVerificationExpiresAt(): Date {
  return new Date(Date.now() + VERIFICATION_EXPIRES_MS);
}

export function isAllowedDemoSignupEmail(email: string): boolean {
  return email.toLowerCase().trim() === DEMO_SIGNUP_VERIFICATION_EMAIL;
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

function isResendTestingRecipientRestriction({
  status,
  message,
}: {
  status: number | string | null;
  message: string;
}): boolean {
  return (
    String(status) === "403" &&
    /testing emails|own email address|verify a domain|onboarding@resend\.dev/i.test(message)
  );
}

export async function sendSignupVerificationEmail({
  to,
  verificationLink,
}: {
  to: string;
  verificationLink: string;
}): Promise<SignupVerificationEmailResult> {
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
      const status = "statusCode" in result.error ? result.error.statusCode : null;
      const code = isResendTestingRecipientRestriction({
        status,
        message: result.error.message,
      })
        ? "RESEND_TEST_MODE_RECIPIENT_RESTRICTED"
        : undefined;

      return {
        ok: false as const,
        status,
        message: result.error.message,
        name: result.error.name,
        code,
      };
    }

    return { ok: true as const };
  } catch (error) {
    const resendError = error as {
      message?: unknown;
      name?: unknown;
      status?: unknown;
      statusCode?: unknown;
    };
    const statusValue = resendError.statusCode ?? resendError.status ?? null;
    const status =
      typeof statusValue === "number" || typeof statusValue === "string" ? statusValue : null;
    const message =
      error instanceof Error
        ? error.message
        : typeof resendError.message === "string"
          ? resendError.message
          : "Unknown Resend error.";
    const name =
      error instanceof Error
        ? error.name
        : typeof resendError.name === "string"
          ? resendError.name
          : "UnknownError";
    const code = isResendTestingRecipientRestriction({ status, message })
      ? "RESEND_TEST_MODE_RECIPIENT_RESTRICTED"
      : undefined;

    return {
      ok: false as const,
      status,
      message,
      name,
      code,
    };
  }
}
