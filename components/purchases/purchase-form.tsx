"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";
import { Check, Clock, Copy, Loader2, Minus, Plus, QrCode, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SerializedDestination } from "@/lib/destinations";
import { PAYMENT_METHOD_LABELS, paymentMethodValues, type PaymentMethodValue } from "@/lib/payments";
import type { SerializedPurchase } from "@/lib/purchases";
import { cn } from "@/lib/utils";

type PassengerForm = {
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
};

type PassengerError = Partial<Record<keyof PassengerForm, string | undefined>>;

function createEmptyPassenger(): PassengerForm {
  return {
    fullName: "",
    cpf: "",
    birthDate: "",
    phone: "",
    email: "",
  };
}

function createEmptyPassengerErrors(count: number): PassengerError[] {
  return Array.from({ length: count }, () => ({}));
}

interface PurchaseFormProps {
  destination: SerializedDestination;
}

export function PurchaseForm({ destination }: PurchaseFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [quantity, setQuantity] = useState(1);
  const [passengers, setPassengers] = useState<PassengerForm[]>(() => [createEmptyPassenger()]);
  const [passengerErrors, setPassengerErrors] = useState<PassengerError[]>(() => createEmptyPassengerErrors(1));
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>("CARTAO");
  const [pixKeyCopied, setPixKeyCopied] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const cover = destination.photos[0] ?? "/placeholder.jpg";
  const maxSeats = Math.max(destination.totalSeats, 1);

  const monthsUntilTravel = useMemo(() => {
    const travelDate = new Date(destination.startDate);
    const now = new Date();

    if (Number.isNaN(travelDate.getTime())) {
      return 1;
    }

    const monthsDiff =
      (travelDate.getFullYear() - now.getFullYear()) * 12 +
      (travelDate.getMonth() - now.getMonth()) +
      1;

    return Math.max(1, monthsDiff);
  }, [destination.startDate]);

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

  const paymentMethodDescriptions: Record<PaymentMethodValue, string> = {
    CARTAO: `Parcelamos em até ${monthsUntilTravel}x e confirmamos tudo pelo WhatsApp.`,
    PIX: "Receba a chave e o QR Code do Pix para pagar com rapidez e segurança.",
    BOLETO: `Boleto parcelado até o mês da viagem (até ${monthsUntilTravel}x) com acompanhamento pelo WhatsApp.`,
  };

  const renderPaymentGuidelines = () => {
    if (paymentMethod === "PIX") {
      return (
        <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-800 shadow-inner">
          <p className="font-semibold">Pagamento imediato via Pix</p>
          {destination.pixKey ? (
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                {destination.pixKey}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={handleCopyPixKey}
              >
                {pixKeyCopied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />} Copiar chave
              </Button>
            </div>
          ) : (
            <p className="text-xs text-emerald-700">A chave Pix será enviada pela equipe após finalizar a solicitação.</p>
          )}

          {destination.pixQrUrl ? (
            <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3 text-emerald-700">
              <QrCode className="size-10" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold">Escaneie o QR Code para pagar</p>
                <Image
                  src={destination.pixQrUrl}
                  alt="QR Code do Pix"
                  width={120}
                  height={120}
                  className="rounded-lg border border-emerald-100 bg-white object-contain p-2"
                />
              </div>
            </div>
          ) : null}

          <p className="text-xs text-emerald-700">
            Envie o comprovante pela área Minhas Compras para acelerarmos a emissão.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-800 shadow-inner">
        <p className="font-semibold">
          Parcelamento disponível em até {monthsUntilTravel}x (até o mês da viagem)
        </p>
        <p>
          As parcelas acompanham o calendário: conforme o mês da viagem se aproxima, a quantidade de parcelas disponíveis
          diminui. Um atendente entrará em contato pelo WhatsApp para combinar a melhor forma de pagamento e liberar o
          boleto ou link do cartão.
        </p>
        <p className="text-xs text-blue-700">
          Assim que recebermos o comprovante, o status ficará como “Aguardando emissão” para priorizar sua passagem.
        </p>
      </div>
    );
  };

  const buildLoginRedirect = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const query = params.toString();
    const callbackUrl = query ? `${pathname}?${query}` : pathname;
    return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  const syncPassengerLength = (nextQuantity: number) => {
    setPassengers((current) => {
      const updated = [...current];
      if (nextQuantity > updated.length) {
        while (updated.length < nextQuantity) {
          updated.push(createEmptyPassenger());
        }
      } else if (nextQuantity < updated.length) {
        updated.splice(nextQuantity);
      }
      return updated;
    });

    setPassengerErrors((current) => {
      const updated = [...current];
      if (nextQuantity > updated.length) {
        while (updated.length < nextQuantity) {
          updated.push({});
        }
      } else if (nextQuantity < updated.length) {
        updated.splice(nextQuantity);
      }
      return updated;
    });
  };

  const handleQuantityChange = (value: number) => {
    const safeValue = Number.isFinite(value) ? Math.min(Math.max(Math.round(value), 1), maxSeats) : 1;
    setQuantity(safeValue);
    syncPassengerLength(safeValue);
    setGeneralError(null);
  };

  const handleDecreaseQuantity = () => {
    handleQuantityChange(quantity - 1);
  };

  const handleIncreaseQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  const handleProceedToPassengers = () => {
    if (quantity < 1) {
      setGeneralError("Selecione ao menos uma vaga para continuar.");
      return;
    }

    setPassengerErrors(createEmptyPassengerErrors(quantity));
    setGeneralError(null);
    setStep(2);
  };

  const handleBackToQuantity = () => {
    setGeneralError(null);
    setStep(1);
  };

  const handlePassengerChange = <Field extends keyof PassengerForm>(
    index: number,
    field: Field,
    value: PassengerForm[Field]
  ) => {
    setPassengers((current) => {
      const updated = [...current];
      const passenger = { ...updated[index], [field]: value } as PassengerForm;
      updated[index] = passenger;
      return updated;
    });

    setPassengerErrors((current) => {
      const updated = [...current];
      const currentErrors = updated[index] ?? {};
      updated[index] = { ...currentErrors, [field]: undefined };
      return updated;
    });
  };

  const handleConfirm = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedPassengers = passengers.slice(0, quantity);
    const validationErrors = trimmedPassengers.map((passenger) => {
      const errors: PassengerError = {};

      if (!passenger.fullName.trim()) {
        errors.fullName = "Informe o nome completo.";
      }

      if (!passenger.cpf.trim()) {
        errors.cpf = "Informe o CPF.";
      }

      if (!passenger.birthDate) {
        errors.birthDate = "Informe a data de nascimento.";
      }

      if (!passenger.phone.trim()) {
        errors.phone = "Informe o telefone.";
      }

      if (!passenger.email.trim()) {
        errors.email = "Informe o e-mail.";
      }

      return errors;
    });

    setPassengerErrors(validationErrors);

    const hasErrors = validationErrors.some((errors) =>
      Object.values(errors).some((message) => Boolean(message && message.length > 0))
    );

    if (hasErrors) {
      setGeneralError("Revise os campos destacados antes de confirmar a compra.");
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destinationId: destination.id,
          quantity,
          passengers: trimmedPassengers.map((passenger) => ({
            fullName: passenger.fullName.trim(),
            cpf: passenger.cpf.trim(),
            birthDate: passenger.birthDate,
            phone: passenger.phone.trim(),
            email: passenger.email.trim(),
          })),
          paymentMethod,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { status?: string; message?: string; purchase?: SerializedPurchase }
        | null;

      if (response.status === 401) {
        toast.info("Entre na sua conta para finalizar a compra.");
        router.push(buildLoginRedirect());
        return;
      }

      if (!response.ok) {
        const message = data?.message ?? "Não foi possível concluir a compra.";
        setGeneralError(message);
        toast.error(message);
        return;
      }

      toast.success(data?.message ?? "Compra registrada com sucesso!");
      router.push("/minhas-compras");
      router.refresh();
    } catch (error) {
      console.error("Erro ao confirmar compra", error);
      const message = "Não foi possível concluir a compra. Tente novamente mais tarde.";
      setGeneralError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel: ComponentProps<typeof Button>["onClick"] = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/destinos");
  };

  const passengersLabel = quantity === 1 ? "1 passageiro" : `${quantity} passageiros`;

  const handleCopyPixKey = async () => {
    if (!destination.pixKey) return;

    try {
      await navigator.clipboard?.writeText(destination.pixKey);
      setPixKeyCopied(true);
      toast.success("Chave Pix copiada");
      setTimeout(() => setPixKeyCopied(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar chave Pix", error);
      toast.error("Não foi possível copiar a chave Pix agora.");
    }
  };

  useEffect(() => {
    setPixKeyCopied(false);
  }, [paymentMethod]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="relative h-56 w-full bg-slate-200 sm:h-64">
          <Image
            src={cover}
            alt={destination.name}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 896px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />
          <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between gap-3 text-white">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">Pacote selecionado</p>
              <h1 className="text-xl font-semibold leading-tight sm:text-2xl">{destination.name}</h1>
            </div>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow">
              {formattedPrice}
            </span>
          </div>
        </div>
      </div>

      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl">
        <header className="space-y-3 text-left">
          <h2 className="text-2xl font-bold text-slate-900">Confirmar compra</h2>
          <p className="text-sm text-slate-600">
            Revise os detalhes do pacote e informe os passageiros antes de confirmar a solicitação.
          </p>
        </header>

        <div className="space-y-4">
          {step === 1 ? (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
              <header className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Passo 1</p>
                <h3 className="text-base font-semibold text-slate-900">Quantas vagas deseja adquirir?</h3>
                <p className="text-sm text-slate-600">
                  Informe quantos passageiros participarão desta viagem. Você poderá cadastrar os dados na etapa seguinte.
                </p>
              </header>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-10 rounded-full"
                  onClick={handleDecreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="size-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={maxSeats}
                    value={quantity}
                    onChange={(event) => handleQuantityChange(Number(event.target.value))}
                    className="h-10 w-20 rounded-full text-center text-base font-semibold"
                  />
                  <span className="text-sm font-medium text-slate-600">vagas</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-10 rounded-full"
                  onClick={handleIncreaseQuantity}
                  disabled={quantity >= maxSeats}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <Users className="size-4 text-blue-500" /> Máximo de {maxSeats} {maxSeats === 1 ? "vaga" : "vagas"} disponível(is) neste
                pacote.
              </p>
            </section>
          ) : (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
              <header className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Passo 2</p>
                <h3 className="text-base font-semibold text-slate-900">Informações dos passageiros</h3>
                <p className="text-sm text-slate-600">
                  Preencha os dados de cada passageiro. Utilizaremos essas informações para emitir o pacote.
                </p>
              </header>
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {passengers.slice(0, quantity).map((passenger, index) => {
                  const errors = passengerErrors[index] ?? {};

                  return (
                    <div
                      key={index}
                      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-inner"
                    >
                      <p className="text-sm font-semibold text-slate-900">Passageiro {index + 1}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Nome completo
                          </label>
                          <Input
                            value={passenger.fullName}
                            onChange={(event) => handlePassengerChange(index, "fullName", event.target.value)}
                            placeholder="Ex.: Maria Fernanda Silva"
                          />
                          {errors.fullName ? (
                            <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>
                          ) : null}
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">CPF</label>
                          <Input
                            value={passenger.cpf}
                            onChange={(event) => handlePassengerChange(index, "cpf", event.target.value)}
                            placeholder="000.000.000-00"
                            inputMode="numeric"
                          />
                          {errors.cpf ? <p className="mt-1 text-xs text-rose-600">{errors.cpf}</p> : null}
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Data de nascimento
                          </label>
                          <Input
                            type="date"
                            value={passenger.birthDate}
                            onChange={(event) => handlePassengerChange(index, "birthDate", event.target.value)}
                          />
                          {errors.birthDate ? (
                            <p className="mt-1 text-xs text-rose-600">{errors.birthDate}</p>
                          ) : null}
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Telefone</label>
                          <Input
                            value={passenger.phone}
                            onChange={(event) => handlePassengerChange(index, "phone", event.target.value)}
                            placeholder="(00) 90000-0000"
                            inputMode="tel"
                          />
                          {errors.phone ? <p className="mt-1 text-xs text-rose-600">{errors.phone}</p> : null}
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">E-mail</label>
                          <Input
                            type="email"
                            value={passenger.email}
                            onChange={(event) => handlePassengerChange(index, "email", event.target.value)}
                            placeholder="nome@email.com"
                          />
                          {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email}</p> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
          <header className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Pagamento</p>
            <h3 className="text-base font-semibold text-slate-900">Como deseja pagar?</h3>
            <p className="text-sm text-slate-600">
              Escolha a opção que preferir para registrar sua reserva. Nossa equipe combinará o pagamento diretamente com você,
              sem redirecionamentos ou integrações bancárias.
            </p>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            {paymentMethodValues.map((method) => {
              const isSelected = paymentMethod === method;
              return (
                <button
                  key={method}
                  type="button"
                  className={cn(
                    "space-y-1 rounded-2xl border px-4 py-3 text-left transition",
                    isSelected
                      ? "border-blue-400 bg-white shadow-lg"
                      : "border-slate-200 bg-white/80 hover:border-blue-200 hover:bg-white"
                  )}
                  onClick={() => setPaymentMethod(method)}
                >
                  <p className="text-sm font-semibold text-slate-900">{PAYMENT_METHOD_LABELS[method]}</p>
                  <p className="text-xs text-slate-500">{paymentMethodDescriptions[method]}</p>
                </button>
              );
            })}
          </div>
          {renderPaymentGuidelines()}
        </section>

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
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{passengersLabel}</p>
        </div>

        {generalError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {generalError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          {step === 2 ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={handleBackToQuantity}
              disabled={isSubmitting}
            >
              Voltar
            </Button>
          ) : null}
          <Button
            type="button"
            className="rounded-full"
            onClick={step === 1 ? handleProceedToPassengers : handleConfirm}
            disabled={step === 1 ? false : isSubmitting}
          >
            {step === 1 ? (
              "Continuar"
            ) : isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Processando...
              </span>
            ) : (
              "Confirmar compra"
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}
