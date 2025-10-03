import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
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
          return null;
        }

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
          return null;
        }

        return {
          id: user.id.toString(),
          name: user.username,
          image: user.imageUrl ?? undefined,
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
      }

      if (token.userId) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: Number(token.userId) },
            select: { username: true, imageUrl: true },
          });

          if (dbUser) {
            token.name = dbUser.username;
            token.picture = dbUser.imageUrl ?? null;
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
        session.user.name = token.name ?? session.user.name ?? null;
        session.user.image = token.picture ?? null;
      }

      return session;
    },
  },
});
