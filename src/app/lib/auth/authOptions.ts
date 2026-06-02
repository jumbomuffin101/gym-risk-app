import type { NextAuthOptions } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import Credentials from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/app/lib/prisma";

const prismaAdapter = PrismaAdapter(prisma);

function getUsableName(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function buildAuthRedirect(path: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  return baseUrl ? new URL(path, baseUrl).toString() : path;
}

async function readCookieValue(name: string): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value ?? null;
  } catch {
    return null;
  }
}

async function getOAuthSignupNameFallback(): Promise<string | null> {
  const value = await readCookieValue("gym-risk.oauth-signup-name");

  if (!value) {
    return null;
  }

  try {
    return getUsableName(decodeURIComponent(value));
  } catch {
    return getUsableName(value);
  }
}

async function isOAuthSignupRequest(): Promise<boolean> {
  const mode = await readCookieValue("gym-risk.oauth-mode");

  if (mode === "signup") {
    return true;
  }

  const callbackUrl =
    (await readCookieValue("next-auth.callback-url")) ??
    (await readCookieValue("__Secure-next-auth.callback-url"));

  if (!callbackUrl) {
    return false;
  }

  try {
    return new URL(callbackUrl).searchParams.get("authMode") === "signup";
  } catch {
    return callbackUrl.includes("authMode=signup");
  }
}

const adapter: Adapter = {
  ...prismaAdapter,
  async createUser(user: Omit<AdapterUser, "id">) {
    const name = getUsableName(user.name) ?? (await getOAuthSignupNameFallback());

    if (!name) {
      throw new Error("Name is required.");
    }

    return prismaAdapter.createUser!({ ...user, name }) as Promise<AdapterUser>;
  },
};

const providers: NextAuthOptions["providers"] = [
  GitHubProvider({
    clientId: process.env.GITHUB_ID!,
    clientSecret: process.env.GITHUB_SECRET!,
  }),
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
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

      const email = String(emailRaw).toLowerCase().trim();

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, passwordHash: true },
      });

      if (!user?.passwordHash) return null;

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;

      return { id: user.id, email: user.email, name: user.name ?? undefined };
    },
  }),
];

export const authOptions: NextAuthOptions = {
  adapter,
  providers,

  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },

  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider !== "credentials" && !user.email) {
        return false;
      }

      if (account?.type === "oauth" && (await isOAuthSignupRequest())) {
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          select: { userId: true },
        });

        if (existingAccount) {
          return buildAuthRedirect("/signup?error=AccountAlreadyExists");
        }

        const email = user.email?.toLowerCase().trim();

        if (email) {
          const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
          });

          if (existingUser) {
            return buildAuthRedirect("/signup?error=AccountAlreadyExists");
          }
        }

        const name = getUsableName(user.name) ?? (await getOAuthSignupNameFallback());

        if (!name) {
          return buildAuthRedirect("/signup?error=NameRequired");
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.id) token.sub = String(user.id);
      if (user?.name) token.name = user.name;
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = String(token.sub);
      }
      if (session.user) {
        session.user.name = getUsableName(token.name) ?? null;
      }
      return session;
    },
  },
};
