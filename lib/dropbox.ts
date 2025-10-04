import { Dropbox, files } from "dropbox";

let dropboxClient: Dropbox | null = null;
type DropboxAuthMode = "access_token" | "refresh_token";
let lastAuthMode: DropboxAuthMode | null = null;

interface DropboxResponseErrorLike {
  status?: number;
  error?: { error_summary?: string };
}

interface CredentialsStatus {
  configured: boolean;
  mode?: DropboxAuthMode;
  missing?: string[];
}

function resolveCredentialsStatus(): CredentialsStatus {
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN?.trim();
  const appKey = process.env.DROPBOX_APP_KEY?.trim();
  const appSecret = process.env.DROPBOX_APP_SECRET?.trim();

  if (refreshToken || appKey || appSecret) {
    const missing: string[] = [];
    if (!refreshToken) missing.push("DROPBOX_REFRESH_TOKEN");
    if (!appKey) missing.push("DROPBOX_APP_KEY");
    if (!appSecret) missing.push("DROPBOX_APP_SECRET");

    if (missing.length === 0) {
      return { configured: true, mode: "refresh_token" };
    }

    return { configured: false, missing };
  }

  const accessToken = process.env.DROPBOX_ACCESS_TOKEN?.trim();
  if (accessToken) {
    return { configured: true, mode: "access_token" };
  }

  return {
    configured: false,
    missing: [
      "DROPBOX_ACCESS_TOKEN",
      "ou (DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, DROPBOX_APP_SECRET)",
    ],
  };
}

export function getDropboxCredentialsStatus(): CredentialsStatus {
  return resolveCredentialsStatus();
}

function resetDropboxClient() {
  dropboxClient = null;
  lastAuthMode = null;
}

export function getDropbox() {
  const status = resolveCredentialsStatus();

  if (!status.configured || !status.mode) {
    const missing = status.missing?.join(", ") ?? "credenciais";
    throw new Error(`Credenciais do Dropbox não configuradas. Faltando: ${missing}.`);
  }

  if (!dropboxClient || lastAuthMode !== status.mode) {
    if (dropboxClient && lastAuthMode !== status.mode) {
      dropboxClient = null;
    }

    if (status.mode === "access_token") {
      dropboxClient = new Dropbox({
        accessToken: process.env.DROPBOX_ACCESS_TOKEN!,
        fetch,
      });
    } else {
      dropboxClient = new Dropbox({
        clientId: process.env.DROPBOX_APP_KEY!,
        clientSecret: process.env.DROPBOX_APP_SECRET!,
        refreshToken: process.env.DROPBOX_REFRESH_TOKEN!,
        fetch,
      });
    }

    lastAuthMode = status.mode;
  }

  return dropboxClient;
}

function normalizeSharedUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("dl");
    parsed.searchParams.set("raw", "1");
    return parsed.toString();
  } catch {
    const base = url.split("?")[0];
    return `${base}?raw=1`;
  }
}

async function ensureSharedLink(client: Dropbox, path: string) {
  const links = await client.sharingListSharedLinks({ path, direct_only: true });
  if (links.result.links.length > 0) {
    return links.result.links[0].url;
  }

  const created = await client.sharingCreateSharedLinkWithSettings({ path });
  return created.result.url;
}

type WriteModeTag = Exclude<files.WriteMode[".tag"], "update">;
type WriteModeInput = files.WriteMode | WriteModeTag;

type DropboxAuthError = Error & DropboxResponseErrorLike;

function isAuthError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const authError = error as DropboxAuthError;
  if (authError.status === 401) {
    return true;
  }

  const summary = authError.error?.error_summary;
  if (typeof summary === "string") {
    return summary.includes("invalid_access_token") || summary.includes("expired_access_token");
  }

  return false;
}

function isMissingScopeError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const dropboxError = error as DropboxResponseErrorLike;
  const summary = dropboxError.error?.error_summary;
  return typeof summary === "string" && summary.includes("missing_scope");
}

export function getDropboxErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  return (error as DropboxResponseErrorLike).status;
}

async function withDropboxClient<T>(
  operation: (client: Dropbox) => Promise<T>,
  retryOnAuthError = true,
): Promise<T> {
  const client = getDropbox();

  try {
    return await operation(client);
  } catch (error) {
    if (retryOnAuthError && isAuthError(error)) {
      resetDropboxClient();
      return withDropboxClient(operation, false);
    }
    throw error;
  }
}

export interface DropboxUploadResult {
  path: string;
  sharedUrl: string | null;
  warning?: "missing_scope" | "auth";
}

export async function uploadBuffer(
  path: string,
  buffer: Buffer,
  mode: WriteModeInput = "overwrite",
): Promise<DropboxUploadResult> {
  return withDropboxClient(async (client) => {
    const writeMode: files.WriteMode =
      typeof mode === "string" ? { ".tag": mode } : mode;

    await client.filesUpload({
      path,
      contents: buffer,
      mode: writeMode,
      autorename: false,
      mute: true,
    });

    try {
      const shared = await ensureSharedLink(client, path);
      return {
        path,
        sharedUrl: normalizeSharedUrl(shared),
      };
    } catch (error) {
      if (isMissingScopeError(error)) {
        return { path, sharedUrl: null, warning: "missing_scope" };
      }

      if (isAuthError(error)) {
        return { path, sharedUrl: null, warning: "auth" };
      }

      throw error;
    }
  });
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/=+$/u, "")
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/gu, "+").replace(/_/gu, "/");
  const padding = normalized.length % 4;
  const padded =
    padding === 0 ? normalized : normalized + "=".repeat(4 - padding);
  return Buffer.from(padded, "base64").toString("utf8");
}

export function encodeDropboxPath(path: string) {
  return encodeBase64Url(path);
}

export function decodeDropboxPath(encoded: string) {
  return decodeBase64Url(encoded);
}

export function createProxyUrl(path: string, cacheBuster?: number) {
  const query = new URLSearchParams({ path: encodeDropboxPath(path) });
  if (cacheBuster) {
    query.set("v", cacheBuster.toString());
  }
  return `/api/storage/dropbox?${query.toString()}`;
}

async function toBuffer(data: unknown): Promise<Buffer | null> {
  if (!data) {
    return null;
  }

  if (Buffer.isBuffer(data)) {
    return data;
  }

  if (data instanceof Uint8Array) {
    return Buffer.from(data);
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }

  if (typeof Blob !== "undefined" && data instanceof Blob) {
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  return null;
}

export async function downloadFile(path: string): Promise<{
  metadata: files.FileMetadata;
  buffer: Buffer;
}> {
  return withDropboxClient(async (client) => {
    const response = await client.filesDownload({ path });
    const result = response.result as files.FileMetadata & {
      fileBinary?: Buffer | ArrayBuffer;
      fileBlob?: Blob;
    };

    const binary =
      (await toBuffer(result.fileBinary)) ??
      (await toBuffer(result.fileBlob)) ??
      // @ts-expect-error - dropbox sdk also exposes fileBinary on response directly
      (await toBuffer((response as unknown as { fileBinary?: Buffer | ArrayBuffer }).fileBinary));

    if (!binary) {
      throw new Error("Dropbox não retornou o conteúdo do arquivo.");
    }

    return { metadata: result, buffer: binary };
  });
}
