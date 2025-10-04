import path from "node:path";

import { UploadLogEntry } from "@/types/upload";
import { getDropboxCredentialsStatus } from "./dropbox";

export type DropboxUploadStage =
  | "credentials"
  | "client_initialization"
  | "upload";

export class DropboxUploadError extends Error {
  readonly stage: DropboxUploadStage;
  readonly dropboxPath: string;
  readonly uploadLogs: UploadLogEntry[];
  readonly causeMessage?: string;
  readonly causeStack?: string;

  constructor(
    message: string,
    {
      stage,
      dropboxPath,
      logs,
      cause,
    }: {
      stage: DropboxUploadStage;
      dropboxPath: string;
      logs?: UploadLogEntry[];
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "DropboxUploadError";
    this.stage = stage;
    this.dropboxPath = dropboxPath;
    this.uploadLogs = logs ?? [];

    if (cause instanceof Error) {
      this.causeMessage = cause.message;
      this.causeStack = cause.stack;
    } else if (typeof cause === "string") {
      this.causeMessage = cause;
    }

    Object.setPrototypeOf(this, DropboxUploadError.prototype);
  }
}

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
}

async function tryDropboxUpload(
  dropboxPath: string,
  buffer: Buffer,
  { logs, itemDescription = "arquivo", successMessage }: DropboxUploadOptions = {},
): Promise<string> {
  const description = itemDescription;
  const logEntries = logs ?? [];

  logEntries.push(
    createLog("info", "Verificando configuração das credenciais do Dropbox..."),
  );

  const credentials = getDropboxCredentialsStatus();
  if (!credentials.configured) {
    const message =
      "Credenciais do Dropbox não configuradas. Configure-as antes de tentar novamente.";
    logEntries.push(createLog("error", message));
    throw new DropboxUploadError(message, {
      stage: "credentials",
      dropboxPath,
      logs: logEntries,
    });
  }

  const authDescription =
    credentials.mode === "refresh_token"
      ? "via token de atualização"
      : credentials.mode === "access_token"
        ? "via token de acesso"
        : "em modo desconhecido";

  logEntries.push(
    createLog(
      "success",
      `Credenciais do Dropbox configuradas (${authDescription}).`,
    ),
  );

  logEntries.push(createLog("info", "Inicializando cliente do Dropbox..."));

  let dropbox: typeof import("./dropbox") | null = null;
  try {
    dropbox = await import("./dropbox");
    dropbox.getDropbox();
    logEntries.push(
      createLog(
        "success",
        "Cliente do Dropbox inicializado com sucesso.",
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Falha ao inicializar cliente do Dropbox", error);
    const logMessage = `Falha ao inicializar o cliente do Dropbox: ${message}.`;
    logEntries.push(createLog("error", logMessage));
    throw new DropboxUploadError(logMessage, {
      stage: "client_initialization",
      dropboxPath,
      logs: logEntries,
      cause: error,
    });
  }

  if (!dropbox) {
    const message = "Cliente do Dropbox não foi inicializado.";
    logEntries.push(createLog("error", message));
    throw new DropboxUploadError(message, {
      stage: "client_initialization",
      dropboxPath,
      logs: logEntries,
    });
  }

  logEntries.push(
    createLog(
      "info",
      `Enviando ${description} para o Dropbox no caminho ${dropboxPath}...`,
    ),
  );

  try {
    const result = await dropbox.uploadBuffer(dropboxPath, buffer, "overwrite");
    let publicUrl = result.sharedUrl;

    if (!publicUrl) {
      const warningMessage =
        result.warning === "missing_scope"
          ? "Dropbox sem permissão para criar links compartilhados. Usando proxy interno."
          : result.warning === "auth"
            ? "Dropbox não autorizou a criação do link compartilhado. Usando proxy interno."
            : "Não foi possível gerar link compartilhado no Dropbox. Usando proxy interno.";

      logEntries.push(createLog("warning", warningMessage));
      publicUrl = dropbox.createProxyUrl(result.path, Date.now());
    }

    logEntries.push(
      createLog("success", successMessage ?? "Upload concluído no Dropbox."),
    );

    return publicUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Falha ao enviar arquivo ao Dropbox", error);
    const errorMessage = `Falha ao enviar ${description} para o Dropbox: ${message}.`;
    logEntries.push(createLog("error", errorMessage));
    throw new DropboxUploadError(errorMessage, {
      stage: "upload",
      dropboxPath,
      logs: logEntries,
      cause: error,
    });
  }
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
  });

  return { imageUrl: dropboxUrl, logs };
}

export async function storeBackgroundImage(ext: string, buffer: Buffer) {
  const dropboxPath = `/apps/${appName}/backgrounds/current.${ext}`;
  return tryDropboxUpload(dropboxPath, buffer, {
    itemDescription: "background",
    successMessage: "Upload do background concluído no Dropbox.",
  });
}

export async function storeDestinationPhoto(
  userId: string,
  ext: string,
  buffer: Buffer,
  options: { originalName?: string } = {},
) {
  const safeUserId = sanitizeSegment(userId);
  const baseName = options.originalName
    ? sanitizeSegment(path.parse(options.originalName).name)
    : "destino";
  const fileName = `${Date.now()}-${baseName}.${ext}`;
  const dropboxPath = `/apps/${appName}/destinations/${safeUserId}/${fileName}`;

  return tryDropboxUpload(dropboxPath, buffer, {
    itemDescription: "foto de destino",
    successMessage: "Upload da foto de destino concluído no Dropbox.",
  });
}
