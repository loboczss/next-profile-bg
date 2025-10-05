"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Save, UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BackgroundApiResponse, BackgroundImageItem, BackgroundMode } from "@/types/background";

type BackgroundWithDraft = BackgroundImageItem & {
  draftTitle: string;
  draftGroup: string;
  draftUrl: string;
  isSaving: boolean;
  error?: string | null;
  success?: string | null;
};

export function BackgroundGalleryManager() {
  const [mode, setMode] = useState<BackgroundMode>("ALL");
  const [group, setGroup] = useState("");
  const [imageId, setImageId] = useState<number | null>(null);
  const [backgrounds, setBackgrounds] = useState<BackgroundWithDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isModePending, startModeTransition] = useTransition();

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsResponse, galleryResponse] = await Promise.all([
          fetch("/api/background", { cache: "no-store" }),
          fetch("/api/background/gallery", { cache: "no-store" }),
        ]);

        if (!settingsResponse.ok) {
          throw new Error("Não foi possível carregar as configurações");
        }

        if (!galleryResponse.ok) {
          throw new Error("Não foi possível carregar a galeria");
        }

        const settings = (await settingsResponse.json()) as BackgroundApiResponse;
        const gallery = (await galleryResponse.json()) as { images?: BackgroundImageItem[] };

        setMode(settings.mode ?? "ALL");
        setGroup(settings.group ?? "");
        setImageId(settings.imageId ?? null);

        const items = Array.isArray(gallery.images) ? gallery.images : [];
        setBackgrounds(
          items.map((item) => ({
            ...item,
            draftTitle: item.title ?? "",
            draftGroup: item.groupKey ?? "",
            draftUrl: item.url,
            isSaving: false,
            error: null,
            success: null,
          })),
        );
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const groups = useMemo(() => {
    const set = new Set<string>();
    backgrounds.forEach((item) => {
      if (item.groupKey) {
        set.add(item.groupKey);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [backgrounds]);

  const selectedIds = useMemo(() => {
    if (mode === "SINGLE" && imageId) {
      return new Set([imageId]);
    }
    if (mode === "GROUP" && group.trim()) {
      return new Set(
        backgrounds.filter((item) => item.groupKey === group.trim()).map((item) => item.id),
      );
    }
    return new Set(backgrounds.filter((item) => item.isVisible).map((item) => item.id));
  }, [backgrounds, mode, imageId, group]);

  const updateDraft = (id: number, field: "draftTitle" | "draftGroup" | "draftUrl", value: string) => {
    setBackgrounds((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
              error: null,
              success: null,
            }
          : item,
      ),
    );
  };

  const syncBackground = (updated: BackgroundImageItem) => {
    setBackgrounds((current) =>
      current.map((item) =>
        item.id === updated.id
          ? {
              ...item,
              ...updated,
              draftTitle: updated.title ?? "",
              draftGroup: updated.groupKey ?? "",
              draftUrl: updated.url,
              isSaving: false,
              error: null,
              success: "Atualizado com sucesso!",
            }
          : item,
      ),
    );
  };

  const handleSave = async (id: number) => {
    const background = backgrounds.find((item) => item.id === id);
    if (!background) return;

    const payload: Record<string, unknown> = {};
    const trimmedTitle = background.draftTitle.trim();
    const trimmedGroup = background.draftGroup.trim();
    const trimmedUrl = background.draftUrl.trim();

    if (trimmedUrl !== background.url) {
      payload.url = trimmedUrl;
    }

    if ((background.title ?? "") !== trimmedTitle) {
      payload.title = trimmedTitle.length ? trimmedTitle : null;
    }

    if ((background.groupKey ?? "") !== trimmedGroup) {
      payload.groupKey = trimmedGroup.length ? trimmedGroup : null;
    }

    if (Object.keys(payload).length === 0) {
      setBackgrounds((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, success: "Nada para atualizar", error: null }
            : item,
        ),
      );
      return;
    }

    setBackgrounds((current) =>
      current.map((item) =>
        item.id === id ? { ...item, isSaving: true, error: null, success: null } : item,
      ),
    );

    try {
      const response = await fetch(`/api/background/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as { image?: BackgroundImageItem; error?: string };

      if (!response.ok || !data.image) {
        throw new Error(data.error ?? "Não foi possível atualizar a imagem");
      }

      syncBackground(data.image);
      setFeedback("Imagem atualizada!");
    } catch (err) {
      setBackgrounds((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                isSaving: false,
                error: err instanceof Error ? err.message : "Erro inesperado",
              }
            : item,
        ),
      );
    }
  };

  const handleToggleVisibility = async (id: number, nextVisible: boolean) => {
    setBackgrounds((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, isSaving: true, error: null, success: null }
          : item,
      ),
    );

    try {
      const response = await fetch(`/api/background/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: nextVisible }),
      });
      const data = (await response.json().catch(() => ({}))) as { image?: BackgroundImageItem; error?: string };

      if (!response.ok || !data.image) {
        throw new Error(data.error ?? "Não foi possível atualizar a visibilidade");
      }

      syncBackground(data.image);
      setFeedback(nextVisible ? "Imagem exibida" : "Imagem ocultada");
    } catch (err) {
      setBackgrounds((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                isSaving: false,
                error: err instanceof Error ? err.message : "Erro inesperado",
              }
            : item,
        ),
      );
    }
  };

  const handleModeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    const payload: Record<string, unknown> = { mode };

    if (mode === "GROUP") {
      if (!group.trim()) {
        setError("Informe um grupo para exibir");
        return;
      }
      payload.group = group.trim();
    }

    if (mode === "SINGLE") {
      if (!imageId) {
        setError("Selecione uma imagem");
        return;
      }
      payload.imageId = imageId;
    }

    startModeTransition(async () => {
      try {
        const response = await fetch("/api/background", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json().catch(() => ({}))) as { error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Não foi possível atualizar o modo");
        }

        setFeedback("Modo de exibição atualizado");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado");
      }
    });
  };

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando galeria de backgrounds...
      </div>
    );
  }

  if (error && !backgrounds.length) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur">
        <form onSubmit={handleModeSubmit} className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Modo de exibição</p>
            <p className="text-xs text-slate-600">
              Defina se o site utiliza todas as imagens visíveis, apenas um grupo ou somente uma foto.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                { value: "ALL", label: "Todas as visíveis" },
                { value: "GROUP", label: "Grupo específico" },
                { value: "SINGLE", label: "Uma foto" },
              ] satisfies { value: BackgroundMode; label: string }[]
            ).map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer flex-col rounded-xl border px-3 py-3 text-sm font-medium transition",
                  mode === option.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300",
                )}
              >
                <input
                  type="radio"
                  name="mode"
                  value={option.value}
                  checked={mode === option.value}
                  onChange={() => setMode(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>

          {mode === "GROUP" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600" htmlFor="background-group">
                Grupo de imagens
              </label>
              <input
                id="background-group"
                list="background-group-suggestions"
                value={group}
                onChange={(event) => setGroup(event.currentTarget.value)}
                placeholder="Ex.: principal, promoções, verão"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <datalist id="background-group-suggestions">
                {groups.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
          )}

          {mode === "SINGLE" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600" htmlFor="background-single">
                Escolha a imagem
              </label>
              <select
                id="background-single"
                value={imageId ?? ""}
                onChange={(event) => setImageId(event.currentTarget.value ? Number(event.currentTarget.value) : null)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Selecione uma imagem</option>
                {backgrounds.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title?.length ? item.title : `Imagem #${item.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {feedback && <p className="text-sm text-green-600">{feedback}</p>}

          <button
            type="submit"
            disabled={isModePending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isModePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar modo de exibição
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Fotos cadastradas</h3>
          <p className="text-xs text-slate-600">
            Edite as informações, atribua grupos e controle a visibilidade das imagens disponíveis no background.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {backgrounds.map((item) => {
            const isSelected = selectedIds.has(item.id);

            return (
              <div
                key={item.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl border bg-white shadow-sm transition",
                  isSelected ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-200",
                )}
              >
                <div className="relative h-40 w-full">
                  <Image
                    src={item.draftUrl || item.url}
                    alt={item.title ?? `Imagem ${item.id}`}
                    fill
                    className="object-cover"
                  />
                  {!item.isVisible && (
                    <span className="absolute inset-x-0 top-2 mx-auto w-max rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                      Oculta
                    </span>
                  )}
                  {isSelected && (
                    <span className="absolute inset-x-0 bottom-2 mx-auto w-max rounded-full bg-blue-600/90 px-3 py-1 text-xs font-semibold text-white shadow">
                      Em uso
                    </span>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600" htmlFor={`title-${item.id}`}>
                      Título
                    </label>
                    <input
                      id={`title-${item.id}`}
                      value={item.draftTitle}
                      onChange={(event) => updateDraft(item.id, "draftTitle", event.currentTarget.value)}
                      placeholder="Descrição da imagem"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600" htmlFor={`group-${item.id}`}>
                      Grupo
                    </label>
                    <input
                      id={`group-${item.id}`}
                      value={item.draftGroup}
                      onChange={(event) => updateDraft(item.id, "draftGroup", event.currentTarget.value)}
                      placeholder="Ex.: principal, promoções"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600" htmlFor={`url-${item.id}`}>
                      URL
                    </label>
                    <input
                      id={`url-${item.id}`}
                      value={item.draftUrl}
                      onChange={(event) => updateDraft(item.id, "draftUrl", event.currentTarget.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  {item.error && <p className="text-xs text-red-600">{item.error}</p>}
                  {item.success && <p className="text-xs text-green-600">{item.success}</p>}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSave(item.id)}
                      disabled={item.isSaving}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {item.isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar alterações
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(item.id, !item.isVisible)}
                      disabled={item.isSaving}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {item.isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : item.isVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {item.isVisible ? "Ocultar" : "Exibir"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {feedback && backgrounds.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            <UploadCloud className="h-4 w-4" />
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}
