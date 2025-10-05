import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
// import Google from "next-auth/providers/google";
import { z } from "zod";

import { prisma } from "./prisma";
import { verifyPassword } from "./hash";

const credentialsSchema = z.object({
  username: z.string().min(1, "Usuário obrigatório").trim(),
  password: z.string().min(1, "Senha obrigatória"),
});

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { username, password } = parsed.data;

        let user = null;
        try {
          user = await prisma.user.findUnique({ where: { username } });
        } catch {
          return null;
        }

        if (!user) {
          const error = new CredentialsSignin("Usuário não encontrado");
          error.code = "user_not_found";
          throw error;
        }

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
          const error = new CredentialsSignin("Senha incorreta");
          error.code = "invalid_password";
          throw error;
        }

        return {
          id: user.id.toString(),
          name: user.fullName ?? user.username,
          image: user.imageUrl ?? undefined,
          email: user.email,
          role: user.role,
          username: user.username,
          fullName: user.fullName,
        };
      },
    }),
    // Google({
    //   clientId: process.env.AUTH_GOOGLE_ID ?? "",
    //   clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    // }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.name = user.name ?? null;
        token.picture = user.image ?? null;
        token.role = (user as { role?: "user" | "admin" }).role ?? "user";
        token.username = (user as { username?: string }).username ?? token.username;
        token.fullName = (user as { fullName?: string | null }).fullName ?? token.fullName ?? null;
        token.email = (user as { email?: string | null }).email ?? token.email ?? null;
      }

      if (token.userId) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: Number(token.userId) },
            select: {
              username: true,
              imageUrl: true,
              role: true,
              fullName: true,
              email: true,
            },
          });

          if (dbUser) {
            token.name = dbUser.fullName ?? dbUser.username;
            token.picture = dbUser.imageUrl ?? null;
            token.role = (dbUser.role as "user" | "admin") ?? "user";
            token.username = dbUser.username;
            token.fullName = dbUser.fullName ?? null;
            token.email = dbUser.email ?? null;
          }
        } catch {
          // ignore database lookup errors in JWT callback
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId ?? "";
        session.user.name = token.fullName ?? token.name ?? session.user.name ?? null;
        session.user.image = token.picture ?? null;
        session.user.role = (token.role as "user" | "admin") ?? "user";
        session.user.username = token.username ?? session.user.username ?? "";
        session.user.fullName = token.fullName ?? session.user.fullName ?? null;
        session.user.email = token.email ?? session.user.email ?? null;
      }

      return session;
    },
  },
});
