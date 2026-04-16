import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Users, XCircle, Loader2, AlertTriangle, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusColors: Record<string, string> = {
  pago: "bg-emerald-100 text-emerald-700",
  pendente: "bg-amber-100 text-amber-700",
  cancelado: "bg-red-100 text-red-700",
  reembolsado: "bg-purple-100 text-purple-700",
};

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function AdminFinanceiro() {
  const [activeTab, setActiveTab] = useState("transacoes");

  // Paid reservations (source of truth for revenue — includes both webhook & page-confirmed)
  const { data: paidReservations = [], isLoading: loadingPaid } = useQuery({
    queryKey: ["admin-paid-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, order_id, client_name, client_email, client_phone, package_name, total_price, people, status, payment_status, asaas_payment_id, created_at, travel_date, updated_at")
        .eq("payment_status", "pago")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Pending (not yet paid, not cancelled)
  const { data: pendingReservations = [], isLoading: loadingPending } = useQuery({
    queryKey: ["admin-pending-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, order_id, client_name, client_email, client_phone, package_name, total_price, people, status, payment_status, created_at, travel_date")
        .eq("payment_status", "pendente")
        .neq("status", "cancelado")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Estat\u00edsticas resumidas
  const { data: allReservations = [] } = useQuery({
    queryKey: ["admin-all-reservations-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("status, payment_status, total_price");
      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = (paidReservations as any[]).reduce((sum, r) => sum + Number(r.total_price), 0);
  const avgTicket = paidReservations.length > 0 ? totalRevenue / paidReservations.length : 0;
  const cancelledCount = (allReservations as any[]).filter(r => r.status === "cancelado").length;

  const stats = [
    {
      icon: DollarSign,
      label: "Receita Total (Pago)",
      value: formatBRL(totalRevenue),
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      icon: TrendingUp,
      label: "Vendas Pagas",
      value: paidReservations.length.toString(),
      color: "text-blue-600 bg-blue-50",
    },
    {
      icon: Users,
      label: "Ticket Médio",
      value: formatBRL(avgTicket),
      color: "text-purple-600 bg-purple-50",
    },
    {
      icon: AlertTriangle,
      label: "Pagamentos Pendentes",
      value: pendingReservations.length.toString(),
      color: "text-amber-600 bg-amber-50",
    },
    {
      icon: XCircle,
      label: "Cancelamentos",
      value: cancelledCount.toString(),
      color: "text-red-600 bg-red-50",
    },
  ];

  const isLoading = loadingPaid || loadingPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Financeiro</h1>
        <p className="text-muted-foreground text-sm">Acompanhe a saúde financeira do negócio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium leading-tight">
                  {stat.label}
                </p>
                <p className="text-xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="transacoes">
            ✅ Vendas Pagas ({paidReservations.length})
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="data-[state=active]:text-amber-600">
            ⏳ Pendentes / Recuperar ({pendingReservations.length})
          </TabsTrigger>
        </TabsList>

        {/* VENDAS PAGAS */}
        <TabsContent value="transacoes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reservas Confirmadas e Pagas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(paidReservations as any[]).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Pedido</th>
                        <th className="px-4 py-3 text-left">Cliente</th>
                        <th className="px-4 py-3 text-left">Pacote</th>
                        <th className="px-4 py-3 text-left">Valor</th>
                        <th className="px-4 py-3 text-left">Data Pgto.</th>
                        <th className="px-4 py-3 text-left">Viagem</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(paidReservations as any[]).map((r) => (
                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs">{r.order_id || "—"}</td>
                          <td className="px-4 py-3">
                            <div>
                              <span className="font-medium">{r.client_name}</span>
                              {r.client_email && (
                                <span className="block text-xs text-muted-foreground">{r.client_email}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">{r.package_name || "—"}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-600">{formatBRL(Number(r.total_price))}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {r.updated_at ? new Date(r.updated_at).toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {r.travel_date ? (() => { const dt = r.travel_date; if (dt.includes("T") && dt.length > 10) return new Date(dt).toLocaleDateString("pt-BR"); const [y, m, d] = dt.substring(0, 10).split("-"); return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("pt-BR"); })() : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs border-0">
                              💳 Pago
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground px-6">
                  Nenhuma venda paga ainda. As vendas aparecerão aqui após pagamentos confirmados.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PEDIDOS PENDENTES PARA RECUPERAÇÃO */}
        <TabsContent value="pendentes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                Pedidos Pendentes — Recuperação de Vendas
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Clientes que iniciaram compra mas não concluíram o pagamento. Entre em contato para recuperar a venda.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {(pendingReservations as any[]).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Pedido</th>
                        <th className="px-4 py-3 text-left">Cliente</th>
                        <th className="px-4 py-3 text-left">Pacote</th>
                        <th className="px-4 py-3 text-left">Valor</th>
                        <th className="px-4 py-3 text-left">Criado em</th>
                        <th className="px-4 py-3 text-left">Contato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(pendingReservations as any[]).map((r: any) => (
                        <tr key={r.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs">{r.order_id}</td>
                          <td className="px-4 py-3">
                            <div>
                              <span className="font-medium">{r.client_name}</span>
                              {r.client_email && (
                                <span className="block text-xs text-muted-foreground">{r.client_email}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span>{r.package_name}</span>
                            <span className="block text-xs text-muted-foreground">{r.people} pessoa{r.people > 1 ? 's' : ''}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-amber-600">{formatBRL(Number(r.total_price))}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3">
                            {r.client_phone ? (
                              <Button size="sm" variant="outline" className="gap-1 text-xs border-emerald-500 text-emerald-600 hover:bg-emerald-50" asChild>
                                <a
                                  href={`https://wa.me/${r.client_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${r.client_name}! Somos da Evastur 😊 Notamos que você iniciou uma reserva do pacote "${r.package_name}" (pedido ${r.order_id}) mas o pagamento ainda não foi concluído. Posso te ajudar a finalizar?`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Phone size={12} /> WhatsApp
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">{r.client_email || "—"}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground px-6">
                  🎉 Nenhum pedido pendente no momento!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
