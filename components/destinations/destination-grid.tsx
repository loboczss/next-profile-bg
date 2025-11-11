import type {
  DestinationDeleteAction,
  SerializedDestination,
} from "@/lib/destinations";

import { DestinationCarousel } from "./destination-carousel";

interface DestinationGridProps {
  destinations: SerializedDestination[];
  canFavorite?: boolean;
  onFavoriteChange?: (destinationId: number, isFavorite: boolean) => void;
  onDelete?: DestinationDeleteAction;
  className?: string;
}

export function DestinationGrid({
  destinations,
  canFavorite,
  onFavoriteChange,
  onDelete,
  className,
}: DestinationGridProps) {
  return (
    <DestinationCarousel
      destinations={destinations}
      canFavorite={canFavorite}
      onFavoriteChange={onFavoriteChange}
      onDelete={onDelete}
      className={className}
    />
  );
}