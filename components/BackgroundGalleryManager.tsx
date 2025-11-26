"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Ban, Eye, EyeOff, Loader2, PlusCircle, Save, Trash2, UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BackgroundApiResponse, BackgroundImageItem, BackgroundMode } from "@/types/background";

type BackgroundWithDraft = BackgroundImageItem & {
  draftTitle: string;
  draftGroup: string;
  draftUrl: string;
  isSaving: boolean;
  pendingAction?: "save" | "visibility" | "delete";
  error?: string | null;
  success?: string | null;
};

type DisplayedBackground = BackgroundImageItem & { isFallback?: boolean };
type AddMode = "url" | "upload";

const toBackgroundWithDraft = (item: BackgroundImageItem): BackgroundWithDraft => ({
  ...item,
  draftTitle: item.title ?? "",
  draftGroup: item.groupKey ?? "",
  draftUrl: item.url,
  isSaving: false,
  pendingAction: undefined,
  error: null,
  success: null,
});

export function BackgroundGalleryManager() {
  const [mode, setMode] = useState<BackgroundMode>("ALL");
  const [group, setGroup] = useState("");
  const [imageId, setImageId] = useState<number | null>(null);
  const [backgrounds, setBackgrounds] = useState<BackgroundWithDraft[]>([]);
  const [activeBackgrounds, setActiveBackgrounds] = useState<BackgroundImageItem[]>([]);
  const [fallbackBackgroundUrl, setFallbackBackgroundUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [modeError, setModeError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode>("url");
  const [newBackgroundUrl, setNewBackgroundUrl] = useState("");
  const [newBackgroundTitle, setNewBackgroundTitle] = useState("");
  const [newBackgroundGroup, setNewBackgroundGroup] = useState("");
  const [newBackgroundFile, setNewBackgroundFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isModePending, startModeTransition] = useTransition();

  const setItemState = (
    id: number,
    changes: Partial<BackgroundWithDraft>,
  ) => {
    setBackgrounds((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  };

  const mutateBackground = async (
    id: number,
    {
      request,
      pendingAction,
      successMessage,
      errorMessage,
      onSuccess,
    }: {
      request: () => Promise<Response>;
      pendingAction: BackgroundWithDraft["pendingAction"];
      successMessage: string;
      errorMessage: string;
      onSuccess?: (image: BackgroundImageItem | undefined) => void;
    },
  ) => {
    setItemState(id, {
      isSaving: true,
      pendingAction,
      error: null,
      success: null,
    });

    try {
      const response = await request();
      const data = (await response.json().catch(() => ({}))) as {
        image?: BackgroundImageItem;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? errorMessage);
      }

      const image = data.image;
      const applySuccess =
        onSuccess ??
        ((img?: BackgroundImageItem) => {
          if (!img) {
            throw new Error("Resposta inválida do servidor");
          }
          syncBackground(img);
        });

      applySuccess(image);
      setFeedback(successMessage);
      await refreshSettings();
    } catch (err) {
      setItemState(id, {
        isSaving: false,
        pendingAction: undefined,
        error: err instanceof Error ? err.message : "Erro inesperado",
      });
    }
  };

  const applySettings = (settings: BackgroundApiResponse | null) => {
    if (!settings) {
      setMode("ALL");
      setGroup("");
      setImageId(null);
      setActiveBackgrounds([]);
      setFallbackBackgroundUrl(null);
      return;
    }

    setMode(settings.mode ?? "ALL");
    setGroup(settings.group ?? "");
    setImageId(settings.imageId ?? null);
    const selected = Array.isArray(settings.selectedBackgrounds)
      ? settings.selectedBackgrounds
      : [];
    setActiveBackgrounds(selected);
    setFallbackBackgroundUrl(
      typeof settings.backgroundUrl === "string" && settings.backgroundUrl.trim().length > 0
        ? settings.backgroundUrl
        : null,
    );
  };

  const refreshSettings = async () => {
    try {
      const response = await fetch("/api/background", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as BackgroundApiResponse;
      applySettings(data);
    } catch (err) {
      console.error("Erro ao atualizar configurações de background", err);
    }
  };

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
        applySettings(settings);

        const items = Array.isArray(gallery.images) ? gallery.images : [];
        setBackgrounds(items.map(toBackgroundWithDraft));
      } catch (err) {
        console.error(err);
        setStatusError(err instanceof Error ? err.message : "Erro desconhecido");
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
    return new Set(activeBackgrounds.map((item) => item.id));
  }, [activeBackgrounds]);

  const displayedBackgrounds = useMemo<DisplayedBackground[]>(() => {
    const mapped = activeBackgrounds
      .filter((item) => typeof item.url === "string" && item.url.trim().length > 0)
      .map((item) => ({ ...item, isFallback: false }));

    if (!mapped.length && fallbackBackgroundUrl?.trim()) {
      mapped.push({
        id: -1,
        url: fallbackBackgroundUrl,
        title: "Background padrão",
        groupKey: null,
        isVisible: true,
        createdAt: "1970-01-01T00:00:00.000Z",
        updatedAt: "1970-01-01T00:00:00.000Z",
        isFallback: true,
      });
    }

    return mapped;
  }, [activeBackgrounds, fallbackBackgroundUrl]);

  const hasDisplayedBackgrounds = displayedBackgrounds.length > 0;
  const canClearBackgrounds = hasDisplayedBackgrounds;

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
              pendingAction: undefined,
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

    await mutateBackground(id, {
      pendingAction: "save",
      request: () =>
        fetch(`/api/background/gallery/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      successMessage: "Imagem atualizada!",
      errorMessage: "Não foi possível atualizar a imagem",
    });
  };

  const handleToggleVisibility = async (id: number, nextVisible: boolean) => {
    await mutateBackground(id, {
      pendingAction: "visibility",
      request: () =>
        fetch(`/api/background/gallery/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isVisible: nextVisible }),
        }),
      successMessage: nextVisible ? "Imagem exibida" : "Imagem ocultada",
      errorMessage: "Não foi possível atualizar a visibilidade",
    });
  };

  const handleDelete = async (id: number) => {
    await mutateBackground(id, {
      pendingAction: "delete",
      request: () =>
        fetch(`/api/background/gallery/${id}`, {
          method: "DELETE",
        }),
      successMessage: "Imagem removida",
      errorMessage: "Não foi possível excluir a imagem",
      onSuccess: () => {
        setBackgrounds((current) => current.filter((item) => item.id !== id));
      },
    });
  };

  const handleAddBackground = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddError(null);
    setFeedback(null);

    const trimmedUrl = newBackgroundUrl.trim();
    const trimmedTitle = newBackgroundTitle.trim();
    const trimmedGroup = newBackgroundGroup.trim();

    if (addMode === "url") {
      if (!trimmedUrl) {
        setAddError("Informe a URL da imagem");
        return;
      }

      if (!trimmedUrl.startsWith("https://")) {
        setAddError("Use uma URL com HTTPS");
        return;
      }
    }

    if (addMode === "upload" && !newBackgroundFile) {
      setAddError("Selecione um arquivo para enviar");
      return;
    }

    setIsAdding(true);

    try {
      let response: Response;

      if (addMode === "upload") {
        const formData = new FormData();
        const fileToUpload = newBackgroundFile;

        if (fileToUpload) {
          formData.append("file", fileToUpload);
        }

        if (trimmedTitle.length) {
          formData.append("title", trimmedTitle);
        }

        if (trimmedGroup.length) {
          formData.append("groupKey", trimmedGroup);
        }

        response = await fetch("/api/background/gallery", {
          method: "POST",
          body: formData,
        });
      } else {
        const payload: Record<string, unknown> = { url: trimmedUrl };

        if (trimmedTitle.length) {
          payload.title = trimmedTitle;
        }
        if (trimmedGroup.length) {
          payload.groupKey = trimmedGroup;
        }

        response = await fetch("/api/background/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = (await response.json().catch(() => ({}))) as {
        image?: BackgroundImageItem;
        error?: string;
      };

      const newImage = data.image;

      if (!response.ok || !newImage) {
        throw new Error(data.error ?? "Não foi possível adicionar a imagem");
      }

      setBackgrounds((current) => [toBackgroundWithDraft(newImage), ...current]);
      setNewBackgroundUrl("");
      setNewBackgroundTitle("");
      setNewBackgroundGroup("");
      setNewBackgroundFile(null);
      setFileInputKey((key) => key + 1);
      setFeedback("Imagem adicionada!");
      await refreshSettings();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setIsAdding(false);
    }
  };

  const handleClearAll = async () => {
    setStatusError(null);
    setModeError(null);
    setFeedback(null);
    setIsClearing(true);

    try {
      const response = await fetch("/api/background", { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível limpar os backgrounds");
      }

      setBackgrounds((current) =>
        current.map((item) => ({
          ...item,
          isVisible: false,
          isSaving: false,
          pendingAction: undefined,
          success: null,
          error: null,
        })),
      );
      setActiveBackgrounds([]);
      setFeedback("Todas as imagens foram removidas do site");
      await refreshSettings();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setIsClearing(false);
    }
  };

  const handleModeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setModeError(null);
    setStatusError(null);

    const payload: Record<string, unknown> = { mode };

    if (mode === "GROUP") {
      if (!group.trim()) {
        setModeError("Informe um grupo para exibir");
        return;
      }
      payload.group = group.trim();
    }

    if (mode === "SINGLE") {
      if (!imageId) {
        setModeError("Selecione uma imagem");
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
        await refreshSettings();
      } catch (err) {
        setModeError(err instanceof Error ? err.message : "Erro inesperado");
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

  if (statusError && !backgrounds.length) {
    return <p className="text-sm text-red-600">{statusError}</p>;
  }

  return (
    <div className="space-y-6">
      {(statusError || feedback) && (
        <div className="space-y-2">
          {statusError && (
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 shadow-sm">
              <Ban className="h-4 w-4" />
              {statusError}
            </div>
          )}
          {feedback && (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
              <UploadCloud className="h-4 w-4" />
              {feedback}
            </div>
          )}
        </div>
      )}

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
                onChange={(event) =>
                  setImageId(event.currentTarget.value ? Number(event.currentTarget.value) : null)
                }
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

          {modeError && <p className="text-sm text-red-600">{modeError}</p>}

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

      <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Fotos em exibição</h3>
            <p className="text-xs text-slate-600">
              Visualize as imagens que estão aparecendo agora nas páginas do site.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={!canClearBackgrounds || isClearing}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            Remover todas as fotos
          </button>
        </div>

        {hasDisplayedBackgrounds ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedBackgrounds.map((item) => (
              <div
                key={item.isFallback ? `fallback-${item.url}` : item.id}
                className="overflow-hidden rounded-xl border border-white/20 bg-white/70 shadow-sm"
              >
                <div className="relative aspect-video w-full">
                  <Image
                    src={item.url}
                    alt={item.title ?? "Imagem exibida"}
                    fill
                    className="object-cover"
                  />
                  {item.isFallback ? (
                    <span className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-white">
                      Fallback
                    </span>
                  ) : (
                    selectedIds.has(item.id) && (
                      <span className="absolute left-3 top-3 rounded-full bg-blue-600/90 px-3 py-1 text-xs font-semibold text-white shadow">
                        Em uso
                      </span>
                    )
                  )}
                </div>
                <div className="space-y-1.5 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.isFallback
                      ? "Imagem padrão do site"
                      : item.title?.length
                      ? item.title
                      : `Imagem #${item.id}`}
                  </p>
                  {!item.isFallback && item.groupKey && (
                    <p className="text-xs font-medium text-blue-600">Grupo: {item.groupKey}</p>
                  )}
                  <p className="truncate text-xs text-slate-500">{item.url}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-600">
            Nenhuma imagem está sendo exibida no momento.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur">
        <form onSubmit={handleAddBackground} className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Adicionar nova foto</h3>
            <p className="text-xs text-slate-600">
              Inclua uma nova imagem para o carrossel global do background.
            </p>
          </div>

          <div className="flex gap-2">
            {(
              [
                { value: "url", label: "Usar URL" },
                { value: "upload", label: "Enviar do computador" },
              ] satisfies { value: AddMode; label: string }[]
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setAddMode(option.value);
                  setAddError(null);
                  setNewBackgroundFile(null);
                  setFileInputKey((key) => key + 1);
                  if (option.value === "upload") {
                    setNewBackgroundUrl("");
                  }
                }}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition",
                  addMode === option.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {addMode === "url" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600" htmlFor="new-background-url">
                URL da imagem (HTTPS)
              </label>
              <input
                id="new-background-url"
                type="url"
                value={newBackgroundUrl}
                onChange={(event) => setNewBackgroundUrl(event.currentTarget.value)}
                placeholder="https://exemplo.com/imagem.webp"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required={addMode === "url"}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600" htmlFor="new-background-file">
                Arquivo do computador
              </label>
              <input
                key={fileInputKey}
                id="new-background-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setNewBackgroundFile(event.target.files?.[0] ?? null)}
                className="sr-only"
              />
              <label
                htmlFor="new-background-file"
                className="group relative inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-50"
              >
                <span className="flex items-center gap-2">
                  <UploadCloud className="h-4 w-4" />
                  Selecione uma imagem do computador
                </span>
              </label>
              {newBackgroundFile && (
                <p className="text-xs font-medium text-slate-700">
                  Arquivo selecionado: <span className="font-semibold">{newBackgroundFile.name}</span>
                </p>
              )}
              <p className="text-xs text-slate-600">JPEG, PNG ou WebP até 10MB.</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600" htmlFor="new-background-title">
                Título (opcional)
              </label>
              <input
                id="new-background-title"
                value={newBackgroundTitle}
                onChange={(event) => setNewBackgroundTitle(event.currentTarget.value)}
                placeholder="Descrição curta da imagem"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600" htmlFor="new-background-group">
                Grupo (opcional)
              </label>
              <input
                id="new-background-group"
                value={newBackgroundGroup}
                onChange={(event) => setNewBackgroundGroup(event.currentTarget.value)}
                placeholder="ex.: hero, promoções, verão"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {addError && <p className="text-sm text-red-600">{addError}</p>}

          <button
            type="submit"
            disabled={isAdding}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Adicionar imagem
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Fotos cadastradas</h3>
            <p className="text-xs text-slate-600">
              Edite as informações, atribua grupos e controle a visibilidade das imagens disponíveis no background.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">Total: {backgrounds.length}</span>
        </div>

        {backgrounds.length ? (
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
                        {item.isSaving && item.pendingAction === "save" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Salvar alterações
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(item.id, !item.isVisible)}
                        disabled={item.isSaving}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {item.isSaving && item.pendingAction === "visibility" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : item.isVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        {item.isVisible ? "Ocultar" : "Exibir"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={item.isSaving}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {item.isSaving && item.pendingAction === "delete" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-600">
            Nenhuma imagem cadastrada até o momento.
          </div>
        )}
      </div>
    </div>
  );
}
