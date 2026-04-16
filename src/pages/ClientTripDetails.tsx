/**
 * DETALHES DA VIAGEM DO CLIENTE — ClientTripDetails.tsx
 *
 * Juan, esta página mostra os detalhes de uma reserva específica.
 * O cliente acessa via /minha-conta/viagem/:id
 *
 * MOSTRA:
 * - Status da reserva (novo, aguardando, confirmado, cancelado)
 * - Nome do pacote, destino, data, nº de pessoas, preço
 * - Roteiro do pacote (package_itinerary_days)
 * - Link para contato via WhatsApp
 *
 * QUERY: Busca reservation por ID com joins em packages e package_itinerary_days
 */
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, MapPin, Users, CreditCard, Loader2, Clock, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const statusConfig: Record<string, { label: string; color: string }> = {
  novo: { label: "Orçamento", color: "bg-blue-100 text-blue-700" },
  aguardando: { label: "Aguardando Pagamento", color: "bg-amber-100 text-amber-700" },
  confirmado: { label: "Confirmado", color: "bg-emerald-100 text-emerald-700" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

const ClientTripDetails = () => {
  const { id } = useParams();

  const { data: reservation, isLoading } = useQuery({
    queryKey: ["trip-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, packages(title, slug, duration, cover_image_url, package_itinerary_days(day_number, title, description))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={48} />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <h1 className="text-2xl font-bold text-primary mb-2">Viagem não encontrada</h1>
          <Link to="/minha-conta" className="text-accent underline">Voltar</Link>
        </div>
      </div>
    );
  }

  const pkg = (reservation as any).packages;
  const itinerary = ((pkg?.package_itinerary_days) || []).sort((a: any, b: any) => a.day_number - b.day_number);
  const sc = statusConfig[reservation.status] || { label: reservation.status, color: "" };

  const whatsappMsg = encodeURIComponent(
    `Olá! Sou ${reservation.client_name}, referente ao pedido ${reservation.order_id}.`
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      {pkg?.cover_image_url && (
        <section className="relative h-[30vh] min-h-[200px] overflow-hidden">
          <img src={pkg.cover_image_url} alt={reservation.package_name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 z-10">
            <Link to="/minha-conta" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3 transition-colors">
              <ArrowLeft size={16} />
              Minha Conta
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{reservation.package_name}</h1>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Status do Pedido</h3>
                  <Badge className={`${sc.color} text-sm border-0`}>{sc.label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Pedido</span>
                    <p className="font-mono font-medium">{reservation.order_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data da Viagem</span>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar size={14} />
                      {reservation.travel_date
                        ? (() => { const dt = reservation.travel_date; if (dt.includes("T") && dt.length > 10) { return new Date(dt).toLocaleDateString("pt-BR"); } const [y, m, d] = dt.substring(0, 10).split("-"); return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("pt-BR"); })()
                        : "A definir"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Destino</span>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin size={14} />
                      {reservation.destination || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Passageiros</span>
                    <p className="font-medium flex items-center gap-1">
                      <Users size={14} />
                      {reservation.people} pessoa(s)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Itinerary */}
            {itinerary.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock size={20} />
                    Roteiro
                  </h3>
                  <div className="space-y-4">
                    {itinerary.map((day: any) => (
                      <div key={day.day_number} className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {day.day_number}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{day.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{day.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <CreditCard size={20} />
                  Financeiro
                </h3>
                <div>
                  <span className="text-sm text-muted-foreground">Valor Total</span>
                  <p className="text-3xl font-bold text-primary">
                    R$ {Number(reservation.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Button
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  asChild
                >
                  <a href={`https://wa.me/5568992552607?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={18} />
                    Falar com a Evastur
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientTripDetails;
