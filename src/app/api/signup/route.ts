import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/app/lib/prisma";
import {
  buildVerificationLink,
  createSignupVerificationToken,
  DEMO_EMAIL_UNSUPPORTED_MESSAGE,
  getSignupVerificationExpiresAt,
  hashSignupVerificationToken,
  isAllowedDemoSignupEmail,
  RESEND_TEST_MODE_MESSAGE,
  sendSignupVerificationEmail,
} from "@/app/lib/auth/signupVerification";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const nameRaw = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, message: "Please enter a valid email." }, { status: 400 });
    }

    if (!nameRaw) {
      return NextResponse.json({ ok: false, message: "Name is required." }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { ok: false, message: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    if (!isAllowedDemoSignupEmail(email)) {
      return NextResponse.json(
        { ok: false, message: DEMO_EMAIL_UNSUPPORTED_MESSAGE },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    if (existing) {
      return NextResponse.json(
        { ok: false, message: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rawToken = createSignupVerificationToken();
    const tokenHash = hashSignupVerificationToken(rawToken);
    const expiresAt = getSignupVerificationExpiresAt();
    const verificationLink = buildVerificationLink(rawToken);

    if (!verificationLink) {
      return NextResponse.json(
        { ok: false, message: "App URL is not configured." },
        { status: 500 },
      );
    }

    await prisma.pendingSignup.upsert({
      where: { email },
      update: {
        name: nameRaw,
        passwordHash,
        tokenHash,
        expiresAt,
        usedAt: null,
      },
      create: {
        email,
        name: nameRaw,
        passwordHash,
        tokenHash,
        expiresAt,
      },
    });

    const emailResult = await sendSignupVerificationEmail({
      to: email,
      verificationLink,
    });

    if (!emailResult.ok) {
      const appUrlHost = (() => {
        try {
          return new URL(verificationLink).host;
        } catch {
          return "invalid";
        }
      })();

      console.error("[signup] verification email send failed", {
        hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
        resendFrom: process.env.RESEND_FROM ?? null,
        appUrlHost,
        resendStatus: emailResult.status ?? null,
        resendError: emailResult.name ?? null,
        resendMessage: emailResult.message ?? null,
      });

      if (emailResult.code === "RESEND_TEST_MODE_RECIPIENT_RESTRICTED") {
        return NextResponse.json(
          {
            ok: false,
            code: "VERIFICATION_EMAIL_SEND_FAILED",
            message: RESEND_TEST_MODE_MESSAGE,
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          code: "VERIFICATION_EMAIL_SEND_FAILED",
          message: "We couldn't send the verification email. Please try again.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Check your email to verify your account.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Signup failed. Please try again." },
      { status: 500 },
    );
  }
}
