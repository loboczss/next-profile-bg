"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { UploadErrorDetails } from "@/types/upload";
import { normalizeUploadErrorDetails } from "@/lib/upload-error";
import { UploadErrorDialog } from "./UploadErrorDialog";

type Mode = "url" | "upload";

export function ChangeBackground({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorDetails, setErrorDetails] = useState<UploadErrorDetails | null>(
    null,
  );
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setErrorDetails(null);
    setIsErrorDialogOpen(false);

    startTransition(async () => {
      try {
        let response: Response;

        if (mode === "url") {
          response = await fetch("/api/background", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
            credentials: "include",
          });
        } else {
          if (!file) {
            setError("Selecione um arquivo para enviar.");
            return;
          }
          const formData = new FormData();
          formData.append("file", file);
          response = await fetch("/api/background", {
            method: "PUT",
            body: formData,
            credentials: "include",
          });
        }

        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Erro ao atualizar background");
          const normalizedDetails = normalizeUploadErrorDetails(
            data.errorDetails,
          );

          if (normalizedDetails) {
            setErrorDetails(normalizedDetails);
            setIsErrorDialogOpen(true);
          }
          return;
        }

        setMessage("Background atualizado!");
        setUrl("");
        setFile(null);
        router.refresh();
      } catch (err) {
        console.error(err);
        setError("Erro inesperado ao atualizar background.");
      }
    });
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setMessage(null);
    setError(null);

    if (newMode === "url") {
      setFile(null);
    } else {
      setUrl("");
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white/80 shadow">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange("url")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${mode === "url" ? "bg-blue-600 text-white" : "bg-slate-200"}`}
        >
          Usar URL
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("upload")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${mode === "upload" ? "bg-blue-600 text-white" : "bg-slate-200"}`}
        >
          Enviar arquivo
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "url" ? (
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="background-url">
              URL do background (https)
            </label>
            <input
              key="url-input"
              id="background-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.currentTarget.value || "")}
              placeholder="https://exemplo.com/imagem.jpg"
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="background-file">
              Arquivo do background
            </label>
            <input
              key="file-input"
              id="background-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="peer sr-only"
            />
            <label
              htmlFor="background-file"
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
                Selecionar arquivo
              </span>
            </label>
            {file && (
              <p className="text-xs font-medium text-slate-700">
                Arquivo selecionado: <span className="font-semibold">{file.name}</span>
              </p>
            )}
            <p className="text-xs text-slate-600">JPEG, PNG ou WebP até 10MB.</p>
          </div>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Enviando..." : "Salvar background"}
        </button>
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
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
