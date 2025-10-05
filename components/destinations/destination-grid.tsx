import { Compass } from "lucide-react";

import type {
  DestinationDeleteAction,
  SerializedDestination,
} from "@/lib/destinations";

import { DestinationCard } from "./destination-card";
import { ManageableDestinationCard } from "./manageable-destination-card";

interface DestinationGridProps {
  destinations: SerializedDestination[];
  onDelete?: DestinationDeleteAction;
}

export function DestinationGrid({ destinations, onDelete }: DestinationGridProps) {
  if (destinations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white/80 p-12 text-center shadow-lg">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-blue-600 shadow-inner">
          <Compass className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-slate-900">
            Nenhum destino cadastrado ainda
          </p>
          <p className="text-sm text-slate-600">
            Cadastre novas experiências pelo dashboard para montar uma vitrine encantadora por aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
      {destinations.map((destination) =>
        onDelete ? (
          <ManageableDestinationCard
            key={destination.id}
            destination={destination}
            action={onDelete}
          />
        ) : (
          <DestinationCard key={destination.id} destination={destination} />
        )
      )}
    </div>
  );
}
