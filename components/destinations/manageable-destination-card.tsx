"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  destinationDeleteInitialState,
  type DestinationDeleteAction,
  type SerializedDestination,
} from "@/lib/destinations";
import { cn } from "@/lib/utils";

import { DestinationCard } from "./destination-card";

interface ManageableDestinationCardProps {
  destination: SerializedDestination;
  action: DestinationDeleteAction;
  canFavorite?: boolean;
}

export function ManageableDestinationCard({
  destination,
  action,
  canFavorite = true,
}: ManageableDestinationCardProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    destinationDeleteInitialState
  );

  return (
    <div className="space-y-4">
      <DestinationCard
        destination={destination}
        fullHeight={false}
        canFavorite={canFavorite}
      />
      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-2xl border border-red-100/60 bg-white/80 p-4 shadow-md transition-colors hover:border-red-200 sm:flex-row sm:items-center sm:justify-between"
      >
        <input type="hidden" name="destinationId" value={destination.id} />
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={isPending}
          className="min-w-[160px] rounded-full"
        >
          {isPending ? "Excluindo..." : "Excluir destino"}
        </Button>
        {state.status !== "idle" && state.message ? (
          <p
            className={cn(
              "text-sm font-medium",
              state.status === "error" ? "text-red-600" : "text-emerald-600"
            )}
            role="status"
            aria-live="polite"
          >
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
