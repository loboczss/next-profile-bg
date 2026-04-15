import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2, Globe, MapPin, Anchor, Layers3 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DestinationCard from "./DestinationCard";

/**
 * CONFIGURAÇÕES DE FILTRO
 * 
 * Define as categorias disponíveis na Home e seus respectivos ícones.
 */
const filters = ["Todos", "nacional", "internacional", "cruzeiro"] as const;
type Filter = (typeof filters)[number];

const filterConfig: Record<
  Filter,
  { label: string; icon: React.ComponentType<{ size?: string | number; className?: string }> }
> = {
  Todos: { label: "Todos", icon: Layers3 },
  nacional: { label: "Nacional", icon: MapPin },
  internacional: { label: "Internacional", icon: Globe },
  cruzeiro: { label: "Cruzeiro", icon: Anchor },
};

/**
 * ANIMAÇÕES (Framer Motion)
 * 
 * Variantes reutilizáveis para os cards e o cabeçalho, criando aquele efeito
 * suave de "subida" quando a página carrega.
 */
const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.07,
      duration: 0.45,
      ease: [0.25, 0, 0.2, 1] as const,
    },
  }),
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

const headerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

/**
 * SEÇÃO DE DESTINOS (AONDE O POVO QUER IR)
 * 
 * Juan, aqui é onde a mágica dos filtros acontece. 
 * A gente puxa os pacotes do Supabase e separa por categoria (Nacional, Inter, etc).
 * Se um pacote "sumir" daqui, checa se ele está 'ativo' no Admin kkk.
 */
const DestinationsSection = () => {
  const [active, setActive] = useState<Filter>("Todos");

  // BUSCA DE PACOTES PÚBLICOS
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["public-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*, destinations(name)")
        .eq("active", true) // Apenas pacotes "ligados" (visíveis)
        .in("status", ["ativo", "esgotado"]) // Inclui pacotes ativos e esgotados
        .in("category", ["nacional", "internacional", "cruzeiro"]) // Filtra as categorias da Home
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // FILTRAGEM NA TELA (Frontend)
  // Filtramos os dados já baixados para não precisar ir no banco toda hora que trocar o filtro.
  const filtered =
    active === "Todos" ? packages : packages.filter((p) => p.category === active);

  // CONTADORES PARA AS BADGES DE FILTRO
  const counts = {
    Todos: packages.length,
    nacional: packages.filter((p) => p.category === "nacional").length,
    internacional: packages.filter((p) => p.category === "internacional").length,
    cruzeiro: packages.filter((p) => p.category === "cruzeiro").length,
  };

  return (
    <section id="destinos" className="relative py-20 lg:py-32 bg-background overflow-hidden">
      {/* Decoração de Fundo (Gradiente Sutil) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(232 100% 23% / 0.04) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, hsl(232 100% 23% / 0.15), transparent)",
        }}
      />

      <div className="container mx-auto px-4 lg:px-8">
        {/* ── CABEÇALHO DA SEÇÃO ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
        >
          <div className="max-w-xl">
            {/* Tag superior (Eyebrow) */}
            <motion.div custom={0} variants={headerVariants} className="mb-3">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
                <span
                  className="block w-6 h-px"
                  style={{ background: "hsl(350 100% 45%)" }}
                />
                Coleção de destinos
              </span>
            </motion.div>

            <motion.h2
              custom={1}
              variants={headerVariants}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight"
            >
              Descobertas selecionadas{" "}
              <span
                className="relative inline-block"
                style={{ color: "hsl(232 100% 23%)" }}
              >
                para a sua
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(to right, hsl(350 100% 45%), hsl(232 100% 23%))",
                  }}
                />
              </span>{" "}
              próxima viagem
            </motion.h2>

            <motion.p
              custom={2}
              variants={headerVariants}
              className="mt-4 text-muted-foreground text-base leading-relaxed"
            >
              Curadoria humana, destinos únicos. Explore nossas coleções e encontre a
              viagem perfeita para você.
            </motion.p>
          </div>

          {/* INDICADORES RÁPIDOS (Resumo de quantidades) */}
          <motion.div
            custom={3}
            variants={headerVariants}
            className="flex items-center gap-6 shrink-0"
          >
            <div className="text-center">
              <p
                className="text-3xl font-bold"
                style={{ color: "hsl(232 100% 23%)" }}
              >
                {packages.length}
              </p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-0.5">
                Pacotes
              </p>
            </div>
            <div
              className="h-10 w-px"
              style={{ background: "hsl(220 13% 91%)" }}
            />
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: "hsl(350 100% 45%)" }}>
                {counts.internacional + counts.cruzeiro}
              </p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-0.5">
                Internacionais
              </p>
            </div>
            <div
              className="h-10 w-px"
              style={{ background: "hsl(220 13% 91%)" }}
            />
            <div className="text-center">
              <p
                className="text-3xl font-bold"
                style={{ color: "hsl(232 100% 23%)" }}
              >
                {counts.nacional}
              </p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-0.5">
                Nacionais
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ── ABAS DE FILTRO ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <motion.div
            custom={0}
            variants={headerVariants}
            className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-secondary/60 border border-border/60 w-full sm:w-fit"
          >
            {filters.map((f) => {
              const { label, icon: Icon } = filterConfig[f];
              const isActive = active === f;
              return (
                <button
                  key={f}
                  onClick={() => setActive(f)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                      ? "text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                  style={
                    isActive
                      ? {
                        background:
                          "linear-gradient(135deg, hsl(232 100% 23%) 0%, hsl(232 100% 30%) 100%)",
                      }
                      : {}
                  }
                >
                  <Icon size={14} />
                  {label}
                  {counts[f] > 0 && (
                    <span
                      className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${isActive
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {counts[f]}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>

          <motion.div custom={1} variants={headerVariants}>
            <Link
              to="/destinos"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent transition-colors duration-200 group"
            >
              Ver todos os destinos
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform duration-200"
              />
            </Link>
          </motion.div>
        </motion.div>

        {/* ── GRADE DE CARDS ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2
              className="animate-spin text-primary/40"
              size={36}
              strokeWidth={1.5}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "hsl(232 100% 23% / 0.08)" }}
            >
              <Globe size={28} className="text-primary/40" />
            </div>
            <p className="text-muted-foreground text-sm">
              Nenhum destino encontrado nesta categoria.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filtered.map((pkg, i) => (
                <motion.div key={pkg.id} custom={i} variants={cardVariants}>
                  <DestinationCard
                    image={pkg.cover_image_url || ""}
                    title={pkg.title}
                    location={(pkg.destinations as any)?.name || ""}
                    description={pkg.short_description || ""}
                    installments={pkg.installments || 10}
                    installmentValue={Math.round(
                      pkg.price / (pkg.installments || 10)
                    )}
                    totalPrice={pkg.price}
                    slug={pkg.slug}
                    category={pkg.category}
                    status={pkg.status}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── BOTÃO DE CHAMADA FINAL ── */}
        {!isLoading && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/destinos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-primary-foreground transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 shadow-md hover:shadow-lg"
              style={{
                background:
                  "linear-gradient(135deg, hsl(232 100% 23%) 0%, hsl(232 100% 30%) 100%)",
              }}
            >
              Explorar todos os {packages.length} destinos
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default DestinationsSection;
