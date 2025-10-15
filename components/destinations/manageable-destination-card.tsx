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
  className?: string;
  cardClassName?: string;
  isActive?: boolean;
}

export function ManageableDestinationCard({
  destination,
  action,
  canFavorite = true,
  className,
  cardClassName,
  isActive = false,
}: ManageableDestinationCardProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    destinationDeleteInitialState
  );

  return (
    <div className={cn("flex h-full flex-col gap-4", className)}>
      <DestinationCard
        destination={destination}
        fullHeight={false}
        canFavorite={canFavorite}
        className={cn("flex-1", cardClassName)}
        isActive={isActive}
      />
      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-red-100 shadow-inner transition hover:border-red-400/50 sm:flex-row sm:items-center sm:justify-between"
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
              state.status === "error" ? "text-red-200" : "text-emerald-200"
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
