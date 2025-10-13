"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { Clock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const cover = destination.photos[0] ?? "/placeholder.jpg";

  const formattedPrice = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(destination.price),
    [destination.price]
  );

  const shortDescription = useMemo(() => {
    const text = destination.description.trim();
    if (text.length <= 160) {
      return text;
    }
    return `${text.slice(0, 157).trimEnd()}…`;
  }, [destination.description]);

  const buildLoginRedirect = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const query = params.toString();
    const callbackUrl = query ? `${pathname}?${query}` : pathname;
    return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  const handleTriggerClick: ComponentProps<typeof Button>["onClick"] = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  };

  const handleConfirm = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ destinationId: destination.id }),
      });

      const data = (await response.json().catch(() => null)) as
        | { status?: string; message?: string }
        | null;

      if (response.status === 401) {
        toast.info("Entre na sua conta para finalizar a compra.");
        setOpen(false);
        router.push(buildLoginRedirect());
        return;
      }

      if (!response.ok) {
        toast.error(data?.message ?? "Não foi possível concluir a compra.");
        return;
      }

      toast.success(data?.message ?? "Compra registrada com sucesso!");
      setOpen(false);
      router.push("/minhas-compras");
      router.refresh();
    } catch (error) {
      console.error("Erro ao confirmar compra", error);
      toast.error("Não foi possível concluir a compra. Tente novamente mais tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={cn(
            "rounded-full font-semibold shadow-sm transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            className
          )}
          onClick={handleTriggerClick}
        >
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[min(100vw-2rem,560px)] rounded-3xl border border-slate-200 bg-white/95 p-0 shadow-2xl backdrop-blur" showCloseButton={false}>
        <div className="overflow-hidden rounded-t-3xl">
          <div className="relative h-48 w-full bg-slate-200 sm:h-56">
            <Image src={cover} alt={destination.name} fill className="object-cover" sizes="(min-width: 768px) 560px, 100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-white">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">Pacote selecionado</p>
                <h2 className="text-lg font-semibold leading-tight sm:text-xl">{destination.name}</h2>
              </div>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow">{formattedPrice}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 pb-6 pt-5">
          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="text-xl font-bold text-slate-900">Confirmar compra</DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Revise os detalhes do pacote antes de confirmar a solicitação. Nossa equipe entrará em contato para finalizar a emissão.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Resumo do pacote</p>
            <p className="mt-2 text-sm text-slate-600">{shortDescription}</p>
            <div className="mt-4 grid gap-2 text-xs font-medium text-slate-500 sm:grid-cols-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm">
                <ShieldCheck className="size-4 text-emerald-500" />
                Cancelamento gratuito até 7 dias após a compra
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm">
                <Clock className="size-4 text-blue-500" />
                Status inicial: aguardando emissão
              </span>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="rounded-full"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Processando...
                </span>
              ) : (
                "Confirmar compra"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

