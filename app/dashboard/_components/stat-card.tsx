"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: ReactNode;
  trend?: {
    value: string;
    label: string;
    isPositive?: boolean;
  };
}

// Cartão responsivo utilizado no dashboard para exibir métricas principais e tendências.
export function StatCard({ title, value, subtitle, icon: Icon, highlight, trend }: StatCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
          {trend ? (
            <p
              className={cn(
                "mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                trend.isPositive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
              )}
            >
              <span>{trend.value}</span>
              <span className="font-normal opacity-70">{trend.label}</span>
            </p>
          ) : null}
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 text-blue-600 dark:text-indigo-300">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {highlight ? (
        <div className="mt-4 rounded-2xl border border-white/60 bg-white/70 p-3 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
          {highlight}
        </div>
      ) : null}
    </motion.article>
  );
}
