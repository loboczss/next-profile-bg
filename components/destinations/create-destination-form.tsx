"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import {
  destinationFormInitialState,
  type DestinationFormState,
  type SerializedDestination,
} from "@/lib/destinations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BaseDestinationFormProps {
  action: (
    state: DestinationFormState,
    formData: FormData
  ) => Promise<DestinationFormState>;
  mode: "create" | "edit";
  destination?: SerializedDestination;
}

function SubmitButton({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className={cn(
        "inline-flex items-center gap-2 rounded-full",
        pending && "cursor-not-allowed opacity-80",
        className
      )}
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Salvando...
        </>
      ) : (
        label
      )}
    </Button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <p className="mt-1 text-xs font-medium text-rose-600">{errors[0]}</p>
  );
}

function formatDateForInput(date: string | null | undefined) {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function BaseDestinationForm({
  action,
  mode,
  destination,
}: BaseDestinationFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [state, formAction] = useActionState(action, destinationFormInitialState);

  const photoErrors = useMemo(() => state.errors?.photoFiles, [state.errors]);
  const shouldResetOnSuccess = mode === "create";

  const destinationDefaults = useMemo(() => {
    if (!destination) {
      return null;
    }

    return {
      name: destination.name,
      city: destination.city,
      departureLocation: destination.departureLocation,
      description: destination.description,
      price: destination.price.toString(),
      peopleCount: destination.peopleCount.toString(),
      totalSeats: destination.totalSeats.toString(),
      rating: destination.rating.toString(),
      startDate: formatDateForInput(destination.startDate),
      endDate: formatDateForInput(destination.endDate),
      photos: destination.photos.join("\n"),
    };
  }, [destination]);

  const submitLabel = mode === "edit" ? "Salvar alterações" : "Cadastrar destino";
  const badgeLabel = mode === "edit" ? "Editar destino" : "Novo destino";
  const titleLabel =
    mode === "edit" ? "Atualize as informações" : "Informações principais";
  const descriptionLabel =
    mode === "edit"
      ? "Revise ou altere os dados antes de salvar."
      : "Preencha os dados do pacote, incluindo local de saída, quantidade total de vagas e detalhes da experiência.";

  useEffect(() => {
    if (state.status === "success") {
      if (state.message) {
        toast.success(state.message);
      }

      if (shouldResetOnSuccess) {
        formRef.current?.reset();
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [shouldResetOnSuccess, state.message, state.status]);

  useEffect(() => {
    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state.status, state.message]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-xl backdrop-blur"
      encType="multipart/form-data"
    >
      {mode === "edit" && destination ? (
        <input type="hidden" name="destinationId" value={destination.id} />
      ) : null}
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
          {badgeLabel}
        </p>
        <h2 className="text-2xl font-bold text-slate-900">
          {titleLabel}
        </h2>
        <p className="text-sm text-slate-600">
          {descriptionLabel}
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-semibold text-slate-700">
            Nome do destino
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Ex.: Aventura em Bonito"
            required
            defaultValue={destinationDefaults?.name}
          />
          <FieldError errors={state.errors?.name} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="city" className="text-sm font-semibold text-slate-700">
            Cidade / Estado
          </label>
          <Input
            id="city"
            name="city"
            placeholder="Ex.: Bonito - MS"
            required
            defaultValue={destinationDefaults?.city}
          />
          <FieldError errors={state.errors?.city} />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label
            htmlFor="departureLocation"
            className="text-sm font-semibold text-slate-700"
          >
            Local de saída
          </label>
          <Input
            id="departureLocation"
            name="departureLocation"
            placeholder="Ex.: Aeroporto Internacional de Guarulhos"
            required
            defaultValue={destinationDefaults?.departureLocation}
          />
          <FieldError errors={state.errors?.departureLocation} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-semibold text-slate-700">
          Descrição completa
        </label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          placeholder="Detalhe a experiência, os diferenciais e o que está incluso no pacote."
          required
          defaultValue={destinationDefaults?.description}
        />
        <FieldError errors={state.errors?.description} />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <label htmlFor="price" className="text-sm font-semibold text-slate-700">
            Valor por pessoa (R$)
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={destinationDefaults?.price}
          />
          <FieldError errors={state.errors?.price} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="peopleCount" className="text-sm font-semibold text-slate-700">
            Pessoas por reserva
          </label>
          <Input
            id="peopleCount"
            name="peopleCount"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={destinationDefaults?.peopleCount}
          />
          <FieldError errors={state.errors?.peopleCount} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="totalSeats" className="text-sm font-semibold text-slate-700">
            Quantidade total de vagas
          </label>
          <Input
            id="totalSeats"
            name="totalSeats"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={destinationDefaults?.totalSeats}
          />
          <FieldError errors={state.errors?.totalSeats} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="rating" className="text-sm font-semibold text-slate-700">
            Avaliação (0 a 5)
          </label>
          <Input
            id="rating"
            name="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            required
            defaultValue={destinationDefaults?.rating}
          />
          <FieldError errors={state.errors?.rating} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="startDate" className="text-sm font-semibold text-slate-700">
            Data de ida
          </label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={destinationDefaults?.startDate}
          />
          <FieldError errors={state.errors?.startDate} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="endDate" className="text-sm font-semibold text-slate-700">
            Data de volta
          </label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            required
            defaultValue={destinationDefaults?.endDate}
          />
          <FieldError errors={state.errors?.endDate} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="photos" className="text-sm font-semibold text-slate-700">
            URLs de fotos adicionais
          </label>
          <Textarea
            id="photos"
            name="photos"
            rows={4}
            placeholder="Cole aqui URLs de imagens, separadas por linha ou vírgula."
            defaultValue={destinationDefaults?.photos}
          />
          <FieldError errors={state.errors?.photos} />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Envie fotos para a galeria
          </span>
          <label
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center text-sm text-slate-500 transition hover:border-slate-400 hover:bg-slate-50"
          >
            <UploadCloud className="size-6 text-slate-400" />
            <span className="font-medium text-slate-600">
              Clique para selecionar ou arraste os arquivos
            </span>
            <span className="text-xs text-slate-400">PNG, JPG ou WEBP</span>
            <Input
              ref={fileInputRef}
              id="photoFiles"
              name="photoFiles"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
            />
          </label>
          {photoErrors && photoErrors.length > 0 ? (
            <ul className="space-y-1 text-xs text-rose-600">
              {photoErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {state.status === "success" && state.message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {state.message}
        </p>
      ) : null}

      {state.status === "error" && state.message ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

interface CreateDestinationFormProps {
  action: (
    state: DestinationFormState,
    formData: FormData
  ) => Promise<DestinationFormState>;
}

export function CreateDestinationForm({ action }: CreateDestinationFormProps) {
  return <BaseDestinationForm action={action} mode="create" />;
}

interface EditDestinationFormProps {
  action: (
    state: DestinationFormState,
    formData: FormData
  ) => Promise<DestinationFormState>;
  destination: SerializedDestination;
}

export function EditDestinationForm({
  action,
  destination,
}: EditDestinationFormProps) {
  return (
    <BaseDestinationForm
      action={action}
      mode="edit"
      destination={destination}
    />
  );
}
