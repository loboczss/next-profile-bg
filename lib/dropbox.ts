import { Dropbox, files } from "dropbox";

let dropboxClient: Dropbox | null = null;
let usingRefreshToken = false;

export async function getDropbox() {
  if (!dropboxClient) {
    const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
    if (refreshToken) {
      const clientId = process.env.DROPBOX_APP_KEY;
      const clientSecret = process.env.DROPBOX_APP_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error(
          "Configure DROPBOX_APP_KEY e DROPBOX_APP_SECRET para usar refresh tokens."
        );
      }

      dropboxClient = new Dropbox({
        clientId,
        clientSecret,
        refreshToken,
        fetch,
      });
      usingRefreshToken = true;
    } else {
      const token = process.env.DROPBOX_ACCESS_TOKEN;
      if (!token) {
        throw new Error(
          "Configure DROPBOX_REFRESH_TOKEN ou DROPBOX_ACCESS_TOKEN no ambiente."
        );
      }

      dropboxClient = new Dropbox({ accessToken: token, fetch });
      usingRefreshToken = false;
    }
  }

  if (usingRefreshToken) {
    await dropboxClient.auth.checkAndRefreshAccessToken();
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

export async function uploadBuffer(
  path: string,
  buffer: Buffer,
  mode: files.WriteModeOption = "overwrite"
) {
  const client = await getDropbox();
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
