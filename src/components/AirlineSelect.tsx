/**
 * AirlineSelect — Dropdown de companhias aéreas com logo + nome
 *
 * Inclui as principais companhias aéreas que operam no Brasil:
 * nacionais (LATAM, GOL, Azul) e internacionais relevantes.
 *
 * Cada opção mostra a logo oficial e o nome da companhia.
 * O componente também permite uma opção "Outra" para digitação livre.
 *
 * FIX: usa createPortal para o dropdown não ser cortado por
 * containers com overflow-hidden (como o SectionCard).
 * Logos via pics.avs.io (CDN de logos de companhias aéreas por IATA).
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X, Plane } from "lucide-react";

export interface AirlineOption {
  /** Valor salvo no banco (ex: "LATAM") */
  value: string;
  /** Nome para exibição (ex: "LATAM Airlines") */
  label: string;
  /** Código IATA (ex: "LA") — usado para gerar a URL da logo */
  iata: string;
}

/** Gera a URL da logo a partir do código IATA */
function airlineLogo(iata: string): string {
  return `https://pics.avs.io/80/80/${iata}.png`;
}

/**
 * Companhias aéreas que operam no Brasil (nacionais + internacionais)
 * Logos são servidas via pics.avs.io (CDN gratuito de logos aéreas).
 */
export const BRAZILIAN_AIRLINES: AirlineOption[] = [
  // ── Nacionais ──
  { value: "LATAM", label: "LATAM Airlines", iata: "LA" },
  { value: "GOL", label: "GOL Linhas Aéreas", iata: "G3" },
  { value: "Azul", label: "Azul Linhas Aéreas", iata: "AD" },
  // ── Internacionais com operação no Brasil ──
  { value: "American Airlines", label: "American Airlines", iata: "AA" },
  { value: "United Airlines", label: "United Airlines", iata: "UA" },
  { value: "Delta", label: "Delta Air Lines", iata: "DL" },
  { value: "Air France", label: "Air France", iata: "AF" },
  { value: "KLM", label: "KLM Royal Dutch Airlines", iata: "KL" },
  { value: "TAP", label: "TAP Air Portugal", iata: "TP" },
  { value: "Iberia", label: "Iberia", iata: "IB" },
  { value: "Emirates", label: "Emirates", iata: "EK" },
  { value: "Turkish Airlines", label: "Turkish Airlines", iata: "TK" },
  { value: "Qatar Airways", label: "Qatar Airways", iata: "QR" },
  { value: "Copa Airlines", label: "Copa Airlines", iata: "CM" },
  { value: "Avianca", label: "Avianca", iata: "AV" },
  { value: "Aerolíneas Argentinas", label: "Aerolíneas Argentinas", iata: "AR" },
  { value: "JetSMART", label: "JetSMART", iata: "JA" },
  { value: "Flybondi", label: "Flybondi", iata: "FO" },
  { value: "Lufthansa", label: "Lufthansa", iata: "LH" },
  { value: "British Airways", label: "British Airways", iata: "BA" },
  { value: "Swiss", label: "Swiss International", iata: "LX" },
  { value: "Ethiopian Airlines", label: "Ethiopian Airlines", iata: "ET" },
  { value: "Condor", label: "Condor", iata: "DE" },
];

const NATIONAL_VALUES = ["LATAM", "GOL", "Azul"];

interface AirlineSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AirlineSelect({
  value,
  onChange,
  placeholder = "Selecione a companhia...",
  className = "",
}: AirlineSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Find the selected airline from the list
  const selectedAirline = BRAZILIAN_AIRLINES.find((a) => a.value === value);

  // Determine if the current value is custom (not in the list)
  const isCustomValue = value && !selectedAirline;

  // Filter airlines by search term
  const filtered = BRAZILIAN_AIRLINES.filter(
    (a) =>
      a.label.toLowerCase().includes(search.toLowerCase()) ||
      a.value.toLowerCase().includes(search.toLowerCase()) ||
      a.iata.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate dropdown position based on trigger button
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearch("");
        setCustomMode(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) updatePosition();
    setIsOpen(!isOpen);
  };

  const handleSelect = (airline: AirlineOption) => {
    onChange(airline.value);
    setIsOpen(false);
    setSearch("");
    setCustomMode(false);
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setIsOpen(false);
      setSearch("");
      setCustomMode(false);
      setCustomValue("");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`
          w-full h-10 px-3 rounded-md border bg-background text-sm
          flex items-center gap-2.5 transition-all duration-200
          hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          ${isOpen ? "border-primary ring-2 ring-ring ring-offset-2" : "border-input"}
          ${!value ? "text-muted-foreground" : "text-foreground"}
        `}
      >
        {selectedAirline ? (
          <>
            <AirlineLogoImg iata={selectedAirline.iata} alt={selectedAirline.label} size={20} />
            <span className="font-medium truncate flex-1 text-left">
              {selectedAirline.label}
            </span>
            <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground flex-shrink-0">
              {selectedAirline.iata}
            </span>
          </>
        ) : isCustomValue ? (
          <>
            <Plane size={16} className="text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate flex-1 text-left">{value}</span>
          </>
        ) : (
          <span className="truncate flex-1 text-left">{placeholder}</span>
        )}

        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-muted transition-colors"
            >
              <X size={12} className="text-muted-foreground" />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown — renderizado via Portal para escapar de overflow:hidden */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              maxHeight: "340px",
            }}
          >
            {/* Search */}
            <div className="p-2 border-b border-border/50 sticky top-0 bg-popover z-10">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar companhia..."
                  className="w-full h-8 pl-8 pr-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="overflow-y-auto" style={{ maxHeight: "240px" }}>
              {/* Custom mode form */}
              {customMode ? (
                <div className="p-3 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Digite o nome da companhia:
                  </p>
                  <input
                    type="text"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                    placeholder="Ex: Placar Linhas Aéreas"
                    className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCustomSubmit}
                      className="flex-1 h-8 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCustomMode(false); setCustomValue(""); }}
                      className="flex-1 h-8 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {filtered.length > 0 ? (
                    <>
                      {/* Nacional header */}
                      {filtered.some((a) => NATIONAL_VALUES.includes(a.value)) && (
                        <div className="px-3 pt-2 pb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            🇧🇷 Nacionais
                          </span>
                        </div>
                      )}
                      {filtered
                        .filter((a) => NATIONAL_VALUES.includes(a.value))
                        .map((airline) => (
                          <AirlineOptionItem
                            key={airline.value}
                            airline={airline}
                            isSelected={value === airline.value}
                            onClick={() => handleSelect(airline)}
                          />
                        ))}

                      {/* Internacional header */}
                      {filtered.some((a) => !NATIONAL_VALUES.includes(a.value)) && (
                        <div className="px-3 pt-3 pb-1 border-t border-border/30">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            ✈️ Internacionais
                          </span>
                        </div>
                      )}
                      {filtered
                        .filter((a) => !NATIONAL_VALUES.includes(a.value))
                        .map((airline) => (
                          <AirlineOptionItem
                            key={airline.value}
                            airline={airline}
                            isSelected={value === airline.value}
                            onClick={() => handleSelect(airline)}
                          />
                        ))}
                    </>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhuma companhia encontrada
                    </div>
                  )}

                  {/* Custom option */}
                  <div className="border-t border-border/30">
                    <button
                      type="button"
                      onClick={() => setCustomMode(true)}
                      className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-muted/60 transition-colors text-muted-foreground"
                    >
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Plane size={14} className="text-muted-foreground" />
                      </div>
                      <span className="font-medium">Outra companhia...</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/**
 * Componente auxiliar para exibir a logo da companhia aérea.
 * Mostra fallback (ícone de avião) caso a imagem não carregue.
 */
function AirlineLogoImg({
  iata,
  alt,
  size = 20,
  className = "",
}: {
  iata: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return <Plane size={size * 0.7} className={`text-muted-foreground flex-shrink-0 ${className}`} />;
  }

  return (
    <img
      src={airlineLogo(iata)}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain flex-shrink-0 ${className}`}
      onError={() => setError(true)}
    />
  );
}

function AirlineOptionItem({
  airline,
  isSelected,
  onClick,
}: {
  airline: AirlineOption;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 transition-colors
        ${isSelected
          ? "bg-primary/10 text-primary font-semibold"
          : "hover:bg-muted/60 text-foreground"
        }
      `}
    >
      {/* Logo */}
      <div className="w-7 h-7 rounded-lg bg-white border border-border/50 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
        <AirlineLogoImg iata={airline.iata} alt={airline.label} size={22} />
      </div>

      {/* Name */}
      <span className="truncate flex-1">{airline.label}</span>

      {/* IATA code badge */}
      <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground flex-shrink-0">
        {airline.iata}
      </span>

      {/* Selected indicator */}
      {isSelected && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </button>
  );
}

/**
 * Helper: dado um valor de airline (string), retorna a info da companhia
 * Útil para exibir logo/nome no PackageDetails ou em previews.
 */
export function getAirlineInfo(value: string): (AirlineOption & { logo: string }) | null {
  if (!value) return null;
  const found = BRAZILIAN_AIRLINES.find((a) => a.value === value);
  if (!found) return null;
  return { ...found, logo: airlineLogo(found.iata) };
}
