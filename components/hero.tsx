"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

type HeroProps = {
  images: string[];
  userName?: string | null;
};

export default function Hero({ images, userName }: HeroProps) {
  const slides = useMemo(
    () => (images?.length ? images.slice(0, 6) : []),
    [images],
  );

  const [active, setActive] = useState(0);

  // auto-rotate a cada 5.5s
  useEffect(() => {
    if (!slides.length) return;
    const t = setInterval(
      () => setActive((p) => (p + 1) % slides.length),
      5500,
    );
    return () => clearInterval(t);
  }, [slides]);

  return (
    <section className="relative isolate min-h-[86dvh] overflow-clip rounded-b-[2.5rem] border-b border-white/10 bg-black/60">
      {/* Slides como camadas */}
      <div className="absolute inset-0 -z-10">
        {slides.map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-[1500ms] ease-out",
              active === idx ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={active !== idx}
          >
            {/* Next/Image como background cover */}
            <Image
              src={src}
              alt="Paisagem de destino"
              fill
              priority={idx === 0}
              className="object-cover"
            />
            {/* máscara de gradiente para legibilidade */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/35 to-black/70" />
            {/* brilhos sutis */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,255,255,0.25),transparent)] mix-blend-overlay opacity-20" />
          </div>
        ))}
      </div>

      {/* Partículas simples (decorativo) */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]">
        <div className="absolute left-1/2 top-1/3 size-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      </div>

      {/* Conteúdo */}
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-20 sm:py-24 lg:gap-10">
        {/* Badge/label */}
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs text-white/90 backdrop-blur">
          <Sparkles className="size-3.5" />
          <span>Agência boutique • experiências sob medida</span>
        </div>

        {/* Headline */}
        <div className="max-w-3xl">
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white drop-shadow md:text-6xl">
            Descubra o mundo com a{" "}
            <span className="bg-gradient-to-r from-primary via-primary/90 to-white/90 bg-clip-text text-transparent">
              Evastur
            </span>
            : viagens premium, memórias eternas.
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base text-white/80 md:text-lg">
            {userName ? (
              <>
                {userName.split(" ")[0]}, planejamos sua próxima jornada com
                curadoria, conforto e autenticidade — do primeiro clique ao
                último pôr do sol.
              </>
            ) : (
              <>
                Do primeiro clique ao último pôr do sol: roteiros exclusivos,
                hotéis selecionados a dedo e suporte 24/7.
              </>
            )}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/destinos"
            className={cn(
              "group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-6 py-3 text-sm font-medium text-white backdrop-blur transition-all duration-300",
              "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/30",
            )}
          >
            <Plane className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            Explorar destinos
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/sobre-nos"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
          >
            <Compass className="size-4" />
            Conheça a Evastur
          </Link>

          <Link
            href="/contato"
            className="group inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/15 px-5 py-3 text-sm font-medium text-emerald-50 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-400/25"
          >
            <CalendarCheck2 className="size-4" />
            Montar roteiro
          </Link>
        </div>

        {/* Chips/benefícios */}
        <ul className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/85">
          <li className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
            <Ticket className="size-3.5" />
            Tarifas negociadas
          </li>
          <li className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
            <MapPin className="size-3.5" />
            Curadoria local autêntica
          </li>
          <li className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
            <Plane className="size-3.5" />
            Suporte ponta a ponta
          </li>
        </ul>

        {/* Bullets/indicadores do carrossel */}
        {slides.length > 1 && (
          <div className="mt-2 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setActive(i)}
                className={cn(
                  "h-1.5 w-6 rounded-full transition-all duration-500",
                  active === i
                    ? "bg-primary/90"
                    : "bg-white/40 hover:bg-white/60",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
