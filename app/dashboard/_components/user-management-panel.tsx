"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Edit,
  Plus,
  RefreshCcw,
  RotateCcwKey,
  Search,
  ShieldHalf,
  ShieldPlus,
  ShieldQuestion,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  ActionState,
  createUserAction,
  deleteUserAction,
  resetUserPasswordAction,
  updateUserAction,
} from "../user-actions";

export type DashboardUser = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

const permissionOptions = [
  {
    value: "admin",
    label: "Administrador",
    description: "Acesso completo às ferramentas do painel.",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Pode gerenciar conteúdos, destinos e mídias.",
  },
  {
    value: "viewer",
    label: "Visualizador",
    description: "Acesso somente leitura às informações.",
  },
  {
    value: "user",
    label: "Usuário",
    description: "Permissões padrão da plataforma.",
  },
] as const;

type RoleValue = (typeof permissionOptions)[number]["value"];

interface FieldErrors {
  [key: string]: string[] | undefined;
}

interface UserManagementPanelProps {
  users: DashboardUser[];
  total: number;
  page: number;
  pageSize: number;
  searchTerm: string;
}

const defaultCreateState = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  role: "editor" as RoleValue,
  imageUrl: "",
};

// Painel completo de administração de usuários com busca, paginação e ações inline.
export function UserManagementPanel({ users, total, page, pageSize, searchTerm }: UserManagementPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(searchTerm);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(defaultCreateState);
  const [createErrors, setCreateErrors] = useState<FieldErrors>({});
  const [isCreatePending, startCreateTransition] = useTransition();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({
    id: 0,
    fullName: "",
    username: "",
    email: "",
    role: "user" as RoleValue,
    imageUrl: "",
    password: "",
  });
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [isEditPending, startEditTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isResetPending, startResetTransition] = useTransition();

  useEffect(() => {
    setSearchValue(searchTerm);
  }, [searchTerm]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const updateQuery = (nextPage: number, query?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query !== undefined) {
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      params.set("page", "1");
    } else {
      params.set("page", String(nextPage));
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateQuery(1, searchValue.trim());
  };

  const openEdit = (user: DashboardUser) => {
    setEditingId(user.id);
    setEditDraft({
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: permissionOptions.find((option) => option.value === user.role)?.value ?? "user",
      imageUrl: user.imageUrl ?? "",
      password: "",
    });
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditErrors({});
    setEditDraft({
      id: 0,
      fullName: "",
      username: "",
      email: "",
      role: "user" as RoleValue,
      imageUrl: "",
      password: "",
    });
  };

  const handleCreateSubmit = () => {
    setCreateErrors({});
    startCreateTransition(async () => {
      const payload = {
        ...createForm,
        role: createForm.role,
        imageUrl: createForm.imageUrl?.trim() || undefined,
      };

      const result = await createUserAction(payload);
      handleActionFeedback(result, () => {
        toast.success(result.message);
        setCreateForm(defaultCreateState);
        setCreateOpen(false);
        router.refresh();
      }, setCreateErrors);
    });
  };

  const handleEditSubmit = () => {
    if (!editingId) return;
    setEditErrors({});

    startEditTransition(async () => {
      const payload = {
        id: editingId,
        fullName: editDraft.fullName,
        username: editDraft.username,
        email: editDraft.email,
        role: editDraft.role,
        password: editDraft.password,
        imageUrl: editDraft.imageUrl?.trim() || undefined,
      };

      const result = await updateUserAction(payload);
      handleActionFeedback(result, () => {
        toast.success(result.message);
        cancelEdit();
        router.refresh();
      }, setEditErrors);
    });
  };

  const handleDelete = (id: number) => {
    startDeleteTransition(async () => {
      const result = await deleteUserAction(id);
      if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleResetPassword = (id: number) => {
    startResetTransition(async () => {
      const result = await resetUserPasswordAction(id);
      if (result.status === "success") {
        toast.success(result.message, {
          description: result.data?.password ? `Senha temporária: ${result.data.password}` : undefined,
        });
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const isCreateDisabled = isCreatePending;
  const isEditDisabled = isEditPending;

  return (
    <section id="users" className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Gestão de usuários</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controle total de contas, permissões e redefinição de credenciais.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-blue-500">
              <Plus className="mr-2 h-4 w-4" /> Novo usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl border-0 bg-slate-50/90 p-6 shadow-2xl backdrop-blur-xl dark:bg-slate-900/90">
            <DialogHeader>
              <DialogTitle>Criar novo usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para liberar o acesso ao painel administrativo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 pt-2">
              <Field
                label="Nome completo"
                value={createForm.fullName}
                onChange={(value) => setCreateForm((state) => ({ ...state, fullName: value }))}
                error={createErrors.fullName?.[0]}
              />
              <Field
                label="Usuário"
                value={createForm.username}
                onChange={(value) => setCreateForm((state) => ({ ...state, username: value }))}
                helper="Use apenas letras, números e pontos."
                error={createErrors.username?.[0]}
              />
              <Field
                label="E-mail"
                value={createForm.email}
                onChange={(value) => setCreateForm((state) => ({ ...state, email: value }))}
                error={createErrors.email?.[0]}
              />
              <Field
                label="Senha temporária"
                value={createForm.password}
                onChange={(value) => setCreateForm((state) => ({ ...state, password: value }))}
                helper="A senha pode ser alterada pelo usuário posteriormente."
                error={createErrors.password?.[0]}
              />
              <RoleSelector
                value={createForm.role}
                onChange={(value) => setCreateForm((state) => ({ ...state, role: value }))}
                error={createErrors.role?.[0]}
              />
              <Field
                label="Foto (URL)"
                value={createForm.imageUrl}
                onChange={(value) => setCreateForm((state) => ({ ...state, imageUrl: value }))}
                helper="Opcional. Recomenda-se imagens em 512x512px."
                error={createErrors.imageUrl?.[0]}
              />
            </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button variant="outline" className="rounded-xl">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                onClick={handleCreateSubmit}
                disabled={isCreateDisabled}
                className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
              >
                {isCreatePending ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col gap-3 rounded-3xl border border-white/60 bg-white/70 p-4 shadow-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 md:flex-row md:items-center"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Buscar por nome, usuário ou e-mail"
            className="h-11 rounded-xl border-0 bg-white pl-10 pr-4 text-sm shadow-inner dark:bg-slate-900"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900">
            Filtrar
          </Button>
          {searchTerm ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => updateQuery(1, "")}
            >
              Limpar
            </Button>
          ) : null}
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
        <table className="min-w-full divide-y divide-white/40 text-sm dark:divide-slate-800">
          <thead className="bg-white/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Contato</th>
              <th className="px-6 py-4">Permissão</th>
              <th className="px-6 py-4">Atualizado</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/40 dark:divide-slate-800">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isEditing = editingId === user.id;
                return (
                  <tr
                    key={user.id}
                    onDoubleClick={() => openEdit(user)}
                    className="transition hover:bg-white/70 dark:hover:bg-slate-900"
                  >
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-2">
                        {isEditing ? (
                          <InlineInput
                            value={editDraft.fullName}
                            onChange={(value) => setEditDraft((state) => ({ ...state, fullName: value }))}
                            placeholder="Nome completo"
                            error={editErrors.fullName?.[0]}
                          />
                        ) : (
                          <p className="font-semibold text-slate-900 dark:text-white">{user.fullName}</p>
                        )}
                        {isEditing ? (
                          <InlineInput
                            value={editDraft.username}
                            onChange={(value) => setEditDraft((state) => ({ ...state, username: value }))}
                            placeholder="Usuário"
                            error={editErrors.username?.[0]}
                          />
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
                        )}
                        {isEditing ? (
                          <InlineInput
                            value={editDraft.imageUrl}
                            onChange={(value) => setEditDraft((state) => ({ ...state, imageUrl: value }))}
                            placeholder="URL da foto (opcional)"
                            error={editErrors.imageUrl?.[0]}
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {isEditing ? (
                        <div className="space-y-2">
                          <InlineInput
                            value={editDraft.email}
                            onChange={(value) => setEditDraft((state) => ({ ...state, email: value }))}
                            placeholder="E-mail"
                            error={editErrors.email?.[0]}
                          />
                          <InlineInput
                            value={editDraft.password}
                            onChange={(value) => setEditDraft((state) => ({ ...state, password: value }))}
                            placeholder="Nova senha (opcional)"
                            error={editErrors.password?.[0]}
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {isEditing ? (
                        <RoleSelector
                          value={editDraft.role}
                          onChange={(value) => setEditDraft((state) => ({ ...state, role: value }))}
                          compact
                          error={editErrors.role?.[0]}
                        />
                      ) : (
                        <PermissionBadge role={user.role} />
                      )}
                    </td>
                    <td className="px-6 py-4 align-top text-xs text-slate-500 dark:text-slate-400">
                      Atualizado em {new Date(user.updatedAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={cancelEdit}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                            onClick={handleEditSubmit}
                            disabled={isEditDisabled}
                          >
                            {isEditPending ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-lg"
                            onClick={() => openEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-lg text-amber-600 hover:text-amber-500"
                            onClick={() => handleResetPassword(user.id)}
                            disabled={isResetPending}
                          >
                            <RotateCcwKey className="h-4 w-4" />
                          </Button>
                          <ConfirmDeleteButton
                            onConfirm={() => handleDelete(user.id)}
                            disabled={isDeletePending}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/60 bg-white/70 px-6 py-4 text-xs text-slate-500 shadow-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400 sm:flex-row">
        <span>
          Exibindo {users.length} de {total} usuários
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => updateQuery(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => updateQuery(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Próxima
          </Button>
        </div>
      </footer>
    </section>
  );
}

function handleActionFeedback(
  result: ActionState,
  onSuccess: () => void,
  setErrors: (errors: FieldErrors) => void,
) {
  if (result.status === "success") {
    onSuccess();
    return;
  }

  toast.error(result.message);
  if (result.errors) {
    setErrors(result.errors);
  }
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  error?: string;
}

function Field({ label, value, onChange, helper, error }: FieldProps) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-11 rounded-xl border-0 bg-white px-4 py-2 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-900",
          error ? "ring-2 ring-rose-500" : "",
        )}
      />
      {helper ? <span className="text-xs text-slate-400 dark:text-slate-500">{helper}</span> : null}
      {error ? <span className="text-xs font-semibold text-rose-500">{error}</span> : null}
    </label>
  );
}

interface RoleSelectorProps {
  value: (typeof permissionOptions)[number]["value"];
  onChange: (value: (typeof permissionOptions)[number]["value"]) => void;
  error?: string;
  compact?: boolean;
}

function RoleSelector({ value, onChange, error, compact }: RoleSelectorProps) {
  return (
    <div className="space-y-3">
      {!compact ? (
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Permissão</span>
      ) : null}
      <div
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-1" : "grid-cols-2",
        )}
      >
        {permissionOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-2xl border px-3 py-3 text-left text-sm transition",
              value === option.value
                ? "border-blue-500 bg-blue-500/10 text-blue-600 shadow-lg dark:border-blue-400 dark:bg-blue-500/20 dark:text-blue-200"
                : "border-white/40 bg-white/70 text-slate-600 hover:border-blue-400 hover:bg-blue-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300",
            )}
          >
            <p className="font-semibold">{option.label}</p>
            <p className="text-xs opacity-70">{option.description}</p>
          </button>
        ))}
      </div>
      {error ? <span className="text-xs font-semibold text-rose-500">{error}</span> : null}
    </div>
  );
}

interface InlineInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

function InlineInput({ value, onChange, placeholder, error }: InlineInputProps) {
  return (
    <div className="space-y-1">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border border-transparent bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none dark:bg-slate-900/70 dark:text-slate-200",
          error ? "border-rose-500" : "",
        )}
      />
      {error ? <p className="text-xs font-semibold text-rose-500">{error}</p> : null}
    </div>
  );
}

interface PermissionBadgeProps {
  role: string;
}

function PermissionBadge({ role }: PermissionBadgeProps) {
  const option = permissionOptions.find((item) => item.value === role);
  const label = option?.label ?? role;

  const icon = (
    role === "admin" ? <ShieldPlus className="h-4 w-4" /> : role === "editor" ? <ShieldHalf className="h-4 w-4" /> : <ShieldQuestion className="h-4 w-4" />
  );

  const colorClass =
    role === "admin"
      ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200"
      : role === "editor"
        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
        : role === "viewer"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300";

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold", colorClass)}>
      {icon}
      {label}
    </span>
  );
}

interface ConfirmDeleteButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
}

function ConfirmDeleteButton({ onConfirm, disabled }: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-lg text-rose-600 hover:text-rose-500"
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border border-rose-200 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-rose-500/40 dark:bg-slate-900/90">
        <DialogHeader>
          <DialogTitle>Confirmar exclusão</DialogTitle>
          <DialogDescription>
            Essa ação removerá o usuário definitivamente. Deseja continuar?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="rounded-xl">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            className="rounded-xl bg-rose-600 text-white hover:bg-rose-500"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            Excluir usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
