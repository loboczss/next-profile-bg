"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  Phone,
  Send,
  User,
  Users,
} from "lucide-react";

const WHATSAPP_NUMBER = "5568992552607";

const baseFieldClasses =
  "flex w-full items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white shadow-[0_18px_45px_-24px_rgba(15,23,42,0.65)] backdrop-blur transition focus-within:border-white/40 focus-within:bg-white/15 focus-within:shadow-[0_24px_55px_-30px_rgba(14,165,233,0.65)] sm:text-base";

const inputClasses =
  "h-11 w-full bg-transparent text-white placeholder:text-white/60 focus:outline-none";

const labelClasses = "text-xs font-medium uppercase tracking-wide text-white/70";

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

const formMotion = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
};

const fieldMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const errorMotion = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export function QuoteForm() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<
    | {
        type: "error" | "success";
        message: string;
      }
    | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const peopleOptions = useMemo(() => {
    return Array.from({ length: 10 }, (_, index) => `${index + 1}`);
  }, []);

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

    setErrors({});

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
    <motion.form
      {...formMotion}
      transition={{ duration: 0.6, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="relative w-full overflow-hidden rounded-3xl border border-white/20 bg-white/15 p-6 shadow-[0_35px_120px_-45px_rgba(15,23,42,0.9)] backdrop-blur-xl sm:p-7 md:p-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-blue-500/10 to-purple-500/10" />
      <div className="pointer-events-none absolute -left-10 top-24 size-36 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-14 size-44 rounded-full bg-purple-400/15 blur-[120px]" />

      <div className="relative flex flex-col gap-2 pb-6 text-white">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur">
          <Send className="size-3.5" /> Solicite agora
        </span>
        <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">Monte seu orçamento personalizado</h2>
        <p className="text-sm text-white/80 sm:text-base">
          Informe os detalhes da sua viagem e nossa equipe retorna com as melhores opções.
        </p>
      </div>

      <div className="relative grid gap-4 sm:grid-cols-2">
        <Field
          icon={<User className="size-4 text-white/70" />}
          label="Nome da pessoa"
          motionIndex={0}
          error={errors.name}
        >
          <input
            id="quote-name"
            name="name"
            value={form.name}
            onChange={handleChange("name")}
            placeholder="Como devemos te chamar?"
            autoComplete="name"
            className={inputClasses}
            type="text"
          />
        </Field>

        <Field
          icon={<Phone className="size-4 text-white/70" />}
          label="Número de celular"
          motionIndex={1}
          error={errors.phone}
        >
          <input
            id="quote-phone"
            name="phone"
            value={form.phone}
            onChange={handleChange("phone")}
            placeholder="(68) 99255-2607"
            autoComplete="tel"
            className={inputClasses}
            type="tel"
          />
        </Field>

        <Field
          icon={<MapPin className="size-4 text-white/70" />}
          label="De onde"
          motionIndex={2}
          error={errors.origin}
        >
          <input
            id="quote-origin"
            name="origin"
            value={form.origin}
            onChange={handleChange("origin")}
            placeholder="Cidade de saída"
            autoComplete="address-level2"
            className={inputClasses}
            type="text"
          />
        </Field>

        <Field
          icon={<MapPin className="size-4 text-white/70" />}
          label="Para onde"
          motionIndex={3}
          error={errors.destination}
        >
          <input
            id="quote-destination"
            name="destination"
            value={form.destination}
            onChange={handleChange("destination")}
            placeholder="Destino dos sonhos"
            className={inputClasses}
            type="text"
          />
        </Field>

        <Field
          icon={<CalendarDays className="size-4 text-white/70" />}
          label="Data de ida"
          motionIndex={4}
          error={errors.departureDate}
        >
          <input
            id="quote-departure"
            name="departureDate"
            value={form.departureDate}
            onChange={handleChange("departureDate")}
            className={inputClasses}
            type="date"
          />
        </Field>

        <Field
          icon={<CalendarDays className="size-4 text-white/70" />}
          label="Data de volta"
          motionIndex={5}
          error={errors.returnDate}
        >
          <input
            id="quote-return"
            name="returnDate"
            value={form.returnDate}
            onChange={handleChange("returnDate")}
            className={inputClasses}
            type="date"
            min={form.departureDate || undefined}
          />
        </Field>

        <Field
          icon={<Users className="size-4 text-white/70" />}
          label="Quantidade de pessoas"
          motionIndex={6}
          error={errors.people}
        >
          <select
            id="quote-people"
            name="people"
            value={form.people}
            onChange={handleChange("people")}
            className={`${inputClasses} pr-8`}
          >
            <option value="" disabled>
              Selecionar
            </option>
            {peopleOptions.map((option) => (
              <option key={option} value={option} className="text-slate-900">
                {option} pessoa{option === "1" ? "" : "s"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <motion.button
        type="submit"
        className="group relative mt-6 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-purple-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-sky-200/80 focus:ring-offset-2 focus:ring-offset-slate-900"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        disabled={isSubmitting}
      >
        <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <Send className="size-4" />
        {isSubmitting ? "Enviando..." : "Enviar"}
      </motion.button>

      <AnimatePresence>
        {status && (
          <motion.p
            key={status.message}
            {...errorMotion}
            transition={{ duration: 0.25 }}
            className={`mt-4 text-center text-sm font-medium ${
              status.type === "success" ? "text-emerald-100" : "text-red-200"
            }`}
          >
            {status.message}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.form>
  );
}

type FieldProps = {
  children: ReactNode;
  icon: ReactNode;
  label: string;
  motionIndex: number;
  error?: string;
};

function Field({ children, icon, label, motionIndex, error }: FieldProps) {
  return (
    <motion.div
      {...fieldMotion}
      transition={{ duration: 0.45, delay: 0.05 * motionIndex, ease: "easeOut" }}
      className="flex flex-col gap-2"
    >
      <label className={labelClasses}>{label}</label>
      <div className={`${baseFieldClasses} ${error ? "border-red-300/70 bg-red-500/10" : ""}`}>
        <span className="shrink-0">
          {icon}
        </span>
        {children}
      </div>
      <AnimatePresence>
        {error && (
          <motion.span
            {...errorMotion}
            transition={{ duration: 0.25 }}
            className="text-xs font-medium text-red-200"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
