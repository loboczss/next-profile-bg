import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const images = await prisma.backgroundImage.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Erro ao listar backgrounds", error);
    return NextResponse.json({ error: "Erro ao listar backgrounds" }, { status: 500 });
  }
}
