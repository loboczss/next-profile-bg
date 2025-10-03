"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ChangePhoto() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!file) {
      setError("Selecione uma imagem primeiro.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile/photo", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Erro ao enviar foto");
          return;
        }

        setMessage("Foto atualizada com sucesso!");
        setFile(null);
        form.reset();
        router.refresh();
      } catch (err) {
        setError("Erro inesperado ao enviar foto.");
        console.error(err);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border rounded-lg p-4 bg-white/80 shadow">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="profile-photo">
          Nova foto de perfil
        </label>
        <input
          id="profile-photo"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        <p className="text-xs text-slate-600 mt-1">JPEG, PNG ou WebP até 2MB.</p>
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
  );
}
