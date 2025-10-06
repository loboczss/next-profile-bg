"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Mail,
  LockKeyhole,
  UserRound,
} from "lucide-react";

const ADMIN_CODE = "258790" as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};
const fieldTransition = { duration: 0.32, ease: "easeOut" as const };

const signupHighlights = [
  "Crie perfis sob medida para sua equipe",
  "Gerencie destinos favoritos em um só lugar",
  "Receba novidades e ofertas exclusivas",
];

export default function SignupPage() {
  const router = useRouter();

  // estado do formulário
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");

  // UI states
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
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

    const normalizedUsername = username.trim();
    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim();
    const normalizedAdminCode = adminCode.trim();

    // pequenas validações de UX (front-only)
    if (normalizedFullName.length < 3) {
      setError("Informe seu nome completo com pelo menos 3 caracteres.");
      return;
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (normalizedUsername.length < 3) {
      setError("O usuário deve ter pelo menos 3 caracteres.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    const hasAdminCode = normalizedAdminCode.length > 0;
    const resultingProfileType = hasAdminCode ? "admin" : "user";

    if (hasAdminCode && normalizedAdminCode !== ADMIN_CODE) {
      setError("Código de administrador incorreto.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: normalizedUsername,
          fullName: normalizedFullName,
          email: normalizedEmail,
          password,
          confirmPassword,
          profileType: resultingProfileType,
          adminCode: hasAdminCode ? normalizedAdminCode : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Erro ao cadastrar.");
        return;
      }

      setSuccess(
        hasAdminCode
          ? "Administrador cadastrado com sucesso! Redirecionando para o login…"
          : "Cadastro realizado com sucesso! Redirecionando para o login…",
      );
      setUsername("");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAdminCode("");
      setTimeout(() => router.push("/login"), 1200);
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

      {/* container central */}
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* card glass */}
        <div className="group relative w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/80 shadow-2xl backdrop-blur-2xl transition-all duration-500">
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10" />
          </div>

          <div className="relative grid gap-0 lg:grid-cols-[1.05fr_1fr]">
            {/* coluna inspiracional desktop */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-10 text-white lg:flex">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
                  <Sparkles className="h-4 w-4" />
                  Comece sua jornada
                </div>
                <h2 className="mt-6 text-3xl font-semibold leading-tight">
                  Cadastre-se para viver experiências inesquecíveis com a Evastur
                </h2>
                <p className="mt-4 max-w-sm text-sm text-blue-50/90">
                  Tenha acesso a roteiros exclusivos, personalize destinos e mantenha toda a sua equipe alinhada em um painel intuitivo.
                </p>
              </div>

              <div className="space-y-4">
                {signupHighlights.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm text-blue-50">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-white/15 shadow-inner">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-3 text-xs text-blue-50/80">
                <div className="h-10 w-10 rounded-full bg-white/20" />
                <div>
                  <p className="font-semibold">Equipe Evastur</p>
                  <p>Transformando sonhos em viagens desde 1999.</p>
                </div>
              </div>

              <div className="pointer-events-none absolute -right-24 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/40 blur-3xl" />
            </div>

            {/* conteúdo do formulário */}
            <div className="relative flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <div className="mb-8 text-center lg:hidden">
                <div className="mx-auto mb-3 inline-grid h-16 w-16 place-items-center rounded-2xl border border-slate-200/60 bg-white/70 shadow">
                  <UserPlus className="h-8 w-8 text-blue-700" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Criar conta</h2>
                <p className="mt-2 text-sm text-slate-600">Cadastre um novo usuário para acessar a Evastur.</p>
              </div>

              <div className="mb-8 hidden text-left lg:block">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/60 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  <Sparkles className="h-4 w-4" />
                  Novo por aqui?
                </div>
                <h2 className="mt-4 text-3xl font-bold text-slate-900">Cadastre seu acesso</h2>
                <p className="mt-2 text-sm text-slate-600">Preencha os dados abaixo e aproveite todos os benefícios Evastur.</p>
              </div>

              {/* alertas */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={fieldMotion.initial}
                    animate={fieldMotion.animate}
                    exit={fieldMotion.exit}
                    transition={fieldTransition}
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
                    key="success"
                    initial={fieldMotion.initial}
                    animate={fieldMotion.animate}
                    exit={fieldMotion.exit}
                    transition={fieldTransition}
                    className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div
                  initial={fieldMotion.initial}
                  animate={fieldMotion.animate}
                  transition={fieldTransition}
                  className="space-y-1.5"
                >
                  <label htmlFor="fullName" className="text-sm font-medium text-slate-800">
                    Nome completo
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <UserPlus className="h-4 w-4" />
                    </span>
                    <input
                      id="fullName"
                      name="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="João Silva"
                      autoComplete="name"
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
                  <label htmlFor="email" className="text-sm font-medium text-slate-800">
                    E-mail
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@empresa.com"
                      autoComplete="email"
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
                      placeholder="usuario.evastur"
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
                  className="space-y-2"
                >
                  <div className="space-y-1.5">
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
                        placeholder="Crie uma senha segura"
                        autoComplete="new-password"
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
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full ${strengthBarClass} transition-all`}
                        style={{ width: `${(strength / 5) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                      <span>
                        Força da senha: <strong>{strengthLabel}</strong>
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={fieldMotion.initial}
                  animate={fieldMotion.animate}
                  transition={fieldTransition}
                  className="space-y-1.5"
                >
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-800">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <LockKeyhole className="h-4 w-4" />
                    </span>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      autoComplete="new-password"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-10 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPass ? "Ocultar confirmação" : "Mostrar confirmação"}
                      onClick={() => setShowConfirmPass((v) => !v)}
                      className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 transition hover:text-slate-700"
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  initial={fieldMotion.initial}
                  animate={fieldMotion.animate}
                  transition={fieldTransition}
                  className="space-y-1.5"
                >
                  <label htmlFor="adminCode" className="text-sm font-medium text-slate-800">
                    Tem um código?
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <input
                      id="adminCode"
                      name="adminCode"
                      type="password"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      placeholder="Digite o código (opcional)"
                      autoComplete="one-time-code"
                      className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Informe apenas se recebeu um código da equipe Evastur para acesso administrativo.
                  </p>
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
                      Salvando...
                    </>
                  ) : (
                    <>
                      Cadastrar
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* rodapé do card */}
              <p className="mt-6 text-center text-sm text-slate-600">
                Já tem conta?{" "}
                <Link href="/login" className="font-semibold text-blue-700 transition hover:text-blue-800">
                  Faça login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* rodapé institucional */}
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Evastur — desde 1999. Segurança e atendimento humano 24/7.
      </footer>
    </main>
  );
}
