"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  MapPin,
  Phone,
  Send,
  User,
  Users,
} from "lucide-react";

const WHATSAPP_NUMBER = "5568999872973";

const initialFormState = {
  name: "",
  phone: "",
  origin: "",
  destination: "",
  departureDate: "",
  returnDate: "",
  people: "",
};

type FormState = typeof initialFormState;

type FormKey = keyof FormState;

type FormErrors = Partial<Record<FormKey, string>>;

type FormStatus =
  | {
      type: "error" | "success";
      message: string;
    }
  | null;

export function QuoteForm() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const peopleOptions = useMemo(
    () => Array.from({ length: 10 }, (_, index) => `${index + 1}`),
    [],
  );

  const handleChange = (field: FormKey) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { value } = event.target;

      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setStatus(null);
    };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) nextErrors.name = "Informe o seu nome.";
    if (!form.phone.trim()) nextErrors.phone = "Compartilhe um número de WhatsApp.";
    if (!form.origin.trim()) nextErrors.origin = "Conte-nos de onde você parte.";
    if (!form.destination.trim()) nextErrors.destination = "Informe para onde deseja viajar.";
    if (!form.departureDate) nextErrors.departureDate = "Escolha a data de ida.";
    if (!form.returnDate) nextErrors.returnDate = "Escolha a data de volta.";
    if (!form.people) nextErrors.people = "Quantas pessoas vão com você?";

    if (form.departureDate && form.returnDate) {
      const departure = new Date(form.departureDate);
      const returning = new Date(form.returnDate);

      if (departure > returning) {
        nextErrors.returnDate = "A volta deve ser após a data de ida.";
      }
    }

    return nextErrors;
  };

  const buildMessage = () => {
    return `Orçamento Evastur\n\nNome: ${form.name}\nCelular: ${form.phone}\nOrigem: ${form.origin}\nDestino: ${form.destination}\nIda: ${form.departureDate}\nVolta: ${form.returnDate}\nPessoas: ${form.people}\n\nObservação: desejo um orçamento completo com as melhores opções.`;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    const validation = validate();

    if (Object.keys(validation).length) {
      setErrors(validation);
      setIsSubmitting(false);
      setStatus({
        type: "error",
        message: "Revise os campos destacados antes de enviar.",
      });
      return;
    }

    const message = buildMessage();
    const encoded = encodeURIComponent(message);
    const redirectUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

    const popup = window.open(redirectUrl, "_blank", "noopener,noreferrer");
    if (!popup) {
      window.location.href = redirectUrl;
    }

    setStatus({
      type: "success",
      message: "Perfeito! Abrimos seu WhatsApp com os detalhes do pedido.",
    });

    setIsSubmitting(false);
    setForm(initialFormState);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-6 rounded-3xl bg-white/90 p-6 text-[color:var(--brand-secondary)] shadow-xl shadow-[rgba(0,27,114,0.08)] ring-1 ring-[color:var(--brand-secondary-soft)]/60 backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-100 dark:ring-white/10 sm:bg-white/95 sm:p-8"
    >
      <div className="space-y-1">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--brand-secondary)]/60 dark:text-slate-300">
          <Send className="size-4" /> Solicite agora
        </span>
        <h2 className="text-xl font-semibold sm:text-2xl">Monte seu orçamento</h2>
        <p className="text-sm text-[color:var(--brand-secondary)]/70 dark:text-slate-300">
          Informe os detalhes da viagem e nossa equipe retorna com sugestões personalizadas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          icon={<User className="size-4" />}
          label="Nome completo"
          error={errors.name}
        >
          <input
            id="quote-name"
            name="name"
            value={form.name}
            onChange={handleChange("name")}
            placeholder="Como devemos te chamar?"
            autoComplete="name"
            className="h-11 w-full rounded-xl border border-[color:var(--brand-secondary-soft)] bg-white/85 px-3 text-sm font-medium text-[color:var(--brand-secondary)] placeholder:text-[color:var(--brand-secondary)]/40 focus:border-[color:var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
            type="text"
          />
        </Field>

        <Field
          icon={<Phone className="size-4" />}
          label="Número de celular"
          error={errors.phone}
        >
          <input
            id="quote-phone"
            name="phone"
            value={form.phone}
            onChange={handleChange("phone")}
            placeholder="(68) 99255-2607"
            autoComplete="tel"
            className="h-11 w-full rounded-xl border border-[color:var(--brand-secondary-soft)] bg-white/85 px-3 text-sm font-medium text-[color:var(--brand-secondary)] placeholder:text-[color:var(--brand-secondary)]/40 focus:border-[color:var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
            type="tel"
          />
        </Field>

        <Field
          icon={<MapPin className="size-4" />}
          label="Cidade de origem"
          error={errors.origin}
        >
          <input
            id="quote-origin"
            name="origin"
            value={form.origin}
            onChange={handleChange("origin")}
            placeholder="Cidade de saída"
            autoComplete="address-level2"
            className="h-11 w-full rounded-xl border border-[color:var(--brand-secondary-soft)] bg-white/85 px-3 text-sm font-medium text-[color:var(--brand-secondary)] placeholder:text-[color:var(--brand-secondary)]/40 focus:border-[color:var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
            type="text"
          />
        </Field>

        <Field
          icon={<MapPin className="size-4" />}
          label="Destino"
          error={errors.destination}
        >
          <input
            id="quote-destination"
            name="destination"
            value={form.destination}
            onChange={handleChange("destination")}
            placeholder="Para onde deseja ir?"
            className="h-11 w-full rounded-xl border border-[color:var(--brand-secondary-soft)] bg-white/85 px-3 text-sm font-medium text-[color:var(--brand-secondary)] placeholder:text-[color:var(--brand-secondary)]/40 focus:border-[color:var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
            type="text"
          />
        </Field>

        <Field
          icon={<CalendarDays className="size-4" />}
          label="Data de ida"
          error={errors.departureDate}
        >
          <input
            id="quote-departure"
            name="departureDate"
            value={form.departureDate}
            onChange={handleChange("departureDate")}
            className="h-11 w-full rounded-xl border border-[color:var(--brand-secondary-soft)] bg-white/85 px-3 text-sm font-medium text-[color:var(--brand-secondary)] placeholder:text-[color:var(--brand-secondary)]/40 focus:border-[color:var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
            type="date"
          />
        </Field>

        <Field
          icon={<CalendarDays className="size-4" />}
          label="Data de volta"
          error={errors.returnDate}
        >
          <input
            id="quote-return"
            name="returnDate"
            value={form.returnDate}
            onChange={handleChange("returnDate")}
            className="h-11 w-full rounded-xl border border-[color:var(--brand-secondary-soft)] bg-white/85 px-3 text-sm font-medium text-[color:var(--brand-secondary)] placeholder:text-[color:var(--brand-secondary)]/40 focus:border-[color:var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
            type="date"
            min={form.departureDate || undefined}
          />
        </Field>

        <Field
          icon={<Users className="size-4" />}
          label="Quantidade de pessoas"
          error={errors.people}
        >
          <select
            id="quote-people"
            name="people"
            value={form.people}
            onChange={handleChange("people")}
            className="h-11 w-full rounded-xl border border-[color:var(--brand-secondary-soft)] bg-white/85 px-3 text-sm font-medium text-[color:var(--brand-secondary)] focus:border-[color:var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
          >
            <option value="" disabled>
              Selecionar
            </option>
            {peopleOptions.map((option) => (
              <option key={option} value={option} className="text-[color:var(--brand-secondary)]">
                {option} pessoa{option === "1" ? "" : "s"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ea002a] via-[#c4002d] to-[#001b72] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[rgba(0,27,114,0.25)] transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary)]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
        disabled={isSubmitting}
      >
        <Send className="size-4" />
        {isSubmitting ? "Enviando..." : "Enviar para o WhatsApp"}
      </button>

      {status && (
        <p
          className={`text-sm font-medium ${
            status.type === "success" ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-rose-300"
          }`}
        >
          {status.message}
        </p>
      )}
    </form>
  );
}

type FieldProps = {
  children: ReactNode;
  icon: ReactNode;
  label: string;
  error?: string;
};

function Field({ children, icon, label, error }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-[color:var(--brand-secondary)] dark:text-slate-200">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-secondary)]/60 dark:text-slate-300">
        {icon}
        {label}
      </span>
      <div className={`flex w-full flex-col gap-1 ${error ? "text-red-600 dark:text-rose-300" : "text-[color:var(--brand-secondary)] dark:text-slate-100"}`}>
        {children}
        {error && <span className="text-xs font-medium">{error}</span>}
      </div>
    </label>
  );
}
