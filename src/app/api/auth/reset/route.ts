import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { createPasswordResetToken } from "@/app/lib/auth/passwordReset";
import { sendResetEmail } from "@/app/lib/email/sendResetEmail";

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };

  // Always return ok to prevent account enumeration
  const safeOk = NextResponse.json({ ok: true });

  const e = String(email ?? "").toLowerCase().trim();
  if (!e) {
    // Still safe to return a 400 here; this doesn't reveal account existence
    return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: e },
    select: { id: true, email: true },
  });

  // If user doesn't exist, exit quietly
  if (!user) return safeOk;

  const { token, expiresAt } = await createPasswordResetToken(user.id, 30);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const resetUrl = baseUrl
    ? `${baseUrl}/reset-password/confirm?token=${encodeURIComponent(token)}`
    : `/reset-password/confirm?token=${encodeURIComponent(token)}`;

  const emailResult = await sendResetEmail({ to: user.email, resetUrl });

  if (process.env.NODE_ENV !== "production") {
    console.log("[reset] emailResult", emailResult);
    // Helpful in dev only
    return NextResponse.json({ ok: true, devLink: resetUrl, expiresAt, email: emailResult });
  }

  // In prod, always safe ok
  return safeOk;
}
