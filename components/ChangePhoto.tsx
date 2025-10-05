"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type {
  UploadErrorDetails,
  UploadLogEntry,
  UploadLogLevel,
} from "@/types/upload";
import { normalizeUploadErrorDetails } from "@/lib/upload-error";
import { UploadErrorDialog } from "./UploadErrorDialog";

type UploadAttemptStatus = "pending" | "success" | "error";

interface UploadAttempt {
  id: string;
  filename: string | null;
  startedAt: string;
  status: UploadAttemptStatus;
  logs: UploadLogEntry[];
}

function createClientLog(level: UploadLogLevel, message: string): UploadLogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
  };
}

function normalizeServerLogs(value: unknown): UploadLogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowedLevels: UploadLogLevel[] = ["info", "success", "warning", "error"];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const entry = item as Partial<UploadLogEntry>;
      if (
        typeof entry.message !== "string" ||
        typeof entry.level !== "string" ||
        typeof entry.timestamp !== "string"
      ) {
        return null;
      }

      if (!allowedLevels.includes(entry.level as UploadLogLevel)) {
        return null;
      }

      return {
        message: entry.message,
        level: entry.level as UploadLogLevel,
        timestamp: entry.timestamp,
      } satisfies UploadLogEntry;
    })
    .filter((entry): entry is UploadLogEntry => Boolean(entry));
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

const statusLabels: Record<UploadAttemptStatus, { label: string; className: string }> = {
  pending: { label: "Em andamento", className: "text-amber-600" },
  success: { label: "Concluído", className: "text-green-600" },
  error: { label: "Com falha", className: "text-red-600" },
};

const levelClasses: Record<UploadLogLevel, string> = {
  info: "text-slate-700",
  success: "text-green-700",
  warning: "text-amber-700",
  error: "text-red-700",
};

export function ChangePhoto() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [attempts, setAttempts] = useState<UploadAttempt[]>([]);
  const [errorDetails, setErrorDetails] = useState<UploadErrorDetails | null>(
    null,
  );
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    event.preventDefault();
    setMessage(null);
    setError(null);
    setErrorDetails(null);
    setIsErrorDialogOpen(false);

    if (!file) {
      setError("Selecione uma imagem primeiro.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const attemptId = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    const initialAttempt: UploadAttempt = {
      id: attemptId,
      filename: file.name ?? null,
      startedAt: new Date().toISOString(),
      status: "pending",
      logs: [createClientLog("info", "Iniciando envio da foto de perfil...")],
    };

    setAttempts((previous) => [initialAttempt, ...previous]);

    const appendToAttempt = (newLogs: UploadLogEntry[], status?: UploadAttemptStatus) => {
      setAttempts((previous) =>
        previous.map((attempt) =>
          attempt.id === attemptId
            ? {
                ...attempt,
                status: status ?? attempt.status,
                logs: [...attempt.logs, ...newLogs],
              }
            : attempt,
        ),
      );
    };

    appendToAttempt([createClientLog("info", "Enviando arquivo para o servidor...")]);

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile/photo", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        const data = await response.json();
        const serverLogs = normalizeServerLogs(data.logs);

        if (!response.ok) {
          const normalizedDetails = normalizeUploadErrorDetails(
            data.errorDetails,
          );

          appendToAttempt(
            [
              ...serverLogs,
              createClientLog("error", data.error ?? "Erro ao enviar foto."),
            ],
            "error",
          );
          setError(data.error ?? "Erro ao enviar foto.");

          if (normalizedDetails) {
            setErrorDetails(normalizedDetails);
            setIsErrorDialogOpen(true);
          }
          return;
        }

        appendToAttempt(
          [
            ...serverLogs,
            createClientLog("success", "Upload concluído sem erros."),
          ],
          "success",
        );

        setMessage("Foto atualizada com sucesso!");
        setFile(null);
        form.reset();
        router.refresh();
      } catch (err) {
        console.error(err);
        appendToAttempt(
          [createClientLog("error", "Erro inesperado ao enviar foto.")],
          "error",
        );
        setError("Erro inesperado ao enviar foto.");
      }
    });
  };

  const sortedAttempts = useMemo(
    () =>
      [...attempts].sort((a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      ),
    [attempts],
  );

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3 border rounded-lg p-4 bg-white/80 shadow">
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="profile-photo">
            Nova foto de perfil
          </label>
          <input
            id="profile-photo"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="peer sr-only"
          />
          <label
            htmlFor="profile-photo"
            className="group relative inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-[1px] text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl active:scale-[0.98] peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 peer-focus-visible:ring-offset-2"
          >
            <span className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950/10 px-4 py-2 backdrop-blur transition group-hover:bg-white/20">
              <svg
                aria-hidden
                className="h-4 w-4 text-white/80 transition group-hover:text-white"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path d="M4 7a2 2 0 0 1 2-2h2l1.2-1.6A1 1 0 0 1 10.95 3h2.1a1 1 0 0 1 .75.36L15 5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              Escolher imagem
            </span>
          </label>
          {file && (
            <p className="text-xs font-medium text-slate-700">
              Arquivo selecionado: <span className="font-semibold">{file.name}</span>
            </p>
          )}
          <p className="text-xs text-slate-600">JPEG, PNG ou WebP até 10MB.</p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Enviando..." : "Trocar Foto de Perfil"}
        </button>
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <UploadLogPanel attempts={sortedAttempts} />
      <UploadErrorDialog
        open={isErrorDialogOpen}
        onOpenChange={(open) => {
          setIsErrorDialogOpen(open);
          if (!open) {
            setErrorDetails(null);
          }
        }}
        details={errorDetails}
      />
    </div>
  );
}

function UploadLogPanel({ attempts }: { attempts: UploadAttempt[] }) {
  if (attempts.length === 0) {
    return (
      <div className="border rounded-lg bg-white/80 p-4 shadow">
        <h3 className="text-lg font-semibold">Painel de logs de upload</h3>
        <p className="mt-2 text-sm text-slate-600">
          Os detalhes de cada envio aparecerão aqui assim que você enviar uma foto.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white/80 p-4 shadow">
      <h3 className="text-lg font-semibold">Painel de logs de upload</h3>
      <div className="mt-4 space-y-4">
        {attempts.map((attempt) => {
          const status = statusLabels[attempt.status];
          const formattedDate = formatTime(attempt.startedAt);

          return (
            <div key={attempt.id} className="rounded-md border bg-white/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="font-medium text-slate-800">
                  {attempt.filename ?? "Envio de foto"}
                </div>
                <div className={`text-xs font-semibold ${status.className}`}>
                  {status.label}
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">Iniciado às {formattedDate}.</p>
              <ul className="mt-3 space-y-1">
                {attempt.logs.map((log, index) => (
                  <li key={`${attempt.id}-${index}`} className="flex gap-3 text-xs">
                    <span className="font-mono text-[0.65rem] text-slate-500">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className={`${levelClasses[log.level]} flex-1`}>{log.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
