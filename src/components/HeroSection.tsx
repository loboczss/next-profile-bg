import { Sparkles, ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import QuoteFormDialog from "./QuoteFormDialog";
import heroImage from "@/assets/hero-amazon.jpg";

const HeroSection = () => {
  const [quoteOpen, setQuoteOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-[85vh] lg:min-h-screen flex items-center pt-16 lg:pt-20">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-5 lg:px-8 py-10 lg:py-0">
          <div className="max-w-2xl lg:max-w-3xl space-y-4 lg:space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 lg:px-4 lg:py-2 rounded-full text-white/90">
              <Sparkles size={14} className="text-amber-400" />
              <span className="text-xs lg:text-sm font-medium uppercase tracking-wider">
                Experiências Evastur
              </span>
            </div>

            {/* Title */}
            <h1 className="text-[1.3rem] sm:text-[1.575rem] lg:text-[2.1rem] xl:text-[2.625rem] font-bold leading-tight text-shadow-hero">
              <span className="text-white">Viagens sob medida </span>
              <span className="text-amber-400">para criar memórias</span>
              <span className="text-white"> que duram para sempre.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-white/80 max-w-xl leading-relaxed">
              Curadoria humana, atendimento próximo e destinos que combinam com o seu momento.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 lg:pt-4">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 py-5 lg:px-8 lg:py-6 text-sm lg:text-base gap-2 group"
                onClick={() => document.getElementById("destinos")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Compass size={16} />
                Explorar Destinos
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/50 text-white hover:bg-white/10 hover:border-white font-medium px-6 py-5 lg:px-8 lg:py-6 text-sm lg:text-base gap-2 bg-transparent"
                onClick={() => setQuoteOpen(true)}
              >
                <Sparkles size={16} />
                Solicitar Orçamento
              </Button>
            </div>
          </div>
        </div>
      </section>

      <QuoteFormDialog open={quoteOpen} onOpenChange={setQuoteOpen} />
    </>
  );
};

export default HeroSection;
