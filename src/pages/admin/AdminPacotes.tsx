import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Plus, Search, Pencil, Trash2, Loader2,
  Package, MapPin, ToggleLeft, ToggleRight, Filter, Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type PackageRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  price: number;
  status: string;
  active: boolean;
  cover_image_url: string | null;
  destination_name?: string | null;
  destinations?: { name: string } | null;
  created_at: string;
  total_slots?: number | null;
  available_slots?: number | null;
};

const categoryConfig: Record<string, { label: string; color: string; dot: string }> = {
  interno: { label: "Regional", color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  nacional: { label: "Nacional", color: "text-sky-700 bg-sky-50 border-sky-200", dot: "bg-sky-500" },
  internacional: { label: "Internacional", color: "text-violet-700 bg-violet-50 border-violet-200", dot: "bg-violet-500" },
  cruzeiro: { label: "Cruzeiro", color: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-500" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  rascunho: { label: "Rascunho", color: "text-amber-700 bg-amber-50 border-amber-200" },
  esgotado: { label: "Esgotado", color: "text-red-700 bg-red-50 border-red-200" },
};

export default function AdminPacotes() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("todos");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*, destinations(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PackageRow[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("packages")
        .update({ active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-packages"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      toast({ title: "Pacote excluído." });
    },
    onError: (err: Error) =>
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" }),
  });

  const filtered = packages.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.destination_name || p.destinations?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "todos" || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const stats = {
    total: packages.length,
    active: packages.filter((p) => p.active && p.status === "ativo").length,
    draft: packages.filter((p) => p.status === "rascunho").length,
    sold: packages.filter((p) => p.status === "esgotado").length,
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-0.5">
            Admin / Pacotes
          </p>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Pacotes</h1>
        </div>
        <Button asChild className="gap-2 h-10 px-5" style={{ background: "linear-gradient(135deg, hsl(232 100% 23%), hsl(232 100% 30%))" }}>
          <Link to="/admin/pacotes/novo">
            <Plus size={16} /> Novo Pacote
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Total", value: stats.total, color: "hsl(232 100% 23%)" },
          { label: "Ativos", value: stats.active, color: "#16a34a" },
          { label: "Rascunhos", value: stats.draft, color: "#d97706" },
          { label: "Esgotados", value: stats.sold, color: "#dc2626" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Buscar por título ou destino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={15} className="text-muted-foreground" />
          {["todos", "interno", "nacional", "internacional", "cruzeiro"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filterCat === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {cat === "todos" ? "Todos" : categoryConfig[cat]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Package list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Package size={26} className="text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">Nenhum pacote encontrado</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {search ? "Tente outro termo de busca" : "Crie seu primeiro pacote"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((pkg) => {
            const cat = categoryConfig[pkg.category] || categoryConfig.interno;
            const st = statusConfig[pkg.status] || statusConfig.ativo;
            const destName = (pkg as any).destination_name || pkg.destinations?.name || null;

            return (
              <div
                key={pkg.id}
                className={`flex items-center gap-4 bg-card border border-border rounded-2xl p-3 pr-4 transition-all hover:shadow-sm ${
                  !pkg.active ? "opacity-60" : ""
                }`}
              >
                {/* Cover image */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                  {pkg.cover_image_url ? (
                    <img
                      src={pkg.cover_image_url}
                      alt={pkg.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={20} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm truncate">
                      {pkg.title}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cat.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                      {cat.label}
                    </span>
                    <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full border ${st.color}`}>
                      {st.label}
                    </span>
                    {pkg.available_slots != null && (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                        pkg.available_slots === 0
                          ? "text-red-700 bg-red-50 border-red-200"
                          : pkg.available_slots <= 5
                          ? "text-amber-700 bg-amber-50 border-amber-200"
                          : "text-sky-700 bg-sky-50 border-sky-200"
                      }`}>
                        <Users size={10} />
                        {pkg.available_slots} vaga{pkg.available_slots !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {destName && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-muted-foreground/50 shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{destName}</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="shrink-0 text-right hidden sm:block">
                  <p className="font-bold text-foreground text-sm">
                    R$ {Number(pkg.price).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] text-muted-foreground">por pessoa</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Toggle active */}
                  <button
                    onClick={() => toggleMutation.mutate({ id: pkg.id, active: !pkg.active })}
                    title={pkg.active ? "Desativar" : "Ativar"}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    {pkg.active ? (
                      <ToggleRight size={20} className="text-emerald-600" />
                    ) : (
                      <ToggleLeft size={20} className="text-muted-foreground" />
                    )}
                  </button>

                  {/* Edit */}
                  <Link
                    to={`/admin/pacotes/${pkg.id}/editar`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil size={15} />
                  </Link>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm(`Excluir "${pkg.title}"?`)) deleteMutation.mutate(pkg.id);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
