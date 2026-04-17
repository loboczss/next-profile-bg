import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, Car, Coffee, Bed, Map, Shield, MessageCircle, Users, Utensils, Compass, Camera, MapPin, Loader2, CreditCard, Heart, Star, UserCircle, ShoppingCart, Calendar, Maximize2, Ticket, Sparkles, ArrowRight, Send, Info, ChevronDown, Hotel, Plane, UtensilsCrossed, CheckCircle2, Plus, Minus, Ban
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useFavorite } from "@/hooks/useFavorite";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import QuoteFormDialog from "@/components/QuoteFormDialog";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

const inclusionIcons: Record<string, typeof Car> = {
  translado: Car,
  hospedagem: Bed,
  alimentacao: Coffee,
  guia: Map,
  ingresso: Compass,
  seguro: Shield,
  passeio: Camera,
};

/**
 * PÁGINA DE DETALHES DO PACOTE
 * 
 * Juan, esta é a página mais importante do site kkk.
 * Aqui a gente mostra tudo o que o pacote oferece, fotos, roteiro e preços.
 * Nosso amigão freelancer deixou tudo organizado, não vai quebrar nada! kkk
 */
const PackageDetails = () => {
  const { slug: slugParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: siteSettings } = useSiteSettings();

  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("roteiro");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<string[]>([]);
  const [customerTravelDate, setCustomerTravelDate] = useState("");
  const [customerTravelTime, setCustomerTravelTime] = useState("");

  // Busca os dados do pacote pelo slug (usando slugParam pra não confundir o Juan kkk)
  const { data: pkg, isLoading } = useQuery({
    queryKey: ["package", slugParam],
    queryFn: async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugParam || "");

      // Busca o pacote SEM join com destinations (destination_id pode ser null)
      // Pacotes novos usam o campo texto destination_name direto
      let pkgQuery = supabase
        .from("packages")
        .select("*, package_inclusions(inclusion_key, label), package_itinerary_days(day_number, title, description), package_images(image_url, sort_order), available_slots, total_slots");

      if (isUuid) {
        pkgQuery = pkgQuery.eq("id", slugParam!);
      } else {
        pkgQuery = pkgQuery.eq("slug", slugParam!);
      }

      const { data, error } = await pkgQuery.single();
      if (error) throw error;
      return data;
    },
  });

  // Busca itens do cardápio — SÓ para pacotes internos (categoria 'interno')
  const { data: menuItems = [] } = useQuery({
    queryKey: ["package-menu-items", pkg?.id],
    enabled: !!pkg?.id && pkg?.category === "interno",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("package_menu_items")
        .select("*")
        .eq("package_id", pkg!.id)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["package-reviews", pkg?.id],
    enabled: !!pkg?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, profiles(full_name, avatar_url)")
        .eq("package_id", pkg!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: hasConfirmedReservation } = useQuery({
    queryKey: ["package-reservation", pkg?.id, user?.id],
    enabled: !!pkg?.id && !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("reservations")
        .select("*", { count: 'exact', head: true })
        .eq("package_id", pkg!.id)
        .eq("user_id", user!.id)
        .eq("status", "confirmado");
      return (count || 0) > 0;
    },
  });

  // O NOSSO NOVO HOOK DE FAVORITOS
  const { isFavorite, toggleFavorite } = useFavorite(pkg?.id);

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Você precisa estar logado para adicionar itens ao carrinho");
        throw new Error("Não logado");
      }

      // Monta as seleções do cardápio para salvar no carrinho
      const menuSelections = menuItems
        .filter((item) => selectedMenuItemIds.includes(item.id))
        .map((item) => ({ id: item.id, name: item.name, price: item.price }));

      const travelDateToSave = isInternal
        ? (customerTravelDate && customerTravelTime
          ? `${customerTravelDate}T${customerTravelTime}:00`
          : customerTravelDate || null)
        : (pkg as any).travel_date || null;

      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, people")
        .eq("user_id", user.id)
        .eq("package_id", pkg!.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ people: existing.people + 1, menu_selections: menuSelections as any, travel_date: travelDateToSave })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            package_id: pkg!.id,
            people: 1,
            menu_selections: menuSelections as any,
            travel_date: travelDateToSave,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-count", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
      toast.success("Pacote adicionado ao carrinho!");
    },
    onError: (err: any) => {
      if (err.message !== "Não logado") {
        toast.error("Erro ao adicionar ao carrinho");
      }
    }
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      await supabase.from("reviews").insert({
        package_id: pkg!.id,
        user_id: user!.id,
        rating: reviewRating,
        comment: reviewComment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-reviews", pkg?.id] });
      setReviewComment("");
      toast.success("Avaliação enviada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao enviar avaliação");
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={48} />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <h1 className="text-2xl font-bold text-primary mb-2">Pacote não encontrado</h1>
          <button onClick={() => navigate(-1)} className="text-accent underline">Voltar</button>
        </div>
      </div>
    );
  }

  const inclusions = (pkg as any).package_inclusions || [];
  const itinerary = ((pkg as any).package_itinerary_days || []).sort((a: any, b: any) => a.day_number - b.day_number);
  const images = ((pkg as any).package_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const destinationName: string | null = (pkg as any).destination_name || null;
  const installments = pkg.installments || 10;
  const isInternal = pkg.category === "interno";
  const isSoldOut = pkg.status === "esgotado";
  const availableSlots: number | null = (pkg as any).available_slots ?? null;
  const totalSlots: number | null = (pkg as any).total_slots ?? null;

  // Calcula o total dos extras do cardápio
  const menuExtrasTotal = menuItems
    .filter((item) => selectedMenuItemIds.includes(item.id))
    .reduce((sum, item) => sum + Number(item.price), 0);

  const totalWithExtras = Number(pkg.price) + menuExtrasTotal;
  const installmentValue = Math.round(totalWithExtras / installments);

  const toggleMenuItem = (id: string) => {
    setSelectedMenuItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // null when no reviews yet — display as "Novo" in the UI
  const avgRating = reviewsData && reviewsData.length > 0
    ? (reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length).toFixed(1)
    : null;

  const userHasReviewed = reviewsData?.some(r => r.user_id === user?.id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative h-[40vh] min-h-[350px] overflow-hidden">
        <motion.img
          src={pkg.cover_image_url || ""}
          alt={pkg.title}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="absolute top-6 right-6 z-20">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-all"
            onClick={() => toggleFavorite()}
          >
            <Heart
              size={20}
              className={isFavorite ? "fill-evastur-red text-evastur-red" : "text-white"}
            />
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 z-10">
          <div className="max-w-7xl mx-auto">
            <motion.button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium mb-4 transition-colors"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ArrowLeft size={18} />
              Voltar
            </motion.button>

            <motion.div initial="hidden" animate="visible">
              <motion.div custom={0} variants={fadeUp} className="flex flex-wrap gap-2 mb-3 items-center">
                <Badge className="bg-evastur-red text-white border-0">
                  {pkg.category === "interno" ? "Nacional" : "Internacional"}
                </Badge>
                {pkg.duration && (
                  <Badge variant="outline" className="border-white/30 text-white/90 backdrop-blur-sm">
                    <Clock size={12} className="mr-1" />
                    {pkg.duration}
                  </Badge>
                )}
                {(pkg as any).travel_date && (
                  <Badge variant="outline" className="border-amber-300/60 text-amber-200 backdrop-blur-sm bg-black/20">
                    <Calendar size={12} className="mr-1" />
                    Saída: {(() => { const [y, m, d] = (pkg as any).travel_date.substring(0, 10).split("-"); return `${d}/${m}/${y}`; })()}
                  </Badge>
                )}
                {isSoldOut && (
                  <Badge className="bg-red-600 text-white border-0 animate-pulse">
                    <Ban size={12} className="mr-1" />
                    Esgotado
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-amber-400 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full text-sm font-medium border border-white/10">
                  {avgRating ? (
                    <>
                      <Star size={14} className="fill-amber-400" />
                      {avgRating} <span className="text-white/70 text-xs ml-1">({reviewsData?.length || 0})</span>
                    </>
                  ) : (
                    <span className="text-white/80 text-xs px-1">Novo ✨</span>
                  )}
                </div>
              </motion.div>

              <motion.h1 custom={1} variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 text-shadow-hero">
                {pkg.title}
              </motion.h1>

              {destinationName && (
                <motion.div custom={2} variants={fadeUp} className="flex items-center gap-2 text-white/70 text-sm">
                  <MapPin size={14} />
                  {destinationName}
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-10 py-10 grid lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          {/* Overview */}
          {pkg.short_description && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4">
              <motion.h2 custom={0} variants={fadeUp} className="text-2xl font-bold text-primary">
                Sobre o Pacote
              </motion.h2>
              <motion.p custom={1} variants={fadeUp} className="text-muted-foreground leading-relaxed text-lg">
                {pkg.short_description}
              </motion.p>
              {pkg.full_description && (
                <motion.p custom={2} variants={fadeUp} className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {pkg.full_description}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Inclusions */}
          {inclusions.length > 0 && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4">
              <motion.h2 custom={0} variants={fadeUp} className="text-2xl font-bold text-primary">
                O que está incluso
              </motion.h2>
              <motion.div custom={1} variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {inclusions.map((inc: any) => {
                  const IconComp = inclusionIcons[inc.inclusion_key] || Map;
                  return (
                    <Card key={inc.inclusion_key} className="shadow-sm border-0 bg-secondary/30">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-evastur-red/10 flex items-center justify-center flex-shrink-0">
                          <IconComp size={20} className="text-evastur-red" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{inc.label}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {/* Menu Items (internal packages only) */}
          {isInternal && menuItems.length > 0 && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4">
              <motion.div custom={0} variants={fadeUp} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                  <UtensilsCrossed size={18} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary">Cardápio do Passeio</h2>
                  <p className="text-sm text-muted-foreground">Adicione itens ao seu passeio — o valor é somado ao total</p>
                </div>
              </motion.div>
              <motion.div custom={1} variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {menuItems.map((item: any) => {
                  const isSelected = selectedMenuItemIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleMenuItem(item.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                          ? "border-orange-500 bg-orange-50 shadow-md"
                          : "border-border bg-card hover:border-orange-300 hover:bg-orange-50/30"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className={`font-semibold text-sm ${isSelected ? "text-orange-700" : "text-foreground"}`}>
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-sm font-bold ${isSelected ? "text-orange-600" : "text-primary"}`}>
                            R$ {Number(item.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "bg-orange-500 border-orange-500" : "border-muted-foreground/30"
                            }`}>
                            {isSelected && <CheckCircle2 size={14} className="text-white" />}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
              {selectedMenuItemIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-orange-700">
                    <UtensilsCrossed size={16} />
                    <span className="text-sm font-medium">{selectedMenuItemIds.length} item(s) selecionado(s)</span>
                  </div>
                  <span className="font-bold text-orange-700">
                    + R$ {menuExtrasTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Itinerary */}
          {itinerary.length > 0 && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4">
              <motion.h2 custom={0} variants={fadeUp} className="text-2xl font-bold text-primary">
                Roteiro Dia a Dia
              </motion.h2>
              <motion.div custom={1} variants={fadeUp}>
                <Accordion type="single" collapsible defaultValue="day-0">
                  {itinerary.map((day: any, i: number) => (
                    <AccordionItem key={day.day_number} value={`day-${i}`} className="border-0 bg-secondary/20 rounded-xl mb-3 px-0 overflow-hidden">
                      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/40 transition-colors">
                        <div className="flex items-center gap-3 text-left">
                          <span className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {day.day_number}
                          </span>
                          <span className="font-semibold text-foreground">{day.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-5 text-muted-foreground leading-relaxed pt-2">
                        {day.description}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </motion.div>
          )}

          {/* Gallery */}
          {images.length > 0 && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4">
              <motion.h2 custom={0} variants={fadeUp} className="text-2xl font-bold text-primary">
                Galeria
              </motion.h2>
              <motion.div custom={1} variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((img: any, i: number) => (
                  <div key={img.image_url} className={`group relative rounded-xl overflow-hidden cursor-pointer bg-secondary/30 ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}>
                    <img src={img.image_url} alt={`Gallery ${i + 1}`} className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Reviews Section */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-6 pt-8 border-t">
            <motion.h2 custom={0} variants={fadeUp} className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
              Avaliações <Badge variant="secondary" className="ml-2 font-mono">{avgRating}</Badge>
            </motion.h2>

            {/* Review Form for Eligible Users */}
            {hasConfirmedReservation && !userHasReviewed && (
              <motion.div custom={1} variants={fadeUp}>
                <Card className="border-primary/20 bg-primary/5 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Avalie sua experiência</CardTitle>
                    <CardDescription>Compartilhe o que achou desta viagem com outros clientes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setReviewRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                          <Star size={24} className={star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"} />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      placeholder="Deixe um comentário curto (opcional)..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="resize-none"
                    />
                    <Button
                      onClick={() => submitReview.mutate()}
                      disabled={submitReview.isPending}
                      className="w-full sm:w-auto"
                    >
                      {submitReview.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : "Enviar Avaliação"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* List Reviews */}
            <motion.div custom={2} variants={fadeUp} className="space-y-4">
              {reviewsData && reviewsData.length > 0 ? (
                reviewsData.map((review) => (
                  <div key={review.id} className="bg-secondary/20 p-5 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0 border">
                          {review.profiles?.avatar_url ? (
                            <img src={review.profiles.avatar_url} alt="User avatar" className="w-full h-full object-cover" />
                          ) : (
                            <UserCircle size={40} className="text-muted-foreground/50" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{review.profiles?.full_name || "Cliente Evastur"}</p>
                          <div className="flex text-amber-400 mt-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={12} className={star <= review.rating ? "fill-amber-400" : "text-muted-foreground/30"} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {review.comment && (
                      <p className="text-muted-foreground text-sm leading-relaxed mt-3 bg-white/50 p-3 rounded-lg border shadow-sm">
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-6 bg-secondary/10 rounded-xl border border-dashed">Ainda não há avaliações para este pacote. Seja o primeiro a avaliar após viajar!</p>
              )}
            </motion.div>

          </motion.div>
        </div>

        {/* Sidebar - Pricing */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="shadow-xl border-primary/10 bg-white">
              <CardContent className="p-6 space-y-5">
                <div>
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">A partir de</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-bold tracking-tight text-primary">
                      R$ {Number(pkg.price).toLocaleString("pt-BR")}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">/pessoa</span>
                  </div>
                  {menuExtrasTotal > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Pacote base</span>
                        <span>R$ {Number(pkg.price).toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="flex justify-between text-xs text-orange-600 font-medium">
                        <span className="flex items-center gap-1"><UtensilsCrossed size={10} /> Extras do cardápio</span>
                        <span>+ R$ {menuExtrasTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-primary border-t pt-1 mt-1">
                        <span>Total</span>
                        <span>R$ {totalWithExtras.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2 bg-secondary/50 p-2 rounded border border-secondary">
                    ou {installments}x de <strong className="text-foreground">R$ {installmentValue.toLocaleString("pt-BR")}</strong>
                  </p>
                </div>

                {/* Vagas disponíveis */}
                {!isSoldOut && availableSlots != null && availableSlots > 0 && (
                  <div className={`flex items-center gap-2 text-sm py-3 px-3 rounded-xl border ${
                    availableSlots <= 5
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}>
                    <Users size={16} className={availableSlots <= 5 ? "text-amber-500" : "text-emerald-500"} />
                    <div>
                      <span className={`font-bold ${availableSlots <= 5 ? "animate-pulse" : ""}`}>
                        {availableSlots <= 5 ? `Últimas ${availableSlots} vaga${availableSlots !== 1 ? "s" : ""}!` : `${availableSlots} vagas disponíveis`}
                      </span>
                      {totalSlots && (
                        <p className="text-xs opacity-70">de {totalSlots} no total</p>
                      )}
                    </div>
                  </div>
                )}

                {isSoldOut && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Ban size={20} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-700">Pacote Esgotado</p>
                      <p className="text-xs text-red-600/80">Este pacote não está mais disponível para reserva.</p>
                    </div>
                  </div>
                )}

                {pkg.duration && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 border-b">
                    <Clock size={16} className="text-primary" />
                    <span className="font-medium">Duração:</span> {pkg.duration}
                  </div>
                )}

                {/* For non-internal packages: show admin-defined travel date */}
                {!isInternal && (pkg as any).travel_date && (
                  <div className="flex items-center gap-2 text-sm py-2 border-b">
                    <Calendar size={16} className="text-amber-500" />
                    <span className="font-medium text-amber-700">Data da Viagem:</span>
                    <span className="font-semibold text-amber-600">
                      {(() => { const [y, m, d] = (pkg as any).travel_date.substring(0, 10).split("-"); return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }); })()}
                    </span>
                  </div>
                )}

                {/* For internal packages: customer picks travel date + time */}
                {isInternal && (
                  <div className="space-y-3 py-2 border-b">
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Calendar size={15} className="text-primary" />
                      Data e horário do passeio <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Data</p>
                        <input
                          type="date"
                          value={customerTravelDate}
                          onChange={(e) => setCustomerTravelDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Horário</p>
                        <input
                          type="time"
                          value={customerTravelTime}
                          onChange={(e) => setCustomerTravelTime(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                    {(!customerTravelDate || !customerTravelTime) && (
                      <p className="text-xs text-muted-foreground">
                        Selecione a data e o horário desejados para o passeio
                      </p>
                    )}
                    {customerTravelDate && customerTravelTime && (
                      <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        ✅ {new Date(`${customerTravelDate}T${customerTravelTime}`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} às {customerTravelTime}h
                      </p>
                    )}
                  </div>
                )}

                {/* Route Info — Trajeto Ida e Volta */}
                {(() => {
                  const ri = (pkg as any).route_info;
                  if (!ri || typeof ri !== "object") return null;
                  const dep = ri.departure;
                  const ret = ri.return;
                  const hasDep = dep && (dep.from || dep.to);
                  const hasRet = ret && (ret.from || ret.to);
                  if (!hasDep && !hasRet) return null;

                  const formatRouteDate = (d: string) => {
                    if (!d) return "";
                    const [y, m, day] = d.split("-");
                    return `${day}/${m}`;
                  };

                  return (
                    <div className="space-y-2.5 py-3 border-b">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Plane size={15} className="text-indigo-500" />
                        Trajeto
                      </div>
                      {hasDep && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                          <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            →
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-indigo-800">
                              {dep.from} <ArrowRight size={12} className="inline mx-1 text-indigo-400" /> {dep.to}
                            </p>
                            <p className="text-xs text-indigo-600/80 mt-0.5">
                              {dep.date ? formatRouteDate(dep.date) : ""}
                              {dep.date && dep.time ? " • " : ""}
                              {dep.time ? `Saída às ${dep.time}h` : ""}
                            </p>
                          </div>
                        </div>
                      )}
                      {hasRet && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            ←
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-emerald-800">
                              {ret.from} <ArrowRight size={12} className="inline mx-1 text-emerald-400" /> {ret.to}
                            </p>
                            <p className="text-xs text-emerald-600/80 mt-0.5">
                              {ret.date ? formatRouteDate(ret.date) : ""}
                              {ret.date && ret.time ? " • " : ""}
                              {ret.time ? `Saída às ${ret.time}h` : ""}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}


                {isSoldOut ? (
                  <>
                    <Button
                      className="w-full gap-2 bg-gray-400 text-white cursor-not-allowed"
                      size="lg"
                      disabled
                    >
                      <Ban size={20} />
                      Esgotado — Indisponível
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all"
                      size="lg"
                      onClick={() => {
                        const phone = siteSettings?.agencyWhatsapp?.replace(/\D/g, "") || "5568999872973";
                        const msg = encodeURIComponent(`Olá! Vi no site que o pacote *${pkg.title}* está esgotado. Gostaria de saber se há previsão de novas vagas ou pacotes similares. Obrigado!`);
                        window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
                      }}
                    >
                      <MessageCircle size={20} />
                      Falar com a Evastur
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                      size="lg"
                      onClick={async () => {
                        if (!user) {
                          navigate(`/login?redirect=/pacote/${slugParam}`);
                          return;
                        }
                        if (isInternal && (!customerTravelDate || !customerTravelTime)) {
                          toast.error("Por favor, selecione a data e o horário do passeio antes de reservar.");
                          return;
                        }
                        // Adiciona ao carrinho e vai direto pro checkout
                        await addToCart.mutateAsync();
                        navigate("/checkout");
                      }}
                      disabled={addToCart.isPending || (isInternal && (!customerTravelDate || !customerTravelTime))}
                    >
                      {addToCart.isPending ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>
                          <CreditCard size={20} />
                          Reservar Agora
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full gap-2 border-primary text-primary hover:bg-primary/5 hover:text-primary transition-all"
                      size="lg"
                      onClick={() => addToCart.mutate()}
                      disabled={addToCart.isPending}
                    >
                      {addToCart.isPending ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <ShoppingCart size={20} />
                      )}
                      Adicionar ao Carrinho
                    </Button>
                  </>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  Pagamento 100% seguro via PIX, Crédito ou Débito
                </p>
              </CardContent>
            </Card>

            {/* Package Details — Detalhes do Pacote */}
            {(() => {
              const pd = (pkg as any).package_details;
              if (!pd || !Array.isArray(pd) || pd.length === 0) return null;

              return (
                <div className="mt-4 p-5 rounded-xl border border-border bg-white shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                    <Info size={16} />
                    Detalhes Importantes
                  </h3>
                  <div className="space-y-3">
                    {pd.map((item: any, i: number) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{item.label}</span>
                        <span className="text-sm text-foreground font-medium leading-tight">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetails;
