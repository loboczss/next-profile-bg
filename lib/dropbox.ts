import { Dropbox, files } from "dropbox";

let dropboxClient: Dropbox | null = null;

export function getDropbox() {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error("DROPBOX_ACCESS_TOKEN não configurado.");
  }

  if (!dropboxClient) {
    dropboxClient = new Dropbox({ accessToken: token, fetch });
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

export async function uploadBuffer(path: string, buffer: Buffer, mode: files.WriteModeOption = "overwrite") {
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
