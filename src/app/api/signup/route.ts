import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "src/app/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const name = body?.name ? String(body.name).trim() : null;
  const emailRaw = body?.email ? String(body.email) : "";
  const password = body?.password ? String(body.password) : "";

  const email = emailRaw.toLowerCase().trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: name && name.length > 0 ? name : null,
      passwordHash,
    },
  });

  return NextResponse.json({ ok: true });
}
