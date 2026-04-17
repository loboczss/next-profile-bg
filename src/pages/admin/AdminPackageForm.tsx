/**
 * FORMULÁRIO DE PACOTES (Criar/Editar) — AdminPackageForm.tsx
 *
 * Juan, este é o grande formulário onde cria e edita pacotes de viagem.
 * Ele serve tanto para /admin/pacotes/novo quanto para /admin/pacotes/:id/editar
 *
 * SEÇÕES DO FORMULÁRIO:
 * 1. Informações Gerais — título, destino, categoria, preço, parcelas, duração, data, status, slug
 * 2. Imagens — capa (hero) e galeria de fotos
 * 3. Descrição — texto curto de apresentação
 * 4. Inclusões — o que está incluso (translado, hospedagem, alimentação, etc.)
 * 5. Roteiro Dia a Dia — descrição de cada dia da viagem
 * 6. Cardápio — SÓ para pacotes internos (bebidas, refeições extras)
 *
 * IMPORTANTES:
 * - Slug é gerado automaticamente do título (pode editar manualmente)
 * - Data da viagem só aparece para pacotes NÃO internos (nac/inter/cruzeiro)
 * - Ao criar, oferece enviar newsletter para assinantes
 * - Todas as sub-tabelas (inclusions, itinerary, images, menu_items)
 *   são sincronizadas via delete + insert (padrão sync)
 *
 * TABELAS ENVOLVIDAS:
 * packages, package_inclusions, package_itinerary_days,
 * package_images, package_menu_items
 */
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Plus, Trash2, Loader2, Send, Package,
  Image, FileText, CheckSquare, Map, Info, UtensilsCrossed, Users, Plane, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ImageUpload, MultiImageUpload } from "@/components/ImageUpload";


function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface ItineraryDay {
  id: string;
  title: string;
  description: string;
}

interface MenuItemDraft {
  id: string;
  name: string;
  description: string;
  price: string;
}

interface PackageDetailItem {
  id: string;
  label: string;
  value: string;
}

const inclusionOptions = [
  { key: "translado", label: "Translado", emoji: "🚌" },
  { key: "hospedagem", label: "Hospedagem", emoji: "🛏️" },
  { key: "alimentacao", label: "Alimentação", emoji: "🍽️" },
  { key: "guia", label: "Guia local", emoji: "🗺️" },
  { key: "ingresso", label: "Ingressos", emoji: "🎟️" },
  { key: "seguro", label: "Seguro viagem", emoji: "🛡️" },
  { key: "passeio", label: "Passeios", emoji: "🚤" },
];

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  color = "text-primary",
  iconBg = "bg-primary/10",
}: {
  icon: any;
  title: string;
  description?: string;
  children: React.ReactNode;
  color?: string;
  iconBg?: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-start gap-4 px-6 pt-5 pb-4 border-b border-border/50">
        <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon size={18} className={color} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-base">{title}</h3>
          {description && (
            <p className="text-muted-foreground text-xs mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default function AdminPackageForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!id && id !== "novo";

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [destinationName, setDestinationName] = useState("");
  const [category, setCategory] = useState("interno");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("ativo");
  const [shortDescription, setShortDescription] = useState("");
  const [selectedInclusions, setSelectedInclusions] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [installments, setInstallments] = useState("10");
  const [travelDate, setTravelDate] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItemDraft[]>([]);
  const [totalSlots, setTotalSlots] = useState("");

  // Route info state
  const [routeDepartureFrom, setRouteDepartureFrom] = useState("");
  const [routeDepartureTo, setRouteDepartureTo] = useState("");
  const [routeDepartureDate, setRouteDepartureDate] = useState("");
  const [routeDepartureTime, setRouteDepartureTime] = useState("");
  const [routeReturnFrom, setRouteReturnFrom] = useState("");
  const [routeReturnTo, setRouteReturnTo] = useState("");
  const [routeReturnDate, setRouteReturnDate] = useState("");
  const [routeReturnTime, setRouteReturnTime] = useState("");

  // Package details state
  const [packageDetails, setPackageDetails] = useState<PackageDetailItem[]>([]);


  const { isLoading } = useQuery({
    queryKey: ["package-edit", id],
    enabled: isEditing,
    queryFn: async () => {
      const { data: pkg, error } = await supabase
        .from("packages")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      const { data: inclusions } = await supabase
        .from("package_inclusions")
        .select("inclusion_key")
        .eq("package_id", id!);

      const { data: days } = await supabase
        .from("package_itinerary_days")
        .select("*")
        .eq("package_id", id!)
        .order("day_number");

      const { data: images } = await supabase
        .from("package_images")
        .select("image_url")
        .eq("package_id", id!)
        .order("sort_order");

      const { data: menuItemsData } = await supabase
        .from("package_menu_items")
        .select("*")
        .eq("package_id", id!)
        .order("sort_order");

      setTitle(pkg.title);
      setSlug(pkg.slug);
      setSlugManual(true);
      // Suporta tanto o antigo destination_id->name quanto o novo destination_name
      const dName = (pkg as any).destination_name || "";
      setDestinationName(dName);
      setCategory(pkg.category);
      setDuration(pkg.duration || "");
      setPrice(pkg.price.toString());
      setStatus(pkg.status);
      setShortDescription(pkg.short_description || "");
      setCoverImageUrl(pkg.cover_image_url || null);
      setInstallments(String(pkg.installments || 10));
      setTravelDate((pkg as any).travel_date ? (pkg as any).travel_date.split("T")[0] : "");
      setTotalSlots((pkg as any).available_slots != null ? String((pkg as any).available_slots) : "");
      setSelectedInclusions(inclusions?.map((i) => i.inclusion_key) || []);
      setItinerary(
        days?.map((d) => ({
          id: d.id,
          title: d.title,
          description: d.description || "",
        })) || []
      );
      setGallery(images?.map((img) => img.image_url) || []);
      setMenuItems(
        menuItemsData?.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description || "",
          price: String(m.price),
        })) || []
      );

      // Load route info
      const ri = (pkg as any).route_info;
      if (ri && typeof ri === "object") {
        setRouteDepartureFrom(ri.departure?.from || "");
        setRouteDepartureTo(ri.departure?.to || "");
        setRouteDepartureDate(ri.departure?.date || "");
        setRouteDepartureTime(ri.departure?.time || "");
        setRouteReturnFrom(ri.return?.from || "");
        setRouteReturnTo(ri.return?.to || "");
        setRouteReturnDate(ri.return?.date || "");
        setRouteReturnTime(ri.return?.time || "");
      }

      // Load package details
      const pd = (pkg as any).package_details;
      if (pd && Array.isArray(pd)) {
        setPackageDetails(pd.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          label: item.label || "",
          value: item.value || "",
        })));
      }

      return pkg;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slotsValue = totalSlots ? parseInt(totalSlots) : null;
      const pkgData: any = {
        title,
        slug,
        destination_name: destinationName || null,
        destination_id: null,
        category,
        duration: duration || null,
        price: parseFloat(price) || 0,
        status,
        short_description: shortDescription || null,
        cover_image_url: coverImageUrl || null,
        installments: parseInt(installments) || 10,
        travel_date: travelDate || null,
        updated_at: new Date().toISOString(),
      };

      // Build route_info
      const hasRoute = routeDepartureFrom || routeDepartureTo || routeReturnFrom || routeReturnTo;
      if (hasRoute) {
        pkgData.route_info = {
          departure: {
            from: routeDepartureFrom || null,
            to: routeDepartureTo || null,
            date: routeDepartureDate || null,
            time: routeDepartureTime || null,
          },
          return: {
            from: routeReturnFrom || null,
            to: routeReturnTo || null,
            date: routeReturnDate || null,
            time: routeReturnTime || null,
          },
        };
      } else {
        pkgData.route_info = null;
      }

      // Build package_details
      const validDetails = packageDetails.filter(d => d.label.trim() || d.value.trim());
      pkgData.package_details = validDetails.length > 0
        ? validDetails.map(d => ({ id: d.id, label: d.label, value: d.value }))
        : null;

      if (!isEditing) {
        // Na criação: total_slots e available_slots iguais
        pkgData.total_slots = slotsValue;
        pkgData.available_slots = slotsValue;
      } else {
        // Na edição: admin ajusta available_slots direto
        pkgData.available_slots = slotsValue;
        // Se o total_slots original era null e agora definiu, atualiza também
        if (slotsValue !== null) {
          pkgData.total_slots = slotsValue;
        }
      }

      let pkgId = id;

      if (isEditing) {
        const { error } = await supabase
          .from("packages")
          .update(pkgData as any)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("packages")
          .insert(pkgData as any)
          .select("id")
          .single();
        if (error) throw error;
        pkgId = data.id;
      }

      // Sincroniza inclusões (deleta antigas e insere novas)
      await supabase.from("package_inclusions").delete().eq("package_id", pkgId!);
      if (selectedInclusions.length > 0) {
        const incRows = selectedInclusions.map((key) => ({
          package_id: pkgId!,
          inclusion_key: key,
          label: inclusionOptions.find((o) => o.key === key)?.label || key,
        }));
        const { error } = await supabase.from("package_inclusions").insert(incRows);
        if (error) throw error;
      }

      // Sincroniza roteiro dia a dia
      await supabase.from("package_itinerary_days").delete().eq("package_id", pkgId!);
      if (itinerary.length > 0) {
        const dayRows = itinerary.map((day, i) => ({
          package_id: pkgId!,
          day_number: i + 1,
          title: day.title,
          description: day.description || null,
        }));
        const { error } = await supabase.from("package_itinerary_days").insert(dayRows);
        if (error) throw error;
      }

      // Sincroniza galeria de fotos
      await supabase.from("package_images").delete().eq("package_id", pkgId!);
      if (gallery.length > 0) {
        const imageRows = gallery.map((url, i) => ({
          package_id: pkgId!,
          image_url: url,
          sort_order: i + 1,
        }));
        const { error } = await supabase.from("package_images").insert(imageRows);
        if (error) throw error;
      }

      // Sincroniza cardápio (só para pacotes internos)
      await supabase.from("package_menu_items").delete().eq("package_id", pkgId!);
      if (category === "interno" && menuItems.length > 0) {
        const menuRows = menuItems.map((item, i) => ({
          package_id: pkgId!,
          name: item.name,
          description: item.description || null,
          price: parseFloat(item.price) || 0,
          sort_order: i + 1,
        }));
        const { error } = await supabase.from("package_menu_items").insert(menuRows);
        if (error) throw error;
      }

      return { newPkgId: isEditing ? null : pkgId, title, price, coverImageUrl, slug };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      toast({ title: isEditing ? "Pacote atualizado! ✅" : "Pacote criado! 🎉" });
      if (data?.newPkgId) {
        toast({
          title: "📧 Enviar Newsletter?",
          description: "Notificar assinantes sobre o novo pacote?",
          action: (
            <button
              onClick={() =>
                sendNewsletterMutation.mutate({
                  id: data.newPkgId,
                  title: data.title,
                  price: data.price,
                  cover_image_url: data.coverImageUrl,
                  slug: data.slug,
                })
              }
              className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1"
            >
              <Send size={12} /> Enviar
            </button>
          ) as any,
        });
      }
      navigate("/admin/pacotes");
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const sendNewsletterMutation = useMutation({
    mutationFn: async (pkgData: { id: string; title: string; price: string; cover_image_url: string; slug: string }) => {
      const { error } = await supabase.functions.invoke("send-newsletter", {
        body: {
          package_id: pkgData.id,
          package_name: pkgData.title,
          package_price: pkgData.price,
          package_image: pkgData.cover_image_url,
          package_slug: pkgData.slug,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Newsletter enviada!", description: "Todos os assinantes foram notificados." });
    },
  });

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManual) setSlug(slugify(val));
  };

  const toggleInclusion = (key: string) => {
    setSelectedInclusions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const addDay = () => {
    setItinerary([...itinerary, { id: crypto.randomUUID(), title: "", description: "" }]);
  };

  const removeDay = (dayId: string) => {
    setItinerary(itinerary.filter((d) => d.id !== dayId));
  };

  const updateDay = (dayId: string, field: "title" | "description", value: string) => {
    setItinerary(itinerary.map((d) => (d.id === dayId ? { ...d, [field]: value } : d)));
  };

  const addMenuItem = () => {
    setMenuItems([...menuItems, { id: crypto.randomUUID(), name: "", description: "", price: "" }]);
  };

  const removeMenuItem = (itemId: string) => {
    setMenuItems(menuItems.filter((m) => m.id !== itemId));
  };

  const updateMenuItem = (itemId: string, field: keyof MenuItemDraft, value: string) => {
    setMenuItems(menuItems.map((m) => (m.id === itemId ? { ...m, [field]: value } : m)));
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  const canSave = !!title && !!slug && !saveMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/admin/pacotes"
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-0.5">
            Admin / Pacotes
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "Editar Pacote" : "Criar Novo Pacote"}
          </h1>
        </div>
      </div>

      <div className="space-y-5">
        {/* ── 1. INFORMAÇÕES GERAIS ── */}
        <SectionCard
          icon={Info}
          title="Informações Gerais"
          description="Dados principais do pacote que o cliente verá na listagem"
          color="text-sky-600"
          iconBg="bg-sky-50"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Título do Pacote */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-sm font-medium">
                Título do Pacote <span className="text-red-500">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex: Imersão no Rio Croa"
                className="h-11"
              />
            </div>

            {/* Nome do Destino */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Destino</Label>
              <Input
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                placeholder="Ex: Cruzeiro do Sul, Rio Croa"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Digite o nome do destino livremente
              </p>
            </div>

            {/* Categoria do pacote */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interno">🌿 Interno — Regional</SelectItem>
                  <SelectItem value="nacional">🇧🇷 Nacional</SelectItem>
                  <SelectItem value="internacional">✈️ Internacional</SelectItem>
                  <SelectItem value="cruzeiro">🚢 Cruzeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preço por pessoa */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Preço por pessoa (R$) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                  R$
                </span>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0,00"
                  className="h-11 pl-9"
                />
              </div>
            </div>

            {/* Parcelas máximas */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Parcelamento máximo</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  max={48}
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  placeholder="10"
                  className="h-11 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  x
                </span>
              </div>
            </div>

            {/* Duração */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Duração</Label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: 3 dias / 2 noites"
                className="h-11"
              />
            </div>

            {/* Data da viagem — só para pacotes NÃO internos (admin define a data) */}
            {category !== "interno" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Data da Viagem</Label>
                <Input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="h-11"
                />
              </div>
            )}

            {/* Vagas disponíveis */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Users size={14} className="text-muted-foreground" />
                Vagas disponíveis
              </Label>
              <Input
                type="number"
                min={0}
                value={totalSlots}
                onChange={(e) => setTotalSlots(e.target.value)}
                placeholder="Ilimitado"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                {totalSlots
                  ? `${totalSlots} vaga(s) — ao esgotar, o pacote será marcado como esgotado automaticamente`
                  : "Deixe vazio para vagas ilimitadas"}
              </p>
            </div>


            {/* Status de venda */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status de venda</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">✅ Ativo — à venda</SelectItem>
                  <SelectItem value="rascunho">✏️ Rascunho — oculto</SelectItem>
                  <SelectItem value="esgotado">❌ Esgotado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* URL slug (gerado automaticamente) */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">
                URL (slug) — gerado automaticamente
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm shrink-0">/pacote/</span>
                <Input
                  value={slug}
                  className="h-9 font-mono text-sm text-muted-foreground"
                  onChange={(e) => {
                    setSlugManual(true);
                    setSlug(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── 1.5 TRAJETO IDA E VOLTA ── */}
        <SectionCard
          icon={Plane}
          title="Trajeto Ida e Volta"
          description="Informe os trechos de ida e volta com datas e horários de saída (opcional)"
          color="text-indigo-600"
          iconBg="bg-indigo-50"
        >
          <div className="space-y-5">
            {/* IDA */}
            <div className="space-y-3 p-4 rounded-xl border border-indigo-200 bg-indigo-50/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">→</span>
                <span className="text-sm font-semibold text-indigo-700">Ida</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Origem</Label>
                  <Input
                    value={routeDepartureFrom}
                    onChange={(e) => setRouteDepartureFrom(e.target.value)}
                    placeholder="Ex: Cruzeiro do Sul"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Destino</Label>
                  <Input
                    value={routeDepartureTo}
                    onChange={(e) => setRouteDepartureTo(e.target.value)}
                    placeholder="Ex: Rio Branco"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Data da ida</Label>
                  <Input
                    type="date"
                    value={routeDepartureDate}
                    onChange={(e) => setRouteDepartureDate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Horário de saída</Label>
                  <Input
                    type="time"
                    value={routeDepartureTime}
                    onChange={(e) => setRouteDepartureTime(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              {routeDepartureFrom && routeDepartureTo && routeDepartureDate && (
                <p className="text-xs text-indigo-600 font-medium mt-1">
                  ✈️ {routeDepartureFrom} → {routeDepartureTo} • {(() => { const [y, m, d] = routeDepartureDate.split("-"); return `${d}/${m}/${y}`; })()}{routeDepartureTime ? ` às ${routeDepartureTime}h` : ""}
                </p>
              )}
            </div>

            {/* VOLTA */}
            <div className="space-y-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">←</span>
                <span className="text-sm font-semibold text-emerald-700">Volta</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Origem</Label>
                  <Input
                    value={routeReturnFrom}
                    onChange={(e) => setRouteReturnFrom(e.target.value)}
                    placeholder="Ex: Rio Branco"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Destino</Label>
                  <Input
                    value={routeReturnTo}
                    onChange={(e) => setRouteReturnTo(e.target.value)}
                    placeholder="Ex: Cruzeiro do Sul"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Data da volta</Label>
                  <Input
                    type="date"
                    value={routeReturnDate}
                    onChange={(e) => setRouteReturnDate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Horário de saída</Label>
                  <Input
                    type="time"
                    value={routeReturnTime}
                    onChange={(e) => setRouteReturnTime(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              {routeReturnFrom && routeReturnTo && routeReturnDate && (
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  ✈️ {routeReturnFrom} → {routeReturnTo} • {(() => { const [y, m, d] = routeReturnDate.split("-"); return `${d}/${m}/${y}`; })()}{routeReturnTime ? ` às ${routeReturnTime}h` : ""}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── 2. IMAGENS ── */}
        <SectionCard
          icon={Image}
          title="Imagens"
          description="Foto de capa e galeria do pacote"
          color="text-violet-600"
          iconBg="bg-violet-50"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Foto de Capa (Hero)</Label>
              <p className="text-xs text-muted-foreground">
                Imagem principal exibida nos cards e no topo da página do pacote
              </p>
              <ImageUpload
                bucket="packages"
                value={coverImageUrl}
                onChange={setCoverImageUrl}
                onRemove={() => setCoverImageUrl(null)}
                label="Arraste ou clique para enviar a capa"
              />
            </div>
            <div className="border-t border-border/50 pt-5 space-y-2">
              <Label className="text-sm font-medium">Galeria de Fotos</Label>
              <p className="text-xs text-muted-foreground">
                Fotos adicionais exibidas na página de detalhes do pacote
              </p>
              <MultiImageUpload
                bucket="packages"
                values={gallery}
                onChange={setGallery}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── 3. DESCRIÇÃO ── */}
        <SectionCard
          icon={FileText}
          title="Descrição"
          description="Texto de apresentação do pacote para o cliente"
          color="text-amber-600"
          iconBg="bg-amber-50"
        >
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Descrição curta</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Aparece nos cards da listagem e no topo da página do pacote (2–3 linhas)
            </p>
            <Textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={4}
              placeholder="Descreva brevemente a experiência e os principais atrativos deste pacote..."
              className="resize-none"
            />
          </div>
        </SectionCard>

        {/* ── 4. INCLUSÕES ── */}
        <SectionCard
          icon={CheckSquare}
          title="O que está incluso?"
          description="Selecione todos os itens incluídos no pacote"
          color="text-emerald-600"
          iconBg="bg-emerald-50"
        >
          <div className="flex flex-wrap gap-2">
            {inclusionOptions.map((opt) => {
              const active = selectedInclusions.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleInclusion(opt.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 border ${
                    active
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
          {selectedInclusions.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              {selectedInclusions.length} item(s) selecionado(s)
            </p>
          )}
        </SectionCard>

        {/* ── 5. ROTEIRO ── */}
        <SectionCard
          icon={Map}
          title="Roteiro Dia a Dia"
          description="Descrição das atividades em cada dia da viagem (opcional)"
          color="text-rose-600"
          iconBg="bg-rose-50"
        >
          <div className="space-y-3">
            {itinerary.map((day, i) => (
              <div
                key={day.id}
                className="rounded-xl border border-border bg-muted/20 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "hsl(232 100% 23%)" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      Dia {i + 1}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDay(day.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <Input
                  value={day.title}
                  onChange={(e) => updateDay(day.id, "title", e.target.value)}
                  placeholder="Título do dia (ex: Chegada e trilha)"
                  className="h-10"
                />
                <Textarea
                  value={day.description}
                  onChange={(e) => updateDay(day.id, "description", e.target.value)}
                  placeholder="Descreva as atividades deste dia..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            ))}

            {itinerary.length === 0 && (
              <div className="border-2 border-dashed border-border rounded-xl py-8 text-center">
                <Map size={28} className="text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum dia adicionado ainda
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDay}
              className="gap-2 w-full border-dashed"
            >
              <Plus size={14} />
              Adicionar dia ao roteiro
            </Button>
          </div>
        </SectionCard>

        {/* ── 5.5 DETALHES DO PACOTE ── */}
        <SectionCard
          icon={ClipboardList}
          title="Detalhes do Pacote"
          description="Informações adicionais como tipo de tarifa, bagagem, data de emissão, etc. (opcional)"
          color="text-cyan-600"
          iconBg="bg-cyan-50"
        >
          <div className="space-y-3">
            {packageDetails.map((item, i) => (
              <div
                key={item.id}
                className="flex items-start gap-2"
              >
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Rótulo</Label>
                    <Input
                      value={item.label}
                      onChange={(e) => setPackageDetails(prev => prev.map(d => d.id === item.id ? { ...d, label: e.target.value } : d))}
                      placeholder="Ex: Tipo de Tarifa"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Valor</Label>
                    <Input
                      value={item.value}
                      onChange={(e) => setPackageDetails(prev => prev.map(d => d.id === item.id ? { ...d, value: e.target.value } : d))}
                      placeholder="Ex: Econômica com bagagem inclusa"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPackageDetails(prev => prev.filter(d => d.id !== item.id))}
                  className="w-8 h-8 mt-5 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {packageDetails.length === 0 && (
              <div className="border-2 border-dashed border-cyan-200 rounded-xl py-8 text-center bg-cyan-50/30">
                <ClipboardList size={28} className="text-cyan-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum detalhe adicionado
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Adicione informações como tarifa, bagagem, data de emissão, etc.
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPackageDetails(prev => [...prev, { id: crypto.randomUUID(), label: "", value: "" }])}
              className="gap-2 w-full border-dashed border-cyan-300 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-400"
            >
              <Plus size={14} />
              Adicionar detalhe
            </Button>
          </div>
        </SectionCard>

        {/* ── 6. CARDÁPIO (somente internos) ── */}
        {category === "interno" && (
          <SectionCard
            icon={UtensilsCrossed}
            title="Cardápio do Passeio"
            description="Itens opcionais que o cliente poderá escolher ao fazer a reserva (bebidas, refeições, etc.)"
            color="text-orange-600"
            iconBg="bg-orange-50"
          >
            <div className="space-y-3">
              {menuItems.map((item, i) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-muted/20 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: "hsl(25 100% 50%)" }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        Item {i + 1}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMenuItem(item.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs text-muted-foreground">Nome do item</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => updateMenuItem(item.id, "name", e.target.value)}
                        placeholder="Ex: Caipirinha artesanal"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Preço (R$)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateMenuItem(item.id, "price", e.target.value)}
                          placeholder="0,00"
                          className="h-10 pl-9"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Descrição (opcional)</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateMenuItem(item.id, "description", e.target.value)}
                      placeholder="Ex: Com fruta da estação e cachaça artesanal"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              ))}

              {menuItems.length === 0 && (
                <div className="border-2 border-dashed border-orange-200 rounded-xl py-8 text-center bg-orange-50/30">
                  <UtensilsCrossed size={28} className="text-orange-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum item adicionado ao cardápio
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Adicione bebidas, refeições ou experiências extras
                  </p>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMenuItem}
                className="gap-2 w-full border-dashed border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
              >
                <Plus size={14} />
                Adicionar item ao cardápio
              </Button>
            </div>
          </SectionCard>
        )}

        {/* ── BOTÕES DE AÇÃO ── */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <Button variant="ghost" asChild className="text-muted-foreground">
            <Link to="/admin/pacotes">← Cancelar</Link>
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!canSave}
            className="gap-2 px-7 h-11"
            style={{
              background: canSave
                ? "linear-gradient(135deg, hsl(232 100% 23%), hsl(232 100% 30%))"
                : undefined,
            }}
          >
            {saveMutation.isPending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Package size={16} />
            )}
            {saveMutation.isPending
              ? "Salvando..."
              : isEditing
              ? "Salvar alterações"
              : "Publicar pacote"}
          </Button>
        </div>
      </div>
    </div>
  );
}
