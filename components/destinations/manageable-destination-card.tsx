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
}

export function ManageableDestinationCard({
  destination,
  action,
  canFavorite = true,
  className,
}: ManageableDestinationCardProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    destinationDeleteInitialState
  );

  return (
    <div
      className={cn(
        "flex min-h-full min-w-[17rem] max-w-[23rem] flex-col gap-4",
        className
      )}
    >
      <DestinationCard
        destination={destination}
        fullHeight={false}
        canFavorite={canFavorite}
      />
      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-[28px] border border-red-500/30 bg-red-500/10 p-4 text-red-200 shadow-[0_20px_50px_-25px_rgba(239,68,68,0.45)] backdrop-blur-md transition hover:border-red-500/50 sm:flex-row sm:items-center sm:justify-between"
      >
        <input type="hidden" name="destinationId" value={destination.id} />
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={isPending}
          className="min-w-[160px] rounded-full bg-red-500 text-white shadow-lg shadow-red-500/40 transition hover:bg-red-400"
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
