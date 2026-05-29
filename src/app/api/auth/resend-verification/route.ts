import { NextResponse } from "next/server";
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
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, message: "Please enter a valid email." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    if (existing) {
      return NextResponse.json(
        { ok: false, message: "An account with this email already exists. Please sign in." },
        { status: 409 },
      );
    }

    const pendingSignup = await prisma.pendingSignup.findUnique({ where: { email } });

    if (!pendingSignup || pendingSignup.usedAt) {
      return NextResponse.json(
        { ok: false, message: "No pending signup found. Please create an account first." },
        { status: 404 },
      );
    }

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

    await prisma.pendingSignup.update({
      where: { id: pendingSignup.id },
      data: {
        tokenHash,
        expiresAt,
        usedAt: null,
      },
    });

    const emailResult = await sendSignupVerificationEmail({
      to: pendingSignup.email,
      verificationLink,
    });

    if (!emailResult.ok) {
      return NextResponse.json(
        { ok: false, message: "We couldn't send the verification email. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Check your email to verify your account.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "We couldn't resend the verification email. Please try again." },
      { status: 500 },
    );
  }
}
