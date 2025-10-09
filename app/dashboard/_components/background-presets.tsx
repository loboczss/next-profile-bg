"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Palette } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const presetBackgrounds = [
  {
    label: "Aurora Boreal",
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=80",
    title: "Aurora"
  },
  {
    label: "Cidade Noturna",
    url: "https://images.unsplash.com/photo-1499343245400-cddc78a01317?auto=format&fit=crop&w=1920&q=80",
    title: "Cidade"
  },
  {
    label: "Praia Tropical",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80",
    title: "Praia"
  },
];

// Coleção de atalhos para aplicar backgrounds ou definir cores sólidas rapidamente.
export function BackgroundPresets() {
  const router = useRouter();
  const [color, setColor] = useState("#4f46e5");
  const [isPending, startTransition] = useTransition();

  const applyBackground = (url: string, title: string) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/background", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, title }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Erro ao atualizar background");
        }
        toast.success("Background atualizado");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Não foi possível aplicar o background");
      }
    });
  };

  const applyColor = () => {
    const sanitized = color.replace("#", "");
    const colorUrl = `https://singlecolorimage.com/get/${sanitized}/1920x1080`;
    applyBackground(colorUrl, `Cor sólida ${color.toUpperCase()}`);
  };

  return (
    <div className="space-y-4 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
      <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Planos de fundo instantâneos</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Aplique um cenário premium ou escolha uma cor sólida personalizada com um clique.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        {presetBackgrounds.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyBackground(preset.url, preset.title)}
            disabled={isPending}
            className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-4 text-left text-sm font-semibold text-slate-600 shadow-inner transition hover:border-blue-400 hover:bg-blue-500/10 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300"
          >
            <span className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              {preset.label}
            </span>
            <span className="mt-2 block text-xs font-normal opacity-70">Aplicar imagem hospedada</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-inner dark:border-slate-800 dark:bg-slate-900/70 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Cor personalizada</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Defina um fundo sólido utilizando um gerador de imagens.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-12 w-16 cursor-pointer rounded-xl border border-white/60 bg-white shadow-inner dark:border-slate-700"
          />
          <Button
            onClick={applyColor}
            disabled={isPending}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Aplicar cor
          </Button>
        </div>
      </div>
    </div>
  );
}
