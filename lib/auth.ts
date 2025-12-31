import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/db";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return { session: null, user: null };

  const user = await prisma.user.findUnique({ where: { email } });
  return { session, user };
}
