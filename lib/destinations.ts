import type { Destination } from "@prisma/client";
import { z } from "zod";

export const destinationFormSchema = z
  .object({
    name: z.string().min(1, "O nome do destino é obrigatório.").trim(),
    city: z.string().min(1, "A cidade do destino é obrigatória.").trim(),
    description: z
      .string()
      .min(1, "A descrição do destino é obrigatória.")
      .trim(),
    price: z
      .coerce
      .number({ invalid_type_error: "Informe um valor válido." })
      .min(0, "O valor deve ser maior ou igual a 0."),
    peopleCount: z
      .coerce
      .number({ invalid_type_error: "Informe a quantidade de pessoas." })
      .int("A quantidade de pessoas deve ser um número inteiro.")
      .min(1, "A quantidade mínima é 1."),
    startDate: z.coerce.date({ invalid_type_error: "Data de ida inválida." }),
    endDate: z.coerce.date({ invalid_type_error: "Data de volta inválida." }),
    rating: z
      .coerce
      .number({ invalid_type_error: "Informe uma nota válida." })
      .min(0, "A nota mínima é 0.")
      .max(5, "A nota máxima é 5."),
    photos: z
      .array(z.string().url("Informe URLs válidas para as fotos."))
      .min(1, "Envie pelo menos uma foto ou informe uma URL válida."),
  })
  .refine(
    (data) => data.endDate >= data.startDate,
    {
      path: ["endDate"],
      message: "A data de volta deve ser posterior ou igual à data de ida.",
    }
  );

export type DestinationFormInput = z.infer<typeof destinationFormSchema>;

export type DestinationFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[]>;
};

export const destinationFormInitialState: DestinationFormState = {
  status: "idle",
};

export type DestinationDeleteState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const destinationDeleteInitialState: DestinationDeleteState = {
  status: "idle",
};

export type DestinationDeleteAction = (
  state: DestinationDeleteState,
  formData: FormData
) => Promise<DestinationDeleteState>;

export type SerializedDestination = {
  id: number;
  name: string;
  city: string;
  description: string;
  price: number;
  peopleCount: number;
  startDate: string;
  endDate: string;
  rating: number;
  photos: string[];
  createdAt: string;
  updatedAt: string;
};

export function serializeDestination(
  destination: Destination
): SerializedDestination {
  return {
    id: destination.id,
    name: destination.name,
    city: destination.city,
    description: destination.description,
    price: Number(destination.price),
    peopleCount: destination.peopleCount,
    startDate: destination.startDate.toISOString(),
    endDate: destination.endDate.toISOString(),
    rating: destination.rating,
    photos: destination.photos,
    createdAt: destination.createdAt.toISOString(),
    updatedAt: destination.updatedAt.toISOString(),
  };
}
