"use client";

import { motion } from "framer-motion";
import { CalendarClock, KeyRound, ShieldCheck, UserCog, UserMinus, UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";

export type ActivityItem = {
  id: number;
  action: string;
  message: string;
  createdAt: string;
  actorName?: string | null;
  subjectName?: string | null;
};

// Timeline de atividades administrativas exibindo logs recentes com ícones contextuais.
export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
      <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Log de atividades</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400">Últimas ações registradas no painel.</p>

      <ol className="mt-6 space-y-4">
        {items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/70">
            Nenhuma atividade registrada até o momento.
          </li>
        ) : (
          items.map((item, index) => {
            const Icon = resolveIcon(item.action);
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="flex items-start gap-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/60"
              >
                <span className={cn("grid h-10 w-10 place-items-center rounded-full", iconBackground(item.action))}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.message}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.actorName ? `${item.actorName} • ` : ""}
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </motion.li>
            );
          })
        )}
      </ol>
    </div>
  );
}

function resolveIcon(action: string) {
  switch (action) {
    case "USER_CREATED":
      return UsersRound;
    case "USER_UPDATED":
      return UserCog;
    case "USER_ROLE_UPDATED":
      return ShieldCheck;
    case "USER_DELETED":
      return UserMinus;
    case "PASSWORD_RESET":
      return KeyRound;
    default:
      return CalendarClock;
  }
}

function iconBackground(action: string) {
  switch (action) {
    case "USER_CREATED":
      return "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200";
    case "USER_UPDATED":
      return "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200";
    case "USER_ROLE_UPDATED":
      return "bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-200";
    case "USER_DELETED":
      return "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200";
    case "PASSWORD_RESET":
      return "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200";
    default:
      return "bg-slate-500/15 text-slate-600 dark:bg-slate-500/20 dark:text-slate-200";
  }
}

function formatDate(input: string) {
  return new Date(input).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
