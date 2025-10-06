"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  Compass,
  Plane,
  Sparkles,
} from "lucide-react";

import { QuoteForm } from "./home/quote-form";

export type HeroProps = {
  images: string[];
  userName?: string | null;
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1473893604213-3df9c15611d4?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1920&auto=format&fit=crop",
];

export default function Hero({ images, userName }: HeroProps) {
  const slides = useMemo(() => {
    const normalized = Array.isArray(images)
      ? images.filter((item) => typeof item === "string" && item.trim().length)
      : [];

    if (!normalized.length) {
      return FALLBACK_IMAGES;
    }

    return normalized.slice(0, 5);
  }, [images]);

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 7000);

    return () => window.clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    if (!slides.length) {
      setActive(0);
      return;
    }

    if (active >= slides.length) {
      setActive(0);
    }
  }, [slides, active]);

  return (
    <section className="relative isolate flex min-h-[70vh] w-full flex-col justify-center overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        {slides.map((src, idx) => (
          <Image
            key={`${src}-${idx}`}
            src={src}
            alt="Paisagem de destino"
            fill
            priority={idx === 0}
            className={`absolute inset-0 object-cover transition-opacity duration-1000 ${active === idx ? "opacity-100" : "opacity-0"}`}
            sizes="100vw"
          />
        ))}
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-slate-950/90" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:px-10 sm:py-20 lg:flex-row lg:items-center lg:gap-12 lg:py-24">
        <div className="flex-1 space-y-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 backdrop-blur">
            <Sparkles className="size-4" /> Experiências Evastur
          </span>

          <div className="space-y-4">
            <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {userName ? (
                <>
                  {userName.split(" ")[0]}, planeje sua próxima viagem com conforto e autenticidade.
                </>
              ) : (
                <>Viagens sob medida para criar memórias que duram para sempre.</>
              )}
            </h1>
            <p className="max-w-xl text-pretty text-sm leading-relaxed text-white/80 sm:text-base">
              Curadoria humana, atendimento próximo e destinos que combinam com o seu momento. Nós cuidamos de tudo enquanto você aproveita cada detalhe.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/destinos"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Plane className="size-4" />
              Explorar destinos
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/sobre-nos"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Compass className="size-4" />
              Conheça a Evastur
            </Link>
            <Link
              href="/contato"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <CalendarCheck2 className="size-4" />
              Falar com especialista
            </Link>
          </div>

          {slides.length > 1 && (
            <div className="flex items-center gap-2 pt-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    active === index
                      ? "w-10 bg-white"
                      : "w-5 bg-white/40 hover:w-7 hover:bg-white/70"
                  }`}
                  aria-label={`Ver imagem ${index + 1}`}
                  aria-pressed={active === index}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-full max-w-xl lg:max-w-md">
          <QuoteForm />
        </div>
      </div>
    </section>
  );
}
