import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Anchor, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DestinationCard from "@/components/DestinationCard";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.42, ease: [0.25, 0, 0.2, 1] as const },
  }),
};

const CruiseCarousel = () => {
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["cruise-carousel-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*, destinations(name)")
        .eq("active", true)
        .in("status", ["ativo", "esgotado"])
        .eq("category", "cruzeiro")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  if (!isLoading && packages.length === 0) return null;

  return (
    <section className="py-20 lg:py-28 bg-background relative overflow-hidden">
      {/* Dark navy wave background strip */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 50% at 70% 30%, hsl(225 76% 49% / 0.06) 0%, transparent 65%)",
        }}
      />

      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(225 76% 49% / 0.12)" }}
            >
              <Anchor size={18} style={{ color: "hsl(225 76% 49%)" }} />
            </div>
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "hsl(225 76% 49%)" }}
            >
              Temporada de Cruzeiros
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-2xl">
            Navegue pelos rios e mares{" "}
            <span className="text-primary">mais fascinantes do mundo</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-3 max-w-lg leading-relaxed">
            De expedições fluviais na Amazônia a navios transatlânticos luxuosos — descubra a magia de viajar sobre as águas.
          </p>
        </motion.div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2
              className="animate-spin"
              size={36}
              strokeWidth={1.5}
              style={{ color: "hsl(225 76% 49% / 0.4)" }}
            />
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
                    image={pkg.cover_image_url || ""}
                    title={pkg.title}
                    location={(pkg.destinations as any)?.name || "Cruzeiro"}
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

export default CruiseCarousel;
