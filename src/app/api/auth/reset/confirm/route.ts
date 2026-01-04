import { NextResponse } from "next/server";
import { consumePasswordReset } from "@/app/lib/auth/passwordReset";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    token?: string;
    newPassword?: string;
  };

  const token = String(body.token ?? "").trim();
  const newPassword = String(body.newPassword ?? "");

  if (!token) return NextResponse.json({ ok: false, reason: "Missing token" }, { status: 400 });
  if (newPassword.length < 8)
    return NextResponse.json({ ok: false, reason: "Password too short" }, { status: 400 });

  const result = await consumePasswordReset(token, newPassword);
  if (!result.ok) return NextResponse.json(result, { status: 400 });

  return NextResponse.json({ ok: true });
}
