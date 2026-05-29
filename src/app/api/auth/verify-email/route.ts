import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { hashSignupVerificationToken } from "@/app/lib/auth/signupVerification";

const INVALID_VERIFICATION_LINK = "Verification link is invalid or expired.";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ ok: false, message: INVALID_VERIFICATION_LINK }, { status: 400 });
    }

    const tokenHash = hashSignupVerificationToken(token);
    const pendingSignup = await prisma.pendingSignup.findUnique({
      where: { tokenHash },
    });

    if (!pendingSignup || pendingSignup.usedAt || pendingSignup.expiresAt < new Date()) {
      return NextResponse.json({ ok: false, message: INVALID_VERIFICATION_LINK }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: pendingSignup.email },
      select: { id: true },
    });

    if (existing) {
      await prisma.pendingSignup.update({
        where: { id: pendingSignup.id },
        data: { usedAt: new Date() },
      });

      return NextResponse.json(
        { ok: false, message: "An account already exists for this email." },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.user.create({
        data: {
          email: pendingSignup.email,
          name: pendingSignup.name,
          passwordHash: pendingSignup.passwordHash,
        },
      }),
      prisma.pendingSignup.update({
        where: { id: pendingSignup.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      message: "Email verified. Your account has been created.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "We couldn't verify your email. Please try again." },
      { status: 500 },
    );
  }
}
