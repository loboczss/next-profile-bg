"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Compass } from "lucide-react";

import { DestinationCard } from "@/components/destinations/destination-card";
import { buttonVariants } from "@/components/ui/button";
import type { SerializedDestination } from "@/lib/destinations";
import { cn } from "@/lib/utils";

interface FavoritesGridProps {
  initialDestinations: SerializedDestination[];
}

export function FavoritesGrid({ initialDestinations }: FavoritesGridProps) {
  const [favorites, setFavorites] = useState(initialDestinations);

  const handleFavoriteChange = (destinationId: number, isFavorite: boolean) => {
    if (!isFavorite) {
      setFavorites((current) =>
        current.filter((destination) => destination.id !== destinationId)
      );
    }
  };

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-pink-300/60 bg-white/80 p-12 text-center shadow-lg">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-pink-500/15 text-pink-500 shadow-inner">
          <Heart className="h-10 w-10" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-slate-900">Você ainda não tem favoritos</h2>
          <p className="text-sm text-slate-600">
            Explore os destinos disponíveis e toque no coração para salvar as experiências que mais combinam com você.
          </p>
        </div>
        <Link
          href="/destinos"
          className={cn(
            buttonVariants({ variant: "default" }),
            "rounded-full bg-pink-500/90 px-6 py-2 text-white shadow-md transition hover:bg-pink-500"
          )}
        >
          Explorar destinos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {favorites.map((destination) => (
          <motion.div
            key={destination.id}
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="will-change-transform"
          >
            <DestinationCard
              destination={{ ...destination, isFavorite: true }}
              canFavorite
              onFavoriteChange={handleFavoriteChange}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      <motion.div
        layout
        key="cta"
        className="hidden items-center justify-center rounded-3xl border border-slate-200/60 bg-gradient-to-br from-white/80 to-white/60 p-6 text-center shadow-inner shadow-slate-200/50 sm:flex"
      >
        <div className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <Compass className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-600">
            Continue explorando para aumentar sua coleção de destinos favoritos.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
