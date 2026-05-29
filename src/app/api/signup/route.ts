import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/app/lib/prisma";
import {
  buildVerificationLink,
  createSignupVerificationToken,
  getSignupVerificationExpiresAt,
  hashSignupVerificationToken,
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
    const name = nameRaw.length > 0 ? nameRaw : null;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, message: "Please enter a valid email." }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { ok: false, message: "Password must be at least 8 characters." },
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
        name,
        passwordHash,
        tokenHash,
        expiresAt,
        usedAt: null,
      },
      create: {
        email,
        name,
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
