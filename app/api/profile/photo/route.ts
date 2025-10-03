import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storeProfileImage } from "@/lib/storage";
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
  try {
    const imageUrl = await storeProfileImage(session.user.id, ext, buffer);

    const updated = await prisma.user.update({
      where: { id: Number(session.user.id) },
      data: { imageUrl },
      select: { imageUrl: true },
    });

    return NextResponse.json({ imageUrl: updated.imageUrl });
  } catch (error) {
    console.error("Erro ao atualizar foto de perfil", error);
    return NextResponse.json({ error: "Erro ao enviar arquivo" }, { status: 500 });
  }
}
