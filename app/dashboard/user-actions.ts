"use server";

import { revalidatePath } from "next/cache";
import { AdminActivityAction, Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { hashPassword } from "@/lib/hash";
import { prisma } from "@/lib/prisma";

// Schema base para validação e reaproveitamento nos formulários de criação/edição.
const baseUserSchema = z.object({
  fullName: z
    .string({ required_error: "Informe o nome completo" })
    .trim()
    .min(3, "O nome deve ter ao menos 3 caracteres")
    .max(120, "O nome deve ter até 120 caracteres"),
  username: z
    .string({ required_error: "Informe o usuário" })
    .trim()
    .min(3, "O usuário deve ter ao menos 3 caracteres")
    .max(40, "O usuário deve ter até 40 caracteres"),
  email: z
    .string({ required_error: "Informe o e-mail" })
    .trim()
    .email("Informe um e-mail válido")
    .max(180, "O e-mail deve ter até 180 caracteres"),
  role: z.enum(["admin", "editor", "viewer", "user"], {
    required_error: "Selecione um perfil",
  }),
  imageUrl: z
    .string()
    .url("Informe uma URL válida")
    .max(500, "A URL deve ter até 500 caracteres")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
});

// Schema específico para criação, exigindo a definição da senha.
const createUserSchema = baseUserSchema.extend({
  password: z
    .string({ required_error: "Informe uma senha" })
    .min(8, "A senha deve ter ao menos 8 caracteres")
    .max(100, "A senha deve ter até 100 caracteres"),
});

// Schema específico para atualização, permitindo senha opcional.
const updateUserSchema = baseUserSchema.extend({
  id: z.number().int().positive(),
  password: z
    .string()
    .min(8, "A senha deve ter ao menos 8 caracteres")
    .max(100, "A senha deve ter até 100 caracteres")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
});

// Estrutura de retorno padronizada para os formulários do painel.
export type ActionState =
  | { status: "success"; message: string; data?: Record<string, unknown> }
  | { status: "error"; message: string; errors?: Record<string, string[]> };

async function ensureAdminSession() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Acesso restrito a administradores");
  }

  return session;
}

async function registerActivity(
  action: AdminActivityAction,
  message: string,
  subjectId: number | null,
  metadata: Record<string, unknown> | null = null,
) {
  try {
    const session = await auth();
    const actorId = session?.user?.id ? Number(session.user.id) : null;

    await prisma.adminActivityLog.create({
      data: {
        action,
        message,
        metadata,
        actorId,
        subjectId,
      },
    });
  } catch (error) {
    console.error("Não foi possível registrar a atividade administrativa", error);
  }
}

export async function createUserAction(input: z.infer<typeof createUserSchema>): Promise<ActionState> {
  await ensureAdminSession();

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Revise os campos destacados.",
      errors,
    };
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);

    const user = await prisma.user.create({
      data: {
        username: parsed.data.username,
        fullName: parsed.data.fullName,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        passwordHash,
        imageUrl: parsed.data.imageUrl,
      },
    });

    await registerActivity(
      AdminActivityAction.USER_CREATED,
      `Usuário ${user.fullName} criado`,
      user.id,
      { role: user.role },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta?.target as string[])
        : [];
      const errors: Record<string, string[]> = {};

      if (target.includes("User_username_key")) {
        errors.username = ["O usuário informado já está em uso."];
      }
      if (target.includes("User_email_key")) {
        errors.email = ["O e-mail informado já está em uso."];
      }

      return {
        status: "error",
        message: "Já existe um usuário com os dados informados.",
        errors,
      };
    }

    console.error("Erro ao criar usuário", error);
    return {
      status: "error",
      message: "Não foi possível criar o usuário agora.",
    };
  }

  revalidatePath("/dashboard");
  return { status: "success", message: "Usuário criado com sucesso!" };
}

export async function updateUserAction(input: z.infer<typeof updateUserSchema>): Promise<ActionState> {
  await ensureAdminSession();

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Revise os campos destacados.",
      errors,
    };
  }

  const { id, password, ...data } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return {
        status: "error",
        message: "Usuário não encontrado.",
      };
    }

    const updateData: Prisma.UserUpdateInput = {
      username: data.username,
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      role: data.role,
      imageUrl: data.imageUrl,
    };

    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const hasRoleChanged = existing.role !== user.role;

    await registerActivity(
      hasRoleChanged
        ? AdminActivityAction.USER_ROLE_UPDATED
        : AdminActivityAction.USER_UPDATED,
      `Usuário ${user.fullName} atualizado`,
      user.id,
      {
        previousRole: existing.role,
        newRole: user.role,
        updatedFields: Object.keys(updateData),
      },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta?.target as string[])
        : [];
      const errors: Record<string, string[]> = {};

      if (target.includes("User_username_key")) {
        errors.username = ["O usuário informado já está em uso."];
      }
      if (target.includes("User_email_key")) {
        errors.email = ["O e-mail informado já está em uso."];
      }

      return {
        status: "error",
        message: "Já existe um usuário com os dados informados.",
        errors,
      };
    }

    console.error("Erro ao atualizar usuário", error);
    return {
      status: "error",
      message: "Não foi possível atualizar o usuário agora.",
    };
  }

  revalidatePath("/dashboard");
  return { status: "success", message: "Usuário atualizado com sucesso!" };
}

export async function deleteUserAction(id: number): Promise<ActionState> {
  const session = await ensureAdminSession();

  if (Number(session.user.id) === id) {
    return {
      status: "error",
      message: "Você não pode remover o próprio usuário logado.",
    };
  }

  try {
    const user = await prisma.user.delete({ where: { id } });

    await registerActivity(
      AdminActivityAction.USER_DELETED,
      `Usuário ${user.fullName} removido`,
      user.id,
      { role: user.role },
    );
  } catch (error) {
    console.error("Erro ao remover usuário", error);
    return {
      status: "error",
      message: "Não foi possível remover o usuário agora.",
    };
  }

  revalidatePath("/dashboard");
  return { status: "success", message: "Usuário removido com sucesso." };
}

export async function resetUserPasswordAction(id: number): Promise<ActionState> {
  await ensureAdminSession();

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return {
        status: "error",
        message: "Usuário não encontrado.",
      };
    }

    const newPassword = `eva-${Math.random().toString(36).slice(-8)}`;

    await prisma.user.update({
      where: { id },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    await registerActivity(
      AdminActivityAction.PASSWORD_RESET,
      `Senha redefinida para ${user.fullName}`,
      user.id,
      { username: user.username },
    );

    revalidatePath("/dashboard");
    return {
      status: "success",
      message: "Senha redefinida com sucesso.",
      data: { password: newPassword },
    };
  } catch (error) {
    console.error("Erro ao redefinir senha do usuário", error);
    return {
      status: "error",
      message: "Não foi possível redefinir a senha agora.",
    };
  }
}
