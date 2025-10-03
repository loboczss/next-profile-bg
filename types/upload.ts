export type UploadLogLevel = "info" | "success" | "warning" | "error";

export interface UploadLogEntry {
  message: string;
  level: UploadLogLevel;
  timestamp: string;
}
