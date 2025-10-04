import { NextResponse } from "next/server";

import { getDropbox, getDropboxCredentialsStatus } from "@/lib/dropbox";

interface LogEntry {
  level: "info" | "success" | "warning" | "error";
  message: string;
  timestamp: string;
  details?: Record<string, string>;
}

const appName = process.env.APP_NAME ?? "next-profile-bg";

function createLog(
  level: LogEntry["level"],
  message: string,
  details?: LogEntry["details"],
): LogEntry {
  return {
    level,
    message,
    details,
    timestamp: new Date().toISOString(),
  };
}

export async function POST() {
  const logs: LogEntry[] = [];
  let currentStage = "Inicialização";

  const appendLog = (
    level: LogEntry["level"],
    message: string,
    details?: LogEntry["details"],
  ) => {
    const entry = createLog(level, message, details);
    logs.push(entry);
    return entry;
  };

  appendLog(
    "info",
    "Iniciando teste de conexão com o Dropbox.",
    { etapa: currentStage },
  );

  try {
    currentStage = "Validação do token";
    const credentials = getDropboxCredentialsStatus();
    const credentialDetails: Record<string, string> = { etapa: currentStage };
    if (credentials.mode) {
      credentialDetails.modo = credentials.mode;
    }
    if (!credentials.configured && credentials.missing?.length) {
      credentialDetails.faltando = credentials.missing.join(", ");
    }

    appendLog(
      "info",
      "Verificando configuração das credenciais do Dropbox.",
      credentialDetails,
    );

    if (!credentials.configured) {
      throw new Error(
        credentials.missing?.length
          ? `Credenciais incompletas. Faltando: ${credentials.missing.join(", ")}.`
          : "Credenciais do Dropbox não configuradas.",
      );
    }

    const client = getDropbox();
    appendLog(
      "success",
      "Credenciais válidas. Cliente do Dropbox inicializado com sucesso.",
      { etapa: currentStage, modo: credentials.mode ?? "indefinido" },
    );

    currentStage = "Envio do arquivo de teste";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dropboxPath = `/apps/${appName}/connection-tests/test-${timestamp}.txt`;
    const contents = Buffer.from(
      `Teste de conexão executado em ${new Date().toISOString()}\n`,
      "utf-8",
    );

    appendLog(
      "info",
      "Criando arquivo de teste no Dropbox.",
      { etapa: currentStage, caminho: dropboxPath },
    );

    await client.filesUpload({
      path: dropboxPath,
      contents,
      autorename: true,
      mute: true,
      mode: { ".tag": "add" },
    });

    appendLog(
      "success",
      "Arquivo de teste criado com sucesso no Dropbox.",
      { etapa: currentStage, caminho: dropboxPath },
    );

    currentStage = "Conclusão";
    appendLog(
      "success",
      "Teste de conexão concluído sem erros.",
      { etapa: currentStage },
    );

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    const name = error instanceof Error && error.name ? error.name : "Erro";
    const stack = error instanceof Error ? error.stack : undefined;

    appendLog(
      "error",
      `Falha durante a etapa "${currentStage}": ${message}`,
      { etapa: currentStage, tipoErro: name },
    );

    if (stack) {
      appendLog("error", "Stack trace capturado.", {
        etapa: currentStage,
        stack,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
        logs,
      },
      { status: 500 },
    );
  }
}
