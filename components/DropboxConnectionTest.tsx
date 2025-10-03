"use client";

import { useState } from "react";

type LogLevel = "info" | "success" | "warning" | "error";

type LogEntry = {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  details?: Record<string, string>;
};

type ApiLogEntry = Omit<LogEntry, "id">;

type OperationStatus = "pending" | "success" | "error";

type OperationLog = {
  id: number;
  startedAt: string;
  completedAt?: string;
  status: OperationStatus;
  logs: LogEntry[];
};

const levelStyles: Record<LogLevel, string> = {
  info: "text-slate-700",
  success: "text-green-600",
  warning: "text-amber-600",
  error: "text-red-600",
};

const levelLabels: Record<LogLevel, string> = {
  info: "Info",
  success: "Sucesso",
  warning: "Aviso",
  error: "Erro",
};

export function DropboxConnectionTest() {
  const [history, setHistory] = useState<OperationLog[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const appendOperationLog = (operationId: number, entries: ApiLogEntry[]) => {
    setHistory((prev) =>
      prev.map((operation) =>
        operation.id === operationId
          ? {
              ...operation,
              logs: [
                ...operation.logs,
                ...entries.map((entry, index) => ({
                  ...entry,
                  id: `${operationId}-api-${index}-${entry.timestamp}`,
                })),
              ],
            }
          : operation,
      ),
    );
  };

  const finalizeOperation = (
    operationId: number,
    status: OperationStatus,
    extraLogs: ApiLogEntry[] = [],
  ) => {
    setHistory((prev) =>
      prev.map((operation) =>
        operation.id === operationId
          ? {
              ...operation,
              status,
              completedAt: new Date().toISOString(),
              logs: [
                ...operation.logs,
                ...extraLogs.map((entry, index) => ({
                  ...entry,
                  id: `${operationId}-extra-${index}-${entry.timestamp}`,
                })),
              ],
            }
          : operation,
      ),
    );
  };

  const handleTestConnection = async () => {
    if (isTesting) {
      return;
    }

    const operationId = Date.now();
    const startedAt = new Date().toISOString();

    setHistory((prev) => [
      {
        id: operationId,
        startedAt,
        status: "pending",
        logs: [
          {
            id: `${operationId}-start`,
            level: "info",
            message: "Teste iniciado. Solicitando verificação da conexão com o Dropbox...",
            timestamp: startedAt,
          },
        ],
      },
      ...prev,
    ]);

    setIsTesting(true);

    try {
      const response = await fetch("/api/dropbox/test", {
        method: "POST",
      });
      const data = await response.json();
      const logs = Array.isArray(data.logs) ? (data.logs as ApiLogEntry[]) : [];

      appendOperationLog(operationId, logs);

      if (response.ok) {
        finalizeOperation(operationId, "success", [
          {
            level: "success",
            message: "Teste concluído com sucesso.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        finalizeOperation(operationId, "error", [
          {
            level: "error",
            message:
              typeof data.error === "string"
                ? `Teste falhou: ${data.error}`
                : "Teste falhou por um motivo desconhecido.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      const timestamp = new Date().toISOString();
      finalizeOperation(operationId, "error", [
        {
          level: "error",
          message:
            error instanceof Error
              ? `Falha ao chamar a API de teste: ${error.message}`
              : "Falha desconhecida ao chamar a API de teste.",
          timestamp,
          details:
            error instanceof Error && error.stack
              ? { stack: error.stack }
              : undefined,
        },
      ]);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white/80 p-4 shadow">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Testar conexão com o Dropbox</h3>
          <p className="text-sm text-slate-600">
            Clique no botão abaixo para criar um arquivo de teste no Dropbox e acompanhar o
            passo a passo da operação.
          </p>
        </div>
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={isTesting}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isTesting ? "Testando..." : "Testar conexão"}
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum teste realizado ainda. Inicie um teste para visualizar os logs detalhados.
          </p>
        ) : (
          history.map((operation) => (
            <div key={operation.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Teste iniciado em {new Date(operation.startedAt).toLocaleString()}
                  </p>
                  {operation.completedAt && (
                    <p className="text-xs text-slate-500">
                      Finalizado em {new Date(operation.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                    operation.status === "success"
                      ? "bg-green-100 text-green-700"
                      : operation.status === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {operation.status === "success"
                    ? "Sucesso"
                    : operation.status === "error"
                      ? "Erro"
                      : "Em andamento"}
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {operation.logs.map((log) => (
                  <li key={log.id} className="rounded-md bg-slate-50 p-2">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div className={`text-sm font-medium ${levelStyles[log.level]}`}>
                        <span className="uppercase tracking-wide text-xs font-semibold mr-2">
                          {levelLabels[log.level]}
                        </span>
                        {log.message}
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {log.details && (
                      <pre className="mt-2 whitespace-pre-wrap rounded bg-white p-2 text-xs text-slate-600">
                        {Object.entries(log.details)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join("\n")}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
