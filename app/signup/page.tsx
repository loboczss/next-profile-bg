"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Plane,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  // estado do formulário (backend inalterado)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // UI states
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // força simples da senha (apenas UI)
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 5);
  }, [password]);

  const strengthLabel = ["Muito fraca", "Fraca", "Razoável", "Forte", "Excelente"][Math.max(0, strength - 1)] ?? "Muito fraca";
  const strengthBarClass = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
    "bg-blue-600",
  ][Math.max(0, strength - 1)] ?? "bg-red-500";

  // submit (rota /api/signup permanece igual)
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    // pequenas validações de UX (front-only)
    if (username.trim().length < 3) {
      setError("O usuário deve ter pelo menos 3 caracteres.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Erro ao cadastrar.");
        return;
        }

      setSuccess("Cadastro realizado com sucesso! Redirecionando para o login…");
      setUsername("");
      setPassword("");
      setTimeout(() => router.push("/login"), 1000);
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* blobs suaves no fundo */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-50">
        <div className="absolute left-1/3 top-1/4 h-72 w-72 animate-pulse rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 h-64 w-64 animate-pulse rounded-full bg-purple-500/15 blur-3xl" />
      </div>

      {/* header compacto com marca */}
      <header className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-6 text-slate-800 sm:justify-start sm:px-6 lg:px-8">
        <div className="relative">
          <Plane className="h-7 w-7 text-blue-600" />
          <Sparkles className="absolute -right-2 -top-2 h-4 w-4 text-yellow-500" />
        </div>
        <h1 className="text-xl font-bold">
          <span className="bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">Evastur</span>
          <span className="ml-2 text-sm font-medium text-slate-600">desde 1999</span>
        </h1>
      </header>

      {/* container central */}
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* card glass */}
        <div className="group relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 sm:p-8">
          {/* brilho sutil no hover */}
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
          </div>

          {/* header do card */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-grid h-14 w-14 place-items-center rounded-2xl border border-slate-200/60 bg-white/60 shadow">
              <UserPlus className="h-7 w-7 text-blue-700" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Criar conta</h2>
            <p className="mt-1 text-sm text-slate-600">Cadastre um novo usuário para acessar a Evastur.</p>
          </div>

          {/* alertas */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          {/* form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* usuário */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-slate-800">
                Usuário
              </label>
              <input
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
              />
            </div>

            {/* senha */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-800">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                />
                <button
                  type="button"
                  aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 transition hover:text-slate-700"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* força da senha (apenas visual) */}
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full ${strengthBarClass} transition-all`}
                    style={{ width: `${(strength / 5) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>Força da senha: <strong>{strengthLabel}</strong></span>
                </div>
              </div>
            </div>

            {/* botão */}
            <button
              type="submit"
              disabled={loading}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-blue-500/30 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Salvando...
                </>
              ) : (
                <>
                  Cadastrar
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* rodapé do card */}
          <p className="mt-5 text-center text-sm text-slate-600">
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-blue-700 hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </section>

      {/* rodapé institucional */}
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Evastur — desde 1999. Segurança e atendimento humano 24/7.
      </footer>
    </main>
  );
}
