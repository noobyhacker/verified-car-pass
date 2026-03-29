import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { getInspectedVehicles, getUninspectedVehicles, formatPrice, currencyRates } from "@/data/mockData";
import { getCatalogVehicles } from "@/lib/queries";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { CatalogEntry } from "@/lib/types";
import { Search, Star, Clock, CheckCircle, ChevronDown } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { carDatabase } from "@/data/carDatabase";
import { AnimatedSelect } from "@/components/AnimatedSelect";

const CURRENCY_OPTIONS = Object.entries(currencyRates).map(([code, data]) => ({ code, label: `${code} — ${data.label}` }));


// ── Catalog search bar (same as Landing) ────────────────────────────────────
function CatalogSearch({ onSearch }: { onSearch: (q: string) => void }) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  const makes = Object.keys(carDatabase).sort();
  const models = make ? (carDatabase[make] || []).map(m => m.model) : [];
  const years = Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - i));

  const makeOptions = [{ value: "", label: "Make" }, ...makes.map(m => ({ value: m, label: m }))];
  const modelOptions = [{ value: "", label: "Models" }, ...models.map(m => ({ value: m, label: m }))];
  const yearOptions = [{ value: "", label: "Year" }, ...years.map(y => ({ value: y, label: y }))];

  const handleSearch = () => {
    const q = [make, model, year].filter(Boolean).join(" ");
    onSearch(q);
  };

  return (
    <div className="flex items-stretch bg-white rounded-lg overflow-visible"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)", border: "1.5px solid #d0d7e3" }}>
      <AnimatedSelect
        value={make}
        onChange={v => { setMake(v); setModel(""); }}
        options={makeOptions}
        placeholder="Make"
        variant="bar"
        className="flex-1 min-w-0 border-r border-gray-200"
      />
      <AnimatedSelect
        value={model}
        onChange={v => setModel(v)}
        options={modelOptions}
        placeholder="Models"
        disabled={!make}
        variant="bar"
        className="flex-1 min-w-0 border-r border-gray-200"
      />
      <AnimatedSelect
        value={year}
        onChange={v => setYear(v)}
        options={yearOptions}
        placeholder="Year"
        variant="bar"
        className="flex-1 min-w-0"
      />
      <button onClick={handleSearch}
        className="flex items-center gap-2 px-6 rounded-r-lg font-display font-bold text-sm text-white flex-shrink-0 transition-opacity hover:opacity-90"
        style={{ background: "#1A3C6E" }}>
        <Search className="w-4 h-4" />
        Results
      </button>
    </div>
  );
}

export default function Catalog() {
  const { t, isRTL } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "uninspected" ? "uninspected" : "inspected";
  const [search, setSearch] = useState(() => {
    // Pre-fill from URL ?q= param (from landing page search or brand click)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("q") || "";
    }
    return "";
  });
  const [currency, setCurrency] = useState("USD");
  const [fuelFilter, setFuelFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [accidentFilter, setAccidentFilter] = useState<"all" | "clean" | "accident">("all");

  const FUEL_OPTIONS = [{ value: "All", label: t("catalog_all_fuel") }, "Petrol", "Diesel", "Hybrid", "Electric"].map(
    (f) => typeof f === "string" ? { value: f, label: f } : f
  );
  const SORT_OPTIONS = [
    { value: "newest", label: t("catalog_newest") },
    { value: "price_asc", label: t("catalog_price_asc") },
    { value: "price_desc", label: t("catalog_price_desc") },
    { value: "rating", label: t("catalog_highest_rated") },
    { value: "mileage", label: t("catalog_lowest_mileage") },
  ];

  const [catalogData, setCatalogData] = useState<CatalogEntry[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(isSupabaseEnabled);

  useEffect(() => {
    if (!isSupabaseEnabled) {
      setCatalogLoading(false);
      return;
    }
    getCatalogVehicles().then((data) => {
      setCatalogData(data);
      setCatalogLoading(false);
    });
  }, []);

  // Map to the shape the rest of the component expects
  const inspected = isSupabaseEnabled
    ? catalogData.map(({ vehicle, inspection, certificate, photo }) => ({
        vehicle,
        inspection,
        cert: certificate,
        photo: photo ? { ...photo, storage_url: photo.storage_url ?? photo.thumbnail_url ?? null } : null,
      }))
    : getInspectedVehicles();

  const uninspected = isSupabaseEnabled ? [] : getUninspectedVehicles();

  const filteredInspected = useMemo(() => {
    let list = inspected.filter(({ vehicle, inspection }) => {
      if (!vehicle || !inspection) return false;
      const term = search.toLowerCase();
      return (!term || vehicle.make.toLowerCase().includes(term) || vehicle.model.toLowerCase().includes(term) || vehicle.vin.toLowerCase().includes(term) || String(vehicle.year).includes(term) || vehicle.color.toLowerCase().includes(term)) &&
        (fuelFilter === "All" || vehicle.fuel_type === fuelFilter) &&
        (accidentFilter === "all" || (accidentFilter === "clean" && !inspection.accident_status) || (accidentFilter === "accident" && inspection.accident_status));
    });
    list.sort((a, b) => {
      if (!a.vehicle || !b.vehicle || !a.inspection || !b.inspection) return 0;
      if (sortBy === "price_asc") return a.vehicle.price_usd - b.vehicle.price_usd;
      if (sortBy === "price_desc") return b.vehicle.price_usd - a.vehicle.price_usd;
      if (sortBy === "rating") return b.inspection.overall_rating - a.inspection.overall_rating;
      if (sortBy === "mileage") return a.inspection.mileage - b.inspection.mileage;
      return new Date(b.inspection.submitted_at).getTime() - new Date(a.inspection.submitted_at).getTime();
    });
    return list;
  }, [inspected, search, fuelFilter, sortBy, accidentFilter]);

  const filteredUninspected = useMemo(() =>
    uninspected.filter(({ vehicle }) => {
      if (!vehicle) return false;
      const term = search.toLowerCase();
      return !term || vehicle.make.toLowerCase().includes(term) || vehicle.model.toLowerCase().includes(term) || String(vehicle.year).includes(term);
    }),
    [uninspected, search]);

  const selectCls = "h-9 rounded border border-border bg-card px-3 text-xs font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />
      <div className="bg-card border-b border-border">
        <div className="container py-5">
          <h1 className="font-display font-bold text-xl text-foreground">{t("catalog_title")}</h1>
          <p className="font-body text-xs text-muted-foreground mt-0.5">{t("catalog_subtitle")}</p>
        </div>
      </div>

      <div className="container py-5 space-y-4 page-fade">
        {/* Loading */}
        {catalogLoading && (
          <div className="py-16 text-center text-sm text-muted-foreground font-body animate-pulse">
            Loading vehicles...
          </div>
        )}

        {/* Main content — hidden while loading */}
        {!catalogLoading && <>
        <div className="flex border border-border rounded-lg overflow-hidden w-fit">
          <button onClick={() => setSearchParams({})}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-body font-medium transition-colors ${activeTab === "inspected" ? "bg-primary text-white" : "bg-card text-muted-foreground hover:text-foreground"}`}>
            <CheckCircle className="w-3.5 h-3.5" /> {t("catalog_certified")} ({inspected.length})
          </button>
          <button onClick={() => setSearchParams({ tab: "uninspected" })}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-body font-medium transition-colors border-l border-border ${activeTab === "uninspected" ? "bg-primary text-white" : "bg-card text-muted-foreground hover:text-foreground"}`}>
            <Clock className="w-3.5 h-3.5" /> {t("catalog_pending")} ({uninspected.length})
          </button>
        </div>

        {/* ── Make/Model/Year search bar ── */}
        <CatalogSearch onSearch={(q) => setSearch(q)} />

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input type="text" placeholder={t("catalog_search_placeholder")} value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded border border-border bg-card pl-9 pr-4 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          {activeTab === "inspected" && (<>
            <AnimatedSelect
              value={accidentFilter}
              onChange={(v) => setAccidentFilter(v as typeof accidentFilter)}
              options={[
                { value: "all", label: t("catalog_all_status") },
                { value: "clean", label: t("catalog_clean_only") },
                { value: "accident", label: t("catalog_accident_disclosed") },
              ]}
              variant="filter"
              className="min-w-[140px]"
            />
            <AnimatedSelect
              value={fuelFilter}
              onChange={setFuelFilter}
              options={FUEL_OPTIONS}
              variant="filter"
              className="min-w-[120px]"
            />
            <AnimatedSelect
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
              variant="filter"
              className="min-w-[140px]"
            />
          </>)}
          <AnimatedSelect
            value={currency}
            onChange={setCurrency}
            options={CURRENCY_OPTIONS.map(c => ({ value: c.code, label: c.label }))}
            variant="filter"
            className="min-w-[120px]"
          />
        </div>

        {/* Inspected */}
        {activeTab === "inspected" && (<>
          <p className="text-xs text-muted-foreground font-body">
            {filteredInspected.length} {filteredInspected.length !== 1 ? t("catalog_vehicles_found") : t("catalog_vehicle")}
          </p>
          {filteredInspected.length === 0
            ? <div className="py-16 text-center text-sm text-muted-foreground font-body">{t("catalog_no_match")}</div>
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredInspected.map(({ vehicle, inspection, cert, photo }, idx) => {
                  if (!vehicle || !inspection || !cert) return null;
                  return (
                    <Link key={cert.id} to={cert.public_url}
                      className="card-enter group bg-card border border-border rounded-lg overflow-hidden hover:shadow-xl hover:border-[#E8A830]/40 hover:-translate-y-1 transition-all duration-300"
                      style={{ animationDelay: `${idx * 60}ms` }}>
                      <div className="relative h-48 bg-muted overflow-hidden">
                        {photo?.storage_url
                          ? <img src={photo.storage_url} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          : <div className="w-full h-full flex items-center justify-center bg-muted"><span className="text-muted-foreground text-xs">{t("catalog_no_photo")}</span></div>}
                        {/* Accident / clean badge */}
                        <div className="absolute top-2 left-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono-data font-bold tracking-wide shadow-sm backdrop-blur-sm ${inspection.accident_status ? "bg-red-600/80 text-white" : "bg-emerald-600/80 text-white"}`}>
                            {inspection.accident_status ? t("accident_recorded") : t("accident_free")}
                          </span>
                        </div>
                        {/* Inspected badge top-right */}
                        <div className="absolute top-2 right-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono-data font-bold tracking-wide shadow-sm backdrop-blur-sm"
                            style={{ background: "rgba(13,31,60,0.75)", color: "#E8A830", border: "1px solid rgba(232,168,48,0.5)" }}>
                            {t("badge_inspected")}
                          </span>
                        </div>
                        {/* Price bottom right */}
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-0.5">
                          <span className="font-mono-data text-xs text-white font-semibold">{formatPrice(vehicle.price_usd, currency)}</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display font-semibold text-sm text-foreground leading-tight">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                            <p className="font-body text-[11px] text-muted-foreground mt-0.5">{vehicle.trim} · {vehicle.fuel_type} · {vehicle.drivetrain}</p>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <Star className="w-3 h-3 fill-[#E8A830] text-[#E8A830]" />
                            <span className="font-mono-data text-xs font-bold text-foreground">{inspection.overall_rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                          <span className="font-mono-data text-[10px] text-muted-foreground">{inspection.mileage.toLocaleString()} km</span>
                          <span className="font-mono-data text-[10px] text-muted-foreground">{cert.certificate_uid}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
        </>)}

        {/* Uninspected */}
        {activeTab === "uninspected" && (<>
          <div className="bg-[#E8A830]/10 border border-[#E8A830]/30 rounded-lg px-4 py-3 flex items-start gap-3">
            <Clock className="w-4 h-4 text-[#E8A830] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-xs font-semibold text-foreground">{t("catalog_pending_notice")}</p>
              <p className="font-body text-xs text-muted-foreground mt-0.5">{t("catalog_pending_desc")}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-body">{filteredUninspected.length} {t("catalog_pending_count")}</p>
          {filteredUninspected.length === 0
            ? <div className="py-16 text-center text-sm text-muted-foreground font-body">{t("catalog_no_pending")}</div>
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredUninspected.map(({ vehicle, photo }) => {
                  if (!vehicle) return null;
                  return (
                    <div key={vehicle.id} className="bg-card border border-border rounded-lg overflow-hidden opacity-90">
                      <div className="relative h-48 bg-muted overflow-hidden">
                        {photo?.storage_url
                          ? <img src={photo.storage_url} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover grayscale" loading="lazy" />
                          : <div className="w-full h-full flex items-center justify-center bg-muted"><span className="text-muted-foreground text-xs">{t("catalog_no_photo")}</span></div>}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="bg-black/60 text-white text-xs font-body px-3 py-1 rounded-full flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> {t("catalog_pending_badge")}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded px-2 py-0.5">
                          <span className="font-mono-data text-xs text-white font-semibold">{formatPrice(vehicle.price_usd, currency)}</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-display font-semibold text-sm text-foreground leading-tight">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                        <p className="font-body text-[11px] text-muted-foreground mt-0.5">{vehicle.trim} · {vehicle.fuel_type} · {vehicle.drivetrain}</p>
                        <div className="mt-3 pt-3 border-t border-border">
                          <a href="https://wa.me/821012345678" target="_blank" rel="noopener noreferrer"
                            className="block text-center text-xs font-body font-medium text-primary hover:text-primary/80 transition-colors">
                            {t("catalog_reserve")}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </>)}
        </>}
      </div>
    </div>
  );
}
