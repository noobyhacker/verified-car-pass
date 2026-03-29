import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { getTrendingVehicles, getInspectedVehicles, formatPrice, currencyRates } from "@/data/mockData";
import { Shield, Globe, FileCheck, ChevronRight, ChevronDown, Star, TrendingUp, ChevronLeft, Search, Car, Bus, Truck } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { carDatabase } from "@/data/carDatabase";
import { AnimatedSelect } from "@/components/AnimatedSelect";

const CURRENCY_OPTIONS = Object.entries(currencyRates).map(([code, data]) => ({
  code, label: `${code} — ${data.label}`,
}));

const HERO_SLIDES = [
  { img: "/hero-2.png", position: "center 20%" },
  { img: "/hero-1.png", position: "center 30%" },
];

const VEHICLE_TYPES = [
  { label: "All",       icon: Car,   value: "all" },
  { label: "Sedan",     icon: Car,   value: "Sedan" },
  { label: "SUV",       icon: Car,   value: "SUV" },
  { label: "MPV / Van", icon: Bus,   value: "Van" },
  { label: "Truck",     icon: Truck, value: "Truck" },
];

const ALL_BRANDS: { make: string; logo: string }[] = [
  { make: "Hyundai",       logo: "/brand-logos/hyundai.svg" },
  { make: "Kia",           logo: "/brand-logos/kia.svg" },
  { make: "Ssangyong",     logo: "/brand-logos/kgm.svg" },
  { make: "Genesis",       logo: "/brand-logos/genesis.svg" },
  { make: "BMW",           logo: "/brand-logos/bmw.svg" },
  { make: "Mercedes-Benz", logo: "/brand-logos/mercedes.svg" },
  { make: "Audi",          logo: "/brand-logos/audi.svg" },
  { make: "Volkswagen",    logo: "/brand-logos/volkswagen.svg" },
  { make: "Toyota",        logo: "/brand-logos/toyota.svg" },
  { make: "Honda",         logo: "/brand-logos/honda.svg" },
  { make: "Nissan",        logo: "/brand-logos/nissan.svg" },
  { make: "Mazda",         logo: "/brand-logos/mazda.svg" },
  { make: "Mitsubishi",    logo: "/brand-logos/mitsubishi.svg" },
  { make: "Chevrolet",     logo: "/brand-logos/chevrolet.svg" },
  { make: "Ford",          logo: "/brand-logos/ford.svg" },
  { make: "Jeep",          logo: "/brand-logos/jeep.svg" },
  { make: "Volvo",         logo: "/brand-logos/volvo.svg" },
  { make: "Lexus",         logo: "/brand-logos/lexus.svg" },
  { make: "Porsche",       logo: "/brand-logos/porsche.svg" },
  { make: "Land Rover",    logo: "/brand-logos/land_rover.svg" },
];

function BrandLogo({ make, logoPath }: { make: string; logoPath?: string }) {
  const [failed, setFailed] = useState(false);
  if (!logoPath || failed) {
    return (
      <span className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: "#f1f5f9", color: "#1e293b" }}>
        {make[0]}
      </span>
    );
  }
  return (
    <img src={logoPath} alt={make} className="w-10 h-10 object-contain"
      onError={() => setFailed(true)} />
  );
}

// ── Hero search bar ──────────────────────────────────────────────────────────
function HeroSearch() {
  const navigate = useNavigate();
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
    const params = new URLSearchParams();
    const q = [make, model, year].filter(Boolean).join(" ");
    if (q) params.set("q", q);
    navigate(`/catalog?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-stretch bg-white rounded-lg overflow-visible"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 1px 6px rgba(0,0,0,0.10)", border: "1.5px solid #d0d7e3" }}>
        {/* Make */}
        <AnimatedSelect
          value={make}
          onChange={v => { setMake(v); setModel(""); }}
          options={makeOptions}
          placeholder="Make"
          variant="bar"
          className="flex-1 min-w-0 border-r border-gray-200"
        />
        {/* Model */}
        <AnimatedSelect
          value={model}
          onChange={v => setModel(v)}
          options={modelOptions}
          placeholder="Models"
          disabled={!make}
          variant="bar"
          className="flex-1 min-w-0 border-r border-gray-200"
        />
        {/* Year */}
        <AnimatedSelect
          value={year}
          onChange={v => setYear(v)}
          options={yearOptions}
          placeholder="Year"
          variant="bar"
          className="flex-1 min-w-0"
        />
        {/* Button */}
        <button onClick={handleSearch}
          className="flex items-center gap-2 px-6 rounded-r-lg font-display font-bold text-sm text-white flex-shrink-0 transition-opacity hover:opacity-90"
          style={{ background: "#0a1628" }}>
          <Search className="w-4 h-4" />
          Results
        </button>
      </div>
    </div>
  );
}

// ── Hero carousel ────────────────────────────────────────────────────────────
function HeroCarousel({ t, isRTL }: { t: (k: string) => string; isRTL: boolean }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const go = useCallback((next: number) => {
    if (fading) return;
    setFading(true);
    setTimeout(() => { setCurrent(next); setFading(false); }, 450);
  }, [fading]);

  const prev = () => go((current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const next = useCallback(() => go((current + 1) % HERO_SLIDES.length), [current, go]);

  useEffect(() => {
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [next]);

  const slide = HERO_SLIDES[current];

  return (
    <section className="relative overflow-hidden" style={{ height: "calc(100vh - 88px)", minHeight: 520, maxHeight: 780 }}>
      {/* Slide image */}
      <div className="absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundImage: `url(${slide.img})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          opacity: fading ? 0 : 1,
        }} />

      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(6,16,31,0.45) 0%, rgba(6,16,31,0.62) 60%, rgba(6,16,31,0.82) 100%)" }} />



      {/* Content — centered like River */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pb-8 pt-8"
        dir={isRTL ? "rtl" : "ltr"}>

        {/* Company tag */}
        <p className="hero-tag font-body text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.75)" }}>
          SS Trading Korea
        </p>
        <p className="hero-sub font-body text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
          Korean Used Car Exporting Company
        </p>

        {/* Main headline */}
        <h1 className="hero-h1 font-display font-bold mb-6" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>
          <span className="block text-white" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
            {t("hero_h1_1")}
          </span>
          <span className="block" style={{ color: "#E8A830", textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
            {t("hero_h1_2")}
          </span>
        </h1>

        {/* Sub CTAs */}
        <div className="hero-ctas flex gap-3 mt-6">
          <Link to="/catalog"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded font-display font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: "#E8A830", color: "#0d2347" }}>
            {t("hero_cta_catalog")} <ChevronRight className="w-4 h-4" />
          </Link>
          <a href="https://wa.me/821027058645" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded font-body text-sm text-white transition-colors hover:bg-white/20"
            style={{ border: "1.5px solid rgba(255,255,255,0.45)" }}>
            WhatsApp Us
          </a>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none select-none"
        style={{ animation: "scrollHint 2.4s ease-in-out infinite" }}>
        <span className="text-white/50 text-[10px] font-body tracking-widest uppercase">Scroll</span>
        <ChevronDown className="w-4 h-4 text-white/40" />
      </div>

      {/* Arrow controls */}
      {(["prev", "next"] as const).map((dir) => (
        <button key={dir} onClick={dir === "prev" ? prev : next}
          className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all hover:scale-110"
          style={{
            [dir === "prev" ? "left" : "right"]: 12,
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.35)",
            backdropFilter: "blur(4px)",
          }}>
          {dir === "prev"
            ? <ChevronLeft className="w-5 h-5 text-white" />
            : <ChevronRight className="w-5 h-5 text-white" />}
        </button>
      ))}

      {/* Dot indicators — no numbers */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {HERO_SLIDES.map((_, i) => (
          <button key={i} onClick={() => go(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 28 : 8,
              height: 8,
              background: i === current ? "#E8A830" : "rgba(255,255,255,0.35)",
              boxShadow: i === current ? "0 0 8px rgba(232,168,48,0.5)" : "none",
            }} />
        ))}
      </div>
    </section>
  );
}

// ── Vehicle type filter bar ──────────────────────────────────────────────────
// ── Main page ────────────────────────────────────────────────────────────────
export default function Landing() {
  const { t, isRTL } = useLanguage();
  const [currency, setCurrency] = useState("USD");
  const [vehicleType, setVehicleType] = useState("all");
  const trending = getTrendingVehicles();
  const allInspected = getInspectedVehicles();

  const stockCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allInspected.forEach(({ vehicle }) => {
      if (vehicle) counts[vehicle.make] = (counts[vehicle.make] || 0) + 1;
    });
    return counts;
  }, [allInspected]);

  const filteredTrending = useMemo(() =>
    trending.filter(({ vehicle }) => {
      if (!vehicle) return false;
      if (vehicleType === "all") return true;
      // Simple type matching on fuel/drivetrain/model name heuristics
      const name = `${vehicle.model} ${vehicle.trim || ""}`.toLowerCase();
      if (vehicleType === "SUV") return name.includes("suv") || ["tucson","sportage","santa fe","palisade","sorento","rexton","ev6","ioniq 5","kona","seltos","telluride"].some(s => name.includes(s));
      if (vehicleType === "Sedan") return ["sonata","elantra","stinger","k5","grandeur","genesis g80"].some(s => name.includes(s));
      if (vehicleType === "Van") return name.includes("carnival") || name.includes("staria") || name.includes("van");
      return true;
    }),
    [trending, vehicleType]
  );

  return (
    <div className="min-h-screen" style={{background:"#eef0f3"}} dir={isRTL ? "rtl" : "ltr"}>
      <style>{`
        @keyframes scrollHint   { 0%,100%{transform:translateY(0);opacity:.45} 50%{transform:translateY(8px);opacity:1} }
        @keyframes fadeUp       { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
        @keyframes slideInLeft  { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes scaleIn      { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes countUp      { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .hero-tag  { animation: fadeIn 0.8s 0.05s cubic-bezier(.22,1,.36,1) both; }
        .hero-sub  { animation: fadeIn 0.8s 0.2s  cubic-bezier(.22,1,.36,1) both; }
        .hero-h1   { animation: fadeUp 0.9s 0.15s cubic-bezier(.22,1,.36,1) both; }
        .hero-ctas { animation: fadeUp 0.9s 0.35s cubic-bezier(.22,1,.36,1) both; }
        .stat-item { animation: countUp 0.7s ease both; }
        .brand-card { transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; }
        .brand-card:hover { background: #EBF0FF; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(13,35,71,0.10); }
        .trend-card { animation: scaleIn 0.55s cubic-bezier(.22,1,.36,1) both; }
        .section-fade { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) both; }
        .type-btn { transition: background 0.18s, color 0.18s, box-shadow 0.18s; }
        .type-btn:hover:not(.active) { background: rgba(13,35,71,0.07); }
        .type-btn.active { box-shadow: 0 2px 8px rgba(13,35,71,0.25); }
      `}</style>
      <Navbar />
      <HeroCarousel t={t} isRTL={isRTL} />

      {/* ── Stats bar ── */}
      <div style={{ background: "linear-gradient(135deg, #06101f 0%, #0b1e3a 100%)" }}>
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/10">
            {[
              { label: t("stat_exported"),      value: "1,240+" },
              { label: t("stat_countries"),     value: "22" },
              { label: t("stat_rating"),        value: "4.6/5" },
              { label: t("stat_accident_free"), value: "87%" },
            ].map((s) => (
              <div key={s.label} className="text-center py-5 px-4">
                <p className="font-display font-bold text-xl" style={{ color: "#E8A830" }}>{s.value}</p>
                <p className="font-body text-xs text-white/65 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search by make grid ── */}
      <section className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
        <div className="bg-white rounded-xl overflow-hidden" style={{border:"2px solid #b0b8c8", boxShadow:"0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)"}}>
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-400">
            <h2 className="font-display font-bold text-base text-gray-900">
              {t("search_by_makes") || "Search By Makes"}
            </h2>
            <Link to="/catalog"
              className="text-xs font-body font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: "#0d2347" }}>
              View all Makes →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 divide-x divide-y divide-gray-300">
            {ALL_BRANDS.map(({ make, logo }) => {
              const count = stockCounts[make] ?? 0;
              return (
                <Link key={make} to={`/catalog?q=${encodeURIComponent(make)}`}
                  className="brand-card flex items-center gap-3 px-5 py-4 group">
                  <BrandLogo make={make} logoPath={logo} />
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm text-gray-800 truncate group-hover:text-blue-900">
                      {make}
                    </p>
                    <p className="text-[11px] font-body text-gray-400 mt-0.5">
                      {count > 0 ? `${count} in stock` : "On request"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Search bar — under brand grid ── */}
      <div className="bg-white py-8">
        <div className="container">
          <HeroSearch />
        </div>
      </div>

      {/* ── Vehicle type filter — just above trending ── */}
      <div className="container pt-10 pb-3" dir={isRTL ? "rtl" : "ltr"}>
        <div className="bg-white rounded-xl overflow-hidden" style={{border:"2px solid #b0b8c8", boxShadow:"0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)"}}>
          <div className="flex items-center gap-1 overflow-x-auto px-2 py-1 no-scrollbar">
            {VEHICLE_TYPES.map(({ label, icon: Icon, value }) => (
              <button key={value} onClick={() => setVehicleType(value)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all flex-shrink-0 text-sm font-body font-semibold ${
                  vehicleType === value ? "text-white" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
                style={vehicleType === value ? { background: "#0d2347" } : {}}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Trending vehicles ── */}
      <section className="container pb-12" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: "#E8A830" }} />
            <h2 className="font-display font-bold text-lg text-gray-900">{t("trending_title")}</h2>
          </div>
          <div className="flex items-center gap-3">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="h-8 rounded border border-gray-200 bg-white px-2 text-xs font-mono-data text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary">
              {CURRENCY_OPTIONS.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
            <Link to="/catalog" className="text-xs font-body font-semibold flex items-center gap-1"
              style={{ color: "#0d2347" }}>
              {t("view_all")} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {filteredTrending.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400 font-body">{t("catalog_no_match")}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTrending.map(({ vehicle, inspection, cert, photo }, idx) => {
              if (!vehicle || !inspection || !cert) return null;
              return (
                <Link key={cert.public_url} to={cert.public_url}
                  className="trend-card group bg-white rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{border:"2px solid #b0b8c8"}}
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}>
                  <div className="relative h-44 bg-gray-100 overflow-hidden">
                    {photo?.storage_url
                      ? <img src={photo.storage_url} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-8 h-8 text-gray-300" />
                        </div>}
                    {/* Accident badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono-data font-bold tracking-wide ${inspection.accident_status ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
                        {inspection.accident_status ? t("accident_recorded") : t("accident_free")}
                      </span>
                    </div>
                    {/* Price badge */}
                    <div className="absolute bottom-2 right-2 rounded px-2 py-0.5"
                      style={{ background: "rgba(26,60,110,0.85)", backdropFilter: "blur(4px)" }}>
                      <span className="font-mono-data text-xs text-white font-semibold">
                        {formatPrice(vehicle.price_usd, currency)}
                      </span>
                    </div>
                    {/* HOT tag */}
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono-data font-bold"
                        style={{ background: "linear-gradient(135deg,#E8A830,#ff6b35)", color: "#fff" }}>
                        {t("badge_hot")}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-display font-semibold text-sm text-gray-900 leading-tight">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="font-body text-[11px] text-gray-400 mt-0.5">
                      {vehicle.trim} · {vehicle.fuel_type} · {vehicle.drivetrain}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-gray-300">
                      <span className="font-mono-data text-[11px] text-gray-400">
                        {inspection.mileage.toLocaleString()} km
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[#E8A830] text-[#E8A830]" />
                        <span className="font-mono-data text-xs font-bold text-gray-700">{inspection.overall_rating}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Trust pillars ── */}
      <section className="py-12" style={{background:"#fff", borderTop:"2px solid #b8bfcc"}} dir={isRTL ? "rtl" : "ltr"}>
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: Shield,    titleKey: "trust_1_title", bodyKey: "trust_1_body" },
              { icon: Globe,     titleKey: "trust_2_title", bodyKey: "trust_2_body" },
              { icon: FileCheck, titleKey: "trust_3_title", bodyKey: "trust_3_body" },
            ].map(({ icon: Icon, titleKey, bodyKey }) => (
              <div key={titleKey} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(26,60,110,0.08)" }}>
                  <Icon className="w-5 h-5" style={{ color: "#0d2347" }} />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm text-gray-900 mb-1">{t(titleKey)}</p>
                  <p className="font-body text-xs text-gray-500 leading-relaxed">{t(bodyKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-12" style={{background:"#eef0f3", borderTop:"2px solid #b8bfcc"}} dir={isRTL ? "rtl" : "ltr"}>
        <div className="container">
          <h2 className="font-display font-bold text-lg text-gray-900 text-center mb-8">{t("how_title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "01", titleKey: "step_01_title", bodyKey: "step_01_body" },
              { step: "02", titleKey: "step_02_title", bodyKey: "step_02_body" },
              { step: "03", titleKey: "step_03_title", bodyKey: "step_03_body" },
              { step: "04", titleKey: "step_04_title", bodyKey: "step_04_body" },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-xl p-5" style={{border:"2px solid #b0b8c8", boxShadow:"0 2px 6px rgba(0,0,0,0.07)"}}
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <p className="font-mono-data text-3xl font-bold mb-3" style={{ color: "#E8A830" }}>{s.step}</p>
                <p className="font-display font-semibold text-sm text-gray-900 mb-1">{t(s.titleKey)}</p>
                <p className="font-body text-xs text-gray-500 leading-relaxed">{t(s.bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-12 text-center" style={{ background: "#0d2347" }} dir={isRTL ? "rtl" : "ltr"}>
        <div className="container">
          <h2 className="font-display font-bold text-xl text-white mb-2">{t("cta_title")}</h2>
          <p className="font-body text-sm mb-6 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.7)" }}>
            {t("cta_body")}
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded font-display font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: "#E8A830", color: "#0d2347" }}>
              {t("cta_catalog")} <ChevronRight className="w-4 h-4" />
            </Link>
            <a href="https://wa.me/821027058645" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded font-body text-sm text-white transition-colors hover:bg-white/10 border border-white/30">
              {t("cta_whatsapp")}
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white py-6" style={{borderTop:"2px solid #b0b8c8"}} dir={isRTL ? "rtl" : "ltr"}>
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-display font-bold text-sm" style={{ color: "#0d2347" }}>SS Trading Korea</p>
          <p className="font-body text-xs text-gray-400">{t("footer_rights")}</p>
          <div className="flex gap-4">
            <Link to="/catalog" className="font-body text-xs text-gray-400 hover:text-gray-700">{t("nav_catalog")}</Link>
            <Link to="/contact" className="font-body text-xs text-gray-400 hover:text-gray-700">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
