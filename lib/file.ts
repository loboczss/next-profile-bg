export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function assertImage(file: File) {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Formato de arquivo inválido. Use JPEG, PNG ou WebP.");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("Arquivo muito grande. O limite é 10MB.");
  }
}

export function sanitizeExt(mime: string) {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error("Não foi possível determinar a extensão do arquivo.");
  }
}
