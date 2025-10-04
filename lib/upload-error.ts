import { UploadErrorDetails } from "@/types/upload";

export function normalizeUploadErrorDetails(value: unknown): UploadErrorDetails | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Partial<Record<string, unknown>>;
  const message = record.message;

  if (typeof message !== "string" || message.trim().length === 0) {
    return null;
  }

  const details: UploadErrorDetails = {
    message,
  };

  if (typeof record.stack === "string") {
    details.stack = record.stack;
  }

  if (typeof record.stage === "string") {
    details.stage = record.stage;
  }

  if (typeof record.dropboxPath === "string") {
    details.dropboxPath = record.dropboxPath;
  }

  if (typeof record.causeMessage === "string") {
    details.causeMessage = record.causeMessage;
  }

  if (typeof record.causeStack === "string") {
    details.causeStack = record.causeStack;
  }

  return details;
}
