import type { Destination } from "@prisma/client";
import { z } from "zod";

const photoUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (!value) {
        return false;
      }

      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return value.startsWith("/");
      }
    },
    {
      message:
        "Informe URLs completas (http/https) ou caminhos relativos gerados pelo sistema.",
    },
  );

export const destinationFormSchema = z
  .object({
    name: z.string().min(1, "O nome do destino é obrigatório.").trim(),
    city: z.string().min(1, "A cidade do destino é obrigatória.").trim(),
    departureLocation: z
      .string()
      .min(1, "Informe o local de saída do destino.")
      .trim(),
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
    totalSeats: z
      .coerce
      .number({ invalid_type_error: "Informe a quantidade total de vagas." })
      .int("A quantidade total de vagas deve ser um número inteiro.")
      .min(1, "Informe pelo menos uma vaga disponível."),
    startDate: z.coerce.date({ invalid_type_error: "Data de ida inválida." }),
    endDate: z.coerce.date({ invalid_type_error: "Data de volta inválida." }),
    rating: z
      .coerce
      .number({ invalid_type_error: "Informe uma nota válida." })
      .min(0, "A nota mínima é 0.")
      .max(5, "A nota máxima é 5."),
    photos: z.array(photoUrlSchema).min(
      1,
      "Envie pelo menos uma foto ou informe uma URL válida.",
    ),
    pixKey: z
      .string()
      .trim()
      .max(255, "A chave Pix deve ter até 255 caracteres.")
      .optional()
      .transform((value) => (value ? value : undefined)),
    pixQrUrl: photoUrlSchema.optional(),
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
  departureLocation: string;
  description: string;
  price: number;
  peopleCount: number;
  totalSeats: number;
  startDate: string;
  endDate: string;
  rating: number;
  photos: string[];
  pixKey?: string | null;
  pixQrUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  favoriteCreatedAt?: string | null;
};

export function serializeDestination(
  destination: Destination
): SerializedDestination {
  return {
    id: destination.id,
    name: destination.name,
    city: destination.city,
    departureLocation: destination.departureLocation,
    description: destination.description,
    price: Number(destination.price),
    peopleCount: destination.peopleCount,
    totalSeats: destination.totalSeats,
    startDate: destination.startDate.toISOString(),
    endDate: destination.endDate.toISOString(),
    rating: destination.rating,
    photos: destination.photos,
    pixKey: destination.pixKey,
    pixQrUrl: destination.pixQrUrl,
    createdAt: destination.createdAt.toISOString(),
    updatedAt: destination.updatedAt.toISOString(),
  };
}
