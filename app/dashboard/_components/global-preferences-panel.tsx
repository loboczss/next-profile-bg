"use client";

import { useEffect, useState } from "react";
import { BellRing, Globe2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const languageOptions = [
  { value: "pt-BR", label: "Português" },
  { value: "en-US", label: "Inglês" },
  { value: "es-ES", label: "Espanhol" },
];

// Painel de preferências globais simples para simular futuras expansões do sistema.
export function GlobalPreferencesPanel() {
  const [language, setLanguage] = useState("pt-BR");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("dashboard-language");
    const storedEmail = window.localStorage.getItem("dashboard-email-alerts");
    const storedPush = window.localStorage.getItem("dashboard-push-alerts");

    if (storedLanguage) setLanguage(storedLanguage);
    if (storedEmail) setEmailAlerts(storedEmail === "true");
    if (storedPush) setPushAlerts(storedPush === "true");
  }, []);

  const persist = () => {
    window.localStorage.setItem("dashboard-language", language);
    window.localStorage.setItem("dashboard-email-alerts", String(emailAlerts));
    window.localStorage.setItem("dashboard-push-alerts", String(pushAlerts));
    toast.success("Preferências atualizadas");
  };

  return (
    <div className="space-y-4 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
      <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Preferências globais</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Personalize idioma e alertas do painel. Os dados são armazenados localmente para cada administrador.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-inner dark:border-slate-800 dark:bg-slate-900/70">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Globe2 className="h-4 w-4 text-blue-500" /> Idioma do painel
          </span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/60 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-inner dark:border-slate-800 dark:bg-slate-900/70">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <BellRing className="h-4 w-4 text-purple-500" /> Alertas administrativos
          </span>
          <ToggleChip
            label="Alertas por e-mail"
            active={emailAlerts}
            onToggle={() => setEmailAlerts((state) => !state)}
          />
          <ToggleChip
            label="Notificações push"
            active={pushAlerts}
            onToggle={() => setPushAlerts((state) => !state)}
          />
        </div>
      </div>

      <Button onClick={persist} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
        Salvar preferências
      </Button>
    </div>
  );
}

function ToggleChip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition",
        active
          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-inner dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-200"
          : "border-white/50 bg-white text-slate-600 hover:border-emerald-400 hover:bg-emerald-500/10 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300",
      )}
    >
      {label}
      <span
        className={cn(
          "inline-flex h-5 w-10 items-center rounded-full border border-transparent bg-slate-200 px-1 transition",
          active ? "bg-emerald-500/80" : "bg-slate-200 dark:bg-slate-700",
        )}
      >
        <span
          className={cn(
            "h-3.5 w-3.5 rounded-full bg-white shadow transition",
            active ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}
