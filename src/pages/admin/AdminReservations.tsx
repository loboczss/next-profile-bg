/**
 * GERENCIAMENTO DE RESERVAS — AdminReservations.tsx
 *
 * Juan, aqui a equipe da Evastur gerencia todas as reservas dos clientes.
 *
 * FUNCIONALIDADES:
 * - Lista todas as reservas com busca por nome/pacote
 * - Filtro por status (novo, aguardando, confirmado, cancelado)
 * - Sheet lateral para ver detalhes de cada reserva
 * - Alterar status da reserva (muda no banco com update mutation)
 * - Adicionar observações internas
 * - Integração com WhatsApp para contatar o cliente
 * - Link para gerar/ver voucher da reserva
 *
 * TABELA: reservations
 * STATUS POSSÍVEIS: novo, aguardando, confirmado, cancelado
 * CAMPO IMPORTANTE: travel_date → vem do pacote (admin define) ou do cliente (pacote interno)
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  Search, Eye, MessageCircle, Loader2, FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";

type Reservation = Tables<"reservations"> & { payment_status?: string };
type ReservationStatus = "novo" | "aguardando" | "confirmado" | "cancelado";

const statusConfig: Record<string, { label: string; color: string }> = {
  novo: { label: "Novo Orçamento", color: "bg-blue-100 text-blue-700" },
  aguardando: { label: "Aguardando Pagamento", color: "bg-amber-100 text-amber-700" },
  confirmado: { label: "Confirmado", color: "bg-emerald-100 text-emerald-700" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pago: { label: "💳 Pago", color: "bg-emerald-100 text-emerald-700" },
  pendente: { label: "⏳ Pendente", color: "bg-amber-100 text-amber-700" },
  cancelado: { label: "❌ Cancelado", color: "bg-red-100 text-red-700" },
};

export default function AdminReservations() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [paymentFilter, setPaymentFilter] = useState<string>("todos");
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Reservation[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status?: string; notes?: string }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      const { error } = await supabase.from("reservations").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      toast({ title: "Reserva atualizada!" });
    },
  });

  const filtered = reservations.filter((r) => {
    const matchSearch =
      r.client_name.toLowerCase().includes(search.toLowerCase()) ||
      r.order_id.toLowerCase().includes(search.toLowerCase()) ||
      r.package_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || r.status === statusFilter;
    const matchPayment = paymentFilter === "todos" || r.payment_status === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  const openDetail = (r: Reservation) => {
    setSelected(r);
    setNotes(r.notes || "");
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Reservas & Orçamentos</h1>
          <p className="text-muted-foreground text-sm">{reservations.length} registros</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Buscar por cliente, pedido ou pacote..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="aguardando">Aguardando</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Pgto." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo Pgto.</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Pedido</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Pacote</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Valor</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium">{r.order_id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium">{r.client_name}</span>
                        {r.client_phone && (
                          <span className="block text-xs text-muted-foreground">{r.client_phone}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span>{r.package_name}</span>
                        {r.destination && (
                          <span className="block text-xs text-muted-foreground">{r.destination}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.travel_date ? (
                        <div>
                          <span>{(() => { const dt = r.travel_date; if (dt.includes("T") && dt.length > 10) return new Date(dt).toLocaleDateString("pt-BR"); const [y, m, d] = dt.substring(0, 10).split("-"); return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("pt-BR"); })()}</span>
                          {r.travel_date.includes("T") && r.travel_date.length > 10 && (
                            <span className="block text-xs text-amber-600 font-medium">
                              {new Date(r.travel_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}h
                            </span>
                          )}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      R$ {Number(r.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${statusConfig[r.status]?.color || ""} text-xs border-0`}>
                        {statusConfig[r.status]?.label || r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${paymentStatusConfig[r.payment_status as string]?.color || "bg-gray-100 text-gray-700"} text-xs border-0`}>
                        {paymentStatusConfig[r.payment_status as string]?.label || r.payment_status || "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openDetail(r)}>
                          <Eye size={16} />
                        </Button>
                        {r.client_phone && (
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={`https://wa.me/${r.client_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${r.client_name}! Somos da Evastur, referente ao pedido ${r.order_id}.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle size={16} className="text-emerald-600" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      Nenhuma reserva encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle>Detalhes — {selected.order_id}</SheetTitle>
                <SheetDescription>
                  Criado em {new Date(selected.created_at).toLocaleDateString("pt-BR")}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-1">
                {/* Status update */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Status</label>
                  <Select
                    value={selected.status}
                    onValueChange={(val) => {
                      updateMutation.mutate({ id: selected.id, status: val });
                      setSelected({ ...selected, status: val });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo Orçamento</SelectItem>
                      <SelectItem value="aguardando">Aguardando Pagamento</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Client info */}
                <div className="space-y-3 p-4 border rounded-lg bg-secondary/50">
                  <h4 className="text-sm font-semibold">Dados do Cliente</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="font-medium">{selected.client_name}</span>
                    <span className="text-muted-foreground">Email:</span>
                    <span>{selected.client_email || "—"}</span>
                    <span className="text-muted-foreground">Telefone:</span>
                    <span>{selected.client_phone || "—"}</span>
                    <span className="text-muted-foreground">Cidade:</span>
                    <span>{selected.client_city || "—"}</span>
                  </div>
                </div>

                {/* Trip info */}
                <div className="space-y-3 p-4 border rounded-lg bg-secondary/50">
                  <h4 className="text-sm font-semibold">Dados da Viagem</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Pacote:</span>
                    <span className="font-medium">{selected.package_name}</span>
                    <span className="text-muted-foreground">Destino:</span>
                    <span>{selected.destination || "—"}</span>
                    <span className="text-muted-foreground">Data / Hora:</span>
                    <span>
                      {selected.travel_date ? (
                        <>
                          {(() => { const dt = selected.travel_date; if (dt.includes("T") && dt.length > 10) return new Date(dt).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }); const [y, m, d] = dt.substring(0, 10).split("-"); return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }); })()}
                          {selected.travel_date.includes("T") && selected.travel_date.length > 10 && (
                            <strong className="ml-1 text-amber-600">
                              às {new Date(selected.travel_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}h
                            </strong>
                          )}
                        </>
                      ) : "—"}
                    </span>
                    <span className="text-muted-foreground">Pessoas:</span>
                    <span>{selected.people}</span>
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-bold">R$ {Number(selected.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    <span className="text-muted-foreground">Pagamento:</span>
                    <span>
                      <Badge className={`${paymentStatusConfig[selected.payment_status as string]?.color || "bg-gray-100"} text-xs border-0`}>
                        {paymentStatusConfig[selected.payment_status as string]?.label || selected.payment_status || "—"}
                      </Badge>
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <FileText size={14} />
                    Observações Internas
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Adicione observações sobre esta reserva..."
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateMutation.mutate({ id: selected.id, notes });
                    }}
                  >
                    Salvar Observações
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
