"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plane,
  MapPin,
  Sparkles,
  Compass,
  CalendarCheck2,
  Ticket,
  ArrowRight,
  Zap,
  Shield,
  Hotel,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuoteForm } from "./home/quote-form";

type HeroProps = {
  images: string[];
  userName?: string | null;
};

const featureHighlights = [
  { icon: Ticket, label: "Tarifas negociadas" },
  { icon: Hotel, label: "Hotéis selecionados" },
  { icon: MapPin, label: "Curadoria local autêntica" },
  { icon: Headphones, label: "Suporte dedicado 24/7" },
  { icon: Zap, label: "Experiências imersivas" },
  { icon: Shield, label: "Atendimento seguro" },
];

export default function Hero({ images, userName }: HeroProps) {
  const slides = useMemo(() => (images?.length ? images.slice(0, 6) : []), [images]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const slideCount = slides.length;

  const normalizeIndex = useCallback(
    (index: number) => {
      if (!slideCount) return 0;
      const remainder = index % slideCount;
      return remainder >= 0 ? remainder : remainder + slideCount;
    },
    [slideCount],
  );

  const goToSlide = useCallback(
    (next: number | ((prev: number) => number)) => {
      if (!slideCount) return;
      setActive((prev) => {
        const target = typeof next === "function" ? next(prev) : next;
        const normalized = normalizeIndex(target);
        return normalized === prev ? prev : normalized;
      });
    },
    [normalizeIndex, slideCount],
  );

  useEffect(() => {
    if (!slideCount) {
      setActive(0);
      return;
    }
    setActive((prev) => {
      if (!Number.isFinite(prev) || prev < 0 || prev >= slideCount) {
        return 0;
      }
      return prev;
    });
  }, [slideCount]);

  // Auto-rotate (mantido), com pausa por foco/hover e respeito a prefers-reduced-motion
  useEffect(() => {
    if (!slideCount) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || paused) return;

    const t = setInterval(() => {
      setActive((prev) => normalizeIndex(prev + 1));
    }, 5500);
    return () => clearInterval(t);
  }, [slideCount, paused, normalizeIndex]);

  // Acessibilidade: setas do teclado (←/→) para navegar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(document.activeElement)) return;
      if (slideCount <= 1) return;
      if (e.key === "ArrowRight") goToSlide((p) => p + 1);
      if (e.key === "ArrowLeft") goToSlide((p) => p - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goToSlide, slideCount]);

  return (
    <section
      ref={containerRef}
      className="relative isolate min-h-[86dvh] overflow-clip rounded-b-[2.5rem] border-b border-white/10 bg-black/60 sm:min-h-[88dvh] md:rounded-b-[3rem]"
      aria-label="Destaques Evastur"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Slides em camadas com transição suave */}
      <div className="absolute inset-0 -z-10">
        {slides.map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            className={cn(
              "absolute inset-0 transition-all duration-[1800ms] ease-in-out will-change-transform",
              active === idx ? "scale-100 opacity-100" : "scale-105 opacity-0",
            )}
            aria-hidden={active !== idx}
          >
            <Image
              src={src}
              alt="Paisagem de destino"
              fill
              priority={idx === 0}
              className="object-cover"
              quality={90}
              sizes="100vw"
            />
            {/* Máscaras para legibilidade */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/25" />

            {/* Brilhos decorativos */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.16),transparent_50%)] mix-blend-overlay" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.12),transparent_50%)] mix-blend-overlay" />
          </div>
        ))}
      </div>

      {/* Partículas/blur blobs sutis (respeitam reduced-motion implicitamente) */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div className="absolute left-1/3 top-1/4 size-72 animate-pulse rounded-full bg-blue-500/20 blur-3xl" />
        <div
          className="absolute bottom-1/4 right-1/3 size-64 animate-pulse rounded-full bg-purple-500/15 blur-3xl"
          style={{ animationDelay: "1s" }}
        />
      </div>

    

      {/* Conteúdo principal */}
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start xl:grid-cols-[minmax(0,1fr)_460px]">
          <div className="flex flex-col gap-6 sm:gap-8 lg:pr-8 xl:pr-12">
            {/* Badge */}
            <div className="group inline-flex w-fit animate-[fadeIn_1s_ease-out] items-center gap-2.5 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/40 hover:bg-white/20 sm:text-sm">
              <Sparkles className="size-3.5 animate-pulse text-yellow-300 sm:size-4" />
              <span>Agência boutique • experiências sob medida</span>
              <span className="size-1.5 animate-pulse rounded-full bg-green-400 shadow-[0_0_8px_theme(colors.green.400)]" />
            </div>

            {/* Headline */}
            <div className="max-w-3xl animate-[fadeIn_1.2s_ease-out] space-y-5">
              <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-2xl sm:text-4xl md:text-5xl lg:text-6xl">
                Descubra o mundo com a{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
                    Evastur
                  </span>
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 opacity-50 blur-xl"
                  />
                </span>
                : viagens premium, memórias eternas.
              </h1>

              <p className="max-w-xl text-pretty text-sm leading-relaxed text-white/90 drop-shadow-lg sm:text-base md:text-lg md:leading-relaxed">
                {userName ? (
                  <>
                    <span className="font-semibold text-white">{userName.split(" ")[0]}</span>, planejamos sua próxima jornada com
                    curadoria, conforto e autenticidade — do primeiro clique ao último pôr do sol.
                  </>
                ) : (
                  <>Do primeiro clique ao último pôr do sol: roteiros exclusivos, hotéis selecionados a dedo e suporte 24/7.</>
                )}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex animate-[fadeIn_1.4s_ease-out] flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/destinos"
                className={cn(
                  "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full border border-white/30 bg-gradient-to-r from-blue-500/90 to-purple-500/90 px-6 py-3.5 text-sm font-semibold text-white shadow-xl backdrop-blur transition-all duration-300",
                  "hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/50 sm:px-7 sm:py-3.5 sm:text-base",
                )}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <Plane className="relative z-10 size-4 transition-transform duration-300 group-hover:translate-x-0.5 sm:size-5" />
                <span className="relative z-10">Explorar destinos</span>
                <ArrowRight className="relative z-10 size-4 transition-transform duration-300 group-hover:translate-x-1 sm:size-5" />
              </Link>

              <Link
                href="/sobre-nos"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white/95 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-lg sm:px-6 sm:text-base"
              >
                <Compass className="size-4 transition-transform duration-300 group-hover:rotate-12 sm:size-5" />
                <span>Conheça a Evastur</span>
              </Link>

              <Link
                href="/contato"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 px-5 py-3 text-sm font-medium text-emerald-50 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/60 hover:from-emerald-500/30 hover:to-emerald-400/30 hover:shadow-lg hover:shadow-emerald-500/30 sm:px-6 sm:text-base"
              >
                <CalendarCheck2 className="size-4 transition-transform duration-300 group-hover:scale-110 sm:size-5" />
                <span>Montar roteiro</span>
              </Link>
            </div>

            {/* Benefícios */}
            <div className="mt-6 grid animate-[fadeIn_1.6s_ease-out] gap-3 text-white/85 sm:grid-cols-2 lg:grid-cols-3">
              {featureHighlights.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/15"
                >
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-white/15 shadow-lg shadow-black/10 backdrop-blur">
                    <Icon className="size-4 text-sky-200" />
                  </span>
                  <span className="text-sm font-medium text-white/90">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-stretch lg:pl-4 xl:pl-8">
            <QuoteForm />
          </div>
        </div>
      </div>

        {/* Indicadores do carrossel */}
        {slideCount > 1 && (
          <div className="mt-2 flex animate-[fadeIn_1.8s_ease-out] items-center gap-2.5 sm:mt-4" role="tablist" aria-label="Seleção de slides">
            {slides.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={active === i}
                aria-controls={`hero-slide-${i}`}
                aria-label={`Ir para o slide ${i + 1}`}
                onClick={() => goToSlide(i)}
                className={cn(
                  "group relative h-1.5 rounded-full transition-all duration-500",
                  active === i
                    ? "w-10 bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg shadow-blue-500/50"
                    : "w-6 bg-white/40 hover:w-8 hover:bg-white/60",
                )}
              >
                {active === i && <span className="absolute inset-0 animate-pulse rounded-full bg-white/30" />}
              </button>
            ))}
          </div>
        )}

      {/* Indicador de scroll */}
      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 animate-bounce md:block">
        <div className="flex flex-col items-center gap-2">
          <div className="size-6 rounded-full border-2 border-white/40 p-1">
            <div className="size-full animate-pulse rounded-full bg-white/60" />
          </div>
          <span className="text-xs font-medium text-white/60">Role para explorar</span>
        </div>
      </div>
    </section>
  );
}
