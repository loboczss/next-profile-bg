import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, Package, ArrowRight, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  // Support both Asaas redirect (?payment_id=) and legacy Stripe (?session_id=)
  const paymentId = searchParams.get("payment_id") || searchParams.get("session_id");
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paymentId) {
      setLoading(false);
      return;
    }

    const confirmAndFetch = async () => {
      try {
        // 1. Call check-payment-status edge function which verifies directly with Asaas
        //    and updates reservations + generates vouchers if payment is confirmed
        await supabase.functions.invoke("check-payment-status", {
          body: { payment_id: paymentId },
        });

        // 2. Fetch the reservation records to display on this page
        const { data, error } = await supabase
          .from("reservations")
          .select("*")
          .eq("asaas_payment_id", paymentId);

        if (!error && data) {
          setReservations(data);
        }

        // 3. Clear cart if user is logged in
        if (user?.id) {
          await supabase.from("cart_items").delete().eq("user_id", user.id);
        }
      } catch (e) {
        console.error("Error confirming payment:", e);
      } finally {
        setLoading(false);
      }
    };

    confirmAndFetch();
  }, [paymentId, user?.id]);

  const formatBRL = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const total = reservations.reduce((s, r) => s + Number(r.total_price), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Confirmando seu pagamento...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Success Header */}
              <div className="text-center space-y-4 py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 size={48} className="text-emerald-500" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold text-primary">Pagamento Confirmado! 🎉</h1>
                  <p className="text-muted-foreground mt-2">
                    Sua viagem está reservada. Obrigado por escolher a Evastur!
                  </p>
                </div>
              </div>

              {/* Order Summary */}
              {reservations.length > 0 && (
                <Card className="border-emerald-200 shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-bold text-lg text-primary border-b pb-3 flex items-center gap-2">
                      <Package size={20} />
                      Detalhes do Pedido
                    </h2>

                    {reservations.map((r) => (
                      <div key={r.id} className="space-y-2 py-3 border-b last:border-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{r.package_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {r.people} pessoa{r.people > 1 ? "s" : ""}
                              {r.travel_date && ` • ${(() => { const dt = r.travel_date; if (dt.includes("T") && dt.length > 10) { return new Date(dt).toLocaleDateString("pt-BR"); } const [y, m, d] = dt.substring(0, 10).split("-"); return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("pt-BR"); })()}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 mb-1">
                              💳 Pago
                            </Badge>
                            <p className="font-bold text-primary">{formatBRL(Number(r.total_price))}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          Pedido: <span className="font-medium text-foreground">{r.order_id}</span>
                        </p>
                      </div>
                    ))}

                    {reservations.length > 1 && (
                      <div className="flex justify-between pt-2 font-bold">
                        <span>Total</span>
                        <span className="text-xl text-primary">{formatBRL(total)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Next Steps */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold text-primary">Próximos Passos</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">1.</span>
                      Nossa equipe entrará em contato via WhatsApp para confirmar todos os detalhes da viagem.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">2.</span>
                      Você pode acompanhar o status do seu pedido em "Minha Conta".
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">3.</span>
                      Após a viagem, você poderá avaliar sua experiência diretamente no site.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1 gap-2" size="lg">
                  <Link to="/minha-conta">
                    Ver Meus Pedidos <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  size="lg"
                >
                  <a
                    href="https://wa.me/5568999872973?text=Olá! Acabei de confirmar minha reserva na Evastur."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Phone size={18} /> Falar com Especialista
                  </a>
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
