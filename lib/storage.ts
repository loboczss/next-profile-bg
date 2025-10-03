import fs from "node:fs/promises";
import path from "node:path";

const appName = process.env.APP_NAME ?? "next-profile-bg";

async function tryDropboxUpload(dropboxPath: string, buffer: Buffer) {
  if (!process.env.DROPBOX_ACCESS_TOKEN) {
    return null;
  }

  try {
    const dropbox = await import("./dropbox");
    return await dropbox.uploadBuffer(dropboxPath, buffer, "overwrite");
  } catch (error) {
    console.error("Falha ao enviar arquivo ao Dropbox", error);
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
  const dropboxPath = `/apps/${appName}/profiles/${userId}.${ext}`;
  const dropboxUrl = await tryDropboxUpload(dropboxPath, buffer);
  if (dropboxUrl) {
    return dropboxUrl;
  }

  const dir = ["uploads", "profiles"];
  const safeId = sanitizeSegment(userId);
  const fileName = `${safeId}-${Date.now()}.${ext}`;
  const dirPath = path.join(process.cwd(), "public", ...dir);
  await removeByPrefix(dirPath, `${safeId}-`);
  return saveLocalFile(dir, fileName, buffer);
}

export async function storeBackgroundImage(ext: string, buffer: Buffer) {
  const dropboxPath = `/apps/${appName}/backgrounds/current.${ext}`;
  const dropboxUrl = await tryDropboxUpload(dropboxPath, buffer);
  if (dropboxUrl) {
    return dropboxUrl;
  }

  const dir = ["uploads", "backgrounds"];
  const fileName = `background-${Date.now()}.${ext}`;
  const dirPath = path.join(process.cwd(), "public", ...dir);
  await removeByPrefix(dirPath, "background-");
  return saveLocalFile(dir, fileName, buffer);
}
