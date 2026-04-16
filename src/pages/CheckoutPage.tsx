/**
 * PÁGINA DE CHECKOUT — FINALIZAÇÃO DO PEDIDO (Asaas)
 *
 * FLUXO RESUMIDO:
 * 1. O cliente vem do carrinho (CartPage ou CartSheet)
 * 2. Busca os itens do carrinho com dados do pacote (preço, imagem, parcelas)
 * 3. Preenche/confirma nome, whatsapp e CPF
 * 4. Escolhe forma de pagamento: Cartão de Crédito, Débito ou PIX
 * 5. Clica em "Pagar" → chama a Edge Function "create-payment"
 * 6. Para CARTÃO: Redireciona para página segura do Asaas (invoiceUrl)
 * 7. Para PIX: Exibe QR Code inline para pagamento instantâneo
 * 8. Após pagar, o Asaas manda um webhook (asaas-webhook) que confirma a reserva
 *
 * IMPORTANTE:
 * - A data da viagem vem do cart_item (definida pelo admin ou pelo cliente na página do pacote)
 * - NÃO existe mais campo de data nesta página
 * - O parcelamento máximo é definido pelo pacote com MENOS parcelas no carrinho
 */
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

type PaymentMethod = "credit_card" | "debit_card" | "pix";

interface PixData {
  qr_code_image: string;
  copy_paste: string;
  expiration_date: string;
}

// ─── Componente principal do Checkout ───
const CheckoutPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCpf, setClientCpf] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [pixConfirmed, setPixConfirmed] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setClientName(profile.full_name || "");
      setClientPhone(profile.whatsapp || "");
      setClientCpf(profile.cpf || "");
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
            id, title, slug, price, cover_image_url, duration, installments, category, travel_date
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Pega o menor número de parcelas entre todos os itens do carrinho
  // Maximum installments allowed (minimum across all cart items)
  const maxInstallments = cartItems.length > 0
    ? cartItems.reduce((min: number, item: any) => {
        const pkg = item.package?.installments || 1;
        return Math.min(min, pkg);
      }, cartItems[0]?.package?.installments || 1)
    : 1;

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
        return {
          package_id: item.package_id,
          package_name: item.package?.title || "Pacote",
          price: (item.package?.price || 0) + menuExtras,
          people: item.people,
          cover_image_url: item.package?.cover_image_url || null,
          installments: paymentMethod === "credit_card" ? selectedInstallments : 1,
          menu_selections: item.menu_selections || [],
          travel_date: item.travel_date || null,
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

  const calculateTotal = () =>
    cartItems.reduce((total, item: any) => {
      const menuExtras = Array.isArray(item.menu_selections)
        ? (item.menu_selections as any[]).reduce((s: number, m: any) => s + Number(m.price || 0), 0)
        : 0;
      return total + ((item.package?.price || 0) + menuExtras) * item.people;
    }, 0);

  const total = calculateTotal();

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

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
              Revise seus itens, escolha como pagar e confirme.
            </p>
          </header>

          {cartItems.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Coluna esquerda: Itens + Formulário + Método de Pagamento */}
              <div className="lg:col-span-2 space-y-6">

                {/* Lista de itens do pedido */}
                <Card className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold text-lg text-primary border-b pb-3">Itens do Pedido</h3>
                    {cartItems.map((item: any, index: number) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4 py-3 border-b last:border-0"
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
                              <UsersIcon size={12} /> {item.people} pessoa{item.people > 1 ? "s" : ""}
                            </span>
                            {item.package?.duration && (
                              <span className="flex items-center gap-1">
                                <Calendar size={12} /> {item.package.duration}
                              </span>
                            )}
                            {item.package?.installments > 1 && (
                              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                                até {item.package.installments}x
                              </Badge>
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
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {formatBRL(item.package?.price || 0)} × {item.people}
                          </p>
                          {Array.isArray(item.menu_selections) && item.menu_selections.length > 0 && (() => {
                            const extras = (item.menu_selections as any[]).reduce((s: number, m: any) => s + Number(m.price || 0), 0);
                            return <p className="text-[10px] text-orange-600">+ {formatBRL(extras)} extras</p>;
                          })()}
                          <p className="font-bold text-primary">
                            {formatBRL((() => {
                              const extras = Array.isArray(item.menu_selections)
                                ? (item.menu_selections as any[]).reduce((s: number, m: any) => s + Number(m.price || 0), 0)
                                : 0;
                              return ((item.package?.price || 0) + extras) * item.people;
                            })())}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                {/* Dados do viajante (nome, whatsapp e CPF) */}
                <Card className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold text-lg text-primary border-b pb-3">Dados do Viajante</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                          id="name"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Seu nome completo"
                        />
                      </div>
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
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          value={clientCpf}
                          onChange={(e) => setClientCpf(formatCpf(e.target.value))}
                          placeholder="000.000.000-00"
                          maxLength={14}
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
                <Card className="sticky top-24 border-primary/10 shadow-lg">
                  <CardContent className="p-6 space-y-6">
                    <h3 className="font-bold text-lg border-b pb-3 text-primary">Resumo do Pedido</h3>

                    <div className="space-y-3">
                      {cartItems.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">
                            {item.package?.title} × {item.people}
                          </span>
                          <span className="font-medium shrink-0">
                            {formatBRL((item.package?.price || 0) * item.people)}
                          </span>
                        </div>
                      ))}
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
                      disabled={checkoutMutation.isPending || isRedirecting || !clientCpf}
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

                    {!clientCpf && (
                      <p className="text-xs text-center text-amber-600 font-medium">
                        ⚠️ Preencha seu CPF para continuar
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
