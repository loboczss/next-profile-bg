"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Mode = "url" | "upload";

export function ChangeBackground({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

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

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white/80 shadow">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${mode === "url" ? "bg-blue-600 text-white" : "bg-slate-200"}`}
        >
          Usar URL
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
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
              id="background-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.currentTarget.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="background-file">
              Arquivo do background
            </label>
            <input
              id="background-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
            <p className="text-xs text-slate-600 mt-1">JPEG, PNG ou WebP até 10MB.</p>
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
    </div>
  );
}
