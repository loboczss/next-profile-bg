"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { SerializedDestination } from "@/lib/destinations";
import { cn } from "@/lib/utils";

type ButtonVariant = ComponentProps<typeof Button>["variant"];
type ButtonSize = ComponentProps<typeof Button>["size"];

interface PurchaseButtonProps {
  destination: SerializedDestination;
  label?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function PurchaseButton({
  destination,
  label = "Comprar",
  variant = "default",
  size = "lg",
  className,
}: PurchaseButtonProps) {
  const router = useRouter();

  const handleClick: ComponentProps<typeof Button>["onClick"] = (event) => {
    event.preventDefault();
    event.stopPropagation();

    router.push(`/destinos/${destination.id}/comprar`);
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        "rounded-full font-semibold shadow-sm transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className
      )}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}
