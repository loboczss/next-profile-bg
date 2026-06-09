import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Globe,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const wppText = encodeURIComponent(
  "Olá! Acessei a página de contato e gostaria de falar com um consultor Evastur."
);
const wppLink = `https://wa.me/5568999872973?text=${wppText}`;

const directChannels = [
  {
    icon: Phone,
    label: "Telefone",
    value: "+55 (68) 9 99987-2973",
    href: "tel:+5568999872973",
    color: "hsl(232 100% 23%)",
    bg: "hsl(232 100% 23% / 0.08)",
  },
  {
    icon: Mail,
    label: "E-mail",
    value: "contato@evastur.com.br",
    href: "mailto:contato@evastur.com.br",
    color: "hsl(350 100% 45%)",
    bg: "hsl(350 100% 45% / 0.08)",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp Concierge",
    value: "+55 (68) 99987-2973",
    href: wppLink,
    color: "#16a34a",
    bg: "#16a34a14",
  },
  {
    icon: MapPin,
    label: "Endereço",
    value: "Av. Joaquim Tavora, 213 – Baixa, Cruzeiro do Sul/AC",
    href: "https://maps.google.com/?q=Cruzeiro+do+Sul+Acre",
    color: "hsl(232 100% 23%)",
    bg: "hsl(232 100% 23% / 0.08)",
  },
  {
    icon: Clock,
    label: "Horário de atendimento",
    value: "Segunda a sexta, das 8h às 18h (ACRE)",
    href: null,
    color: "hsl(45 93% 45%)",
    bg: "hsl(45 93% 45% / 0.08)",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.09, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

export default function ContactPage() {
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    destination: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    setLoading(true);
    // Simula carregamento rápido e mostra sucesso + abre WhatsApp
    setTimeout(() => {
      const parts = [
        `Olá! Meu nome é ${form.name}.`,
        form.email ? `E-mail: ${form.email}` : "",
        form.phone ? `Telefone: ${form.phone}` : "",
        form.destination ? `Destino desejado: ${form.destination}` : "",
        form.message ? `Mensagem: ${form.message}` : "",
      ].filter(Boolean);

      const wppMsg = encodeURIComponent(parts.join("\n"));
      window.open(`https://wa.me/5568999872973?text=${wppMsg}`, "_blank");

      setSent(true);
      setForm({ name: "", email: "", phone: "", destination: "", message: "" });
      toast({
        title: "Redirecionando para o WhatsApp! 🎉",
        description: "Sua mensagem será enviada ao concierge Evastur.",
      });
      setLoading(false);
      setTimeout(() => setSent(false), 8000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, hsl(220 40% 97%) 0%, hsl(232 60% 95%) 50%, hsl(220 40% 97%) 100%)",
        }}
      >
        {/* Background decoration */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 0%, hsl(232 100% 23% / 0.06) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.04]"
          style={{ background: "hsl(232 100% 23%)", filter: "blur(80px)" }}
        />

        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto"
          >
            {/* Eyebrow pill */}
            <motion.div custom={0} variants={fadeUp} className="mb-6 inline-flex">
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border"
                style={{
                  color: "hsl(232 100% 23%)",
                  background: "hsl(232 100% 23% / 0.07)",
                  borderColor: "hsl(232 100% 23% / 0.15)",
                }}
              >
                <Sparkles size={14} />
                Concierge Evastur
              </span>
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-5"
            >
              Como podemos transformar{" "}
              <span
                className="relative inline-block"
                style={{ color: "hsl(232 100% 23%)" }}
              >
                sua próxima jornada?
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(to right, hsl(350 100% 45%), hsl(232 100% 23%))",
                  }}
                />
              </span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto"
            >
              Nossa equipe está pronta para desenhar roteiros personalizados,
              sugerir experiências exclusivas e cuidar de cada detalhe da sua
              viagem. Conte-nos seus planos e retornaremos em até um dia útil.
            </motion.p>

            {/* Quick action pills */}
            <motion.div
              custom={3}
              variants={fadeUp}
              className="mt-8 flex flex-wrap justify-center gap-3"
            >
              <a
                href={wppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
                style={{ background: "#16a34a" }}
              >
                <MessageCircle size={15} />
                Chamar no WhatsApp
              </a>
              <a
                href="#form-contato"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  color: "hsl(232 100% 23%)",
                  borderColor: "hsl(232 100% 23% / 0.25)",
                  background: "hsl(232 100% 23% / 0.05)",
                }}
              >
                <Send size={14} />
                Enviar mensagem
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── MAIN CONTENT: FORM + CHANNELS ── */}
      <section
        id="form-contato"
        className="py-20 lg:py-28"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_400px] gap-10 xl:gap-16 max-w-6xl mx-auto">
            {/* ── LEFT: FORM ── */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <div className="bg-card rounded-3xl border border-border shadow-card p-8 lg:p-10">
                <div className="mb-7">
                  <h2 className="text-2xl font-bold text-foreground mb-1.5">
                    Envie uma mensagem
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Preencha o formulário e nossa equipe retornará com propostas
                    personalizadas, combinando destinos, hospedagens e
                    experiências que reflitam o seu estilo de viagem.
                  </p>
                </div>

                {sent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 py-12 text-center"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "hsl(142 76% 36% / 0.12)" }}
                    >
                      <CheckCircle2 size={32} style={{ color: "#16a34a" }} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">
                        Mensagem enviada com sucesso! 🎉
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Nossa equipe entrará em contato em até 1 dia útil.
                      </p>
                    </div>
                    <a
                      href={wppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mt-2"
                      style={{ background: "#16a34a" }}
                    >
                      <MessageCircle size={14} />
                      Também pode nos chamar no WhatsApp
                    </a>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Nome completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Como devemos chamá-lo(a)?"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 text-sm transition-all"
                        style={{ focusRingColor: "hsl(232 100% 23%)" } as any}
                      />
                    </div>

                    {/* Email + Phone row */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          E-mail <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="voce@email.com"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Telefone ou WhatsApp
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="(68) 98765-4321"
                          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 text-sm transition-all"
                        />
                      </div>
                    </div>

                    {/* Destination */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Destino desejado
                      </label>
                      <input
                        type="text"
                        name="destination"
                        value={form.destination}
                        onChange={handleChange}
                        placeholder="Ex.: Maldivas, Itália, Patagônia"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 text-sm transition-all"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Conte-nos mais sobre a experiência dos sonhos
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Preferências, datas aproximadas, número de viajantes, ocasiões especiais..."
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 text-sm transition-all resize-none"
                      />
                    </div>

                    {/* Footer + Submit */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                        Ao enviar, você concorda em receber contato da equipe
                        Evastur. Seus dados são tratados conforme a nossa
                        política de privacidade.
                      </p>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm text-white shadow-md hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap disabled:opacity-60 shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, hsl(350 100% 45%), hsl(350 100% 38%))",
                        }}
                      >
                        {loading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={15} />
                        )}
                        {loading ? "Enviando..." : "Enviar mensagem"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>

            {/* ── RIGHT: CHANNELS + INSPIRATION ── */}
            <div className="flex flex-col gap-6">
              {/* Direct channels card */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="bg-card rounded-3xl border border-border shadow-card p-7"
              >
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Canais de contato direto
                </h3>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  Prefere falar imediatamente? Escolha o canal ideal para você e
                  fale com nosso concierge dedicado.
                </p>

                <div className="space-y-4">
                  {directChannels.map((ch, i) => {
                    const content = (
                      <div
                        key={i}
                        className="flex items-start gap-3.5 group"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105"
                          style={{ background: ch.bg }}
                        >
                          <ch.icon size={18} style={{ color: ch.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                            {ch.label}
                          </p>
                          <p
                            className="text-sm font-semibold text-foreground leading-snug"
                            style={ch.href ? { color: ch.color } : undefined}
                          >
                            {ch.value}
                          </p>
                        </div>
                      </div>
                    );

                    return ch.href ? (
                      <a
                        key={i}
                        href={ch.href}
                        target={ch.href.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="block rounded-xl p-2 -mx-2 hover:bg-secondary/50 transition-colors cursor-pointer"
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={i} className="rounded-xl p-2 -mx-2">
                        {content}
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Inspiration card */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="rounded-3xl border p-6"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(232 100% 23% / 0.04) 0%, hsl(232 100% 23% / 0.08) 100%)",
                  borderColor: "hsl(232 100% 23% / 0.12)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={16} style={{ color: "hsl(232 100% 23%)" }} />
                  <h4 className="font-semibold text-foreground text-sm">
                    Precisa de inspiração imediata?
                  </h4>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Explore nossos{" "}
                  <Link
                    to="/destinos"
                    className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
                    style={{ color: "hsl(232 100% 23%)" }}
                  >
                    destinos
                  </Link>{" "}
                  favoritos ou leia mais{" "}
                  <Link
                    to="/sobre"
                    className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
                    style={{ color: "hsl(350 100% 45%)" }}
                  >
                    sobre nossa curadoria
                  </Link>{" "}
                  antes de conversar com a equipe.
                </p>
                <Link
                  to="/destinos"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2.5 duration-200"
                  style={{ color: "hsl(232 100% 23%)" }}
                >
                  Ver todos os destinos
                  <ArrowRight size={14} />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
