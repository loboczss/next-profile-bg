import { NextResponse } from "next/server";

import { decodeDropboxPath, downloadFile, getDropboxErrorStatus } from "@/lib/dropbox";

const appName = process.env.APP_NAME ?? "next-profile-bg";
const allowedPrefix = `/apps/${appName}/`;

export const runtime = "nodejs";

function inferContentType(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) {
    return "image/png";
  }
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lower.endsWith(".webp")) {
    return "image/webp";
  }
  return "application/octet-stream";
}

function buildCacheHeaders() {
  return {
    "Cache-Control": "public, max-age=31536000, immutable",
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const encodedPath = url.searchParams.get("path");

  if (!encodedPath) {
    return NextResponse.json(
      { error: "Parâmetro 'path' é obrigatório." },
      { status: 400 },
    );
  }

  let dropboxPath: string;
  try {
    dropboxPath = decodeDropboxPath(encodedPath);
  } catch {
    return NextResponse.json(
      { error: "Parâmetro 'path' inválido." },
      { status: 400 },
    );
  }

  if (!dropboxPath.startsWith(allowedPrefix)) {
    return NextResponse.json(
      { error: "Caminho solicitado não é permitido." },
      { status: 400 },
    );
  }

  try {
    const { buffer, metadata } = await downloadFile(dropboxPath);
    const contentType = inferContentType(metadata.path_display ?? dropboxPath);

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Length": buffer.length.toString(),
      ...buildCacheHeaders(),
    };

    if (metadata.rev) {
      headers.ETag = metadata.rev;
    }

    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      headers,
    });
  } catch (error) {
    console.error("Falha ao servir arquivo do Dropbox", error);
    const status = getDropboxErrorStatus(error);

    if (status === 409 || status === 404) {
      return NextResponse.json(
        { error: "Arquivo não encontrado no Dropbox." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Erro ao acessar o Dropbox." },
      { status: 502 },
    );
  }
}
