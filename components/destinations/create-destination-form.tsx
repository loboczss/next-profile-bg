"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DestinationFormState,
  destinationFormInitialState,
} from "@/lib/destinations";

interface CreateDestinationFormProps {
  action: (
    state: DestinationFormState,
    formData: FormData
  ) => Promise<DestinationFormState>;
}

export function CreateDestinationForm({ action }: CreateDestinationFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(action, destinationFormInitialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  const getError = (field: string) => state.errors?.[field] ?? [];

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">
          Cadastre um novo destino
        </h2>
        <p className="text-sm text-slate-600">
          Preencha todos os campos para disponibilizar um novo destino aos seus clientes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Nome do destino
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Ex.: Praia dos Sonhos"
            aria-invalid={getError("name").length > 0}
            required
          />
          {getError("name").map((message) => (
            <p key={message} className="text-xs text-red-600">
              {message}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="city" className="text-sm font-medium text-slate-700">
            Cidade do destino
          </label>
          <Input
            id="city"
            name="city"
            placeholder="Ex.: Fortaleza - CE"
            aria-invalid={getError("city").length > 0}
            required
          />
          {getError("city").map((message) => (
            <p key={message} className="text-xs text-red-600">
              {message}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium text-slate-700">
            Valor por pessoa (R$)
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex.: 1999.90"
            aria-invalid={getError("price").length > 0}
            required
          />
          {getError("price").map((message) => (
            <p key={message} className="text-xs text-red-600">
              {message}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="peopleCount"
            className="text-sm font-medium text-slate-700"
          >
            Quantidade de pessoas
          </label>
          <Input
            id="peopleCount"
            name="peopleCount"
            type="number"
            min="1"
            step="1"
            placeholder="Ex.: 4"
            aria-invalid={getError("peopleCount").length > 0}
            required
          />
          {getError("peopleCount").map((message) => (
            <p key={message} className="text-xs text-red-600">
              {message}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="startDate" className="text-sm font-medium text-slate-700">
            Data de ida
          </label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            aria-invalid={getError("startDate").length > 0}
            required
          />
          {getError("startDate").map((message) => (
            <p key={message} className="text-xs text-red-600">
              {message}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="endDate" className="text-sm font-medium text-slate-700">
            Data de volta
          </label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            aria-invalid={getError("endDate").length > 0}
            required
          />
          {getError("endDate").map((message) => (
            <p key={message} className="text-xs text-red-600">
              {message}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="rating" className="text-sm font-medium text-slate-700">
            Nota do destino (0 a 5)
          </label>
          <Input
            id="rating"
            name="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            placeholder="Ex.: 4.8"
            aria-invalid={getError("rating").length > 0}
            required
          />
          {getError("rating").map((message) => (
            <p key={message} className="text-xs text-red-600">
              {message}
            </p>
          ))}
        </div>

        <div className="md:col-span-2 space-y-2">
          <label
            htmlFor="description"
            className="text-sm font-medium text-slate-700"
          >
            Descrição completa
          </label>
          <Textarea
            id="description"
            name="description"
            placeholder="Conte todos os diferenciais, experiências e detalhes deste destino."
            aria-invalid={getError("description").length > 0}
            required
          />
          {getError("description").map((message) => (
            <p key={message} className="text-xs text-red-600">
              {message}
            </p>
          ))}
        </div>

        <div className="md:col-span-2 space-y-2">
          <label htmlFor="photos" className="text-sm font-medium text-slate-700">
            URLs das fotos (uma por linha)
          </label>
          <Textarea
            id="photos"
            name="photos"
            placeholder={"https://exemplo.com/foto-1.jpg\nhttps://exemplo.com/foto-2.jpg"}
            aria-invalid={getError("photos").length > 0}
            required
          />
          {getError("photos").map((message) => (
            <p key={message} className="text-xs text-red-600">
              {message}
            </p>
          ))}
        </div>
      </div>

      {state.message && (
        <div
          className={
            state.status === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
          role="status"
        >
          {state.message}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" className="min-w-[160px]">
          Salvar destino
        </Button>
      </div>
    </form>
  );
}
