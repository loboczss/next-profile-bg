/**
 * ÁREA DO CLIENTE — CustomerDashboard.tsx
 *
 * Juan, esta é a "minha conta" do cliente. Ele acessa via /minha-conta
 *
 * ESTRUTURA — 5 abas (controladas via query param ?tab=xxx):
 * 1. Meus Pedidos — lista de reservas com status, pagamento, ações
 * 2. Favoritos — pacotes salvos com coração (hook useFavorite)
 * 3. Carrinho — itens reais do cart_items com preço, pessoas, extras
 * 4. Meus Vouchers — comprovantes de viagens pagas (baixar/imprimir)
 * 5. Meu Perfil — editar nome, CPF, idade, endereço, cidade, estado
 *
 * LAYOUT:
 * - Desktop: sidebar fixa com avatar + menu vertical | conteúdo à direita
 * - Mobile: card de perfil + menu horizontal scrollable
 *
 * CONSULTAS AO BANCO:
 * - profile: dados do perfil (tabela profiles)
 * - reservations: pedidos do cliente (tabela reservations, filtro user_id)
 * - favorites: join user_favorites → packages (título, preço, imagem)
 * - cart: join cart_items → packages (detalhes do pacote)
 * - vouchers: busca em vouchers por reservation_ids do cliente (RLS protege)
 *
 * VOUCHERS:
 * - Gerados automaticamente após pagamento (edge function generate-voucher)
 * - RLS policy "Users can see own vouchers" permite o cliente ver os dele
 * - Download como HTML + botão imprimir/PDF
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Plane, Calendar, MapPin, CreditCard, Loader2, Package, UserCircle, LogOut,
  Heart, Save, ShoppingCart, Star, XCircle, Ticket, Download, Eye, X,
  Users, Trash2, Clock, ChevronRight, Mail
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ImageUpload } from "@/components/ImageUpload";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Status Configs ───────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  novo: { label: "Orçamento", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  aguardando: { label: "Aguardando Pgto.", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  confirmado: { label: "Confirmado", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  cancelado: { label: "Cancelado", color: "text-red-600", bg: "bg-red-50 border-red-200" },
};

const paymentStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pago: { label: "Pago", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  pendente: { label: "Pendente", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  cancelado: { label: "Cancelado", color: "text-red-600", bg: "bg-red-50 border-red-200" },
};

type TabType = "pedidos" | "perfil" | "favoritos" | "carrinho" | "vouchers";

const sidebarItems: { key: TabType; label: string; icon: any }[] = [
  { key: "pedidos", label: "Meus Pedidos", icon: Package },
  { key: "favoritos", label: "Favoritos", icon: Heart },
  { key: "carrinho", label: "Carrinho", icon: ShoppingCart },
  { key: "vouchers", label: "Meus Vouchers", icon: Ticket },
  { key: "perfil", label: "Meu Perfil", icon: UserCircle },
];

// ─── Voucher HTML Generator (matches edge function template) ──────
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function generateVoucherHTML(voucher: any): string {
  const inclusions = (voucher.package_inclusions || []) as string[];
  const inclusionsHTML = inclusions.length > 0
    ? inclusions.map((inc: string) => `<tr><td style="padding:6px 12px;font-size:14px;color:#374151;">✓ ${inc}</td></tr>`).join("")
    : '<tr><td style="padding:6px 12px;font-size:14px;color:#9ca3af;">Consulte o pacote para detalhes</td></tr>';

  const travelDateFormatted = voucher.travel_date
    ? new Date(voucher.travel_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "A definir";

  // Build route HTML
  const ri = voucher.route_info;
  let routeHTML = '';
  if (ri && typeof ri === 'object') {
    const dep = ri.departure;
    const ret = ri.return;
    const hasDep = dep && (dep.from || dep.to);
    const hasRet = ret && (ret.from || ret.to);
    if (hasDep || hasRet) {
      const fmtD = (d: string) => { if (!d) return ''; const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; };
      let rows = '';
      if (hasDep) {
        const info = [dep.date ? fmtD(dep.date) : '', dep.time ? `${dep.time}h` : ''].filter(Boolean).join(' \u2022 ');
        rows += `<tr><td style="padding:8px 12px;font-size:13px;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#6366f1;color:#fff;text-align:center;line-height:20px;font-size:10px;font-weight:700;margin-right:8px;">\u2192</span><span style="color:#312e81;font-weight:600;">IDA</span></td><td style="padding:8px 12px;font-size:13px;color:#0f172a;font-weight:600;">${dep.from || ''} \u2192 ${dep.to || ''}</td><td style="padding:8px 12px;font-size:12px;color:#64748b;">${info}</td></tr>`;
      }
      if (hasRet) {
        const info = [ret.date ? fmtD(ret.date) : '', ret.time ? `${ret.time}h` : ''].filter(Boolean).join(' \u2022 ');
        rows += `<tr><td style="padding:8px 12px;font-size:13px;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#059669;color:#fff;text-align:center;line-height:20px;font-size:10px;font-weight:700;margin-right:8px;">\u2190</span><span style="color:#065f46;font-weight:600;">VOLTA</span></td><td style="padding:8px 12px;font-size:13px;color:#0f172a;font-weight:600;">${ret.from || ''} \u2192 ${ret.to || ''}</td><td style="padding:8px 12px;font-size:12px;color:#64748b;">${info}</td></tr>`;
      }
      routeHTML = `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;"><tr style="background:#eef2ff;"><td colspan="3" style="padding:14px 16px;border-bottom:1px solid #e5e7eb;"><span style="color:#4338ca;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">\u2708\ufe0f Trajeto</span></td></tr><tr style="background:#f8fafc;border-bottom:1px solid #e5e7eb;"><td style="padding:6px 12px;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;width:90px;">Trecho</td><td style="padding:6px 12px;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Rota</td><td style="padding:6px 12px;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Data / Hor\u00e1rio</td></tr>${rows}</table>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Voucher ${voucher.voucher_code}</title>
<style>@media print{body{background:#fff!important}}</style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:24px;">
  <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0c4a6e 100%);padding:32px 32px 28px;text-align:center;">
      <div style="margin-bottom:16px;">
        <span style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 16px;">
          <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px;">EVASTUR</span>
          <span style="color:rgba(255,255,255,0.6);font-size:11px;display:block;letter-spacing:3px;margin-top:2px;">VIAGENS & TURISMO</span>
        </span>
      </div>
      <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:12px 0 4px;">VOUCHER DE VIAGEM</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;">Documento de confirma\u00e7\u00e3o de reserva</p>
      <div style="margin-top:20px;display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:10px 24px;">
        <span style="color:rgba(255,255,255,0.6);font-size:11px;text-transform:uppercase;letter-spacing:2px;display:block;">C\u00f3digo do Voucher</span>
        <span style="color:#38bdf8;font-size:22px;font-weight:800;letter-spacing:3px;">${voucher.voucher_code}</span>
      </div>
    </div>
    <div style="padding:32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding:12px 16px;background:#f0f9ff;border-radius:10px;">
            <span style="color:#0369a1;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Passageiro</span>
            <br><span style="color:#0f172a;font-size:18px;font-weight:700;">${voucher.client_name}</span>
            ${voucher.client_email ? `<br><span style="color:#64748b;font-size:13px;">${voucher.client_email}</span>` : ""}
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr style="background:#f8fafc;"><td colspan="2" style="padding:14px 16px;border-bottom:1px solid #e5e7eb;"><span style="color:#0369a1;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Detalhes da Viagem</span></td></tr>
        <tr>
          <td style="padding:12px 16px;width:50%;border-bottom:1px solid #f1f5f9;"><span style="color:#94a3b8;font-size:11px;text-transform:uppercase;">Pacote</span><br><span style="color:#0f172a;font-size:15px;font-weight:600;">${voucher.package_name}</span></td>
          <td style="padding:12px 16px;width:50%;border-bottom:1px solid #f1f5f9;"><span style="color:#94a3b8;font-size:11px;text-transform:uppercase;">Destino</span><br><span style="color:#0f172a;font-size:15px;font-weight:600;">${voucher.destination || "\u2014"}</span></td>
        </tr>
        <tr>
          <td style="padding:12px 16px;width:50%;border-bottom:1px solid #f1f5f9;"><span style="color:#94a3b8;font-size:11px;text-transform:uppercase;">Data da Viagem</span><br><span style="color:#0f172a;font-size:15px;font-weight:600;">${travelDateFormatted}</span></td>
          <td style="padding:12px 16px;width:50%;border-bottom:1px solid #f1f5f9;"><span style="color:#94a3b8;font-size:11px;text-transform:uppercase;">Dura\u00e7\u00e3o</span><br><span style="color:#0f172a;font-size:15px;font-weight:600;">${voucher.package_duration || "\u2014"}</span></td>
        </tr>
        <tr>
          <td style="padding:12px 16px;width:50%;"><span style="color:#94a3b8;font-size:11px;text-transform:uppercase;">Passageiros</span><br><span style="color:#0f172a;font-size:15px;font-weight:600;">${voucher.people} pessoa(s)</span></td>
          <td style="padding:12px 16px;width:50%;"><span style="color:#94a3b8;font-size:11px;text-transform:uppercase;">Valor Total</span><br><span style="color:#059669;font-size:18px;font-weight:800;">${formatCurrency(Number(voucher.total_price))}</span></td>
        </tr>
      </table>
      ${routeHTML}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr style="background:#f0fdf4;"><td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;"><span style="color:#15803d;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">O que est\u00e1 incluso</span></td></tr>
        ${inclusionsHTML}
      </table>
      ${(() => {
        const occupants = (voucher.occupants || []) as any[];
        if (occupants.length === 0) return '';
        const occupantsRows = occupants.map((occ: any) => {
          const type = occ.is_infant ? '🍼 Colo (grátis)' : 'Passageiro';
          const birthFormatted = occ.birth_date
            ? new Date(occ.birth_date + 'T12:00:00').toLocaleDateString('pt-BR')
            : '—';
          return `<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 12px;font-size:13px;color:#0f172a;font-weight:600;">${occ.name}</td>
            <td style="padding:8px 12px;font-size:13px;color:#64748b;">${occ.cpf || '—'}</td>
            <td style="padding:8px 12px;font-size:13px;color:#64748b;">${birthFormatted}</td>
            <td style="padding:8px 12px;font-size:12px;${occ.is_infant ? 'color:#059669;font-weight:600;' : 'color:#64748b;'}">${type}</td>
          </tr>`;
        }).join('');
        return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr style="background:#f0f9ff;"><td colspan="4" style="padding:14px 16px;border-bottom:1px solid #e5e7eb;"><span style="color:#0369a1;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Passageiros</span></td></tr>
          <tr style="background:#f8fafc;border-bottom:1px solid #e5e7eb;">
            <td style="padding:6px 12px;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Nome</td>
            <td style="padding:6px 12px;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;">CPF</td>
            <td style="padding:6px 12px;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Nascimento</td>
            <td style="padding:6px 12px;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Tipo</td>
          </tr>
          ${occupantsRows}
        </table>`;
      })()}
      <div style="text-align:center;padding:16px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
        <span style="color:#15803d;font-size:14px;font-weight:700;">✅ PAGAMENTO CONFIRMADO</span>
        <br><span style="color:#4ade80;font-size:12px;">Reserva confirmada e garantida</span>
      </div>
    </div>
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#64748b;font-size:12px;margin:0 0 4px;">Evastur Agência de Viagens e Turismo</p>
      <p style="color:#94a3b8;font-size:11px;margin:0;">Av. Joaquim Távora, 213 — Centro, Cruzeiro do Sul - AC</p>
      <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">evastur.com.br • @evastur.turismo</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─── Main Component ───────────────────────────────────────────────
const CustomerDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam && sidebarItems.some(s => s.key === tabParam) ? tabParam : "pedidos");
  const [previewVoucher, setPreviewVoucher] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (tabParam && sidebarItems.some(s => s.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  // ─── Queries ──────────────────────────────────────────────
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: reservations = [], isLoading: isLoadingReservations } = useQuery({
    queryKey: ["customer-reservations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: favorites = [], isLoading: isLoadingFavorites } = useQuery({
    queryKey: ["customer-favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_favorites")
        .select(`
          id,
          package:packages (
            id, title, slug, price, cover_image_url, destination_name
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: cartItems = [], isLoading: isLoadingCart } = useQuery({
    queryKey: ["cart", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          package:packages (
            id, title, slug, price, cover_image_url, duration
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: vouchers = [], isLoading: isLoadingVouchers } = useQuery({
    queryKey: ["customer-vouchers", user?.id],
    enabled: !!user && (reservations as any[]).length > 0,
    queryFn: async () => {
      const reservationIds = (reservations as any[]).map(r => r.id);
      if (reservationIds.length === 0) return [];
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .in("reservation_id", reservationIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // ─── Profile form ─────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    full_name: "", cpf: "", age: "", address: "", city: "", state: "",
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        cpf: profile.cpf || "",
        age: profile.age || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
      });
    }
  }, [profile]);

  const updateProfileData = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileForm.full_name,
          cpf: profileForm.cpf,
          age: profileForm.age,
          address: profileForm.address,
          city: profileForm.city,
          state: profileForm.state,
        })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar o perfil.");
    },
  });

  const updateAvatar = useMutation({
    mutationFn: async (avatar_url: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ avatar_url })
        .eq("user_id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Foto atualizada!");
    },
  });

  // ─── Mutations ────────────────────────────────────────────
  const cancelReservation = useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelado", payment_status: "cancelado", updated_at: new Date().toISOString() })
        .eq("id", reservationId)
        .eq("payment_status", "pendente");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-reservations", user?.id] });
      toast.success("Reserva cancelada.");
    },
    onError: () => toast.error("Erro ao cancelar."),
  });

  const removeFavorite = useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("id", favoriteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-favorites", user?.id] });
      toast.info("Removido dos favoritos.");
    },
  });

  const removeCartItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["cart-count", user?.id] });
      toast.success("Item removido do carrinho.");
    },
  });

  // ─── Helpers ──────────────────────────────────────────────
  const formatBRL = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "A definir";
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const confirmedTrips = (reservations as any[]).filter(r => r.status === "confirmado");
  const pendingTrips = (reservations as any[]).filter(r => r.payment_status === "pendente" && r.status !== "cancelado");

  const handleVoucherDownload = (voucher: any) => {
    const html = generateVoucherHTML(voucher);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voucher-${voucher.voucher_code}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVoucherPrint = (voucher: any) => {
    const html = generateVoucherHTML(voucher);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 400);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30">
      <Navbar />

      <div className="container mx-auto px-4 lg:px-8 pt-24 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ══════════ SIDEBAR (Desktop) / TOP BAR (Mobile) ══════════ */}
          <aside className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Profile Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                  <div className="relative flex flex-col items-center text-center">
                    <div className="w-20 h-20 relative group mb-3">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover border-3 border-white/20 shadow-xl"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center border-3 border-white/20">
                          <UserCircle size={36} className="text-white/60" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <ImageUpload
                          bucket="avatars"
                          value={null}
                          onChange={(url) => updateAvatar.mutate(url)}
                          className="w-full h-full flex items-center justify-center absolute inset-0 z-10 opacity-0"
                        />
                        <span className="text-xs font-medium text-white z-0 pointer-events-none">Alterar</span>
                      </div>
                    </div>
                    <h2 className="text-lg font-bold">{profile?.full_name || "Viajante"}</h2>
                    <p className="text-white/50 text-sm truncate max-w-full">{user?.email}</p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-5">
                    <div className="bg-white/5 rounded-xl p-2.5 text-center backdrop-blur-sm">
                      <p className="text-xl font-bold">{(reservations as any[]).length}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Pedidos</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 text-center backdrop-blur-sm">
                      <p className="text-xl font-bold">{confirmedTrips.length}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Viagens</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 text-center backdrop-blur-sm">
                      <p className="text-xl font-bold">{(vouchers as any[]).length}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Vouchers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Nav — mobile horizontal scroll, desktop vertical */}
              <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible hide-scrollbar pb-2 lg:pb-0">
                {sidebarItems.map((item) => {
                  const isActive = activeTab === item.key;
                  const Icon = item.icon;
                  const count = item.key === "carrinho" ? cartItems.length
                    : item.key === "favoritos" ? favorites.length
                    : item.key === "vouchers" ? (vouchers as any[]).length
                    : undefined;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleTabChange(item.key)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                        ${isActive
                          ? "bg-white shadow-md text-primary border border-primary/10"
                          : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
                        }
                      `}
                    >
                      <Icon size={18} className={isActive ? "text-primary" : ""} />
                      <span>{item.label}</span>
                      {count !== undefined && count > 0 && (
                        <span className={`ml-auto text-xs rounded-full px-2 py-0.5 font-bold ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="mt-2 pt-2 border-t border-border/50 hidden lg:block">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all w-full"
                  >
                    <LogOut size={18} />
                    <span>Sair da conta</span>
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* ══════════ MAIN CONTENT ══════════ */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* ──── PEDIDOS ──── */}
                {activeTab === "pedidos" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h1 className="text-2xl font-bold text-foreground">Meus Pedidos</h1>
                        <p className="text-muted-foreground text-sm mt-1">Acompanhe suas reservas e viagens</p>
                      </div>
                      {pendingTrips.length > 0 && (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          {pendingTrips.length} pendente{pendingTrips.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>

                    {isLoadingReservations ? (
                      <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-muted-foreground" size={32} />
                      </div>
                    ) : (reservations as any[]).length > 0 ? (
                      <div className="space-y-3">
                        {(reservations as any[]).map((r, i) => {
                          const payStatus = r.payment_status || "pendente";
                          const payConfig = paymentStatusConfig[payStatus] || paymentStatusConfig["pendente"];
                          const sc = statusConfig[r.status] || statusConfig["novo"];
                          const isPending = payStatus === "pendente" && r.status !== "cancelado";
                          const isPaid = payStatus === "pago";
                          const isConfirmed = r.status === "confirmado";

                          return (
                            <motion.div
                              key={r.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                                <CardContent className="p-5">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-2 flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-foreground">{r.package_name}</h3>
                                        <Badge className={`${sc.bg} ${sc.color} text-[11px] border font-medium`}>
                                          {sc.label}
                                        </Badge>
                                        <Badge className={`${payConfig.bg} ${payConfig.color} text-[11px] border font-medium`}>
                                          {payConfig.label}
                                        </Badge>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                        {r.destination && (
                                          <span className="flex items-center gap-1">
                                            <MapPin size={13} />
                                            {r.destination}
                                          </span>
                                        )}
                                        {r.travel_date && (
                                          <span className="flex items-center gap-1">
                                            <Calendar size={13} />
                                            {formatDate(r.travel_date)}
                                          </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                          <Users size={13} />
                                          {r.people} pessoa(s)
                                        </span>
                                        <span className="font-semibold text-primary">
                                          {formatBRL(Number(r.total_price))}
                                        </span>
                                      </div>
                                      <p className="text-xs font-mono text-muted-foreground/60">{r.order_id}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 shrink-0">
                                      {isPending && (
                                        <>
                                          <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs shadow-sm"
                                            onClick={() => navigate("/checkout")}
                                          >
                                            <CreditCard size={14} />
                                            Pagar
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5 text-xs border-red-300 text-red-500 hover:bg-red-50"
                                            disabled={cancelReservation.isPending}
                                            onClick={() => {
                                              if (window.confirm(`Cancelar "${r.package_name}"?`)) {
                                                cancelReservation.mutate(r.id);
                                              }
                                            }}
                                          >
                                            <XCircle size={14} />
                                            Cancelar
                                          </Button>
                                        </>
                                      )}
                                      {isPaid && isConfirmed && r.package_id && (
                                        <Button size="sm" variant="outline" className="gap-1.5 text-xs border-amber-300 text-amber-600 hover:bg-amber-50" asChild>
                                          <Link to={`/pacote/${r.package_id}`}>
                                            <Star size={14} /> Avaliar
                                          </Link>
                                        </Button>
                                      )}
                                      <Button size="sm" variant="ghost" className="text-xs gap-1.5" asChild>
                                        <Link to={`/minha-conta/viagem/${r.id}`}>
                                          Detalhes <ChevronRight size={14} />
                                        </Link>
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className="border-dashed border-2 bg-transparent">
                        <CardContent className="py-20 text-center">
                          <Plane size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                          <h3 className="text-lg font-bold text-foreground mb-2">Nenhum pedido ainda</h3>
                          <p className="text-muted-foreground mb-6">Explore nossos destinos e comece sua próxima aventura!</p>
                          <Button asChild className="rounded-full shadow-md">
                            <Link to="/destinos">Explorar Destinos</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* ──── FAVORITOS ──── */}
                {activeTab === "favoritos" && (
                  <div>
                    <div className="mb-6">
                      <h1 className="text-2xl font-bold text-foreground">Meus Favoritos</h1>
                      <p className="text-muted-foreground text-sm mt-1">Pacotes que você salvou para depois</p>
                    </div>

                    {isLoadingFavorites ? (
                      <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-muted-foreground" size={32} />
                      </div>
                    ) : favorites.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {(favorites as any[]).map((fav, i) => {
                          const pkg = fav.package as any;
                          if (!pkg) return null;
                          return (
                            <motion.div
                              key={fav.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <Card className="h-full overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all group">
                                <div className="relative aspect-[4/3] overflow-hidden">
                                  <Link to={`/pacote/${pkg.slug || pkg.id}`}>
                                    <img
                                      src={pkg.cover_image_url || "/placeholder.jpg"}
                                      alt={pkg.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                  </Link>
                                  <button
                                    onClick={() => removeFavorite.mutate(fav.id)}
                                    className="absolute top-3 right-3 bg-white/90 p-2 rounded-full backdrop-blur-sm shadow-sm hover:bg-red-50 transition-colors"
                                  >
                                    <Heart size={18} className="text-red-500 fill-red-500" />
                                  </button>
                                </div>
                                <CardContent className="p-5">
                                  <Link to={`/pacote/${pkg.slug || pkg.id}`}>
                                    <h3 className="font-bold text-lg text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                                      {pkg.title}
                                    </h3>
                                  </Link>
                                  {pkg.destination_name && (
                                    <p className="text-muted-foreground flex items-center gap-1 text-sm mb-3">
                                      <MapPin size={14} />
                                      {pkg.destination_name}
                                    </p>
                                  )}
                                  <div className="pt-3 border-t">
                                    <p className="text-xs text-muted-foreground uppercase mb-1">A partir de</p>
                                    <p className="text-xl font-bold text-primary">{formatBRL(pkg.price)}</p>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className="border-dashed border-2 bg-transparent">
                        <CardContent className="py-20 text-center">
                          <Heart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                          <h3 className="text-lg font-bold text-foreground mb-2">Nenhum favorito salvo</h3>
                          <p className="text-muted-foreground mb-6">Explore pacotes e toque no ❤️ para salvar.</p>
                          <Button asChild className="rounded-full shadow-md">
                            <Link to="/destinos">Explorar Pacotes</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* ──── CARRINHO ──── */}
                {activeTab === "carrinho" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h1 className="text-2xl font-bold text-foreground">Meu Carrinho</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                          {cartItems.length > 0
                            ? `${cartItems.length} ${cartItems.length === 1 ? "item" : "itens"} selecionados`
                            : "Nenhum item no carrinho"}
                        </p>
                      </div>
                      {cartItems.length > 0 && (
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md" asChild>
                          <Link to="/checkout">
                            <CreditCard size={16} />
                            Ir para Pagamento
                          </Link>
                        </Button>
                      )}
                    </div>

                    {isLoadingCart ? (
                      <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-muted-foreground" size={32} />
                      </div>
                    ) : cartItems.length > 0 ? (
                      <div className="space-y-3">
                        {(cartItems as any[]).map((item, i) => {
                          const menuExtras = Array.isArray(item.menu_selections)
                            ? (item.menu_selections as any[]).reduce((s: number, m: any) => s + Number(m.price || 0), 0)
                            : 0;
                          const basePrice = item.package?.price || 0;
                          const subtotal = (basePrice + menuExtras) * item.people;

                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <Card className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
                                <CardContent className="p-0">
                                  <div className="flex flex-col sm:flex-row">
                                    <div className="w-full sm:w-36 h-36 shrink-0">
                                      <Link to={`/pacote/${item.package?.slug}`}>
                                        <img
                                          src={item.package?.cover_image_url || "/placeholder.jpg"}
                                          alt={item.package?.title}
                                          className="w-full h-full object-cover"
                                        />
                                      </Link>
                                    </div>
                                    <div className="flex-1 p-4 flex flex-col justify-between">
                                      <div className="flex justify-between items-start gap-3">
                                        <div>
                                          <Link to={`/pacote/${item.package?.slug}`} className="font-bold text-foreground hover:text-primary transition-colors">
                                            {item.package?.title}
                                          </Link>
                                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                              <Clock size={12} />
                                              {item.package?.duration || "Flexível"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Users size={12} />
                                              {item.people} pessoa(s)
                                            </span>
                                            {item.travel_date && (
                                              <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {formatDate(item.travel_date)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-muted-foreground hover:text-red-500 shrink-0"
                                          onClick={() => removeCartItem.mutate(item.id)}
                                        >
                                          <Trash2 size={16} />
                                        </Button>
                                      </div>
                                      <div className="flex items-end justify-between mt-3">
                                        {menuExtras > 0 && (
                                          <p className="text-xs text-orange-600">
                                            + {formatBRL(menuExtras)} extras do cardápio
                                          </p>
                                        )}
                                        <p className="text-xl font-bold text-primary ml-auto">
                                          {formatBRL(subtotal)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}

                        {/* Total */}
                        <Card className="border-primary/10 shadow-md bg-gradient-to-r from-white to-sky-50/50">
                          <CardContent className="p-5 flex items-center justify-between">
                            <span className="font-bold text-lg text-foreground">Total</span>
                            <span className="text-2xl font-black text-primary">
                              {formatBRL(
                                (cartItems as any[]).reduce((total, item: any) => {
                                  const menuExtras = Array.isArray(item.menu_selections)
                                    ? (item.menu_selections as any[]).reduce((s: number, m: any) => s + Number(m.price || 0), 0)
                                    : 0;
                                  return total + ((item.package?.price || 0) + menuExtras) * item.people;
                                }, 0)
                              )}
                            </span>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Card className="border-dashed border-2 bg-transparent">
                        <CardContent className="py-20 text-center">
                          <ShoppingCart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                          <h3 className="text-lg font-bold text-foreground mb-2">Carrinho vazio</h3>
                          <p className="text-muted-foreground mb-6">Adicione pacotes ao carrinho para continuar.</p>
                          <Button asChild className="rounded-full shadow-md">
                            <Link to="/destinos">Explorar Destinos</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* ──── VOUCHERS ──── */}
                {activeTab === "vouchers" && (
                  <div>
                    <div className="mb-6">
                      <h1 className="text-2xl font-bold text-foreground">Meus Vouchers</h1>
                      <p className="text-muted-foreground text-sm mt-1">Comprovantes de viagens confirmadas</p>
                    </div>

                    {isLoadingVouchers || isLoadingReservations ? (
                      <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-muted-foreground" size={32} />
                      </div>
                    ) : (vouchers as any[]).length > 0 ? (
                      <div className="space-y-3">
                        {(vouchers as any[]).map((v: any, i: number) => (
                          <motion.div
                            key={v.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                              <CardContent className="p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-mono font-bold text-primary text-sm bg-primary/5 px-2.5 py-1 rounded-lg">
                                        {v.voucher_code}
                                      </span>
                                      <Badge className={`text-[11px] border font-medium ${
                                        v.status === "ativo"
                                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                          : "bg-red-50 border-red-200 text-red-600"
                                      }`}>
                                        {v.status === "ativo" ? "✅ Ativo" : "Cancelado"}
                                      </Badge>
                                    </div>
                                    <h3 className="font-bold text-foreground">{v.package_name}</h3>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                      {v.destination && (
                                        <span className="flex items-center gap-1">
                                          <MapPin size={13} />
                                          {v.destination}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <Calendar size={13} />
                                        {formatDate(v.travel_date)}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Users size={13} />
                                        {v.people} pessoa(s)
                                      </span>
                                      <span className="font-semibold text-emerald-600">
                                        {formatBRL(Number(v.total_price))}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1.5 text-xs"
                                      onClick={() => setPreviewVoucher(v)}
                                    >
                                      <Eye size={14} />
                                      Ver
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                      onClick={() => handleVoucherDownload(v)}
                                    >
                                      <Download size={14} />
                                      Baixar
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-dashed border-2 bg-transparent">
                        <CardContent className="py-20 text-center">
                          <Ticket size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                          <h3 className="text-lg font-bold text-foreground mb-2">Nenhum voucher disponível</h3>
                          <p className="text-muted-foreground mb-6">
                            Vouchers são gerados automaticamente após a confirmação do pagamento.
                          </p>
                          <Button asChild variant="outline" className="rounded-full">
                            <Link to="/destinos">Explorar Pacotes</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* ──── PERFIL ──── */}
                {activeTab === "perfil" && (
                  <div>
                    <div className="mb-6">
                      <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
                      <p className="text-muted-foreground text-sm mt-1">Mantenha seus dados atualizados para agilizar futuras reservas</p>
                    </div>

                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6 sm:p-8">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            updateProfileData.mutate();
                          }}
                          className="space-y-6 max-w-2xl"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label htmlFor="full_name" className="text-sm font-medium">Nome Completo</Label>
                              <Input
                                id="full_name"
                                value={profileForm.full_name}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                                placeholder="Seu nome completo"
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cpf" className="text-sm font-medium">CPF</Label>
                              <Input
                                id="cpf"
                                value={profileForm.cpf}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, cpf: e.target.value }))}
                                placeholder="000.000.000-00"
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="age" className="text-sm font-medium">Idade</Label>
                              <Input
                                id="age"
                                value={profileForm.age}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, age: e.target.value }))}
                                placeholder="Ex: 30"
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address" className="text-sm font-medium">Endereço</Label>
                              <Input
                                id="address"
                                value={profileForm.address}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Rua, número, bairro"
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="city" className="text-sm font-medium">Cidade</Label>
                              <Input
                                id="city"
                                value={profileForm.city}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                                placeholder="Sua cidade"
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="state" className="text-sm font-medium">Estado (UF)</Label>
                              <Input
                                id="state"
                                value={profileForm.state}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, state: e.target.value }))}
                                placeholder="Ex: AC"
                                className="h-11"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-2">
                            <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-sky-700">
                              <Mail size={15} />
                              <span>{user?.email}</span>
                            </div>
                          </div>

                          <Button
                            type="submit"
                            className="gap-2 shadow-md"
                            disabled={updateProfileData.isPending}
                          >
                            {updateProfileData.isPending ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                            Salvar Alterações
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Danger zone — mobile only logout */}
                    <div className="mt-8 lg:hidden">
                      <Button
                        variant="outline"
                        className="w-full text-red-500 border-red-200 hover:bg-red-50 gap-2"
                        onClick={handleSignOut}
                      >
                        <LogOut size={16} />
                        Sair da conta
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* ══════════ VOUCHER PREVIEW MODAL ══════════ */}
      {previewVoucher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="font-bold text-foreground">
                  Voucher {previewVoucher.voucher_code}
                </h3>
                <p className="text-muted-foreground text-sm">{previewVoucher.package_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => handleVoucherPrint(previewVoucher)}
                >
                  <Download size={14} />
                  Imprimir / PDF
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-lg"
                  onClick={() => setPreviewVoucher(null)}
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <iframe
                srcDoc={generateVoucherHTML(previewVoucher)}
                className="w-full h-[600px] rounded-xl border-0"
                title="Preview do Voucher"
              />
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CustomerDashboard;
