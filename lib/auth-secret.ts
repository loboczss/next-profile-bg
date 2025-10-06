const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? undefined;

if (!secret && process.env.NODE_ENV === "production") {
  console.error(
    "AUTH_SECRET ou NEXTAUTH_SECRET não está definido. Rotas protegidas não funcionarão sem um segredo compartilhado.",
  );
}

export const authSecret = secret;
