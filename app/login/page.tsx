"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
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

const loginHighlights = [
  "Planeje viagens personalizadas",
  "Descontos especiais para clientes",
  "Suporte humano 24/7",
];

export default function LoginPage() {
  // Navegação / callback (mesmo backend)
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const { data: session, status } = useSession();

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

      if (!result.ok || result.error) {
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

      const normalizeAppUrl = (url: string | null | undefined) => {
        if (!url) {
          return null;
        }

        if (url.startsWith("/")) {
          return url;
        }

        try {
          const parsed = new URL(url);
          if (typeof window !== "undefined" && parsed.origin === window.location.origin) {
            return `${parsed.pathname}${parsed.search}${parsed.hash}`;
          }
        } catch (error) {
          console.warn("Não foi possível normalizar a URL de redirecionamento.", error);
        }

        return null;
      };

      const normalizedResultUrl = normalizeAppUrl(result.url);
      const normalizedCallbackUrl = normalizeAppUrl(callbackUrl);
      const destination =
        normalizedResultUrl ??
        normalizedCallbackUrl ??
        (callbackUrl && callbackUrl !== "/" ? callbackUrl : null) ??
        "/";

      router.replace(destination);
      router.refresh();
    } catch (authError) {
      console.error("Falha ao fazer login", authError);
      setError("Erro inesperado ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    const role = session.user.role === "admin" ? "admin" : "user";
    const destination =
      callbackUrl && callbackUrl !== "/"
        ? callbackUrl
        : role === "admin"
          ? "/dashboard"
          : "/usuario";

    router.replace(destination);
  }, [session, status, callbackUrl, router]);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Blobs suaves (mesmo estilo do restante do site) */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-50">
        <div className="absolute left-1/3 top-1/4 h-72 w-72 animate-pulse rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 h-64 w-64 animate-pulse rounded-full bg-purple-500/15 blur-3xl" />
      </div>

      {/* Container central */}
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Card de login com layout responsivo */}
        <div className="group relative w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/80 shadow-2xl backdrop-blur-2xl transition-all duration-500">
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10" />
          </div>

          <div className="relative grid gap-0 lg:grid-cols-[1.05fr_1fr]">
            {/* Coluna inspiracional (desktop) */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-10 text-white lg:flex">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
                  <Sparkles className="h-4 w-4" />
                  Bem-vindo a bordo
                </div>
                <h2 className="mt-6 text-3xl font-semibold leading-tight">
                  Simplifique seus próximos destinos com a Evastur
                </h2>
                <p className="mt-4 max-w-sm text-sm text-blue-50/90">
                  Acesse sua conta para gerenciar roteiros, favoritos e acompanhar as novidades exclusivas da nossa equipe de especialistas.
                </p>
              </div>

              <div className="space-y-4">
                {loginHighlights.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm text-blue-50">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-white/15 shadow-inner">
                      <Plane className="h-4 w-4" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-3 text-xs text-blue-50/80">
                <div className="h-10 w-10 rounded-full bg-white/20" />
                <div>
                  <p className="font-semibold">Equipe Evastur</p>
                  <p>Mais de 20 anos transformando experiências de viagem.</p>
                </div>
              </div>

              <div className="pointer-events-none absolute -right-24 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/40 blur-3xl" />
            </div>

            {/* Conteúdo do formulário */}
            <div className="relative flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              {/* Título mobile */}
              <div className="mb-8 text-center lg:hidden">
                <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/60 px-4 py-1.5 text-xs font-semibold text-slate-700">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Acesso seguro Evastur
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Entrar</h2>
                <p className="mt-2 text-sm text-slate-600">Use seu usuário e senha para continuar.</p>
              </div>

              {/* Título desktop */}
              <div className="mb-8 hidden text-left lg:block">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/60 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  <Sparkles className="h-4 w-4" />
                  Área do cliente
                </div>
                <h2 className="mt-4 text-3xl font-bold text-slate-900">Faça login na sua conta</h2>
                <p className="mt-2 text-sm text-slate-600">Continue explorando destinos incríveis com a Evastur.</p>
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
              <form onSubmit={handleSubmit} className="space-y-5">
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
                      className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
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
                      className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-10 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                    />
                    <button
                      type="button"
                      aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 transition hover:text-slate-700"
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
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
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
              <div className="mt-6 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/recuperar-senha" className="font-semibold text-blue-700 transition hover:text-blue-800">
                  Esqueci minha senha
                </Link>
                <span className="text-center sm:text-right">
                  Não tem conta?{" "}
                  <Link href="/signup" className="font-semibold text-blue-700 transition hover:text-blue-800">
                    Cadastre-se
                  </Link>
                </span>
              </div>
            </div>
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
