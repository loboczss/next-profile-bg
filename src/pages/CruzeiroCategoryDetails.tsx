import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Car, Home, Coffee, Map, Eye, Loader2, ChevronLeft, ChevronRight, Images, Ban } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

// ── Gallery Carousel ──────────────────────────────────────────────────────────
function GalleryCarousel({ images }: { images: string[] }) {
    const [current, setCurrent] = useState(0);

    const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
    const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

    if (images.length === 0) return null;

    return (
        <section className="py-16 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-center"
                >
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                        <Images size={14} />
                        Galeria de Fotos
                    </span>
                    <h2 className="text-3xl font-bold text-primary">
                        Conheça a beleza do local
                    </h2>
                    <p className="text-muted-foreground text-sm mt-2">
                        {images.length} {images.length === 1 ? "foto" : "fotos"} selecionadas
                    </p>
                </motion.div>

                {/* Main carousel */}
                <div className="relative max-w-4xl mx-auto">
                    {/* Main image */}
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl">
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={current}
                                src={images[current]}
                                alt={`Foto ${current + 1}`}
                                className="absolute inset-0 w-full h-full object-cover"
                                initial={{ opacity: 0, scale: 1.04 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ duration: 0.4, ease: [0.25, 0, 0.2, 1] }}
                            />
                        </AnimatePresence>

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

                        {/* Counter badge */}
                        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                            {current + 1} / {images.length}
                        </div>

                        {/* Arrow buttons */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prev}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                                    aria-label="Foto anterior"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={next}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                                    aria-label="Próxima foto"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail strip */}
                    {images.length > 1 && (
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 justify-center">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrent(i)}
                                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${i === current
                                        ? "border-primary scale-105 shadow-md"
                                        : "border-transparent opacity-60 hover:opacity-90"
                                        }`}
                                >
                                    <img src={img} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const CruzeiroCategoryDetails = () => {
    const { slug } = useParams();

    const { data: category, isLoading: loadingCat } = useQuery({
        queryKey: ["cruzeiro-category", slug],
        queryFn: async () => {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || "");

            let query = supabase.from("cruzeiro_categories").select("*");

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

    const { data: packages = [], isLoading: loadingPkgs } = useQuery({
        queryKey: ["cruzeiro-category-packages", category?.id],
        enabled: !!category && (category.assigned_packages?.length ?? 0) > 0,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("packages")
                .select("*, package_inclusions(inclusion_key, label)")
                .in("id", category!.assigned_packages || [])
                .eq("active", true)
                .in("status", ["ativo", "esgotado"])
                .order("price");
            if (error) throw error;
            return data;
        },
    });

    if (loadingCat) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin text-muted-foreground" size={48} />
            </div>
        );
    }

    if (!category) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex flex-col items-center justify-center py-32">
                    <h1 className="text-2xl font-bold text-primary mb-2">Categoria não encontrada</h1>
                    <Link to="/" className="text-accent underline">Voltar para a home</Link>
                </div>
                <Footer />
            </div>
        );
    }

    const galleryImages: string[] = (category as any).gallery_images || [];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            {/* ── Hero ── */}
            <section className="relative h-[60vh] min-h-[420px] flex items-center justify-center overflow-hidden">
                {category.image_url ? (
                    <img src={category.image_url} alt={category.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 w-full h-full bg-secondary" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                <div className="container relative z-10 px-4 text-center mt-16">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                        <Link
                            to="/#cruzeiro"
                            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 uppercase tracking-wider text-sm font-semibold transition-colors"
                        >
                            <ArrowLeft size={16} /> Voltar
                        </Link>
                    </motion.div>
                    <motion.h1
                        initial="hidden" animate="visible" variants={fadeUp} custom={1}
                        className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg"
                    >
                        {category.title}
                    </motion.h1>
                    {category.description && (
                        <motion.p
                            initial="hidden" animate="visible" variants={fadeUp} custom={2}
                            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md"
                        >
                            {category.description}
                        </motion.p>
                    )}
                </div>
            </section>

            {/* ── Photo Gallery Carousel ── */}
            {galleryImages.length > 0 && <GalleryCarousel images={galleryImages} />}

            {/* ── Packages Section ── */}
            <section className={`${galleryImages.length > 0 ? "py-12" : "py-20"} flex-1`}>
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="mb-12 text-center">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                            <span className="block w-6 h-px bg-accent" />
                            Destinos Relacionados
                        </span>
                        <h2 className="text-3xl font-bold text-primary">Roteiros Relacionados</h2>
                        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-sm">
                            Descubra todas as experiências incríveis que selecionamos para esta região.
                        </p>
                    </div>

                    {loadingPkgs ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-muted-foreground" size={32} />
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-2xl border border-border">
                            <p className="text-muted-foreground text-lg">Nenhum pacote disponível para esta categoria no momento.</p>
                            <Link to="/" className="inline-flex mt-4 items-center gap-2 text-accent hover:underline">
                                <ArrowLeft size={16} /> Explorar outros destinos
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {packages.map((pkg, i) => (
                                <motion.div
                                    key={pkg.id}
                                    initial="hidden"
                                    animate="visible"
                                    variants={fadeUp}
                                    custom={i}
                                    className="group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 border border-border"
                                >
                                    <div className="relative h-52 overflow-hidden">
                                        {pkg.cover_image_url ? (
                                            <img
                                                src={pkg.cover_image_url}
                                                alt={pkg.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-secondary" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                        <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                            {pkg.category === "interno" ? "Regional" : "Externo"}
                                        </span>
                                    </div>
                                    <div className="p-5">
                                        <h4 className="font-bold text-primary text-lg mb-3 leading-snug">{pkg.title}</h4>
                                        <div className="grid grid-cols-2 gap-2 mb-5">
                                            {((pkg as any).package_inclusions || []).slice(0, 4).map((inc: any) => {
                                                const IconComp = inclusionIcons[inc.inclusion_key] || Map;
                                                return (
                                                    <div key={inc.inclusion_key} className="flex items-center gap-2 text-muted-foreground text-sm">
                                                        <IconComp size={14} className="text-primary/60 shrink-0" />
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
                                                <Link
                                                    to={`/pacote/${pkg.slug}`}
                                                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
                                                >
                                                    <Eye size={16} />
                                                    Detalhes
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default CruzeiroCategoryDetails;
