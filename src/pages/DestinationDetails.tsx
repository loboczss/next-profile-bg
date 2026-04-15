import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Car, Home, Coffee, Map, Eye, Camera, Star, Loader2, Ban } from "lucide-react";
import Navbar from "@/components/Navbar";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

const inclusionIcons: Record<string, typeof Car> = {
  translado: Car,
  hospedagem: Home,
  alimentacao: Coffee,
  guia: Map,
};

const DestinationDetails = () => {
  const { slug } = useParams();

  const { data: destination, isLoading: loadingDest } = useQuery({
    queryKey: ["destination", slug],
    queryFn: async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || "");
      
      let query = supabase.from("destinations").select("*");
      
      if (isUuid) {
        query = query.eq("id", slug!);
      } else {
        query = query.eq("slug", slug!);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    },
  });

  const { data: gallery = [] } = useQuery({
    queryKey: ["destination-gallery", destination?.id],
    enabled: !!destination,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destination_gallery")
        .select("*")
        .eq("destination_id", destination!.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["destination-packages", destination?.id],
    enabled: !!destination,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*, package_inclusions(inclusion_key, label)")
        .eq("destination_id", destination!.id)
        .eq("active", true)
        .in("status", ["ativo", "esgotado"])
        .order("price");
      if (error) throw error;
      return data;
    },
  });

  if (loadingDest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={48} />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <h1 className="text-2xl font-bold text-primary mb-2">Destino não encontrado</h1>
          <Link to="/destinos" className="text-accent underline">Voltar para destinos</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {destination.cover_image_url && (
          <img src={destination.cover_image_url} alt={destination.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        <Link
          to="/destinos"
          className="absolute top-24 left-6 lg:left-12 z-10 inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>

        <motion.div className="relative z-10 text-center px-4" initial="hidden" animate="visible">
          <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full mb-6">
            <MapPin size={14} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              {destination.subtitle || destination.name}
            </span>
          </motion.div>

          <motion.h1 custom={1} variants={fadeUp} className="text-4xl sm:text-5xl lg:text-7xl font-bold text-primary-foreground mb-4 text-shadow-hero">
            {destination.name}
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} className="text-primary-foreground/80 text-lg sm:text-xl max-w-2xl mx-auto">
            {destination.subtitle}
          </motion.p>

          <motion.div custom={3} variants={fadeUp} className="flex items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
              <Star size={14} className="text-evastur-amber fill-evastur-amber" />
              4.9 avaliação
            </div>
            {gallery.length > 0 && (
              <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <Camera size={14} />
                {gallery.length} fotos
              </div>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* About */}
      {destination.description && (
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div className="max-w-3xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
              <motion.div custom={0} variants={fadeUp} className="space-y-6">
                <div className="inline-flex items-center gap-2 text-accent text-sm font-semibold uppercase tracking-wider">
                  <MapPin size={14} />
                  Sobre o destino
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-primary">
                  Conheça {destination.name}
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {destination.description}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
              <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2 text-accent text-sm font-semibold uppercase tracking-wider mb-4">
                <Camera size={14} />
                Momentos inesquecíveis
              </motion.div>
              <motion.h2 custom={1} variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-primary">
                Galeria de Fotos
              </motion.h2>
            </motion.div>

            <motion.div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[200px]" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
              {gallery.map((img, i) => (
                <motion.div key={img.id} custom={i} variants={fadeUp} className="group relative rounded-2xl overflow-hidden cursor-pointer">
                  <img src={img.image_url} alt={`Gallery ${i + 1}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Packages */}
      {packages.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
              <motion.div custom={0} variants={fadeUp} className="inline-flex items-center gap-2 text-accent text-sm font-semibold uppercase tracking-wider mb-4">
                <MapPin size={14} />
                Experiências exclusivas
              </motion.div>
              <motion.h2 custom={1} variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-primary">
                Pacotes para este Destino
              </motion.h2>
              <motion.p custom={2} variants={fadeUp} className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Escolha o roteiro ideal e viva uma experiência inesquecível.
              </motion.p>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
              {packages.map((pkg, i) => (
                <motion.div key={pkg.id} custom={i} variants={fadeUp} className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-48 overflow-hidden">
                    <img src={pkg.cover_image_url || ""} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute top-3 left-3 bg-emerald-600 text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      {pkg.duration || "Aventura"}
                    </span>
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-primary text-lg mb-3">{pkg.title}</h4>
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {((pkg as any).package_inclusions || []).slice(0, 4).map((inc: any) => {
                        const IconComp = inclusionIcons[inc.inclusion_key] || Map;
                        return (
                          <div key={inc.inclusion_key} className="flex items-center gap-2 text-muted-foreground text-sm">
                            <IconComp size={14} className="text-evastur-lightBlue shrink-0" />
                            {inc.label}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className={pkg.status === "esgotado" ? "opacity-50" : ""}>
                        <span className="text-xs text-muted-foreground">A partir de</span>
                        <p className={`text-xl font-bold ${pkg.status === "esgotado" ? "text-muted-foreground line-through" : "text-primary"}`}>R$ {Number(pkg.price).toLocaleString("pt-BR")}</p>
                      </div>
                      {pkg.status === "esgotado" ? (
                        <span className="inline-flex items-center gap-2 text-red-600 border border-red-200 bg-red-50 font-semibold px-4 py-2.5 rounded-lg text-sm">
                          <Ban size={16} />
                          Esgotado
                        </span>
                      ) : (
                        <Link to={`/pacote/${pkg.slug}`} className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm">
                          <Eye size={16} />
                          Ver Detalhes
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default DestinationDetails;
