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
}

export function ManageableDestinationCard({
  destination,
  action,
}: ManageableDestinationCardProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    destinationDeleteInitialState
  );

  return (
    <div className="space-y-3">
      <DestinationCard destination={destination} />
      <form
        action={formAction}
        className="flex flex-col gap-2 rounded-lg border border-dashed border-slate-200 bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <input type="hidden" name="destinationId" value={destination.id} />
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={isPending}
          className="min-w-[140px]"
        >
          {isPending ? "Excluindo..." : "Excluir destino"}
        </Button>
        {state.status !== "idle" && state.message ? (
          <p
            className={cn(
              "text-sm",
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
