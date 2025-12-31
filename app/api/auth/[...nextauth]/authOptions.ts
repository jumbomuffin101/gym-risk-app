import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";

type TokenWithSub = {
  sub?: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
  async jwt({ token, user }) {
    if (user?.id) token.sub = String(user.id);
    return token;
  },

  async session({ session, token }) {
    if (session.user) {
      const t = token as TokenWithSub;
      if (!session.user.id && t.sub) session.user.id = t.sub;
    }
    return session;
  },
},

};

  

