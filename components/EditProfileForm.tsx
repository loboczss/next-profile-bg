"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type ProfileFormValues = {
  fullName: string;
  username: string;
  email: string;
  password: string;
};

type FieldErrors = Partial<Record<keyof Omit<ProfileFormValues, "password"> | "password", string[]>>;

type EditProfileFormProps = {
  initialData: {
    fullName: string;
    username: string;
    email: string;
  };
};

const normalizeText = (value: string) => value.trim();

export function EditProfileForm({ initialData }: EditProfileFormProps) {
  const router = useRouter();
  const sanitizedInitial = useMemo(
    () => ({
      fullName: normalizeText(initialData.fullName),
      username: normalizeText(initialData.username),
      email: initialData.email.trim(),
    }),
    [initialData.email, initialData.fullName, initialData.username],
  );
  const [referenceValues, setReferenceValues] = useState(sanitizedInitial);
  const [values, setValues] = useState<ProfileFormValues>({
    fullName: sanitizedInitial.fullName,
    username: sanitizedInitial.username,
    email: sanitizedInitial.email,
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setReferenceValues(sanitizedInitial);
    setValues({
      fullName: sanitizedInitial.fullName,
      username: sanitizedInitial.username,
      email: sanitizedInitial.email,
      password: "",
    });
  }, [sanitizedInitial]);

  const hasChanges = useMemo(() => {
    const normalized = {
      fullName: normalizeText(values.fullName),
      username: normalizeText(values.username),
      email: values.email.trim(),
    };

    return (
      normalized.fullName !== referenceValues.fullName ||
      normalized.username !== referenceValues.username ||
      normalized.email.toLowerCase() !== referenceValues.email.toLowerCase() ||
      values.password.length > 0
    );
  }, [referenceValues, values]);

  const handleChange = (field: keyof ProfileFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setValues((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = () => {
    setValues({
      fullName: referenceValues.fullName,
      username: referenceValues.username,
      email: referenceValues.email,
      password: "",
    });
    setFieldErrors({});
    setMessage(null);
    setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFieldErrors({});
    setMessage(null);
    setError(null);

    const payload: Record<string, string> = {
      fullName: normalizeText(values.fullName),
      username: normalizeText(values.username),
      email: values.email.trim(),
    };

    if (values.password.length > 0) {
      payload.password = values.password;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data?.fieldErrors && typeof data.fieldErrors === "object") {
            setFieldErrors(data.fieldErrors);
          }
          setError(data?.error ?? "Não foi possível salvar as alterações.");
          return;
        }

        setMessage(data?.message ?? "Perfil atualizado com sucesso.");
        setReferenceValues({
          fullName: payload.fullName,
          username: payload.username,
          email: payload.email,
        });
        setValues({
          fullName: payload.fullName,
          username: payload.username,
          email: payload.email,
          password: "",
        });
        router.refresh();
      } catch (err) {
        console.error(err);
        setError("Erro inesperado ao salvar as alterações.");
      }
    });
  };

  return (
    <div className="rounded-lg bg-white/80 p-6 shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Informações pessoais</h2>
        <p className="mt-1 text-sm text-slate-600">
          Atualize os dados da sua conta. A senha é opcional e só será alterada se você preencher o campo correspondente.
        </p>
      </div>

      {message ? (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4" />
          <span>{message}</span>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <XCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Nome completo
            <input
              required
              value={values.fullName}
              onChange={handleChange("fullName")}
              className="rounded-md border border-slate-300 px-3 py-2 text-base shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Seu nome"
            />
            {fieldErrors.fullName?.length ? (
              <span className="text-xs text-red-600">{fieldErrors.fullName[0]}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Usuário
            <input
              required
              value={values.username}
              onChange={handleChange("username")}
              className="rounded-md border border-slate-300 px-3 py-2 text-base shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="nome-de-usuario"
            />
            {fieldErrors.username?.length ? (
              <span className="text-xs text-red-600">{fieldErrors.username[0]}</span>
            ) : null}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            E-mail
            <input
              required
              type="email"
              value={values.email}
              onChange={handleChange("email")}
              className="rounded-md border border-slate-300 px-3 py-2 text-base shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="voce@exemplo.com"
            />
            {fieldErrors.email?.length ? (
              <span className="text-xs text-red-600">{fieldErrors.email[0]}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Nova senha
            <input
              type="password"
              value={values.password}
              onChange={handleChange("password")}
              className="rounded-md border border-slate-300 px-3 py-2 text-base shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="••••••••"
            />
            <span className="text-xs text-slate-500">
              Deixe em branco para manter a senha atual.
            </span>
            {fieldErrors.password?.length ? (
              <span className="text-xs text-red-600">{fieldErrors.password[0]}</span>
            ) : null}
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={resetForm}
            disabled={!hasChanges || isPending}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!hasChanges || isPending}
            className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              "Salvar alterações"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
