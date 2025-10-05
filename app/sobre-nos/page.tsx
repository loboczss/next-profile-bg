"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plane,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Crown,
  Globe2,
  MapPinned,
  Clock8,
  PhoneCall,
  Stars,
  CheckCircle2,
  Hotel,
  Ship,
  TicketPercent,
  Users,
  Compass,
  Award,
  CalendarCheck2,
  Handshake,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// --- Helpers de animação simples ---
function useInView<T extends HTMLElement>(
  ref: React.RefObject<T>,
  margin = "0px 0px -20% 0px"
) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: margin }
    );
    obs.observe(element);
    return () => {
      obs.unobserve(element);
      obs.disconnect();
    };
  }, [ref, margin]);
  return inView;
}

function Counter({ from = 0, to, duration = 1800, suffix = "" }: { from?: number; to: number; duration?: number; suffix?: string }) {
  const [val, setVal] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref);

  useEffect(() => {
    if (!visible) return;
    let start: number | null = null;
    const delta = to - from;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      setVal(Math.round(from + delta * (1 - Math.cos(p * Math.PI)) / 2)); // ease-in-out
      if (p < 1) requestAnimationFrame(step);
    };
    const r = requestAnimationFrame(step);
    return () => cancelAnimationFrame(r);
  }, [visible, to, from, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {val.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}

// --- Badge decorativa reutilizável ---
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md shadow-sm">
      <Sparkles className="size-4 text-yellow-300" />
      {children}
    </div>
  );
}

export default function AboutPage() {
  // Mock hero images (opcional): use sua marca/imagem se quiser
  const heroImages = useMemo(
    () => [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1920&auto=format&fit=crop",
    ],
    []
  );

  return (
    <main className="min-h-dvh bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-slate-900">
      {/* HERO */}
      <section className="relative isolate overflow-clip rounded-b-[2.5rem] border-b border-white/20 bg-black/70 md:rounded-b-[3rem]">
        {/* BG images em camadas */}
        <div className="absolute inset-0 -z-10">
          {heroImages.map((src, i) => (
            <div
              key={i}
              className={cn(
                "absolute inset-0 opacity-0",
                i === 0 && "opacity-100"
              )}
            >
              <Image src={src} alt="" fill priority={i === 0} className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.16),transparent_50%)] mix-blend-overlay" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.12),transparent_50%)] mix-blend-overlay" />
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <div className="flex flex-col items-center text-center text-white">
            <Badge>Evastur • desde 1999</Badge>
            <div className="mt-6 inline-flex items-center gap-3">
              <div className="relative">
                <Plane className="size-10 text-blue-300 animate-bounce" />
                <Stars className="absolute -top-2 -right-2 size-5 text-yellow-300 animate-pulse" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Quem somos & por que viajar com a{" "}
                <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Evastur
                </span>
              </h1>
            </div>
            <p className="mt-4 max-w-2xl text-sm text-white/90 sm:text-base">
              Desde 1999, conectamos pessoas a roteiros com curadoria, hotéis
              selecionados e suporte ponta a ponta. Experiências autênticas,
              seguras e memoráveis — do primeiro clique ao último pôr do sol.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/contato"
                className="group inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/15"
              >
                <PhoneCall className="size-4" />
                Fale com um especialista
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/destinos"
                className="group inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 px-6 py-3 text-sm font-semibold text-emerald-50 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/70 hover:shadow-md hover:shadow-emerald-500/30"
              >
                <Compass className="size-4" />
                Explorar destinos
              </Link>
            </div>
          </div>
        </div>

        {/* Blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
          <div className="absolute left-1/3 top-1/4 size-72 animate-pulse rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 size-64 animate-pulse rounded-full bg-purple-500/15 blur-3xl" />
        </div>

        {/* Indicador de scroll */}
        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 animate-bounce md:block">
          <div className="flex flex-col items-center gap-2">
            <div className="size-6 rounded-full border-2 border-white/40 p-1">
              <div className="size-full animate-pulse rounded-full bg-white/60" />
            </div>
            <span className="text-xs font-medium text-white/70">Role para conhecer</span>
          </div>
        </div>
      </section>

      {/* Proposta de Valor */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 md:py-18 lg:px-8">
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/70 to-white/50 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl transition-all duration-500 dark:from-white/[0.06] dark:to-white/[0.03] sm:p-8 md:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
          </div>

          <div className="relative grid gap-6 md:grid-cols-3">
            {[
              {
                Icon: Crown,
                title: "Curadoria Premium",
                desc: "Roteiros autorais com experiências que não estão no óbvio: guias locais, jantares secretos e passeios exclusivos.",
              },
              {
                Icon: ShieldCheck,
                title: "Segurança & Transparência",
                desc: "Parcerias sólidas, proteção total de viagem e acompanhamento em tempo real antes, durante e depois.",
              },
              {
                Icon: HeartHandshake,
                title: "Atendimento humano",
                desc: "Especialistas que entendem seu estilo e orçamento. Nada de respostas genéricas, tudo feito sob medida.",
              },
            ].map(({ Icon, title, desc }, i) => (
              <div
                key={i}
                className="group/card relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-white/60 to-white/40 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-white/30 hover:shadow-xl"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
                </div>
                <div className="relative flex items-start gap-4">
                  <div className="grid size-14 place-items-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/40 to-white/20 shadow">
                    <Icon className="size-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selos de confiança */}
          <div className="relative mt-8 grid grid-cols-2 items-center gap-4 sm:grid-cols-4 md:gap-6">
            {[
              { Icon: Award, label: "Certificações & Parceiros" },
              { Icon: Users, label: "Mais de 15 mil viajantes" },
              { Icon: Globe2, label: "Presença nacional" },
              { Icon: CalendarCheck2, label: "Suporte 24/7" },
            ].map(({ Icon, label }, i) => (
              <div key={i} className="flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/40 px-4 py-3">
                <Icon className="size-5 text-blue-600" />
                <span className="text-sm font-semibold text-slate-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Números (counters) */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/70 p-6 backdrop-blur-xl sm:grid-cols-2 md:grid-cols-4">
          {[
            { Icon: MapPinned, label: "Destinos mapeados", to: 280 },
            { Icon: Users, label: "Viajantes atendidos", to: 15000 },
            { Icon: Clock8, label: "Anos de história", to: new Date().getFullYear() - 1999 },
            { Icon: CheckCircle2, label: "Avaliações 5★", to: 4200 },
          ].map(({ Icon, label, to }, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/50 p-5">
              <div className="grid size-12 place-items-center rounded-xl border border-white/30 bg-gradient-to-br from-blue-50 to-purple-50">
                <Icon className="size-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  <Counter to={to} />
                  {i === 1 ? "+" : ""}
                </div>
                <p className="text-xs font-medium text-slate-600">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Linha do Tempo (1999 → hoje) */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/70 to-white/50 p-6 backdrop-blur-xl">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            Nossa jornada desde <span className="text-blue-700">1999</span>
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">
            Crescemos com você: do atendimento de balcão ao planejamento digital com curadoria premium.
          </p>

          <ol className="relative mx-auto mt-8 grid max-w-4xl gap-8 border-l border-slate-200 pl-6">
            {[
              { year: 1999, title: "Nasce a Evastur", desc: "Agência de bairro com atendimento próximo e foco em viagens nacionais.", Icon: Handshake },
              { year: 2008, title: "Parcerias globais", desc: "Acordos internacionais e melhores tarifas com hotéis e operadoras.", Icon: Hotel },
              { year: 2015, title: "Roteiros autorais", desc: "Curadoria própria: experiências locais, gastronômicas e culturais.", Icon: Stars },
              { year: 2020, title: "Suporte total 24/7", desc: "Acompanhamento ponta a ponta — pré, durante e pós viagem.", Icon: ShieldCheck },
              { year: new Date().getFullYear(), title: "Tecnologia & UX", desc: "Plataforma moderna, gestão de pacotes e atendimento omnichannel.", Icon: Globe2 },
            ].map(({ year, title, desc, Icon }, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[9px] top-1 grid size-4 place-items-center rounded-full border-2 border-blue-600 bg-white" />
                <div className="group/card rounded-2xl border border-white/20 bg-white/60 p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                    <CalendarCheck2 className="size-4" />
                    {year}
                  </div>
                  <div className="mt-1 flex items-start gap-3">
                    <div className="grid size-10 place-items-center rounded-xl border border-white/30 bg-gradient-to-br from-blue-50 to-purple-50">
                      <Icon className="size-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{desc}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* O que você compra quando compra na Evastur */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/70 to-white/50 p-6 backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold md:text-3xl">O que está incluso (de verdade)</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              Transparência total. Sem letrinhas miúdas — só viagem bem planejada.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: TicketPercent, title: "Tarifas negociadas", desc: "Acesso a acordos exclusivos com companhias e hotéis." },
              { Icon: Hotel, title: "Hospedagens selecionadas", desc: "A curadoria cuida do conforto, da localização e do serviço." },
              { Icon: Ship, title: "Cruzeiros & experiências", desc: "Do mar ao deserto: passeios temáticos e roteiros diferentes." },
              { Icon: Users, title: "Atendimento humano", desc: "Nada de chatbot frio. Especialistas de verdade cuidando de você." },
              { Icon: ShieldCheck, title: "Segurança de ponta a ponta", desc: "Documentação, seguros, suporte — tudo em um só lugar." },
              { Icon: Crown, title: "Toque premium", desc: "Upgrades, mimos e detalhes que viram memórias." },
            ].map(({ Icon, title, desc }, i) => (
              <div key={i} className="group/card flex gap-3 rounded-2xl border border-white/20 bg-white/60 p-5 transition-all hover:-translate-y-1 hover:shadow-md">
                <div className="grid size-12 place-items-center rounded-xl border border-white/30 bg-gradient-to-br from-blue-50 to-purple-50">
                  <Icon className="size-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/destinos"
              className="group inline-flex items-center gap-2 rounded-full border border-white/30 bg-blue-600/90 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-500/30"
            >
              Explorar pacotes
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contato"
              className="group inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 px-6 py-3 text-sm font-semibold text-emerald-700 backdrop-blur transition-all hover:-translate-y-1"
            >
              Montar meu roteiro
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ simples */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-14 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold md:text-3xl">Perguntas frequentes</h2>
        <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-white/10 bg-white/70">
          {[
            {
              q: "A Evastur é uma agência de verdade?",
              a: "Sim. Atuamos desde 1999 com CNPJ, certificações do trade e parcerias oficiais com operadoras, hotéis e cias aéreas.",
            },
            {
              q: "Vocês dão suporte durante a viagem?",
              a: "100%. Do planejamento ao retorno, nossa equipe acompanha tudo: documentação, check-ins, remarcações e emergências.",
            },
            {
              q: "Consigo um roteiro personalizado?",
              a: "Esse é o nosso padrão. Ajustamos cada etapa ao seu estilo, orçamento e tempo — com dicas locais e experiências únicas.",
            },
            {
              q: "E se eu já tiver passagens?",
              a: "Sem problema. Podemos cuidar do resto: hospedagem, transfers, seguro, passeios e concierge no destino.",
            },
          ].map(({ q, a }, i) => (
            <details key={i} className="group px-5 py-4 open:bg-white/80 transition-colors">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                <span>{q}</span>
                <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Final forte */}
      <section className="relative mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-blue-600 to-cyan-600 p-10 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="relative z-10 text-center">
            <Stars className="mx-auto mb-4 size-12 animate-pulse" />
            <h2 className="text-3xl font-bold md:text-4xl">
              Pronto para a sua próxima lembrança inesquecível?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-blue-100">
              Deixe nosso time cuidar de tudo. Você só se preocupa em dizer “sim” para a viagem.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/contato"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 font-bold text-blue-700 transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                Solicitar orçamento
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/destinos"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3 font-semibold text-white backdrop-blur-md transition-all hover:-translate-y-1"
              >
                Ver destinos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapézinho institucional */}
      <footer className="mx-auto w-full max-w-7xl px-4 pb-10 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Evastur — desde 1999. Todos os direitos reservados.
      </footer>
    </main>
  );
}
