"use client";

import type React from "react";
import { useMemo, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  Circle,
  DollarSign,
  Filter,
  Mail,
  MapPin,
  Plane,
  Search,
  Ticket,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<PurchaseStatus, string> = {
  AGUARDANDO_EMISSAO: "Aguardando emissão",
  EMITIDA: "Emitida",
  CANCELADA: "Cancelada",
};

const STATUS_COLORS: Record<PurchaseStatus, string> = {
  AGUARDANDO_EMISSAO: "bg-amber-100 text-amber-800 ring-amber-200",
  EMITIDA: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  CANCELADA: "bg-rose-100 text-rose-800 ring-rose-200",
};

type PurchaseStatus = "AGUARDANDO_EMISSAO" | "EMITIDA" | "CANCELADA";

type Passenger = {
  id: number;
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
};

type Payment = {
  method: string;
  status: "pendente" | "pago" | "reembolsado";
  amount: number;
  identifier: string;
};

type EmissionData = {
  locator: string;
  airline: string;
  fareType: string;
  flightNumber: string;
  departureDate: string;
  outboundDepartureTime: string;
  outboundArrivalTime: string;
  returnDate: string;
  returnDepartureTime: string;
  returnArrivalTime: string;
};

type Purchase = {
  id: number;
  code: string;
  buyer: { name: string; email: string };
  package: { id: string; name: string; location: string };
  travelDate: string;
  createdAt: string;
  status: PurchaseStatus;
  seatCount: number;
  payment: Payment;
  emission: EmissionData;
  passengers: Passenger[];
  notes: string;
  company: string;
  route: { outbound: string; inbound: string };
};

type Filters = {
  query: string;
  status: "ALL" | PurchaseStatus;
  packageId: string;
  from: string;
  to: string;
};

const MOCK_PURCHASES: Purchase[] = [
  {
    id: 1,
    code: "EVA-93281",
    buyer: { name: "Mariana Lopes", email: "mariana.lopes@email.com" },
    package: { id: "rio", name: "Praias do Rio", location: "Rio de Janeiro, RJ" },
    travelDate: "2024-11-03",
    createdAt: "2024-08-20",
    status: "AGUARDANDO_EMISSAO",
    seatCount: 2,
    payment: { method: "Cartão de crédito", status: "pago", amount: 4280, identifier: "PAY-128812" },
    emission: {
      locator: "",
      airline: "",
      fareType: "Flex",
      flightNumber: "",
      departureDate: "2024-11-03",
      outboundDepartureTime: "08:15",
      outboundArrivalTime: "10:05",
      returnDate: "2024-11-10",
      returnDepartureTime: "18:40",
      returnArrivalTime: "21:15",
    },
    passengers: [
      {
        id: 11,
        fullName: "Mariana Lopes",
        cpf: "123.456.789-00",
        birthDate: "1991-05-12",
        phone: "+55 11 99876-5432",
        email: "mariana.lopes@email.com",
      },
      {
        id: 12,
        fullName: "Carlos Mendes",
        cpf: "321.654.987-00",
        birthDate: "1990-11-23",
        phone: "+55 11 97777-4444",
        email: "carlos.mendes@email.com",
      },
    ],
    notes: "Cliente pediu assentos juntos e refeição vegetariana.",
    company: "Azul",
    route: { outbound: "GRU → SDU", inbound: "SDU → GRU" },
  },
  {
    id: 2,
    code: "EVA-19422",
    buyer: { name: "Rafael Costa", email: "rafael.costa@email.com" },
    package: { id: "salvador", name: "Carnaval Salvador", location: "Salvador, BA" },
    travelDate: "2025-02-26",
    createdAt: "2024-09-12",
    status: "EMITIDA",
    seatCount: 1,
    payment: { method: "Boleto", status: "pago", amount: 3180, identifier: "BLT-9823" },
    emission: {
      locator: "SAV982",
      airline: "LATAM",
      fareType: "Promo",
      flightNumber: "LA2231",
      departureDate: "2025-02-26",
      outboundDepartureTime: "07:20",
      outboundArrivalTime: "10:00",
      returnDate: "2025-03-05",
      returnDepartureTime: "22:35",
      returnArrivalTime: "01:10",
    },
    passengers: [
      {
        id: 21,
        fullName: "Rafael Costa",
        cpf: "456.987.123-00",
        birthDate: "1987-02-18",
        phone: "+55 21 99123-4500",
        email: "rafael.costa@email.com",
      },
    ],
    notes: "Ticket emitido. Enviar voucher de hotel até 10/02.",
    company: "LATAM",
    route: { outbound: "GIG → SSA", inbound: "SSA → GIG" },
  },
  {
    id: 3,
    code: "EVA-57218",
    buyer: { name: "Bianca Carvalho", email: "bianca.carvalho@email.com" },
    package: { id: "sp", name: "São Paulo Cultural", location: "São Paulo, SP" },
    travelDate: "2024-10-14",
    createdAt: "2024-08-30",
    status: "AGUARDANDO_EMISSAO",
    seatCount: 3,
    payment: { method: "Pagamento combinado", status: "pendente", amount: 5790, identifier: "AG-41872" },
    emission: {
      locator: "",
      airline: "Gol",
      fareType: "Flex",
      flightNumber: "",
      departureDate: "2024-10-14",
      outboundDepartureTime: "09:45",
      outboundArrivalTime: "11:30",
      returnDate: "2024-10-18",
      returnDepartureTime: "19:05",
      returnArrivalTime: "21:00",
    },
    passengers: [
      {
        id: 31,
        fullName: "Bianca Carvalho",
        cpf: "102.304.506-80",
        birthDate: "1994-07-08",
        phone: "+55 31 99811-2000",
        email: "bianca.carvalho@email.com",
      },
      {
        id: 32,
        fullName: "Alice Carvalho",
        cpf: "203.405.607-91",
        birthDate: "2016-03-14",
        phone: "+55 31 98888-1010",
        email: "alice.carvalho@email.com",
      },
      {
        id: 33,
        fullName: "Rogério Carvalho",
        cpf: "102.405.607-22",
        birthDate: "1968-12-01",
        phone: "+55 31 97777-3321",
        email: "rogerio.carvalho@email.com",
      },
    ],
    notes: "Cliente pediu prioridade para assento corredor.",
    company: "Gol",
    route: { outbound: "CNF → CGH", inbound: "CGH → CNF" },
  },
  {
    id: 4,
    code: "EVA-77102",
    buyer: { name: "Joana Prado", email: "joana.prado@email.com" },
    package: { id: "gramado", name: "Natal Luz", location: "Gramado, RS" },
    travelDate: "2024-12-15",
    createdAt: "2024-09-05",
    status: "CANCELADA",
    seatCount: 2,
    payment: { method: "Cartão", status: "reembolsado", amount: 5120, identifier: "PAY-66231" },
    emission: {
      locator: "",
      airline: "",
      fareType: "",
      flightNumber: "",
      departureDate: "2024-12-15",
      outboundDepartureTime: "08:00",
      outboundArrivalTime: "10:20",
      returnDate: "2024-12-20",
      returnDepartureTime: "16:45",
      returnArrivalTime: "19:00",
    },
    passengers: [
      {
        id: 41,
        fullName: "Joana Prado",
        cpf: "623.410.998-00",
        birthDate: "1985-03-12",
        phone: "+55 51 97777-1200",
        email: "joana.prado@email.com",
      },
      {
        id: 42,
        fullName: "Marcelo Prado",
        cpf: "623.410.998-88",
        birthDate: "1984-09-01",
        phone: "+55 51 98888-8844",
        email: "marcelo.prado@email.com",
      },
    ],
    notes: "Cancelada a pedido do cliente em 12/09.",
    company: "",
    route: { outbound: "POA → CWB", inbound: "CWB → POA" },
  },
];

const EMPTY_FILTERS: Filters = {
  query: "",
  status: "ALL",
  packageId: "",
  from: "",
  to: "",
};

export function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>(MOCK_PURCHASES);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const totals = useMemo(() => {
    const total = purchases.length;
    const pending = purchases.filter((purchase) => purchase.status === "AGUARDANDO_EMISSAO").length;
    const issued = purchases.filter((purchase) => purchase.status === "EMITIDA").length;

    return { total, pending, issued };
  }, [purchases]);

  const packageOptions = useMemo(() => {
    const unique = new Map<string, Purchase["package"]>();

    purchases.forEach((purchase) => {
      unique.set(purchase.package.id, purchase.package);
    });

    return Array.from(unique.values());
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const matchesQuery = `${purchase.buyer.name} ${purchase.buyer.email}`
        .toLowerCase()
        .includes(filters.query.trim().toLowerCase());

      const matchesStatus = filters.status === "ALL" ? true : purchase.status === filters.status;
      const matchesPackage = filters.packageId ? purchase.package.id === filters.packageId : true;

      const date = new Date(purchase.travelDate);
      const fromDate = filters.from ? new Date(filters.from) : null;
      const toDate = filters.to ? new Date(filters.to) : null;

      const matchesDate = (() => {
        if (fromDate && date < fromDate) return false;
        if (toDate && date > toDate) return false;
        return true;
      })();

      return matchesQuery && matchesStatus && matchesPackage && matchesDate;
    });
  }, [filters, purchases]);

  const selectedPurchase = useMemo(
    () => purchases.find((purchase) => purchase.id === selectedId) ?? null,
    [purchases, selectedId]
  );

  const handleApplyFilters = () => {
    setFilters({ ...draftFilters });
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
  };

  const updatePurchase = (id: number, data: Partial<Purchase>) => {
    setPurchases((previous) => previous.map((item) => (item.id === id ? { ...item, ...data } : item)));
  };

  const handleMarkAsIssued = (id: number) => {
    const purchase = purchases.find((item) => item.id === id);
    if (!purchase || purchase.status === "EMITIDA") return;

    updatePurchase(id, { status: "EMITIDA" });
    toast.success("Compra marcada como emitida.");
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Administração de compras</p>
        <h1 className="text-3xl font-bold text-slate-900">Monitoramento de pacotes vendidos</h1>
        <p className="text-sm text-slate-600">
          Acompanhe solicitações, atualize status e registre observações para agilizar a emissão dos bilhetes da Evastur
          Viagens.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total de pacotes" value={totals.total} icon={<Ticket className="h-5 w-5" />} />
        <SummaryCard
          label="Aguardando emissão"
          value={totals.pending}
          icon={<ClockIcon className="h-5 w-5" />}
          color="amber"
        />
        <SummaryCard label="Emitidos" value={totals.issued} icon={<CheckCircle2 className="h-5 w-5" />} color="emerald" />
      </section>

      <PurchaseFilters
        filters={draftFilters}
        onChange={setDraftFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        packages={packageOptions}
      />

      <PurchasesTable
        purchases={filteredPurchases}
        onSelect={(purchase) => {
          setSelectedId(purchase.id);
          setDrawerOpen(true);
        }}
        onMarkAsIssued={handleMarkAsIssued}
      />

      <PurchaseDetailsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        purchase={selectedPurchase}
        onSave={(data) => selectedPurchase && updatePurchase(selectedPurchase.id, data)}
        onMarkAsIssued={() => selectedPurchase && handleMarkAsIssued(selectedPurchase.id)}
        onCancel={() => selectedPurchase && updatePurchase(selectedPurchase.id, { status: "CANCELADA" })}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color = "blue",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: "blue" | "amber" | "emerald";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 px-5 py-4 shadow-sm">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <span className={cn("rounded-xl p-2 ring-1", colorClasses[color])}>{icon}</span>
    </div>
  );
}

function PurchaseFilters({
  filters,
  onChange,
  onApply,
  onClear,
  packages,
}: {
  filters: Filters;
  onChange: (value: Filters) => void;
  onApply: () => void;
  onClear: () => void;
  packages: Purchase["package"][];
}) {
  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-slate-700">
        <Filter className="h-4 w-4" />
        <p className="text-sm font-semibold uppercase tracking-[0.2em]">Filtros rápidos</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="space-y-2 lg:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Busca por comprador</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Nome ou e-mail"
              className="pl-10"
              value={filters.query}
              onChange={(event) => onChange({ ...filters, query: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Status</label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner"
            value={filters.status}
            onChange={(event) => onChange({ ...filters, status: event.target.value as Filters["status"] })}
          >
            <option value="ALL">Todos</option>
            <option value="AGUARDANDO_EMISSAO">Aguardando emissão</option>
            <option value="EMITIDA">Emitido</option>
            <option value="CANCELADA">Cancelado</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Pacote</label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner"
            value={filters.packageId}
            onChange={(event) => onChange({ ...filters, packageId: event.target.value })}
          >
            <option value="">Todos</option>
            {packages.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Data inicial</label>
            <Input
              type="date"
              value={filters.from}
              onChange={(event) => onChange({ ...filters, from: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Data final</label>
            <Input
              type="date"
              value={filters.to}
              onChange={(event) => onChange({ ...filters, to: event.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={onApply} className="gap-2">
          <CalendarRange className="h-4 w-4" /> Aplicar filtros
        </Button>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-semibold text-blue-600 underline-offset-2 hover:underline"
        >
          Limpar filtros
        </button>
      </div>
    </section>
  );
}

function PurchasesTable({
  purchases,
  onSelect,
  onMarkAsIssued,
}: {
  purchases: Purchase[];
  onSelect: (purchase: Purchase) => void;
  onMarkAsIssued: (id: number) => void;
}) {
  if (purchases.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-10 text-center shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">Nenhuma compra encontrada</h2>
        <p className="mt-2 text-sm text-slate-600">Ajuste os filtros ou aguarde novas vendas.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-lg">
      <div className="max-h-[520px] overflow-y-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/90 text-[11px] uppercase tracking-[0.35em] text-slate-500 backdrop-blur">
            <tr>
              <th className="px-6 py-4 font-semibold">Comprador</th>
              <th className="px-6 py-4 font-semibold">Pacote</th>
              <th className="px-6 py-4 font-semibold">Data da viagem</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Criada em</th>
              <th className="px-6 py-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {purchases.map((purchase) => (
              <tr key={purchase.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{purchase.buyer.name}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Mail className="h-3.5 w-3.5" />
                      {purchase.buyer.email}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">{purchase.package.name}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {purchase.package.location}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-slate-900/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {purchase.seatCount} {purchase.seatCount === 1 ? "passageiro" : "passageiros"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-slate-400" />
                    <span>{new Date(purchase.travelDate).toLocaleDateString("pt-BR")}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={purchase.status} />
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(purchase.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onSelect(purchase)}>
                      Detalhes
                    </Button>
                    {purchase.status !== "EMITIDA" && purchase.status !== "CANCELADA" && (
                      <Button size="sm" onClick={() => onMarkAsIssued(purchase.id)}>
                        Marcar como emitido
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PurchaseDetailsDrawer({
  purchase,
  open,
  onOpenChange,
  onSave,
  onMarkAsIssued,
  onCancel,
}: {
  purchase: Purchase | null;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSave: (data: Partial<Purchase>) => void;
  onMarkAsIssued: () => void;
  onCancel: () => void;
}) {
  const [emission, setEmission] = useState<EmissionData | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (purchase) {
      setEmission(purchase.emission);
      setPassengers(purchase.passengers);
    }
  }, [purchase]);

  const handleSaveEmission = async () => {
    if (!emission || !purchase) return;

    const requiredFields: (keyof EmissionData)[] = [
      "locator",
      "airline",
      "fareType",
      "flightNumber",
      "departureDate",
      "outboundDepartureTime",
      "outboundArrivalTime",
      "returnDate",
      "returnDepartureTime",
      "returnArrivalTime",
    ];

    const hasEmpty = requiredFields.some((field) => !emission[field]);

    if (hasEmpty) {
      toast.error("Preencha os campos obrigatórios para emissão.");
      return;
    }

    setSaving(true);
    await fakeRequest();
    onSave({ emission });
    toast.success("Dados para emissão salvos.");
    setSaving(false);
  };

  const handleSavePassengers = async () => {
    if (!purchase) return;
    setSaving(true);
    await fakeRequest();
    onSave({ passengers });
    toast.success("Passageiros atualizados.");
    setSaving(false);
  };

  const handleSaveAll = async () => {
    if (!purchase || !emission) return;
    setSaving(true);
    await fakeRequest();
    onSave({ emission, passengers });
    toast.success("Alterações salvas.");
    setSaving(false);
  };

  const handleAddPassenger = () => {
    const newPassenger: Passenger = {
      id: Date.now(),
      fullName: "",
      cpf: "",
      birthDate: "",
      phone: "",
      email: "",
    };

    setPassengers((previous) => [...previous, newPassenger]);
  };

  const handleRemovePassenger = (id: number) => {
    setPassengers((previous) => previous.filter((passenger) => passenger.id !== id));
  };

  const handlePassengerChange = (id: number, field: keyof Passenger, value: string) => {
    setPassengers((previous) => previous.map((passenger) => (passenger.id === id ? { ...passenger, [field]: value } : passenger)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed inset-y-0 right-0 m-0 flex h-full w-full max-w-4xl translate-x-0 flex-col overflow-y-auto rounded-none border-l border-slate-200 bg-white p-0 shadow-2xl sm:max-w-3xl"
        showCloseButton
      >
        {purchase ? (
          <div className="space-y-6 p-8">
            <DialogHeader className="space-y-1 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Painel de emissão</p>
              <DialogTitle className="text-2xl font-bold text-slate-900">{purchase.package.name}</DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Centralize o fluxo de emissão: valide dados, conclua passageiros e atualize status da compra.
              </DialogDescription>
            </DialogHeader>

            <section className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={purchase.status} />
                <span className="text-sm font-semibold text-slate-900">Código: {purchase.code}</span>
                <span className="text-sm text-slate-600">Criada em {new Date(purchase.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoLine label="Trechos" value={`${purchase.route.outbound} • ${purchase.route.inbound}`} />
                <InfoLine label="Companhia" value={purchase.company || "—"} />
                <InfoLine label="Data da viagem" value={new Date(purchase.travelDate).toLocaleDateString("pt-BR")} />
                <InfoLine label="Observações" value={purchase.notes} />
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5 shadow-inner">
              <SectionHeader title="Dados para emissão" subtitle="Campos obrigatórios para liberar a emissão." />
              {emission && (
                <EmissionForm emission={emission} onChange={setEmission} disabled={saving} />
              )}
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => onMarkAsIssued()} disabled={purchase.status === "EMITIDA" || saving}>
                  Marcar como emitido
                </Button>
                <Button onClick={handleSaveEmission} disabled={saving} className="gap-2">
                  <SaveIcon className="h-4 w-4" /> Salvar dados para emissão
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
              <SectionHeader
                title="Passageiros vinculados"
                subtitle="Confirme documentos e contatos antes da emissão."
              />
              <PassengersSection
                passengers={passengers}
                onChange={handlePassengerChange}
                onRemove={handleRemovePassenger}
                onAdd={handleAddPassenger}
                disabled={saving}
              />
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSavePassengers} disabled={saving} className="gap-2">
                  <SaveIcon className="h-4 w-4" /> Salvar passageiros
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
              <SectionHeader title="Pagamento" subtitle="Referência do pedido para suporte." />
              <PaymentSection payment={purchase.payment} />
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
              <SectionHeader title="Ações do pedido" subtitle="Finalize ou cancele esta compra." />
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSaveAll} disabled={saving}>
                  Salvar todas as alterações
                </Button>
                <Button variant="outline" onClick={onMarkAsIssued} disabled={purchase.status === "EMITIDA" || saving}>
                  Marcar como emitido
                </Button>
                <Button variant="destructive" onClick={onCancel} disabled={saving || purchase.status === "CANCELADA"}>
                  Cancelar compra
                </Button>
              </div>
            </section>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
            Nenhuma compra selecionada.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmissionForm({
  emission,
  onChange,
  disabled,
}: {
  emission: EmissionData;
  onChange: (data: EmissionData) => void;
  disabled: boolean;
}) {
  const update = (field: keyof EmissionData, value: string) => {
    onChange({ ...emission, [field]: value });
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Localizador (PNR)"
          value={emission.locator}
          onChange={(value) => update("locator", value)}
          required
          disabled={disabled}
        />
        <InputField
          label="Companhia aérea"
          value={emission.airline}
          onChange={(value) => update("airline", value)}
          required
          disabled={disabled}
        />
        <InputField
          label="Tipo de tarifa"
          value={emission.fareType}
          onChange={(value) => update("fareType", value)}
          required
          disabled={disabled}
        />
        <InputField
          label="Número do voo"
          value={emission.flightNumber}
          onChange={(value) => update("flightNumber", value)}
          required
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-white/70 bg-white/60 p-3 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Ida</p>
          <InputField
            label="Data de embarque"
            type="date"
            value={emission.departureDate}
            onChange={(value) => update("departureDate", value)}
            required
            disabled={disabled}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField
              label="Hora de embarque"
              type="time"
              value={emission.outboundDepartureTime}
              onChange={(value) => update("outboundDepartureTime", value)}
              required
              disabled={disabled}
            />
            <InputField
              label="Hora de chegada"
              type="time"
              value={emission.outboundArrivalTime}
              onChange={(value) => update("outboundArrivalTime", value)}
              required
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-white/70 bg-white/60 p-3 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Volta</p>
          <InputField
            label="Data de retorno"
            type="date"
            value={emission.returnDate}
            onChange={(value) => update("returnDate", value)}
            required
            disabled={disabled}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField
              label="Hora de embarque"
              type="time"
              value={emission.returnDepartureTime}
              onChange={(value) => update("returnDepartureTime", value)}
              required
              disabled={disabled}
            />
            <InputField
              label="Hora de chegada"
              type="time"
              value={emission.returnArrivalTime}
              onChange={(value) => update("returnArrivalTime", value)}
              required
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PassengersSection({
  passengers,
  onChange,
  onRemove,
  onAdd,
  disabled,
}: {
  passengers: Passenger[];
  onChange: (id: number, field: keyof Passenger, value: string) => void;
  onRemove: (id: number) => void;
  onAdd: () => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-4 space-y-3">
      {passengers.map((passenger, index) => (
        <div key={passenger.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <UserRound className="h-4 w-4" /> Passageiro {index + 1}
            </div>
            <button
              type="button"
              onClick={() => onRemove(passenger.id)}
              className="text-xs font-semibold text-rose-600 hover:underline"
              disabled={disabled}
            >
              Remover
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <InputField
              label="Nome completo"
              value={passenger.fullName}
              onChange={(value) => onChange(passenger.id, "fullName", value)}
              disabled={disabled}
            />
            <InputField
              label="CPF"
              value={passenger.cpf}
              onChange={(value) => onChange(passenger.id, "cpf", value)}
              disabled={disabled}
            />
            <InputField
              label="Data de nascimento"
              type="date"
              value={passenger.birthDate}
              onChange={(value) => onChange(passenger.id, "birthDate", value)}
              disabled={disabled}
            />
            <InputField
              label="Telefone"
              value={passenger.phone}
              onChange={(value) => onChange(passenger.id, "phone", value)}
              disabled={disabled}
            />
            <InputField
              label="E-mail"
              value={passenger.email}
              onChange={(value) => onChange(passenger.id, "email", value)}
              disabled={disabled}
            />
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={onAdd} disabled={disabled} className="gap-2">
        <Circle className="h-4 w-4" /> Adicionar passageiro
      </Button>
    </div>
  );
}

function PaymentSection({ payment }: { payment: Payment }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <InfoLine label="Meio de pagamento" value={payment.method} icon={<DollarSign className="h-4 w-4 text-slate-400" />} />
      <InfoLine label="Status do pagamento" value={payment.status} />
      <InfoLine label="Valor" value={payment.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
      <InfoLine label="Identificador" value={payment.identifier} />
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-1 text-sm">
      <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </div>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </label>
  );
}

function InfoLine({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-700">
      {icon}
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: PurchaseStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1", STATUS_COLORS[status])}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 21h10a2 2 0 0 0 2-2V7.5L16.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 3v4h6" />
    </svg>
  );
}

async function fakeRequest() {
  return new Promise((resolve) => setTimeout(resolve, 600));
}
