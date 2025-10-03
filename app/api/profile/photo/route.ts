import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storeProfileImage } from "@/lib/storage";
import { UploadLogEntry } from "@/types/upload";
import { assertImage, sanitizeExt } from "@/lib/file";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  try {
    assertImage(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Arquivo inválido";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const ext = sanitizeExt(file.type);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  let logs: UploadLogEntry[] = [];

  try {
    const result = await storeProfileImage(session.user.id, ext, buffer);
    logs = result.logs;

    logs.push({
      level: "info",
      message: "Atualizando foto de perfil no banco de dados...",
      timestamp: new Date().toISOString(),
    });

    const updated = await prisma.user.update({
      where: { id: Number(session.user.id) },
      data: { imageUrl: result.imageUrl },
      select: { imageUrl: true },
    });

    logs.push({
      level: "success",
      message: "Foto de perfil atualizada com sucesso.",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ imageUrl: updated.imageUrl, logs });
  } catch (error) {
    console.error("Erro ao atualizar foto de perfil", error);
    logs.push({
      level: "error",
      message: "Falha ao atualizar a foto de perfil. Tente novamente.",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ error: "Erro ao enviar arquivo", logs }, { status: 500 });
  }
}
