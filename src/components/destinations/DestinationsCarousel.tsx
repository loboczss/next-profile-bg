import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DestinationCard from "@/components/DestinationCard";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.25, 0, 0.2, 1] as const },
  }),
};

const DestinationsCarousel = () => {
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["carousel-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*, destinations(name)")
        .eq("active", true)
        .in("status", ["ativo", "esgotado"])
        .in("category", ["nacional", "internacional"])
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-20 lg:py-28 bg-secondary/40 relative overflow-hidden">
      {/* Background texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 30% 60%, hsl(232 100% 23% / 0.04) 0%, transparent 70%)",
        }}
      />

      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14"
        >
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent mb-3">
              <Sparkles size={13} />
              Seleção Cinematográfica
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Destinos que brilham{" "}
              <span className="text-primary">na vitrine Evastur</span>
            </h2>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed max-w-md">
              Explore fotos em alta resolução, valores atualizados e detalhes de cada experiência.
            </p>
          </div>

          <Link
            to="/destinos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent transition-colors group shrink-0"
          >
            Ver todos
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary/30" size={36} strokeWidth={1.5} />
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {packages.map((pkg, i) => (
                <motion.div key={pkg.id} custom={i} variants={cardVariants}>
                  <DestinationCard
                    id={pkg.id}
                    image={pkg.cover_image_url || ""}
                    title={pkg.title}
                    location={(pkg.destinations as any)?.name || ""}
                    description={pkg.short_description || ""}
                    installments={pkg.installments || 10}
                    installmentValue={Math.round(pkg.price / (pkg.installments || 10))}
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
      </div>
    </section>
  );
};

export default DestinationsCarousel;
