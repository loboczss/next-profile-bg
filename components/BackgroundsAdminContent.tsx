"use client";

import { useMemo, useState } from "react";

import { BackgroundImageItem, BackgroundMode } from "@/types/background";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

interface DisplayModeState {
  mode: BackgroundMode;
  group: string | null;
  imageId: number | null;
}

interface NewImageForm {
  url: string;
  fileName: string;
  title: string;
  groupKey: string;
}

const initialBackgrounds: BackgroundImageItem[] = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    title: "Praia dourada ao entardecer",
    groupKey: "praias",
    isVisible: true,
    createdAt: "2024-01-05T10:00:00Z",
    updatedAt: "2024-02-01T12:00:00Z",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=1600&q=80",
    title: "Montanhas nevadas",
    groupKey: "montanhas",
    isVisible: true,
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-02-06T15:32:00Z",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    title: "Cidade iluminada",
    groupKey: "cidades",
    isVisible: true,
    createdAt: "2024-01-18T10:00:00Z",
    updatedAt: "2024-02-14T08:21:00Z",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1600&q=80",
    title: "Deserto azul",
    groupKey: "experiencias",
    isVisible: false,
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-02-16T10:00:00Z",
  },
];

export function BackgroundsAdminContent() {
  const [backgrounds, setBackgrounds] = useState<BackgroundImageItem[]>(initialBackgrounds);
  const [displayMode, setDisplayMode] = useState<DisplayModeState>({
    mode: "ALL",
    group: null,
    imageId: null,
  });
  const [newImageForm, setNewImageForm] = useState<NewImageForm>({
    url: "",
    fileName: "",
    title: "",
    groupKey: "",
  });
  const [lastSavedMode, setLastSavedMode] = useState<string | null>(null);
  const [lastSavedImageId, setLastSavedImageId] = useState<number | null>(null);

  const totalImages = backgrounds.length;
  const activeImages = useMemo(() => backgrounds.filter((image) => image.isVisible).length, [backgrounds]);

  const groupOptions = useMemo(() => {
    const groups = new Set<string>();
    backgrounds.forEach((image) => {
      if (image.groupKey) {
        groups.add(image.groupKey);
      }
    });
    return Array.from(groups);
  }, [backgrounds]);

  const inUseIds = useMemo(() => {
    switch (displayMode.mode) {
      case "GROUP":
        return new Set(
          backgrounds
            .filter((image) => image.groupKey === displayMode.group && image.isVisible)
            .map((image) => image.id),
        );
      case "SINGLE":
        return new Set(displayMode.imageId ? [displayMode.imageId] : []);
      default:
        return new Set(backgrounds.filter((image) => image.isVisible).map((image) => image.id));
    }
  }, [backgrounds, displayMode.group, displayMode.imageId, displayMode.mode]);

  const imagesInUseCount = inUseIds.size;

  const resetForm = () =>
    setNewImageForm({
      url: "",
      fileName: "",
      title: "",
      groupKey: "",
    });

  const handleAddImage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newImageForm.url && !newImageForm.fileName) {
      return;
    }

    const nextId = Math.max(0, ...backgrounds.map((image) => image.id)) + 1;
    const generatedUrl =
      newImageForm.url || `https://placehold.co/1200x720?text=${encodeURIComponent(newImageForm.fileName || "Nova+imagem")}`;

    const newImage: BackgroundImageItem = {
      id: nextId,
      url: generatedUrl,
      title: newImageForm.title || null,
      groupKey: newImageForm.groupKey || null,
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // TODO: conectar com API de upload ou persistência ao integrar backend
    setBackgrounds((current) => [newImage, ...current]);
    resetForm();
  };

  const handleToggleVisibility = (id: number) => {
    setBackgrounds((current) =>
      current.map((image) =>
        image.id === id
          ? {
              ...image,
              isVisible: !image.isVisible,
            }
          : image,
      ),
    );
  };

  const handleUpdateImage = (id: number, key: keyof BackgroundImageItem, value: string | boolean | null) => {
    setBackgrounds((current) =>
      current.map((image) =>
        image.id === id
          ? {
              ...image,
              [key]: value,
              updatedAt: new Date().toISOString(),
            }
          : image,
      ),
    );
  };

  const handleDeleteImage = (id: number) => {
    if (!window.confirm("Remover esta imagem da galeria?")) return;
    setBackgrounds((current) => current.filter((image) => image.id !== id));
  };

  const handleSaveImage = (id: number) => {
    setLastSavedImageId(id);
    // TODO: integrar chamada de API para salvar alterações da imagem
  };

  const handleSaveDisplayMode = () => {
    setLastSavedMode(`Modo salvo às ${new Date().toLocaleTimeString()}`);
    // TODO: enviar configuração de modo de exibição para o backend
  };

  const handleRemoveAll = () => {
    if (!window.confirm("Remover todas as fotos cadastradas?")) return;
    setBackgrounds([]);
    setDisplayMode({ mode: "ALL", group: null, imageId: null });
  };

  const handleHideAll = () => {
    setBackgrounds((current) => current.map((image) => ({ ...image, isVisible: false })));
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-500">Evastur Viagens</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Backgrounds do portal</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Gerencie as imagens de fundo e o modo de exibição do site.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Dashboard / Imagens de fundo</p>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
            Controle único para cadastro, edição e exibição das fotos sem seções duplicadas.
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500 dark:text-slate-400">Total de imagens</CardTitle>
            <CardDescription className="text-4xl font-bold text-slate-900 dark:text-white">{totalImages}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-300">Itens cadastrados na galeria.</CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500 dark:text-slate-400">Imagens ativas</CardTitle>
            <CardDescription className="text-4xl font-bold text-slate-900 dark:text-white">{activeImages}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-300">Visíveis na galeria.</CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500 dark:text-slate-400">Em uso no modo atual</CardTitle>
            <CardDescription className="text-4xl font-bold text-slate-900 dark:text-white">{imagesInUseCount}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-300">Fotos exibidas para o visitante.</CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">Modo de exibição</CardTitle>
            <CardDescription>
              Escolha se todas as fotos, um grupo ou apenas uma imagem devem aparecer no portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700">
                <input
                  type="radio"
                  name="display-mode"
                  value="ALL"
                  checked={displayMode.mode === "ALL"}
                  onChange={() => setDisplayMode({ mode: "ALL", group: null, imageId: null })}
                  className="h-4 w-4"
                />
                <div>
                  <p className="font-medium">Todas as fotos</p>
                  <p className="text-xs text-slate-500">Exibe todas as imagens visíveis.</p>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700">
                <input
                  type="radio"
                  name="display-mode"
                  value="GROUP"
                  checked={displayMode.mode === "GROUP"}
                  onChange={() => setDisplayMode({ mode: "GROUP", group: groupOptions[0] ?? null, imageId: null })}
                  className="h-4 w-4"
                />
                <div>
                  <p className="font-medium">Grupo específico</p>
                  <p className="text-xs text-slate-500">Se você quer destacar apenas um conjunto.</p>
                </div>
              </label>
              {displayMode.mode === "GROUP" ? (
                <div className="ml-7 space-y-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Selecione o grupo</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                    value={displayMode.group ?? ""}
                    onChange={(event) => setDisplayMode((current) => ({ ...current, group: event.target.value }))}
                  >
                    <option value="" disabled>
                      Escolha um grupo
                    </option>
                    {groupOptions.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700">
                <input
                  type="radio"
                  name="display-mode"
                  value="SINGLE"
                  checked={displayMode.mode === "SINGLE"}
                  onChange={() => setDisplayMode({ mode: "SINGLE", group: null, imageId: backgrounds[0]?.id ?? null })}
                  className="h-4 w-4"
                />
                <div>
                  <p className="font-medium">Uma foto</p>
                  <p className="text-xs text-slate-500">Foco total em um destaque do portal.</p>
                </div>
              </label>
              {displayMode.mode === "SINGLE" ? (
                <div className="ml-7 space-y-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Escolha a foto</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                    value={displayMode.imageId ?? ""}
                    onChange={(event) => setDisplayMode((current) => ({ ...current, imageId: Number(event.target.value) }))}
                  >
                    <option value="" disabled>
                      Selecionar imagem
                    </option>
                    {backgrounds.map((image) => (
                      <option key={image.id} value={image.id}>
                        {image.title || `Imagem #${image.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleSaveDisplayMode} className="px-4">
                Salvar modo de exibição
              </Button>
              {lastSavedMode ? (
                <span className="text-xs text-slate-500">{lastSavedMode}</span>
              ) : (
                <span className="text-xs text-slate-500">Configuração apenas local até integrar com API.</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">Adicionar imagem</CardTitle>
            <CardDescription>
              Um único formulário para incluir novas fotos na galeria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddImage} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-300">URL da imagem</span>
                  <Input
                    placeholder="https://..."
                    value={newImageForm.url}
                    onChange={(event) => setNewImageForm((current) => ({ ...current, url: event.target.value }))}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-300">Upload (simulado)</span>
                  <Input
                    type="file"
                    onChange={(event) =>
                      setNewImageForm((current) => ({ ...current, fileName: event.target.files?.[0]?.name || "" }))
                    }
                  />
                  {newImageForm.fileName ? (
                    <p className="text-xs text-slate-500">Arquivo selecionado: {newImageForm.fileName}</p>
                  ) : null}
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-300">Título (opcional)</span>
                  <Input
                    placeholder="Hero da página inicial"
                    value={newImageForm.title}
                    onChange={(event) => setNewImageForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-300">Grupo (opcional)</span>
                  <Input
                    placeholder="praias, montanhas..."
                    value={newImageForm.groupKey}
                    onChange={(event) => setNewImageForm((current) => ({ ...current, groupKey: event.target.value }))}
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" className="px-4">
                  Adicionar imagem
                </Button>
                <p className="text-xs text-slate-500">As novas imagens entram como visíveis por padrão.</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">Imagens cadastradas</CardTitle>
            <CardDescription>
              Edite título, URL e grupo sem sair da lista. Use os toggles para ocultar ou exibir.
            </CardDescription>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Button variant="secondary" onClick={handleHideAll} className="bg-slate-100 px-4 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                Ocultar todas as fotos
              </Button>
              <Button variant="destructive" onClick={handleRemoveAll} className="px-4">
                Remover todas as fotos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {backgrounds.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma imagem cadastrada. Adicione a primeira acima.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-800">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Imagem</th>
                      <th className="px-4 py-3">Título</th>
                      <th className="px-4 py-3">Grupo</th>
                      <th className="px-4 py-3">URL</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900/50">
                    {backgrounds.map((image) => {
                      const inUse = inUseIds.has(image.id);
                      return (
                        <tr key={image.id} className="align-top">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={image.url} alt={image.title ?? "Imagem"} className="h-full w-full object-cover" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-slate-500">ID #{image.id}</p>
                                {inUse ? (
                                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                                    Em uso
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    Disponível
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={image.title ?? ""}
                              placeholder="Sem título"
                              onChange={(event) => handleUpdateImage(image.id, "title", event.target.value || null)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={image.groupKey ?? ""}
                              placeholder="grupo opcional"
                              onChange={(event) => handleUpdateImage(image.id, "groupKey", event.target.value || null)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input value={image.url} onChange={(event) => handleUpdateImage(image.id, "url", event.target.value)} />
                          </td>
                          <td className="px-4 py-3">
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={image.isVisible}
                                onChange={() => handleToggleVisibility(image.id)}
                                className="h-4 w-4"
                              />
                              {image.isVisible ? "Visível" : "Oculta"}
                            </label>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end">
                              <Button variant="secondary" onClick={() => handleSaveImage(image.id)} className="px-3">
                                Salvar
                              </Button>
                              <Button variant="destructive" onClick={() => handleDeleteImage(image.id)} className="px-3">
                                Excluir
                              </Button>
                              {lastSavedImageId === image.id ? (
                                <span className="text-[11px] text-slate-500">Alterações guardadas localmente.</span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
