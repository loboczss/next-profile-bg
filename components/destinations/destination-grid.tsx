import { Film, Sparkles } from "lucide-react";

import type {
  DestinationDeleteAction,
  SerializedDestination,
} from "@/lib/destinations";

import { DestinationCarousel } from "./destination-carousel";

interface DestinationGridProps {
  destinations: SerializedDestination[];
  onDelete?: DestinationDeleteAction;
  canFavorite?: boolean;
}

export function DestinationGrid({
  destinations,
  onDelete,
  canFavorite = true,
}: DestinationGridProps) {
  if (destinations.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-[36px] border border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-12 text-center text-slate-100 shadow-[0_35px_90px_-45px_rgba(14,165,233,0.65)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.35),transparent_55%)]" />
        <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4">
          <span className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-300">
            <Sparkles className="size-4 text-sky-300" />
            Coleção vazia
          </span>
          <h3 className="text-3xl font-semibold text-white sm:text-4xl">Crie o primeiro grande lançamento</h3>
          <p className="text-sm text-slate-300">
            Cadastre um destino no dashboard para liberar o carrossel cinematográfico da Evastur e inspirar novos viajantes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-slate-500">
          <Film className="size-5 text-sky-400" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
              Seleção Evastur
            </p>
            <p className="text-base font-medium text-slate-500">
              Experiências em destaque prontas para maratonar
            </p>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
          {destinations.length} {destinations.length === 1 ? "destino" : "destinos"}
        </span>
      </div>
      <DestinationCarousel
        destinations={destinations}
        onDelete={onDelete}
        canFavorite={canFavorite}
      />
    </div>
  );
}
