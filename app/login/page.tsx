"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plane,
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  UserRound,
  LockKeyhole,
} from "lucide-react";

const fieldMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};
const fieldTransition = { duration: 0.3, ease: "easeOut" as const };
const ERROR_MESSAGES: Record<string, string> = {
  user_not_found: "Usuário não encontrado.",
  invalid_password: "Senha incorreta.",
  database_error:
    "Não foi possível validar suas credenciais agora. Tente novamente em instantes.",
  verification_error:
    "Não foi possível validar suas credenciais agora. Tente novamente em instantes.",
  CredentialsSignin: "Credenciais inválidas. Verifique usuário e senha.",
  CallbackRouteError: "Não foi possível concluir o login. Tente novamente.",
};

const DEFAULT_ERROR_MESSAGE =
  "Não foi possível entrar. Confira suas credenciais e tente novamente.";

export default function LoginPage() {
  // Navegação / callback (mesmo backend)
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  // Estado do form (inalterado)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Submit (mesmo signIn + redirects)
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
      setError("Informe seu usuário.");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Informe sua senha.");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username: normalizedUsername,
        password,
        callbackUrl,
      });

      if (!result) {
        setError(DEFAULT_ERROR_MESSAGE);
        return;
      }

      if (!result.ok) {
        const message =
          (result.code && ERROR_MESSAGES[result.code]) ??
          (result.error && ERROR_MESSAGES[result.error]) ??
          (result.status >= 500
            ? "Erro inesperado no servidor. Tente novamente em instantes."
            : DEFAULT_ERROR_MESSAGE);

        if (result.code === "invalid_password") {
          setPassword("");
        }

        setError(message);
        return;
      }

      setSuccess("Login realizado com sucesso! Redirecionando...");

      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const session = await response.json();
          const role = session?.user?.role === "admin" ? "admin" : "user";
          const destination =
            callbackUrl && callbackUrl !== "/"
              ? callbackUrl
              : role === "admin"
                ? "/dashboard"
                : "/usuario";

          router.push(destination);
          router.refresh();
          return;
        }
      } catch (sessionError) {
        console.error("Falha ao recuperar sessão após login", sessionError);
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (authError) {
      console.error("Falha ao fazer login", authError);
      setError("Erro inesperado ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Blobs suaves (mesmo estilo do restante do site) */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-50">
        <div className="absolute left-1/3 top-1/4 h-72 w-72 animate-pulse rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 h-64 w-64 animate-pulse rounded-full bg-purple-500/15 blur-3xl" />
      </div>

      {/* Header compacto com marca (consistente) */}
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

      {/* Container central */}
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Card de login — glass, borda suave, sombras leves */}
        <div className="group relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 sm:p-8">
          {/* Glow no hover (mesma linguagem visual) */}
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
          </div>

          {/* Título e subtítulo */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/60 px-4 py-1.5 text-xs font-semibold text-slate-700">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Acesso seguro Evastur
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Entrar</h2>
            <p className="mt-1 text-sm text-slate-600">Use seu usuário e senha para continuar.</p>
          </div>

          {/* feedbacks */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="login-error"
                initial={fieldMotion.initial}
                animate={fieldMotion.animate}
                exit={fieldMotion.exit}
                transition={fieldTransition}
                role="alert"
                aria-live="assertive"
                className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {success && (
              <motion.div
                key="login-success"
                initial={fieldMotion.initial}
                animate={fieldMotion.animate}
                exit={fieldMotion.exit}
                transition={fieldTransition}
                role="status"
                aria-live="polite"
                className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formulário (fluxo idêntico ao seu) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={fieldMotion.initial}
              animate={fieldMotion.animate}
              transition={fieldTransition}
              className="space-y-1.5"
            >
              <label htmlFor="username" className="text-sm font-medium text-slate-800">
                Usuário
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserRound className="h-4 w-4" />
                </span>
                <input
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-9 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                />
              </div>
            </motion.div>

            <motion.div
              initial={fieldMotion.initial}
              animate={fieldMotion.animate}
              transition={fieldTransition}
              className="space-y-1.5"
            >
              <label htmlFor="password" className="text-sm font-medium text-slate-800">
                Senha
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <LockKeyhole className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-9 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
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
            </motion.div>

            <motion.button
              type="submit"
              disabled={loading}
              initial={fieldMotion.initial}
              animate={fieldMotion.animate}
              transition={{ ...fieldTransition, delay: 0.05 }}
              whileHover={{ translateY: loading ? 0 : -2 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </motion.button>
          </form>

          {/* Links auxiliares */}
          <div className="mt-5 flex items-center justify-between text-xs text-slate-600">
            <Link href="/recuperar-senha" className="font-semibold text-blue-700 hover:underline">
              Esqueci minha senha
            </Link>
            <span>
              Não tem conta?{" "}
              <Link href="/signup" className="font-semibold text-blue-700 hover:underline">
                Cadastre-se
              </Link>
            </span>
          </div>
        </div>
      </section>

      {/* Rodapé institucional minimalista */}
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Evastur — desde 1999. Atendimento humano 24/7.
      </footer>
    </main>
  );
}
