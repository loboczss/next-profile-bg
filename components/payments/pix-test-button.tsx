"use client";

import { useState } from "react";

interface PixTestButtonProps {
  initialCount: number;
}

interface PixTestApiResponse {
  status: string;
  message?: string;
  count?: number;
}

export function PixTestButton({ initialCount }: PixTestButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handlePixTest() {
    setIsLoading(true);
    setFeedback(null);
    setIsError(false);

    try {
      const response = await fetch("/api/cora/pix-test", {
        method: "POST",
      });

      const data = (await response.json()) as PixTestApiResponse;

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message ?? "Não foi possível gerar o Pix de teste.");
      }

      if (typeof data.count === "number") {
        setCount(data.count);
      }

      setFeedback(data.message ?? "Pix confirmado com sucesso!");
    } catch (error) {
      setIsError(true);
      setFeedback(error instanceof Error ? error.message : "Falha ao gerar o Pix.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <button
        type="button"
        onClick={handlePixTest}
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-full bg-[color:var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(234,0,42,0.25)] transition hover:bg-[color:var(--brand-primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary)]/60 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Gerando Pix..." : "Testar Pix de R$ 5,00"}
      </button>

      <p className="text-sm text-muted-foreground">
        Pagamentos confirmados com este botão: <strong className="font-semibold text-foreground">{count}</strong>
      </p>

      {feedback && (
        <p
          className={`text-sm ${isError ? "text-red-600" : "text-emerald-600"}`}
          role="status"
          aria-live="polite"
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
