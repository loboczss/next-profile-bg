/**
 * GERENCIAMENTO DE VOUCHERS — AdminVouchers.tsx
 *
 * Juan, aqui a equipe visualiza, reenvia e baixa os vouchers dos clientes.
 *
 * COMO FUNCIONA O SISTEMA DE VOUCHER:
 * 1. Cliente paga → Asaas envia webhook → asaas-webhook Edge Function confirma
 * 2. asaas-webhook chama generate-voucher Edge Function
 * 3. generate-voucher cria registro na tabela vouchers + envia email via Resend
 * 4. Admin pode ver/reenviar/baixar aqui
 *
 * FUNCIONALIDADES:
 * - Lista todos os vouchers com busca e filtro por status
 * - Preview do voucher em modal (iframe com HTML gerado)
 * - Reenviar voucher por email (chama edge function generate-voucher)
 * - Download como arquivo HTML
 * - Excluir voucher
 *
 * TEMPLATE DO VOUCHER:
 * A função generateVoucherHTML() gera o HTML inline completo do voucher.
 * SE MUDAR O VISUAL DO VOUCHER, MUDE TAMBÉM na edge function generate-voucher
 *
 * TABELA: vouchers
 * RLS: "Users can see own vouchers" permite clientes verem os deles
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Ticket,
  Search,
  RefreshCw,
  Download,
  Eye,
  X,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Users,
  MapPin,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Voucher {
  id: string;
  reservation_id: string | null;
  voucher_code: string;
  client_name: string;
  client_email: string | null;
  package_name: string;
  destination: string | null;
  travel_date: string | null;
  people: number;
  total_price: number;
  package_duration: string | null;
  package_inclusions: string[];
  occupants: any[] | null;
  route_info: any | null;
  status: string;
  created_at: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Generate voucher HTML for preview/download (same template as edge function)
function generateVoucherHTML(voucher: Voucher): string {
  const inclusions = voucher.package_inclusions || [];
  const inclusionsHTML = inclusions.length > 0
    ? inclusions.map((inc) => `<tr><td style="padding:6px 12px;font-size:14px;color:#374151;">✓ ${inc}</td></tr>`).join("")
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
        const info = [dep.date ? fmtD(dep.date) : '', dep.time ? `${dep.time}h` : ''].filter(Boolean).join(' • ');
        rows += `<tr><td style="padding:8px 12px;font-size:13px;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#6366f1;color:#fff;text-align:center;line-height:20px;font-size:10px;font-weight:700;margin-right:8px;">→</span><span style="color:#312e81;font-weight:600;">IDA</span></td><td style="padding:8px 12px;font-size:13px;color:#0f172a;font-weight:600;">${dep.from || ''} → ${dep.to || ''}</td><td style="padding:8px 12px;font-size:12px;color:#64748b;">${info}</td></tr>`;
      }
      if (hasRet) {
        const info = [ret.date ? fmtD(ret.date) : '', ret.time ? `${ret.time}h` : ''].filter(Boolean).join(' • ');
        rows += `<tr><td style="padding:8px 12px;font-size:13px;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#059669;color:#fff;text-align:center;line-height:20px;font-size:10px;font-weight:700;margin-right:8px;">←</span><span style="color:#065f46;font-weight:600;">VOLTA</span></td><td style="padding:8px 12px;font-size:13px;color:#0f172a;font-weight:600;">${ret.from || ''} → ${ret.to || ''}</td><td style="padding:8px 12px;font-size:12px;color:#64748b;">${info}</td></tr>`;
      }
      routeHTML = `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;"><tr style="background:#eef2ff;"><td colspan="3" style="padding:14px 16px;border-bottom:1px solid #e5e7eb;"><span style="color:#4338ca;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">✈️ Trajeto</span></td></tr><tr style="background:#f8fafc;border-bottom:1px solid #e5e7eb;"><td style="padding:6px 12px;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;width:90px;">Trecho</td><td style="padding:6px 12px;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Rota</td><td style="padding:6px 12px;font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Data / Horário</td></tr>${rows}</table>`;
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
      <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;">Documento de confirmação de reserva</p>
      <div style="margin-top:20px;display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:10px 24px;">
        <span style="color:rgba(255,255,255,0.6);font-size:11px;text-transform:uppercase;letter-spacing:2px;display:block;">Código do Voucher</span>
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
        <tr style="background:#f8fafc;">
          <td colspan="2" style="padding:14px 16px;border-bottom:1px solid #e5e7eb;">
            <span style="color:#0369a1;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Detalhes da Viagem</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;width:50%;border-bottom:1px solid #f1f5f9;">
            <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;">Pacote</span>
            <br><span style="color:#0f172a;font-size:15px;font-weight:600;">${voucher.package_name}</span>
          </td>
          <td style="padding:12px 16px;width:50%;border-bottom:1px solid #f1f5f9;">
            <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;">Destino</span>
            <br><span style="color:#0f172a;font-size:15px;font-weight:600;">${voucher.destination || "—"}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;width:50%;border-bottom:1px solid #f1f5f9;">
            <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;">Data da Viagem</span>
            <br><span style="color:#0f172a;font-size:15px;font-weight:600;">${travelDateFormatted}</span>
          </td>
          <td style="padding:12px 16px;width:50%;border-bottom:1px solid #f1f5f9;">
            <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;">Duração</span>
            <br><span style="color:#0f172a;font-size:15px;font-weight:600;">${voucher.package_duration || "—"}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;width:50%;">
            <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;">Passageiros</span>
            <br><span style="color:#0f172a;font-size:15px;font-weight:600;">${voucher.people} pessoa(s)</span>
          </td>
          <td style="padding:12px 16px;width:50%;">
            <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;">Valor Total</span>
            <br><span style="color:#059669;font-size:18px;font-weight:800;">${formatCurrency(Number(voucher.total_price))}</span>
          </td>
        </tr>
      </table>
      ${routeHTML}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr style="background:#f0fdf4;">
          <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;">
            <span style="color:#15803d;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">O que está incluso</span>
          </td>
        </tr>
        ${inclusionsHTML}
      </table>
      ${(() => {
        const occupants = voucher.occupants || [];
        if (occupants.length === 0) return '';
        const occupantsRows = occupants.map((occ: any, idx: number) => {
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

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "cancelado">("todos");
  const [previewVoucher, setPreviewVoucher] = useState<Voucher | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function fetchVouchers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setVouchers(data);
    setLoading(false);
  }

  async function handleResend(voucher: Voucher) {
    if (!voucher.client_email) {
      setToast({ message: "Cliente sem email cadastrado", type: "error" });
      return;
    }
    setResending(voucher.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-voucher`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ resend_only: true, voucher_id: voucher.id }),
        }
      );
      if (res.ok) {
        setToast({ message: `Voucher reenviado para ${voucher.client_email}`, type: "success" });
      } else {
        throw new Error("Falha ao reenviar");
      }
    } catch {
      setToast({ message: "Erro ao reenviar voucher", type: "error" });
    }
    setResending(null);
  }

  function handleDownload(voucher: Voucher) {
    const html = generateVoucherHTML(voucher);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voucher-${voucher.voucher_code}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint(voucher: Voucher) {
    const html = generateVoucherHTML(voucher);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 400);
    }
  }

  const filtered = vouchers.filter((v) => {
    const matchSearch =
      search === "" ||
      v.client_name.toLowerCase().includes(search.toLowerCase()) ||
      v.voucher_code.toLowerCase().includes(search.toLowerCase()) ||
      v.package_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Ticket size={18} className="text-cyan-500" />
            </div>
            Vouchers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {vouchers.length} voucher{vouchers.length !== 1 && "s"} gerado{vouchers.length !== 1 && "s"}
          </p>
        </div>
        <button
          onClick={fetchVouchers}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, código ou pacote..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-card text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["todos", "ativo", "cancelado"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
                statusFilter === s
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-600"
                  : "border-border/50 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {s === "todos" ? "Todos" : s === "ativo" ? "Ativos" : "Cancelados"}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Ticket size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Nenhum voucher encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <div
              key={v.id}
              className="bg-card border border-border/50 rounded-2xl p-5 hover:shadow-md transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Main info */}
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Code + Status */}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Código</span>
                    <p className="font-mono font-bold text-foreground text-sm mt-0.5">{v.voucher_code}</p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium mt-1 px-2 py-0.5 rounded-full",
                        v.status === "ativo"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-500"
                      )}
                    >
                      {v.status === "ativo" ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {v.status === "ativo" ? "Ativo" : "Cancelado"}
                    </span>
                  </div>

                  {/* Client */}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Cliente</span>
                    <p className="font-semibold text-foreground text-sm mt-0.5 truncate">{v.client_name}</p>
                    <p className="text-muted-foreground text-xs truncate">{v.client_email || "Sem email"}</p>
                  </div>

                  {/* Package */}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Pacote</span>
                    <p className="font-semibold text-foreground text-sm mt-0.5 truncate flex items-center gap-1">
                      <Package size={12} className="text-muted-foreground shrink-0" />
                      {v.package_name}
                    </p>
                    <p className="text-muted-foreground text-xs flex items-center gap-1">
                      <MapPin size={11} className="shrink-0" />
                      {v.destination || "—"}
                    </p>
                  </div>

                  {/* Date + Details */}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Detalhes</span>
                    <p className="text-foreground text-sm mt-0.5 flex items-center gap-1">
                      <Calendar size={12} className="text-muted-foreground shrink-0" />
                      {formatDate(v.travel_date)}
                    </p>
                    <p className="text-muted-foreground text-xs flex items-center gap-1">
                      <Users size={11} className="shrink-0" />
                      {v.people} pessoa(s) • {formatCurrency(Number(v.total_price))}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 lg:flex-shrink-0">
                  <button
                    onClick={() => setPreviewVoucher(v)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20 transition-all"
                    title="Visualizar"
                  >
                    <Eye size={14} />
                    <span className="hidden sm:inline">Ver</span>
                  </button>
                  <button
                    onClick={() => handleResend(v)}
                    disabled={resending === v.id || !v.client_email}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Reenviar por email"
                  >
                    {resending === v.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span className="hidden sm:inline">Reenviar</span>
                  </button>
                  <button
                    onClick={() => handleDownload(v)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all"
                    title="Baixar HTML"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Baixar</span>
                  </button>
                </div>
              </div>

              {/* Footer: created at */}
              <p className="text-muted-foreground/60 text-[11px] mt-3">
                Gerado em {formatDateTime(v.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewVoucher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <div>
                <h3 className="font-bold text-foreground">
                  Voucher {previewVoucher.voucher_code}
                </h3>
                <p className="text-muted-foreground text-sm">{previewVoucher.client_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(previewVoucher)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all"
                >
                  <Download size={14} /> Imprimir / PDF
                </button>
                <button
                  onClick={() => setPreviewVoucher(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* Modal body */}
            <div className="flex-1 overflow-auto p-2">
              <iframe
                srcDoc={generateVoucherHTML(previewVoucher)}
                className="w-full h-[600px] rounded-xl border-0"
                title="Preview do Voucher"
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white",
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          )}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
