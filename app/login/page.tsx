"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
      callbackUrl,
    });

    setLoading(false);

    if (!result) {
      setError("Erro inesperado ao fazer login.");
      return;
    }

    if (result.error) {
      setError("Credenciais inválidas.");
      return;
    }

    router.push(result.url ?? callbackUrl);
    router.refresh();
  };

  return (
    <main className="min-h-dvh flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm space-y-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Entrar</h1>
          <p className="text-sm text-slate-600">Acesse com seu usuário e senha.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="username">
              Usuário
            </label>
            <input
              id="username"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="text-sm text-center text-slate-600">
          Ainda não tem conta? <Link className="text-blue-600" href="/signup">Cadastre-se</Link>
        </p>
      </div>
    </main>
  );
}
