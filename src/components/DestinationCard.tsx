import { MapPin, Clock, Star, ArrowUpRight, Heart, Ban } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useFavorite } from "@/hooks/useFavorite";
import { Button } from "@/components/ui/button";

/**
 * PROPS DO CARD
 * 
 * Define tudo o que um card de destino precisa para ser renderizado.
 */
interface DestinationCardProps {
  image: string;
  title: string;
  location: string;
  description: string;
  installments: number;
  installmentValue: number;
  totalPrice: number;
  slug?: string;
  category?: string;
  id?: string; // Adicionando ID opcional para favoritar
  status?: string; // "ativo" | "esgotado" etc
}

// Labels humanizadas para as categorias (usadas na badge)
const categoryLabel: Record<string, string> = {
  nacional: "Nacional",
  internacional: "Internacional",
  cruzeiro: "Cruzeiro",
};

// Cores dinâmicas baseadas na categoria
const categoryColor: Record<string, string> = {
  nacional: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  internacional: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  cruzeiro: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

/**
 * O CARD LINDÃO (DESTINATION CARD)
 * 
 * Juan, este componente é o que faz o cliente brilhar o olho.
 * Ele tem aquele efeito de zoom maroto na imagem quando passa o mouse.
 * Não mexe muito no CSS aqui se não o layout chora kkk.
 */
const DestinationCard = ({
  image,
  title,
  location,
  description,
  installments,
  installmentValue,
  totalPrice,
  slug,
  category,
  id,
  status,
}: DestinationCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorite(id);
  const isSoldOut = status === "esgotado";

  return (
    <div className="relative">
      <Link to={`/pacote/${slug || "rio-croa"}`} className="block group">
        <motion.article
          className="relative rounded-2xl overflow-hidden cursor-pointer bg-card"
          whileHover="hover"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
          variants={{
            hover: {
              y: -4,
              boxShadow: "0 16px 48px rgba(0,0,0,0.16)",
            },
          }}
          transition={{ duration: 0.35, ease: [0.25, 0, 0.2, 1] }}
        >
          {/* CONTAINER DA IMAGEM */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <motion.img
              src={image}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
              variants={{ hover: { scale: 1.07 } }} // Efeito de zoom no hover
              transition={{ duration: 0.6, ease: [0.25, 0, 0.2, 1] }}
            />

            {/* Sombra em degradê para dar leitura ao texto sobre a imagem */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Badge de Categoria (Nacional/Inter/Cruzeiro) */}
            {category && (
              <div className="absolute top-3 left-3 z-10">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${
                    categoryColor[category] ||
                    "bg-white/20 text-white border-white/30"
                  }`}
                >
                  {categoryLabel[category] || category}
                </span>
              </div>
            )}

            {/* Pill de Localização (ex: "Amazonas, Brasil") */}
            <div className="absolute bottom-3 left-3 z-10">
              <div className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <MapPin size={11} className="text-white/80" />
                <span className="text-white/90 text-xs font-medium">{location}</span>
              </div>
            </div>
          </div>

          {/* CONTEÚDO DO CARD */}
          <div className="p-4">
            {/* Título do Pacote */}
            <h3 className="font-bold text-foreground text-base leading-snug mb-1.5 line-clamp-1 group-hover:text-primary transition-colors duration-200">
              {title}
            </h3>

            {/* Pequena Descrição (Limitada a 2 linhas) */}
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4">
              {description}
            </p>

            {/* Divisória Sutil */}
            <div className="h-px bg-border mb-3" />

            {/* ÁREA DE PREÇO */}
            <div className={`flex items-end justify-between ${isSoldOut ? "opacity-50" : ""}`}>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">A partir de</p>
                <p className={`text-lg font-bold leading-none ${isSoldOut ? "text-muted-foreground line-through" : "text-primary"}`}>
                  {installments}x{" "}
                  <span className="text-base">
                    R${" "}
                    {installmentValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ou R${" "}
                  {totalPrice.toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                  })}{" "}
                  à vista
                </p>
              </div>

              {/* Botão Visual de Ação */}
              {isSoldOut ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 border border-red-200 rounded-xl px-3 py-1.5 bg-red-50">
                  <Ban size={12} />
                  Esgotado
                </span>
              ) : (
                <motion.span
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent border border-accent/30 rounded-xl px-3 py-1.5 bg-accent/5 group-hover:bg-accent group-hover:text-white transition-all duration-200"
                  variants={{ hover: { scale: 1.03 } }}
                >
                  Ver pacote
                  <ArrowUpRight size={12} />
                </motion.span>
              )}
            </div>
          </div>
        </motion.article>
      </Link>

      {/* Botão de Favoritar (Coração) - Fora do Link para não disparar navegação */}
      <div className="absolute top-3 right-3 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:text-white group/fav transition-all"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite();
          }}
        >
          <Heart
            size={18}
            className={`transition-all ${isFavorite ? "fill-evastur-red text-evastur-red" : "text-white/80 group-hover/fav:text-white"}`}
          />
        </Button>
      </div>
    </div>
  );
};

export default DestinationCard;
