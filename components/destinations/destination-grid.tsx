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
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
        Ainda não há destinos cadastrados. Assim que você adicionar um destino, ele aparecerá aqui.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
