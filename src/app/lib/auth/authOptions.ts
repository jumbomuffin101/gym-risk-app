import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/app/lib/prisma";

type TokenWithSub = { sub?: string };

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const emailRaw = credentials?.email;
        const password = credentials?.password;

        if (!emailRaw || !password) return null;

        // ✅ normalize email to avoid case/whitespace mismatch
        const email = String(emailRaw).toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, passwordHash: true },
        });

        // ✅ Must use passwordHash
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],

  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },

  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = String(user.id);
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = String(token.sub);
      }
      return session;
    },

  },
};
