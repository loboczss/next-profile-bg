import { Dropbox, files } from "dropbox";

let dropboxClient: Dropbox | null = null;
type DropboxAuthMode = "access_token" | "refresh_token";
let lastAuthMode: DropboxAuthMode | null = null;

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

export async function uploadBuffer(path: string, buffer: Buffer, mode: WriteModeInput = "overwrite") {
  const client = getDropbox();
  const writeMode: files.WriteMode =
    typeof mode === "string" ? { ".tag": mode } : mode;

  await client.filesUpload({
    path,
    contents: buffer,
    mode: writeMode,
    autorename: false,
    mute: true,
  });

  const shared = await ensureSharedLink(client, path);
  return normalizeSharedUrl(shared);
}
