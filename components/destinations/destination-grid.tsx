import type {
  DestinationActionResult,
  SerializedDestination,
} from "@/lib/destinations";

import { DestinationCard } from "./destination-card";

interface DestinationGridProps {
  destinations: SerializedDestination[];
  deleteDestinationAction?: (id: number) => Promise<DestinationActionResult>;
  currentUserId?: number | null;
}

export function DestinationGrid({
  destinations,
  deleteDestinationAction,
  currentUserId,
}: DestinationGridProps) {
  if (destinations.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
        Ainda não há destinos cadastrados. Assim que você adicionar um destino, ele aparecerá aqui.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {destinations.map((destination) => (
        <DestinationCard
          key={destination.id}
          destination={destination}
          onDelete={
            deleteDestinationAction &&
            currentUserId === destination.userId
              ? deleteDestinationAction.bind(null, destination.id)
              : undefined
          }
        />
      ))}
    </div>
  );
}
