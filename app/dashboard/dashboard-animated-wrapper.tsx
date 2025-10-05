"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface DashboardAnimatedWrapperProps {
  children: ReactNode;
  userName: string;
}

export function DashboardAnimatedWrapper({ children }: DashboardAnimatedWrapperProps) {
  return (
    <div className="relative">
      {/* Background Effects Animados */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-blue-400/30 to-cyan-400/30 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute right-1/3 top-1/2 h-80 w-80 rounded-full bg-gradient-to-r from-indigo-400/25 to-blue-400/25 blur-3xl"
        />
      </div>

      {/* Conteúdo com fade-in suave */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}