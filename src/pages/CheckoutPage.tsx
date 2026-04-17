/**
 * PÁGINA DE CHECKOUT — FINALIZAÇÃO DO PEDIDO (Asaas)
 *
 * FLUXO RESUMIDO:
 * 1. O cliente vem do carrinho (CartPage ou CartSheet)
 * 2. Busca os itens do carrinho com dados do pacote (preço, imagem, parcelas)
 * 3. Para cada item, preenche dados de TODOS os ocupantes (nome, CPF, nascimento)
 * 4. Crianças ≤ 2 anos: não pagam e não ocupam vaga
 * 5. Escolhe forma de pagamento: Cartão de Crédito, Débito ou PIX
 * 6. Clica em "Pagar" → chama a Edge Function "create-payment"
 * 7. Para CARTÃO: Redireciona para página segura do Asaas (invoiceUrl)
 * 8. Para PIX: Exibe QR Code inline para pagamento instantâneo
 * 9. Após pagar, o Asaas manda um webhook (asaas-webhook) que confirma a reserva
 *
 * IMPORTANTE:
 * - A data da viagem vem do cart_item (definida pelo admin ou pelo cliente na página do pacote)
 * - NÃO existe mais campo de data nesta página
 * - O parcelamento máximo é definido pelo pacote com MENOS parcelas no carrinho
 * - Dados dos ocupantes (nome, CPF, nascimento) são enviados no payload
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  CreditCard,
  Loader2,
  PackageSearch,
  Calendar,
  Users as UsersIcon,
  Shield,
  Lock,
  ArrowLeft,
  QrCode,
  CheckCircle2,
  UtensilsCrossed,
  Copy,
  Smartphone,
  Wallet,
  UserPlus,
  Baby,
  Trash2,
  AlertCircle,
  Plane,
  ArrowRight,
  MapPin,
  Clock,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

type PaymentMethod = "credit_card" | "debit_card" | "pix";

interface PixData {
  qr_code_image: string;
  copy_paste: string;
  expiration_date: string;
}

interface Occupant {
  name: string;
  cpf: string;
  birth_date: string;
  is_infant: boolean;
}

// ─── Helpers ───
function formatCpfValue(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isInfant(birthDate: string): boolean {
  if (!birthDate) return false;
  const today = new Date();
  const birth = new Date(birthDate + "T12:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age <= 2;
}

function getAge(birthDate: string): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate + "T12:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// ─── Componente principal do Checkout ───
const CheckoutPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [clientPhone, setClientPhone] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [pixConfirmed, setPixConfirmed] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mapa de ocupantes por cart_item id
  const [occupantsMap, setOccupantsMap] = useState<Record<string, Occupant[]>>({});

  // --- PIX Polling: check every 5s if payment was confirmed via Asaas API ---
  useEffect(() => {
    if (!pixData || !currentPaymentId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-payment-status", {
          body: { payment_id: currentPaymentId },
        });

        if (!error && data?.confirmed) {
          // Payment confirmed!
          setPixConfirmed(true);
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast.success("Pagamento PIX confirmado! 🎉");
          setTimeout(() => {
            navigate(`/pagamento/sucesso?payment_id=${currentPaymentId}`);
          }, 2000);
        }
      } catch (e) {
        console.warn("Polling error:", e);
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pixData, currentPaymentId, navigate]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/checkout", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile-checkout", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, whatsapp, city, state, cpf")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setClientPhone(profile.whatsapp || "");
    }
  }, [profile]);

  // Busca os itens do carrinho com os dados completos do pacote
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["cart-checkout", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          package:packages (
            id, title, slug, price, cover_image_url, duration, installments, category, travel_date, available_slots, status, route_info, package_details
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Inicializa occupantsMap quando os cart items ou profile carregarem
  useEffect(() => {
    if (cartItems.length === 0) return;

    setOccupantsMap((prev) => {
      const updated = { ...prev };
      cartItems.forEach((item: any) => {
        if (!updated[item.id]) {
          // Cria array de ocupantes com base no número de pessoas
          const occupants: Occupant[] = [];
          for (let i = 0; i < item.people; i++) {
            if (i === 0 && profile) {
              // Primeiro ocupante pré-preenche com dados do perfil
              occupants.push({
                name: profile.full_name || "",
                cpf: profile.cpf || "",
                birth_date: "",
                is_infant: false,
              });
            } else {
              occupants.push({ name: "", cpf: "", birth_date: "", is_infant: false });
            }
          }
          updated[item.id] = occupants;
        } else {
          // Ajusta tamanho se o people mudou
          const current = updated[item.id];
          const payingOccupants = current.filter((o) => !o.is_infant);
          const infantOccupants = current.filter((o) => o.is_infant);
          
          if (payingOccupants.length < item.people) {
            // Adicionar mais ocupantes pagantes
            const diff = item.people - payingOccupants.length;
            for (let i = 0; i < diff; i++) {
              payingOccupants.push({ name: "", cpf: "", birth_date: "", is_infant: false });
            }
          } else if (payingOccupants.length > item.people) {
            // Remover do final
            payingOccupants.splice(item.people);
          }
          updated[item.id] = [...payingOccupants, ...infantOccupants];
        }
      });
      return updated;
    });
  }, [cartItems, profile]);

  // ── Funções para gerenciar ocupantes ──
  const updateOccupant = (cartItemId: string, index: number, field: keyof Occupant, value: string) => {
    setOccupantsMap((prev) => {
      const list = [...(prev[cartItemId] || [])];
      const occ = { ...list[index] };
      if (field === "cpf") {
        occ.cpf = formatCpfValue(value);
      } else if (field === "birth_date") {
        occ.birth_date = value;
        occ.is_infant = isInfant(value);
      } else if (field === "name") {
        occ.name = value;
      }
      list[index] = occ;
      return { ...prev, [cartItemId]: list };
    });
  };

  const addInfant = (cartItemId: string) => {
    setOccupantsMap((prev) => {
      const list = [...(prev[cartItemId] || [])];
      list.push({ name: "", cpf: "", birth_date: "", is_infant: true });
      return { ...prev, [cartItemId]: list };
    });
  };

  const removeOccupant = (cartItemId: string, index: number) => {
    setOccupantsMap((prev) => {
      const list = [...(prev[cartItemId] || [])];
      const occ = list[index];
      if (occ.is_infant) {
        list.splice(index, 1);
      } else {
        // Não pode remover pagante se só tem 1
        const payingCount = list.filter((o) => !o.is_infant).length;
        if (payingCount > 1) {
          list.splice(index, 1);
          // Atualizar o people no carrinho
          const newPeople = list.filter((o) => !o.is_infant).length;
          supabase.from("cart_items").update({ people: newPeople }).eq("id", cartItemId).then(() => {
            queryClient.invalidateQueries({ queryKey: ["cart-checkout", user?.id] });
          });
        }
      }
      return { ...prev, [cartItemId]: list };
    });
  };

  const addPayingOccupant = (cartItemId: string, currentPeople: number, availableSlots: number | null) => {
    // Verificar vagas
    if (availableSlots != null && currentPeople + 1 > availableSlots) {
      toast.error("Não há vagas suficientes disponíveis!");
      return;
    }

    // Atualizar no banco
    supabase
      .from("cart_items")
      .update({ people: currentPeople + 1 })
      .eq("id", cartItemId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["cart-checkout", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
      });

    // Atualizar localmente
    setOccupantsMap((prev) => {
      const list = [...(prev[cartItemId] || [])];
      // Inserir antes dos infants
      const firstInfantIdx = list.findIndex((o) => o.is_infant);
      const newOcc: Occupant = { name: "", cpf: "", birth_date: "", is_infant: false };
      if (firstInfantIdx >= 0) {
        list.splice(firstInfantIdx, 0, newOcc);
      } else {
        list.push(newOcc);
      }
      return { ...prev, [cartItemId]: list };
    });
  };

  // Pega o menor número de parcelas entre todos os itens do carrinho
  const maxInstallments = cartItems.length > 0
    ? cartItems.reduce((min: number, item: any) => {
        const pkg = item.package?.installments || 1;
        return Math.min(min, pkg);
      }, cartItems[0]?.package?.installments || 1)
    : 1;

  // Calcula total considerando infants (não pagam)
  const calculateTotal = () =>
    cartItems.reduce((total, item: any) => {
      const menuExtras = Array.isArray(item.menu_selections)
        ? (item.menu_selections as any[]).reduce((s: number, m: any) => s + Number(m.price || 0), 0)
        : 0;
      const occupants = occupantsMap[item.id] || [];
      const payingCount = occupants.filter((o) => !o.is_infant).length || item.people;
      return total + ((item.package?.price || 0) + menuExtras) * payingCount;
    }, 0);

  const total = calculateTotal();

  // Conta infants por item
  const getInfantCount = (cartItemId: string) => {
    const occupants = occupantsMap[cartItemId] || [];
    return occupants.filter((o) => o.is_infant).length;
  };

  // Conta pagantes por item
  const getPayingCount = (cartItemId: string, fallback: number) => {
    const occupants = occupantsMap[cartItemId] || [];
    const paying = occupants.filter((o) => !o.is_infant).length;
    return paying || fallback;
  };

  // Valida se todos os ocupantes têm dados preenchidos
  const allOccupantsValid = cartItems.every((item: any) => {
    const occupants = occupantsMap[item.id] || [];
    if (occupants.length === 0) return false;
    return occupants.every((o) => {
      if (o.is_infant) {
        return o.name.trim().length > 0 && o.birth_date.length > 0;
      }
      return o.name.trim().length > 0 && o.cpf.replace(/\D/g, "").length === 11 && o.birth_date.length > 0;
    });
  });

  // Verifica se algum item excede vagas disponíveis
  const slotsExceeded = cartItems.some((item: any) => {
    const slots = item.package?.available_slots;
    const payingCount = getPayingCount(item.id, item.people);
    return slots != null && payingCount > slots;
  });
  const soldOutItems = cartItems.filter((item: any) => item.package?.status === "esgotado");

  // Pega clientName e clientCpf do primeiro ocupante do primeiro item
  const getClientNameAndCpf = () => {
    for (const item of cartItems) {
      const occupants = occupantsMap[item.id] || [];
      if (occupants.length > 0) {
        return { name: occupants[0].name, cpf: occupants[0].cpf };
      }
    }
    return { name: "", cpf: "" };
  };
  const { name: clientName, cpf: clientCpf } = getClientNameAndCpf();

  // Mutation que envia os dados para a Edge Function create-payment
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!user || cartItems.length === 0) throw new Error("Carrinho vazio");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão inválida");

      // Monta o payload com cada item, somando extras de cardápio ao preço base
      const cartPayload = cartItems.map((item: any) => {
        const menuExtras = Array.isArray(item.menu_selections)
          ? (item.menu_selections as any[]).reduce((s: number, m: any) => s + Number(m.price || 0), 0)
          : 0;
        const occupants = occupantsMap[item.id] || [];
        const payingCount = occupants.filter((o) => !o.is_infant).length || item.people;
        return {
          package_id: item.package_id,
          package_name: item.package?.title || "Pacote",
          price: (item.package?.price || 0) + menuExtras,
          people: payingCount,
          cover_image_url: item.package?.cover_image_url || null,
          installments: paymentMethod === "credit_card" ? selectedInstallments : 1,
          menu_selections: item.menu_selections || [],
          travel_date: item.travel_date || null,
          occupants: occupants.map((o) => ({
            name: o.name,
            cpf: o.cpf,
            birth_date: o.birth_date,
            is_infant: o.is_infant,
          })),
        };
      });

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          cart_items: cartPayload,
          client_name: clientName,
          client_phone: clientPhone,
          client_cpf: clientCpf,
          app_origin: window.location.origin,
          payment_method: paymentMethod,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw new Error(error.message || "Erro ao criar sessão de pagamento");

      return data;
    },
    onSuccess: (data) => {
      if (paymentMethod === "pix" && data?.pix) {
        // Show PIX QR code inline + start polling
        setCurrentPaymentId(data.payment_id);
        setPixData(data.pix);
      } else if (data?.url || data?.invoice_url) {
        // Redirect to Asaas checkout page (card/debit)
        setIsRedirecting(true);
        window.location.href = data.url || data.invoice_url;
      } else {
        toast.error("URL de pagamento não recebida. Tente novamente.");
      }
    },
    onError: (err: any) => {
      toast.error("Erro ao iniciar pagamento: " + (err.message || "Tente novamente"));
      setIsRedirecting(false);
    },
  });

  const formatBRL = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const copyPixCode = async () => {
    if (pixData?.copy_paste) {
      await navigator.clipboard.writeText(pixData.copy_paste);
      setPixCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-semibold text-primary">
          Redirecionando para o pagamento seguro...
        </p>
        <p className="text-muted-foreground text-sm">Aguarde, você será redirecionado</p>
      </div>
    );
  }

  // --- PIX QR Code Screen ---
  if (pixData) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <QrCode size={32} className="text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-primary">Pague via PIX</h1>
                <p className="text-muted-foreground text-sm">
                  Escaneie o QR Code abaixo ou copie o código para pagar
                </p>
              </div>

              <Card className={`shadow-lg transition-all ${pixConfirmed ? "border-emerald-500 bg-emerald-50" : "border-emerald-200"}`}>
                <CardContent className="p-6 flex flex-col items-center gap-4">
                  {pixConfirmed ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-6 space-y-4"
                    >
                      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} className="text-emerald-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-emerald-700">Pagamento Confirmado!</h2>
                      <p className="text-muted-foreground text-sm">Redirecionando para seus pedidos...</p>
                      <Loader2 className="animate-spin mx-auto text-emerald-600" size={24} />
                    </motion.div>
                  ) : (
                    <>
                      <div className="bg-white p-4 rounded-2xl shadow-inner border">
                        <img
                          src={`data:image/png;base64,${pixData.qr_code_image}`}
                          alt="QR Code PIX"
                          className="w-64 h-64"
                        />
                      </div>

                      <div className="w-full space-y-3">
                        <p className="text-xs text-muted-foreground text-center font-medium">Código PIX Copia e Cola:</p>
                        <div className="flex gap-2">
                          <Input
                            value={pixData.copy_paste}
                            readOnly
                            className="text-xs font-mono bg-muted/50"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={copyPixCode}
                            className={pixCopied ? "border-emerald-500 text-emerald-600" : ""}
                          >
                            {pixCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                          </Button>
                        </div>
                      </div>

                      <div className="text-center space-y-2 pt-2">
                        <p className="text-2xl font-black text-primary">{formatBRL(total)}</p>
                        <Badge className="bg-emerald-100 text-emerald-700 border-0">
                          Aprovação instantânea
                        </Badge>
                      </div>

                      {/* Polling indicator */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 w-full flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin shrink-0" />
                        <div>
                          <p className="font-semibold">Aguardando pagamento...</p>
                          <p>Esta página será atualizada automaticamente quando o PIX for confirmado.</p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate("/minha-conta")}
                      >
                        Ver meus pedidos
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <Link
              to="/carrinho"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary text-sm mb-4 transition-colors"
            >
              <ArrowLeft size={16} /> Voltar ao carrinho
            </Link>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <ShoppingCart className="text-accent" />
              Finalizar Pedido
            </h1>
            <p className="text-muted-foreground mt-2">
              Preencha os dados dos passageiros, escolha como pagar e confirme.
            </p>
          </header>

          {cartItems.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Coluna esquerda: Itens + Ocupantes + Método de Pagamento */}
              <div className="lg:col-span-2 space-y-6">

                {/* Lista de itens do pedido com formulário de ocupantes */}
                {cartItems.map((item: any, itemIndex: number) => {
                  const occupants = occupantsMap[item.id] || [];
                  const payingOccupants = occupants.filter((o) => !o.is_infant);
                  const infantOccupants = occupants.filter((o) => o.is_infant);
                  const menuExtras = Array.isArray(item.menu_selections)
                    ? (item.menu_selections as any[]).reduce((s: number, m: any) => s + Number(m.price || 0), 0)
                    : 0;
                  const itemTotal = ((item.package?.price || 0) + menuExtras) * payingOccupants.length;

                  return (
                    <Card key={item.id} className="border-none shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        {/* Header do item */}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: itemIndex * 0.1 }}
                          className="flex gap-4 p-6 border-b bg-gradient-to-r from-primary/[0.02] to-transparent"
                        >
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-muted">
                            {item.package?.cover_image_url && (
                              <img
                                src={item.package.cover_image_url}
                                alt={item.package.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{item.package?.title}</h4>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <UsersIcon size={12} /> {payingOccupants.length} pagante{payingOccupants.length > 1 ? "s" : ""}
                                {infantOccupants.length > 0 && (
                                  <span className="text-emerald-600 ml-1">+ {infantOccupants.length} colo</span>
                                )}
                              </span>
                              {item.package?.duration && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} /> {item.package.duration}
                                </span>
                              )}
                            </div>
                            {/* Data da viagem */}
                            {item.travel_date && (
                              <div className="flex items-center gap-1 text-xs mt-1 text-amber-600 font-medium">
                                <Calendar size={11} />
                                <span>
                                  {(() => { const dt = item.travel_date; if (dt.includes("T") && dt.length > 10) { return new Date(dt).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) + ` às ${new Date(dt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}h`; } const [y, m, d] = dt.substring(0, 10).split("-"); return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }); })()}
                                </span>
                              </div>
                            )}
                            {/* Itens extras do cardápio */}
                            {Array.isArray(item.menu_selections) && item.menu_selections.length > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center gap-1 text-xs text-orange-600 font-medium mb-1">
                                  <UtensilsCrossed size={10} /> Cardápio extra:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {(item.menu_selections as any[]).map((m: any, idx: number) => (
                                    <span key={idx} className="text-[10px] bg-orange-50 border border-orange-200 text-orange-600 rounded-full px-2 py-0.5">
                                      {m.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {formatBRL(item.package?.price || 0)} × {payingOccupants.length}
                            </p>
                            {menuExtras > 0 && (
                              <p className="text-[10px] text-orange-600">+ {formatBRL(menuExtras)} extras</p>
                            )}
                            <p className="font-bold text-primary">{formatBRL(itemTotal)}</p>
                          </div>
                        </motion.div>

                        {/* Formulários dos ocupantes */}
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                              <UsersIcon size={16} />
                              Dados dos Passageiros
                            </h3>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                                onClick={() => addPayingOccupant(item.id, item.people, item.package?.available_slots)}
                              >
                                <UserPlus size={14} />
                                Adicionar Vaga
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1.5 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                                onClick={() => addInfant(item.id)}
                              >
                                <Baby size={14} />
                                Criança de Colo
                              </Button>
                            </div>
                          </div>

                          <AnimatePresence mode="popLayout">
                            {occupants.map((occ, occIndex) => {
                              const occNumber = occIndex + 1;
                              const isInfantOcc = occ.is_infant;
                              const hasInfantBirthDate = occ.birth_date && isInfant(occ.birth_date);
                              const showInfantWarning = !isInfantOcc && hasInfantBirthDate;

                              return (
                                <motion.div
                                  key={`${item.id}-${occIndex}`}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div
                                    className={`rounded-xl border p-4 space-y-3 transition-all ${
                                      isInfantOcc
                                        ? "border-emerald-200 bg-emerald-50/50"
                                        : showInfantWarning
                                          ? "border-amber-200 bg-amber-50/30"
                                          : "border-border/60 bg-muted/20"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                          isInfantOcc
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-primary/10 text-primary"
                                        }`}>
                                          {isInfantOcc ? "🍼 Colo" : `Passageiro ${occupants.slice(0, occIndex + 1).filter((o) => !o.is_infant).length || occNumber}`}
                                        </span>
                                        {isInfantOcc && (
                                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
                                            Gratuito — Não ocupa vaga
                                          </Badge>
                                        )}
                                        {showInfantWarning && (
                                          <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] gap-1">
                                            <AlertCircle size={10} />
                                            Criança ≤ 2 anos detectada — será tratada como colo
                                          </Badge>
                                        )}
                                      </div>
                                      {(isInfantOcc || occupants.filter((o) => !o.is_infant).length > 1) && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                          onClick={() => removeOccupant(item.id, occIndex)}
                                        >
                                          <Trash2 size={14} />
                                        </Button>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Nome Completo *</Label>
                                        <Input
                                          value={occ.name}
                                          onChange={(e) => updateOccupant(item.id, occIndex, "name", e.target.value)}
                                          placeholder="Nome do passageiro"
                                          className="h-9 text-sm"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">
                                          CPF {isInfantOcc ? "(opcional)" : "*"}
                                        </Label>
                                        <Input
                                          value={occ.cpf}
                                          onChange={(e) => updateOccupant(item.id, occIndex, "cpf", e.target.value)}
                                          placeholder="000.000.000-00"
                                          maxLength={14}
                                          className="h-9 text-sm"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Data de Nascimento *</Label>
                                        <Input
                                          type="date"
                                          value={occ.birth_date}
                                          onChange={(e) => updateOccupant(item.id, occIndex, "birth_date", e.target.value)}
                                          className="h-9 text-sm"
                                          max={new Date().toISOString().split("T")[0]}
                                        />
                                        {occ.birth_date && (
                                          <p className={`text-[10px] font-medium ${
                                            isInfant(occ.birth_date) ? "text-emerald-600" : "text-muted-foreground"
                                          }`}>
                                            {isInfant(occ.birth_date)
                                              ? `🍼 ${getAge(occ.birth_date)} ano(s) — Criança de colo (gratuito)`
                                              : `${getAge(occ.birth_date)} anos`}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Se passageiro pagante e nascimento indica ≤ 2 anos */}
                                    {showInfantWarning && (
                                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
                                        <Baby size={16} className="shrink-0 mt-0.5" />
                                        <div>
                                          <p className="font-semibold">Esta criança tem {getAge(occ.birth_date)} ano(s) e não paga!</p>
                                          <p>Crianças com até 2 anos viajam gratuitamente e não ocupam uma vaga do pacote. O valor será ajustado automaticamente.</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* WhatsApp do comprador */}
                <Card className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold text-lg text-primary border-b pb-3">Contato do Comprador</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          value={user?.email || ""}
                          disabled
                          className="bg-muted/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">WhatsApp</Label>
                        <Input
                          id="phone"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="(68) 9 9999-9999"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Escolha do método de pagamento */}
                <Card className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold text-lg text-primary border-b pb-3">Forma de Pagamento</h3>
                    <div className="grid grid-cols-3 gap-3">

                      {/* Opção Cartão de Crédito */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("credit_card")}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                          paymentMethod === "credit_card"
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-muted hover:border-primary/40"
                        }`}
                      >
                        {paymentMethod === "credit_card" && (
                          <CheckCircle2 size={16} className="absolute top-2 right-2 text-primary" />
                        )}
                        <CreditCard size={22} className={`mb-2 ${paymentMethod === "credit_card" ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="font-semibold text-sm">Crédito</p>
                        {maxInstallments > 1 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            até {maxInstallments}x
                          </p>
                        )}
                        <Badge variant="outline" className="mt-2 text-[10px] border-primary/30 text-primary">
                          Visa, Master
                        </Badge>
                      </button>

                      {/* Opção Cartão de Débito */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("debit_card")}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                          paymentMethod === "debit_card"
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-muted hover:border-blue-300"
                        }`}
                      >
                        {paymentMethod === "debit_card" && (
                          <CheckCircle2 size={16} className="absolute top-2 right-2 text-blue-500" />
                        )}
                        <Wallet size={22} className={`mb-2 ${paymentMethod === "debit_card" ? "text-blue-600" : "text-muted-foreground"}`} />
                        <p className="font-semibold text-sm">Débito</p>
                        <p className="text-xs text-muted-foreground mt-0.5">À vista</p>
                        <Badge variant="outline" className="mt-2 text-[10px] border-blue-300 text-blue-600">
                          Visa, Master
                        </Badge>
                      </button>

                      {/* Opção PIX */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("pix")}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                          paymentMethod === "pix"
                            ? "border-emerald-500 bg-emerald-50 shadow-sm"
                            : "border-muted hover:border-emerald-300"
                        }`}
                      >
                        {paymentMethod === "pix" && (
                          <CheckCircle2 size={16} className="absolute top-2 right-2 text-emerald-500" />
                        )}
                        <QrCode size={22} className={`mb-2 ${paymentMethod === "pix" ? "text-emerald-600" : "text-muted-foreground"}`} />
                        <p className="font-semibold text-sm">PIX</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Instantâneo</p>
                        <Badge variant="outline" className="mt-2 text-[10px] border-emerald-300 text-emerald-600">
                          QR Code
                        </Badge>
                      </button>
                    </div>

                    {/* Installment selector for credit card */}
                    {paymentMethod === "credit_card" && maxInstallments > 1 && (
                      <div className="rounded-xl border border-primary/15 bg-gradient-to-b from-primary/[0.03] to-transparent overflow-hidden">
                        <div className="px-4 py-3 border-b border-primary/10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <CreditCard size={14} className="text-primary" />
                            </div>
                            <span className="font-semibold text-sm text-primary">Parcelas</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-primary/20 text-primary/70 font-normal">
                            até {maxInstallments}x sem juros
                          </Badge>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
                          {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((n) => {
                            const isSelected = selectedInstallments === n;
                            const installmentValue = total / n;
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setSelectedInstallments(n)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-all duration-150 border-b last:border-b-0 ${
                                  isSelected
                                    ? "bg-primary/[0.07] border-primary/10"
                                    : "bg-transparent border-transparent hover:bg-muted/40"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "border-primary bg-primary"
                                      : "border-muted-foreground/30 bg-transparent"
                                  }`}>
                                    {isSelected && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                    )}
                                  </div>
                                  <span className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                                    {n}x
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    de <span className={`font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>{formatBRL(installmentValue)}</span>
                                  </span>
                                </div>
                                {n === 1 && (
                                  <Badge className="text-[9px] h-4 bg-emerald-100 text-emerald-700 border-0 font-medium px-1.5">
                                    à vista
                                  </Badge>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {paymentMethod === "pix" && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
                        <p className="font-semibold mb-1">⚡ PIX — Pagamento instantâneo</p>
                        <p className="text-xs">Após clicar em pagar, um QR Code será exibido para você escanear com seu app de banco. Confirmação em segundos!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Coluna direita: Resumo do pedido */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                <Card className="border-primary/10 shadow-lg">
                  <CardContent className="p-6 space-y-6">
                    <h3 className="font-bold text-lg border-b pb-3 text-primary">Resumo do Pedido</h3>

                    <div className="space-y-3">
                      {cartItems.map((item: any) => {
                        const occupants = occupantsMap[item.id] || [];
                        const payingCount = occupants.filter((o) => !o.is_infant).length || item.people;
                        const infantCount = occupants.filter((o) => o.is_infant).length;
                        const menuExtras = Array.isArray(item.menu_selections)
                          ? (item.menu_selections as any[]).reduce((s: number, m: any) => s + Number(m.price || 0), 0)
                          : 0;

                        return (
                          <div key={item.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">
                                {item.package?.title} × {payingCount}
                              </span>
                              <span className="font-medium shrink-0">
                                {formatBRL(((item.package?.price || 0) + menuExtras) * payingCount)}
                              </span>
                            </div>
                            {infantCount > 0 && (
                              <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                                <Baby size={11} />
                                + {infantCount} criança{infantCount > 1 ? "s" : ""} de colo (grátis)
                              </p>
                            )}
                          </div>
                        );
                      })}
                      <div className="pt-3 border-t flex justify-between items-baseline">
                        <span className="font-bold">Total</span>
                        <span className="text-2xl font-black text-primary">
                          {formatBRL(total)}
                        </span>
                      </div>
                      {paymentMethod === "credit_card" && selectedInstallments > 1 && (
                        <p className="text-xs text-muted-foreground text-right">
                          {selectedInstallments}x de {formatBRL(total / selectedInstallments)}
                        </p>
                      )}
                    </div>

                    <Button
                      className={`w-full gap-2 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all ${
                        paymentMethod === "pix"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : paymentMethod === "debit_card"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      }`}
                      onClick={() => checkoutMutation.mutate()}
                      disabled={checkoutMutation.isPending || isRedirecting || !allOccupantsValid || slotsExceeded || soldOutItems.length > 0}
                    >
                      {checkoutMutation.isPending || isRedirecting ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <>
                          {paymentMethod === "pix" ? (
                            <><QrCode size={18} /> Gerar QR Code PIX</>
                          ) : paymentMethod === "debit_card" ? (
                            <><Wallet size={18} /> Pagar com Débito</>
                          ) : (
                            <><Lock size={18} /> Pagar com Crédito</>
                          )}
                        </>
                      )}
                    </Button>

                    {!allOccupantsValid && (
                      <p className="text-xs text-center text-amber-600 font-medium">
                        ⚠️ Preencha todos os dados dos passageiros para continuar
                      </p>
                    )}

                    {slotsExceeded && (
                      <p className="text-xs text-center text-red-600 font-medium">
                        ⚠️ Um ou mais pacotes não tem vagas suficientes para a quantidade selecionada
                      </p>
                    )}

                    {soldOutItems.length > 0 && (
                      <p className="text-xs text-center text-red-600 font-medium">
                        ❌ {soldOutItems.map((i: any) => i.package?.title).join(", ")} está esgotado
                      </p>
                    )}

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Shield size={14} className="text-emerald-600" />
                      <span>Pagamento 100% seguro</span>
                    </div>

                    <div className="flex items-center justify-center gap-3 opacity-50">
                      <Smartphone size={16} />
                      <span className="text-xs font-medium">Asaas Pagamentos</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Package Extras (Trajeto & Detalhes) — Compact */}
                {Array.from(new Set(cartItems.map((item: any) => item.package?.id))).map((packageId: any) => {
                  const pkg = cartItems.find((item: any) => item.package?.id === packageId)?.package;
                  if (!pkg) return null;

                  const pd = pkg.package_details;
                  const hasDetails = pd && Array.isArray(pd) && pd.length > 0;
                  
                  const ri = pkg.route_info;
                  const dep = ri?.departure;
                  const ret = ri?.return;
                  const hasDep = dep && (dep.from || dep.to);
                  const hasRet = ret && (ret.from || ret.to);
                  const hasRoute = hasDep || hasRet;

                  if (!hasDetails && !hasRoute) return null;

                  const fmtD = (d: string) => { if (!d) return ''; const p = d.split('-'); return `${p[2]}/${p[1]}`; };

                  return (
                    <Card key={pkg.id} className="border-primary/10 shadow-sm">
                      <CardContent className="p-4 space-y-3">
                        {hasRoute && (
                          <>
                            <h4 className="font-bold text-xs text-primary flex items-center gap-1.5 uppercase tracking-wider">
                              <Plane size={13} />
                              Trajeto
                            </h4>
                            <div className="space-y-1.5">
                              {hasDep && (
                                <div className="flex items-center gap-2 text-xs bg-indigo-50 rounded-lg px-2.5 py-2 border border-indigo-100">
                                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                                    <ArrowRight size={10} strokeWidth={3} />
                                  </span>
                                  <span className="font-semibold text-indigo-900 truncate">{dep.from || '--'}</span>
                                  <ArrowRight size={10} className="text-indigo-300 shrink-0" />
                                  <span className="font-semibold text-indigo-900 truncate">{dep.to || '--'}</span>
                                  {(dep.date || dep.time) && (
                                    <span className="ml-auto text-[10px] text-indigo-600 font-medium shrink-0 whitespace-nowrap">
                                      {dep.date ? fmtD(dep.date) : ''}{dep.date && dep.time ? ' ' : ''}{dep.time ? `${dep.time}h` : ''}
                                    </span>
                                  )}
                                </div>
                              )}
                              {hasRet && (
                                <div className="flex items-center gap-2 text-xs bg-emerald-50 rounded-lg px-2.5 py-2 border border-emerald-100">
                                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                    <ArrowLeft size={10} strokeWidth={3} />
                                  </span>
                                  <span className="font-semibold text-emerald-900 truncate">{ret.from || '--'}</span>
                                  <ArrowRight size={10} className="text-emerald-300 shrink-0" />
                                  <span className="font-semibold text-emerald-900 truncate">{ret.to || '--'}</span>
                                  {(ret.date || ret.time) && (
                                    <span className="ml-auto text-[10px] text-emerald-600 font-medium shrink-0 whitespace-nowrap">
                                      {ret.date ? fmtD(ret.date) : ''}{ret.date && ret.time ? ' ' : ''}{ret.time ? `${ret.time}h` : ''}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {hasDetails && (
                          <>
                            {hasRoute && <div className="border-t" />}
                            <h4 className="font-bold text-xs text-primary flex items-center gap-1.5 uppercase tracking-wider">
                              <Info size={13} />
                              Detalhes
                            </h4>
                            <div className="space-y-1">
                              {pd.map((item: any, i: number) => (
                                <div key={i} className="flex items-baseline gap-2 text-xs">
                                  <span className="text-muted-foreground font-semibold shrink-0">{item.label}:</span>
                                  <span className="text-foreground font-medium leading-snug">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                </div>
              </div>
            </div>
          ) : (
            <Card className="border-dashed border-2 bg-transparent py-16">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <PackageSearch size={40} className="text-muted-foreground/30" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-primary">Nenhum item para comprar</h2>
                  <p className="text-muted-foreground max-w-sm">
                    Seu carrinho está vazio. Adicione pacotes antes de continuar.
                  </p>
                </div>
                <Button asChild size="lg" className="rounded-full px-8 shadow-md">
                  <Link to="/destinos">Explorar Destinos</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
