import fs from "node:fs/promises";
import path from "node:path";

import { UploadLogEntry } from "@/types/upload";
import { getDropboxCredentialsStatus } from "./dropbox";

const appName = process.env.APP_NAME ?? "next-profile-bg";

function createLog(level: UploadLogEntry["level"], message: string): UploadLogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
  };
}

interface DropboxUploadOptions {
  logs?: UploadLogEntry[];
  itemDescription?: string;
  successMessage?: string;
  skipMessage?: string;
}

async function tryDropboxUpload(
  dropboxPath: string,
  buffer: Buffer,
  { logs, itemDescription = "arquivo", successMessage, skipMessage }: DropboxUploadOptions = {},
) {
  const description = itemDescription;

  logs?.push(
    createLog("info", "Verificando configuração das credenciais do Dropbox..."),
  );

  const credentials = getDropboxCredentialsStatus();
  if (!credentials.configured) {
    logs?.push(
      createLog(
        "warning",
        skipMessage ??
          "Credenciais do Dropbox não configuradas. O arquivo será salvo localmente.",
      ),
    );
    return null;
  }

  const authDescription =
    credentials.mode === "refresh_token"
      ? "via token de atualização"
      : credentials.mode === "access_token"
        ? "via token de acesso"
        : "em modo desconhecido";

  logs?.push(
    createLog(
      "success",
      `Credenciais do Dropbox configuradas (${authDescription}).`,
    ),
  );

  logs?.push(createLog("info", "Inicializando cliente do Dropbox..."));

  let dropbox: typeof import("./dropbox") | null = null;
  try {
    dropbox = await import("./dropbox");
    dropbox.getDropbox();
    logs?.push(
      createLog(
        "success",
        "Cliente do Dropbox inicializado com sucesso.",
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Falha ao inicializar cliente do Dropbox", error);
    logs?.push(
      createLog(
        "error",
        `Falha ao inicializar o cliente do Dropbox: ${message}. Prosseguindo com armazenamento local.`,
      ),
    );
    return null;
  }

  if (!dropbox) {
    return null;
  }

  logs?.push(
    createLog(
      "info",
      `Enviando ${description} para o Dropbox no caminho ${dropboxPath}...`,
    ),
  );

  try {
    const url = await dropbox.uploadBuffer(dropboxPath, buffer, "overwrite");
    if (url) {
      logs?.push(
        createLog("success", successMessage ?? "Upload concluído no Dropbox."),
      );
    } else {
      logs?.push(
        createLog(
          "warning",
          `Dropbox não retornou uma URL válida para o ${description}. Prosseguindo com armazenamento local.`,
        ),
      );
    }
    return url;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Falha ao enviar arquivo ao Dropbox", error);
    logs?.push(
      createLog(
        "error",
        `Falha ao enviar ${description} para o Dropbox: ${message}. Prosseguindo com armazenamento local.`,
      ),
    );
    return null;
  }
}

async function ensureDir(dirSegments: string[]) {
  const dirPath = path.join(process.cwd(), "public", ...dirSegments);
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

async function removeByPrefix(dirPath: string, prefix: string) {
  try {
    const entries = await fs.readdir(dirPath);
    await Promise.all(
      entries
        .filter((entry) => entry.startsWith(prefix))
        .map((entry) => fs.rm(path.join(dirPath, entry)).catch(() => undefined)),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
      console.error("Falha ao remover arquivos antigos", error);
    }
  }
}

async function saveLocalFile(dirSegments: string[], fileName: string, buffer: Buffer) {
  const dirPath = await ensureDir(dirSegments);
  await fs.writeFile(path.join(dirPath, fileName), buffer);
  const urlPath = ["", ...dirSegments, fileName]
    .map((segment) => segment.replace(/\\/g, "/"))
    .join("/");
  return `${urlPath}?v=${Date.now()}`;
}

function sanitizeSegment(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned.length > 0 ? cleaned : "item";
}

export async function storeProfileImage(userId: string, ext: string, buffer: Buffer) {
  const logs: UploadLogEntry[] = [];

  const dropboxPath = `/apps/${appName}/profiles/${userId}.${ext}`;
  const dropboxUrl = await tryDropboxUpload(dropboxPath, buffer, {
    logs,
    itemDescription: "foto de perfil",
    successMessage: "Upload da foto concluído no Dropbox.",
    skipMessage:
      "Credenciais do Dropbox não configuradas. Salvando foto de perfil localmente.",
  });

  if (dropboxUrl) {
    return { imageUrl: dropboxUrl, logs };
  }

  logs.push(createLog("info", "Preparando armazenamento local para a foto de perfil..."));

  const dir = ["uploads", "profiles"];
  const safeId = sanitizeSegment(userId);
  const fileName = `${safeId}-${Date.now()}.${ext}`;
  const dirPath = path.join(process.cwd(), "public", ...dir);

  await removeByPrefix(dirPath, `${safeId}-`);
  logs.push(createLog("info", "Fotos antigas removidas do armazenamento local."));

  const imageUrl = await saveLocalFile(dir, fileName, buffer);
  logs.push(createLog("success", "Foto salva com sucesso no armazenamento local."));

  return { imageUrl, logs };
}

export async function storeBackgroundImage(ext: string, buffer: Buffer) {
  const dropboxPath = `/apps/${appName}/backgrounds/current.${ext}`;
  const dropboxUrl = await tryDropboxUpload(dropboxPath, buffer, {
    itemDescription: "background",
    successMessage: "Upload do background concluído no Dropbox.",
    skipMessage:
      "Credenciais do Dropbox não configuradas. Salvando background localmente.",
  });
  if (dropboxUrl) {
    return dropboxUrl;
  }

  const dir = ["uploads", "backgrounds"];
  const fileName = `background-${Date.now()}.${ext}`;
  const dirPath = path.join(process.cwd(), "public", ...dir);
  await removeByPrefix(dirPath, "background-");
  return saveLocalFile(dir, fileName, buffer);
}
