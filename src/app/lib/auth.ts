import { getServerSession } from "next-auth";
import { authOptions } from "src/app/lib/auth/authOptions";
import { prisma } from "./db";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return { session: null, user: null };

  const user = await prisma.user.findUnique({ where: { email } });
  return { session, user };
}
