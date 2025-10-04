export type UploadLogLevel = "info" | "success" | "warning" | "error";

export interface UploadLogEntry {
  message: string;
  level: UploadLogLevel;
  timestamp: string;
}

export type UploadErrorStage =
  | "credentials"
  | "client_initialization"
  | "upload"
  | string;

export interface UploadErrorDetails {
  message: string;
  stack?: string;
  stage?: UploadErrorStage;
  dropboxPath?: string;
  causeMessage?: string;
  causeStack?: string;
}
