import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { vehicles as mockVehicles, inspections as mockInspections, certificates as mockCertificates } from "@/data/mockData";
import { vehicleOptions } from "@/data/vehicleOptions";
import { useLanguage } from "@/i18n/LanguageContext";
import { Plus, Save, Camera, Trash2, CheckCircle, Search, Video, Image, ChevronDown, ChevronUp, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { carDatabase, carMakes, getDefaultSpecs, type CarModel } from "@/data/carDatabase";
import { submitInspection } from "@/lib/queries";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { CatalogEntry } from "@/lib/types";

const zones = ["front", "rear", "left", "right", "roof", "underbody"] as const;

interface MediaFile {
  id: string; file: File; previewUrl: string; type: "image" | "video";
}

type ConditionValue = "good" | "bad" | "replace";
type LeakValue = "없음" | "미세누유" | "누유";
type PanelState = "normal" | "repaired" | "replaced";

// ── Leak-grade items (3-state: 없음 / 미세누유 / 누유) ──
const LEAK_ITEMS = [
  { ko: "엔진 오일 누유",        en: "Engine Oil Leak",           section: "engine" },
  { ko: "냉각수 누수",           en: "Coolant Leak",              section: "engine" },
  { ko: "자동변속기 오일 누유",  en: "Auto Transmission Oil Leak", section: "transmission" },
  { ko: "수동변속기 오일 누유",  en: "Manual Gearbox Oil Leak",   section: "transmission" },
  { ko: "파워스티어링 오일 누유",en: "Power Steering Oil Leak",   section: "steering" },
  { ko: "브레이크 오일 누유",    en: "Brake Fluid Leak",          section: "brakes" },
  { ko: "연료 누출",             en: "Fuel Leak",                 section: "fuel" },
] as const;

// ── Standard good/bad/replace items ──
const CONDITION_ITEMS = [
  // Engine
  { ko: "원동기 작동상태",       en: "Engine Operation",          section: "engine" },
  { ko: "실린더 헤드 가스켓",    en: "Cylinder Head Gasket",      section: "engine" },
  // Transmission
  { ko: "클러치 어셈블리",       en: "Clutch Assembly",           section: "transmission" },
  { ko: "변속기 작동상태",       en: "Transmission Shift Quality",section: "transmission" },
  // Driveline
  { ko: "등속조인트",            en: "CV Joint",                  section: "driveline" },
  { ko: "등속조인트 부트",       en: "CV Joint Boot",             section: "driveline" },
  { ko: "추진축 및 베어링",      en: "Driveshaft & Bearing",      section: "driveline" },
  // Steering
  { ko: "조향 기어박스",         en: "Steering Gearbox",          section: "steering" },
  { ko: "스티어링 유격",         en: "Steering Play",             section: "steering" },
  // Brakes
  { ko: "브레이크 패드",         en: "Brake Pads",                section: "brakes" },
  { ko: "브레이크 디스크/드럼",  en: "Brake Disc / Drum",         section: "brakes" },
  { ko: "ABS 경고등",            en: "ABS Warning Light",         section: "brakes" },
  // Electrical
  { ko: "발전기 출력",           en: "Alternator Output",         section: "electrical" },
  { ko: "시동 모터",             en: "Starter Motor",             section: "electrical" },
  { ko: "와이퍼 작동",           en: "Wiper Function",            section: "electrical" },
  { ko: "실내등/전조등",         en: "Interior & Headlights",     section: "electrical" },
  { ko: "에어백",                en: "Airbag System",             section: "electrical" },
  // Fuel / Exhaust
  { ko: "LPG 봄베/배관",         en: "LPG Tank & Lines",          section: "fuel" },
  { ko: "에어컨",                en: "Air Conditioning",          section: "comfort" },
  { ko: "배기 소음",             en: "Exhaust Noise",             section: "exhaust" },
  // Tyres
  { ko: "타이어",                en: "Tires",                     section: "tyres" },
] as const;

const CONDITION_SECTIONS: Record<string, string> = {
  engine: "원동기 · Engine",
  transmission: "변속기 · Transmission",
  driveline: "동력전달 · Driveline",
  steering: "조향 · Steering",
  brakes: "제동 · Brakes",
  electrical: "전기 · Electrical",
  fuel: "연료 · Fuel",
  exhaust: "배기 · Exhaust",
  comfort: "편의 · Comfort",
  tyres: "타이어 · Tyres",
};

// Official Korean 성능점검기록부 panel numbering (별지 제82호서식)
// Outer panels: 1-10 (교환해도 사고차 아님), Structural: 11-19 (교환시 사고차)
const BODY_PANELS = [
  { id: "hood",       no: "1",  label: "후드",          labelEn: "Hood" },
  { id: "front_fender_l", no: "2", label: "프론트휀더(좌)", labelEn: "Front Fender L" },
  { id: "front_fender_r", no: "3", label: "프론트휀더(우)", labelEn: "Front Fender R" },
  { id: "door_fl",    no: "4",  label: "도어(좌전)",     labelEn: "Door FL" },
  { id: "door_rl",    no: "5",  label: "도어(좌후)",     labelEn: "Door RL" },
  { id: "door_fr",    no: "6",  label: "도어(우전)",     labelEn: "Door FR" },
  { id: "door_rr",    no: "7",  label: "도어(우후)",     labelEn: "Door RR" },
  { id: "trunk_lid",  no: "8",  label: "트렁크리드",     labelEn: "Trunk Lid" },
  { id: "rear_fender_l", no: "9", label: "리어휀더(좌)", labelEn: "Rear Fender L" },
  { id: "rear_fender_r", no: "10", label: "리어휀더(우)", labelEn: "Rear Fender R" },
  // Structural parts below — exchange = accident
  { id: "front_panel", no: "11", label: "프론트패널",    labelEn: "Front Panel" },
  { id: "cross_member", no: "12", label: "크로스멤버",   labelEn: "Cross Member" },
  { id: "ins_panel_l", no: "13", label: "인사이드패널(좌)", labelEn: "Inside Panel L" },
  { id: "ins_panel_r", no: "14", label: "인사이드패널(우)", labelEn: "Inside Panel R" },
  { id: "rear_panel",  no: "15", label: "리어패널",      labelEn: "Rear Panel" },
  { id: "trunk_floor", no: "16", label: "트렁크플로어",  labelEn: "Trunk Floor" },
  { id: "roof_panel",  no: "17", label: "루프패널",      labelEn: "Roof Panel" },
  { id: "quarter_l",   no: "18", label: "쿼터패널(좌)",  labelEn: "Quarter Panel L" },
  { id: "quarter_r",   no: "19", label: "쿼터패널(우)",  labelEn: "Quarter Panel R" },
];

const PANEL_CYCLE: PanelState[] = ["normal", "repaired", "replaced"];
const PANEL_COLOR: Record<PanelState, string> = {
  normal: "#10b981",
  repaired: "#f59e0b",
  replaced: "#ef4444",
};
const PANEL_LABEL: Record<PanelState, string> = {
  normal: "정상", repaired: "판금/용접", replaced: "교환",
};

const OPTION_CATEGORIES = [
  { key: "driving",  label: "Driving & Safety · 주행/안전" },
  { key: "comfort",  label: "Comfort & Convenience · 편의" },
  { key: "av",       label: "Infotainment · AV" },
  { key: "exterior", label: "Exterior & Style · 외관" },
] as const;

interface InspectionDraft {
  // Basic
  plate: string; vin: string; make: string; model: string; year: string;
  fuel_type: string; transmission: string; drivetrain: string; engine_cc: string;
  color: string; mileage: string;
  // Registration
  first_reg_date: string; vehicle_type: string; reg_region: string;
  // Odometer
  odometer_tampered: boolean; odometer_unit: "km" | "miles";
  // Usage history
  usage_rental: boolean; usage_commercial: boolean; usage_lease: boolean;
  // Accident / flood / fire
  accident_status: boolean; accident_notes: string;
  flood_engine: boolean; flood_transmission: boolean; flood_interior: boolean;
  fire_damage: boolean;
  // Tuning
  tuning_illegal: boolean; tuning_structural: boolean; tuning_notes: string;
  // Conditions (good/bad/replace)
  conditions: Record<string, ConditionValue>;
  // Leak grades (없음/미세누유/누유)
  leaks: Record<string, LeakValue>;
  // Emissions
  emission_co: string; emission_hc: string; emission_smoke: string;
  // Body
  body_condition: Record<string, { rating: number; notes: string }>;
  panel_damage: Record<string, PanelState>;
  // Media / docs
  media: MediaFile[];
  report_no: string; inspection_date: string;
  vehicle_options: Record<string, boolean>;
  // Inspector
  inspector_name: string; company_name: string; facility_reg_no: string; facility_address: string;
  signature_data_url: string; document_image_url: string;
}

const emptyDraft: InspectionDraft = {
  plate: "", vin: "", make: "", model: "", year: "", fuel_type: "",
  transmission: "", drivetrain: "", engine_cc: "", color: "", mileage: "",
  first_reg_date: "", vehicle_type: "", reg_region: "",
  odometer_tampered: false, odometer_unit: "km",
  usage_rental: false, usage_commercial: false, usage_lease: false,
  accident_status: false, accident_notes: "",
  flood_engine: false, flood_transmission: false, flood_interior: false,
  fire_damage: false,
  tuning_illegal: false, tuning_structural: false, tuning_notes: "",
  conditions: Object.fromEntries(CONDITION_ITEMS.map(({ ko }) => [ko, "good" as ConditionValue])),
  leaks: Object.fromEntries(LEAK_ITEMS.map(({ ko }) => [ko, "없음" as LeakValue])),
  emission_co: "", emission_hc: "", emission_smoke: "",
  body_condition: Object.fromEntries(zones.map((z) => [z, { rating: 5, notes: "" }])),
  panel_damage: {},
  media: [], report_no: "",
  inspection_date: new Date().toISOString().split("T")[0],
  vehicle_options: Object.fromEntries(vehicleOptions.map((o) => [o.key, false])),
  inspector_name: "", company_name: "", facility_reg_no: "", facility_address: "",
  signature_data_url: "", document_image_url: "",
};

function mockPlateLookup(plate: string) {
  const d: Record<string, Partial<InspectionDraft>> = {
    "12가3456": { vin: "KMHD84LF8NU123456", make: "Hyundai", model: "Tucson", year: "2021", fuel_type: "Petrol", transmission: "Auto", drivetrain: "2WD", engine_cc: "2000", color: "Phantom Black" },
    "34나7890": { vin: "KNDJP3A56J7234567", make: "Kia", model: "Sportage", year: "2020", fuel_type: "Diesel", transmission: "Auto", drivetrain: "AWD", engine_cc: "2200", color: "Snow White Pearl" },
    "56다1234": { vin: "5NPE24AF8JH345678", make: "Hyundai", model: "Sonata", year: "2022", fuel_type: "Hybrid", transmission: "Auto", drivetrain: "2WD", engine_cc: "1600", color: "Creamy White" },
    "78라5678": { vin: "U5YPB81AAKL456789", make: "Ssangyong", model: "Rexton", year: "2019", fuel_type: "Diesel", transmission: "Auto", drivetrain: "4WD", engine_cc: "2200", color: "Titanium Silver" },
  };
  return d[plate] || null;
}

// ─── SIGNATURE PAD ─────────────────────────────────────────────────────────

function SignaturePad({ onSave, clearLabel = "Clear" }: { onSave: (url: string) => void; clearLabel?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent, c: HTMLCanvasElement) => {
    const rect = c.getBoundingClientRect();
    const src = "touches" in e ? e.touches[0] : e;
    // Scale from CSS display size → actual canvas pixel size
    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const p = getPos(e, c);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const p = getPos(e, c);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const stop = () => {
    drawing.current = false;
    onSave(canvasRef.current!.toDataURL());
  };

  const clear = () => {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    onSave("");
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={1200}
        height={200}
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={stop}
        className="w-full rounded border border-border bg-white"
        style={{ cursor: "crosshair", touchAction: "none", height: "100px" }}
      />
      <button type="button" onClick={clear} className="text-xs text-muted-foreground underline hover:text-destructive">
        {clearLabel}
      </button>
    </div>
  );
}

// ─── AUTHENTIC KOREAN 성능점검기록부 CAR DIAGRAM ────────────────────────────

function CarDiagram({
  panelDamage, setPanelDamage, lang,
}: {
  panelDamage: Record<string, PanelState>;
  setPanelDamage: (fn: (p: Record<string, PanelState>) => Record<string, PanelState>) => void;
  lang: string;
}) {
  const cycle = (id: string) => {
    setPanelDamage((prev) => {
      const cur = prev[id] || "normal";
      const next = PANEL_CYCLE[(PANEL_CYCLE.indexOf(cur) + 1) % PANEL_CYCLE.length];
      return { ...prev, [id]: next };
    });
  };

  const damaged = Object.entries(panelDamage).filter(([, v]) => v !== "normal");

  const getLabel = (p: typeof BODY_PANELS[0]) => lang === "ko" ? p.label : p.labelEn;

  const stateColors: Record<PanelState, { bg: string; border: string; text: string; badge: string }> = {
    normal:   { bg: "#f8fafc", border: "#94a3b8", text: "#1e293b", badge: "#64748b" },
    repaired: { bg: "#fefce8", border: "#ca8a04", text: "#713f12", badge: "#d97706" },
    replaced: { bg: "#fef2f2", border: "#ef4444", text: "#7f1d1d", badge: "#ef4444" },
  };

  const stateLabel: Record<PanelState, string> = {
    normal:   lang === "ko" ? "정상"    : lang === "ar" ? "طبيعي"    : lang === "fr" ? "Normal"   : lang === "sw" ? "Kawaida"   : "Normal",
    repaired: lang === "ko" ? "판금/용접" : lang === "ar" ? "إصلاح"   : lang === "fr" ? "Réparé"   : lang === "sw" ? "Kutengenezwa" : "Repaired",
    replaced: lang === "ko" ? "교환"    : lang === "ar" ? "استبدال"  : lang === "fr" ? "Remplacé" : lang === "sw" ? "Kubadilishwa" : "Replaced",
  };

  const stateSymbol: Record<PanelState, string> = { normal: "", repaired: "W", replaced: "✕" };

  const OUTER = BODY_PANELS.filter(p => parseInt(p.no) <= 10);
  const STRUCTURAL = BODY_PANELS.filter(p => parseInt(p.no) >= 11);

  const headerLabel = {
    ko: "자동차 외관 상태 표시", en: "Vehicle Exterior Condition",
    ar: "حالة هيكل المركبة", fr: "État de la Carrosserie", sw: "Hali ya Nje ya Gari",
  }[lang] || "Vehicle Exterior Condition";

  const outerLabel = {
    ko: "외판 부위 (1–10번)", en: "Outer Panels (1–10)",
    ar: "الألواح الخارجية", fr: "Panneaux Extérieurs", sw: "Paneli za Nje",
  }[lang] || "Outer Panels (1–10)";

  const structuralLabel = {
    ko: "주요골격 (11–19번) — 교환시 사고차량", en: "Structural Parts (11–19) — Replacement = Accident",
    ar: "أجزاء هيكلية (11–19) — الاستبدال يعني حادث", fr: "Structure (11–19) — Remplacement = Accident",
    sw: "Muundo (11–19) — Kubadilisha = Ajali",
  }[lang] || "Structural Parts (11–19)";

  const clickHint = {
    ko: "패널 클릭 → 정상 → 판금 → 교환", en: "Click panel → Normal → Repaired → Replaced",
    ar: "اضغط على اللوح لتغيير الحالة", fr: "Cliquez pour changer l'état",
    sw: "Bonyeza kubadilisha hali",
  }[lang] || "Click panel to change state";

  const summaryLabel = {
    ko: "손상 패널 요약", en: "Damage Summary",
    ar: "ملخص الأضرار", fr: "Récapitulatif", sw: "Muhtasari wa Uharibifu",
  }[lang] || "Damage Summary";

  const structuralWarning = {
    ko: "※ 주요골격(11~19번) 교환·판금 이력은 사고차량으로 분류됩니다.",
    en: "※ Structural panel (11–19) repair/replacement classifies as accident vehicle.",
    ar: "※ إصلاح أو استبدال الأجزاء الهيكلية (11–19) يصنّف السيارة كمركبة متضررة.",
    fr: "※ La réparation/remplacement des éléments structurels (11–19) classe le véhicule comme accidenté.",
    sw: "※ Kutengeneza/kubadilisha sehemu za muundo (11–19) kunamaanisha gari la ajali.",
  }[lang] || "※ Structural panel repair/replacement = accident vehicle.";

  const PanelBtn = ({ p }: { p: typeof BODY_PANELS[0] }) => {
    const state = panelDamage[p.id] || "normal";
    const c = stateColors[state];
    const sym = stateSymbol[state];
    return (
      <button
        type="button"
        onClick={() => cycle(p.id)}
        className="relative flex flex-col items-start gap-1 rounded-lg border-2 p-2 text-left transition-all hover:shadow-md active:scale-95 w-full"
        style={{ background: c.bg, borderColor: c.border }}
      >
        {/* Number badge + symbol */}
        <div className="flex items-center justify-between w-full">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white leading-none flex-shrink-0"
            style={{ background: c.badge }}>
            {p.no}
          </span>
          {sym && (
            <span className="text-sm font-black leading-none" style={{ color: c.text }}>{sym}</span>
          )}
        </div>
        {/* Panel name */}
        <span className="text-[11px] font-semibold leading-tight" style={{ color: c.text }}>
          {getLabel(p)}
        </span>
        {/* State label */}
        <span className="text-[10px] font-medium leading-none" style={{ color: c.badge }}>
          {stateLabel[state]}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="border border-border rounded-lg overflow-hidden bg-white">
        {/* Header */}
        <div className="bg-slate-700 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-white text-xs font-semibold tracking-wide">{headerLabel}</span>
          <span className="text-slate-300 text-[10px]">{clickHint}</span>
        </div>

        {/* State legend */}
        <div className="flex flex-wrap items-center gap-3 px-3 py-2 border-b border-border bg-slate-50">
          {(["normal", "repaired", "replaced"] as PanelState[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded border font-bold text-[10px]"
                style={{ background: stateColors[s].bg, borderColor: stateColors[s].border, color: stateColors[s].text }}>
                {stateSymbol[s] || "·"}
              </span>
              {stateLabel[s]}
            </div>
          ))}
        </div>

        <div className="p-3 space-y-4">
          {/* ── Real diagram image with clickable hotspot overlay ── */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <svg
              viewBox="0 0 399 186"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "100%", display: "block", cursor: "crosshair" }}
            >
              {/* The actual uploaded diagram image as background */}
              <image href="/car-diagram.png" x="0" y="0" width="399" height="186" />

              {/* ── Clickable polygon hotspots — traced to actual panel shapes ── */}
              {(() => {
                // SVG viewBox: 399×186. Four quadrants:
                //   TL (left side view):  x 0–199,  y 0–93   — car faces RIGHT
                //   TR (right side view): x 200–399, y 0–93  — car faces LEFT (mirrored)
                //   BL (top-down view):   x 0–199,  y 93–186 — car faces RIGHT (hood = right)
                //   BR (undercarriage):   x 200–399, y 93–186 — car faces RIGHT (front axle = right)
                //
                // Each zone has: id, points (SVG polygon string), cx/cy (label anchor)
                type PolyZone = { id: string; points: string; cx: number; cy: number };
                const zones: PolyZone[] = [

                  // ══ TOP-LEFT: Left side view, car faces RIGHT ══
                  // Fenders and doors only — hood/trunk/roof visible from top-down, not side
                  { id: "front_fender_l", cx: 26,  cy: 63,  points: "10,58 36,62 54,58 54,72 38,80 10,72" },
                  { id: "door_fl",        cx: 78,  cy: 48,  points: "54,20 54,72 100,72 100,20" },
                  { id: "door_rl",        cx: 124, cy: 48,  points: "100,20 100,72 146,72 148,54 146,20" },
                  { id: "rear_fender_l",  cx: 158, cy: 63,  points: "146,54 148,72 164,80 182,72 182,58 162,54" },

                  // ══ TOP-RIGHT: Right side view, car faces LEFT (mirrored) ══
                  // Fenders and doors only
                  { id: "rear_fender_r",  cx: 239, cy: 63,  points: "217,58 217,72 235,80 253,72 253,58 239,54 219,54" },
                  { id: "door_rr",        cx: 272, cy: 48,  points: "253,20 251,54 299,72 299,20" },
                  { id: "door_fr",        cx: 320, cy: 48,  points: "299,20 299,72 345,72 345,20" },
                  { id: "front_fender_r", cx: 370, cy: 63,  points: "345,58 345,72 362,80 388,72 388,58 368,62" },

                  // ══ BOTTOM-LEFT: Top-down view, car faces RIGHT ══
                  // Only roof, hood, trunk visible from above
                  { id: "hood",       cx: 168, cy: 138, points: "148,118 148,158 162,166 182,158 182,118 166,112" },
                  { id: "trunk_lid",  cx: 28,  cy: 138, points: "18,118 18,158 34,166 54,158 54,118 36,112" },
                  { id: "roof_panel", cx: 99,  cy: 138, points: "54,112 54,164 148,164 148,112" },

                  // ══ BOTTOM-RIGHT: Undercarriage, car faces RIGHT (front axle = right) ══
                  // Front panel — rightmost crossbar
                  { id: "front_panel",    cx: 368, cy: 120, points: "352,112 352,128 388,128 388,112" },
                  // Cross member — just left of front panel
                  { id: "cross_member",   cx: 330, cy: 120, points: "310,112 310,128 352,128 352,112" },
                  // Inside panel L — top longitudinal rail
                  { id: "ins_panel_l",    cx: 299, cy: 107, points: "218,100 218,115 380,115 380,100" },
                  // Inside panel R — bottom longitudinal rail
                  { id: "ins_panel_r",    cx: 299, cy: 169, points: "218,162 218,177 380,177 380,162" },
                  // Trunk floor — center rear section
                  { id: "trunk_floor",    cx: 255, cy: 138, points: "218,128 218,162 292,162 292,128" },
                  // Rear panel — leftmost crossbar
                  { id: "rear_panel",     cx: 220, cy: 120, points: "210,112 210,128 252,128 252,112" },
                ];

                return zones.map((z, i) => {
                  const state = panelDamage[z.id] || "normal";
                  const c = stateColors[state];
                  const sym = stateSymbol[state];
                  return (
                    <g key={`${z.id}-${i}`} onClick={() => cycle(z.id)} style={{ cursor: "pointer" }}>
                      <polygon
                        points={z.points}
                        fill={state === "normal" ? "rgba(100,116,139,0.08)" : c.bg}
                        fillOpacity={state === "normal" ? 1 : 0.6}
                        stroke={state === "normal" ? "rgba(100,116,139,0.35)" : c.border}
                        strokeWidth={state === "normal" ? 0.6 : 1.8}
                        style={{ transition: "all 0.15s" }}
                      />
                      {state !== "normal" && (
                        <text
                          x={z.cx} y={z.cy}
                          textAnchor="middle" dominantBaseline="middle"
                          fill={c.text}
                          fontSize="7"
                          fontWeight="900"
                          fontFamily="monospace"
                        >
                          {sym}
                        </text>
                      )}
                      <title>{BODY_PANELS.find(p => p.id === z.id)?.label} — {stateLabel[state]}</title>
                    </g>
                  );
                });
              })()}
            </svg>

            {/* Caption */}
            <p className="text-center text-[10px] text-slate-400 py-1 border-t border-slate-100">
              {clickHint}
            </p>
          </div>

          {/* Outer panels grid */}
          <div>
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2 px-0.5">{outerLabel}</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {OUTER.map(p => <PanelBtn key={p.id} p={p} />)}
            </div>
          </div>

          {/* Structural panels grid */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-0.5"
              style={{ color: "#b91c1c" }}>{structuralLabel}</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STRUCTURAL.map(p => <PanelBtn key={p.id} p={p} />)}
            </div>
          </div>
        </div>

        {/* Structural warning */}
        <div className="mx-3 mb-3 px-3 py-2 rounded border bg-amber-50 border-amber-300 text-[11px] font-body text-amber-900">
          {structuralWarning}
        </div>
      </div>

      {/* Damage summary */}
      {damaged.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-slate-100 border-b border-border flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              {summaryLabel} ({damaged.length})
            </p>
            <p className="text-[10px] text-muted-foreground">
              {stateLabel.replaced}: {damaged.filter(([,v]) => v === "replaced").length} ·{" "}
              {stateLabel.repaired}: {damaged.filter(([,v]) => v === "repaired").length}
            </p>
          </div>
          <div className="divide-y divide-border">
            {damaged.map(([id, state]) => {
              const panel = BODY_PANELS.find(p => p.id === id);
              const isStructural = parseInt(panel?.no || "0") >= 11;
              const c = stateColors[state];
              return (
                <div key={id} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: c.badge }}>{panel?.no}</span>
                    <span className="text-xs font-body text-foreground">{panel ? getLabel(panel) : id}</span>
                    {isStructural && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold border"
                        style={{ background: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" }}>
                        {lang === "ko" ? "주요골격" : "Structural"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: c.badge }}>
                    {stateSymbol[state]} {stateLabel[state]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VEHICLE OPTIONS ────────────────────────────────────────────────────────

function VehicleOptionsSelector({ selected, onChange }: { selected: Record<string, boolean>; onChange: (key: string, val: boolean) => void }) {
  const { t } = useLanguage();
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(Object.fromEntries(OPTION_CATEGORIES.map((c) => [c.key, false])));
  const [search, setSearch] = useState("");
  const toggleCat = (key: string) => setOpenCats((p) => ({ ...p, [key]: !p[key] }));
  const filteredOptions = (category: string) =>
    vehicleOptions.filter((o) => o.category === category).filter((o) =>
      !search || o.label_en.toLowerCase().includes(search.toLowerCase()) || o.label_ko.includes(search));
  const selectedCount = (category: string) => vehicleOptions.filter((o) => o.category === category && selected[o.key]).length;
  const totalSelected = vehicleOptions.filter((o) => selected[o.key]).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input placeholder={t("insp_search_options")} value={search}
          onChange={(e) => { setSearch(e.target.value); if (e.target.value) setOpenCats(Object.fromEntries(OPTION_CATEGORIES.map((c) => [c.key, true]))); }}
          className="h-8 text-xs font-body bg-background border-border rounded flex-1" />
        {totalSelected > 0 && <span className="text-xs font-mono-data text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded">{totalSelected} selected</span>}
      </div>
      {OPTION_CATEGORIES.map(({ key, label }) => {
        const opts = filteredOptions(key);
        const count = selectedCount(key);
        const isOpen = openCats[key] || !!search;
        if (search && opts.length === 0) return null;
        return (
          <div key={key} className="border border-border rounded overflow-hidden">
            <button type="button" onClick={() => !search && toggleCat(key)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left">
              <span className="text-xs font-body font-semibold text-foreground">{label}</span>
              <div className="flex items-center gap-2">
                {count > 0 && <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-data font-semibold bg-primary text-primary-foreground">{count}</span>}
                {!search && (isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />)}
              </div>
            </button>
            {isOpen && (
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1">
                {opts.map((opt) => (
                  <label key={opt.key} className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors text-xs font-body ${selected[opt.key] ? "bg-success/5 border border-success/20 text-foreground" : "hover:bg-muted/40 text-muted-foreground border border-transparent"}`}>
                    <input type="checkbox" checked={!!selected[opt.key]} onChange={(e) => onChange(opt.key, e.target.checked)} className="mt-0.5 accent-primary flex-shrink-0 w-3.5 h-3.5" />
                    <div className="min-w-0">
                      <p className={selected[opt.key] ? "text-foreground font-medium" : ""}>{opt.label_en}</p>
                      <p className="text-muted-foreground text-[10px] leading-tight">{opt.label_ko}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepBadge({ n, label, icon }: { n: number; label: string; icon?: React.ReactNode }) {
  return (
    <h2 className="font-display font-bold text-sm text-foreground border-b border-border pb-2 flex items-center gap-2">
      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono-data font-bold flex items-center justify-center flex-shrink-0">{n}</span>
      {icon}{label}
    </h2>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function InspectorPage() {
  const { t, lang } = useLanguage();
  const [mode, setMode] = useState<"list" | "new" | "success">("list");
  const [draft, setDraft] = useState<InspectionDraft>({ ...emptyDraft });
  const [plateLoading, setPlateLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCert, setSubmittedCert] = useState<{ uid: string; slug: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // ── List data: use Supabase if enabled, else mockData ──
  const listVehicles = isSupabaseEnabled ? [] : mockVehicles;
  const listInspections = isSupabaseEnabled ? [] : mockInspections;
  const listCertificates = isSupabaseEnabled ? [] : mockCertificates;

  const set = <K extends keyof InspectionDraft>(key: K, value: InspectionDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const handlePlateLookup = async () => {
    if (!draft.plate.trim()) return;
    setPlateLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const result = mockPlateLookup(draft.plate.trim());
    setPlateLoading(false);
    if (result) { setDraft((d) => ({ ...d, ...result })); toast.success("Vehicle specs loaded from national database"); }
    else toast.error("Plate not found. Please enter vehicle details manually.");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMedia: MediaFile[] = files.map((file) => ({ id: nanoid(6), file, previewUrl: URL.createObjectURL(file), type: file.type.startsWith("video/") ? "video" : "image" }));
    setDraft((d) => ({ ...d, media: [...d.media, ...newMedia] }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    set("document_image_url", URL.createObjectURL(file)); toast.success("Original document uploaded");
  };

  const removeMedia = (id: string) => setDraft((d) => ({ ...d, media: d.media.filter((m) => { if (m.id === id) URL.revokeObjectURL(m.previewUrl); return m.id !== id; }) }));
  const setCondition = (ko: string, val: ConditionValue) => setDraft((d) => ({ ...d, conditions: { ...d.conditions, [ko]: val } }));
  const setLeak = (ko: string, val: LeakValue) => setDraft((d) => ({ ...d, leaks: { ...d.leaks, [ko]: val } }));
  const setPanelDamage = (fn: (p: Record<string, PanelState>) => Record<string, PanelState>) => setDraft((d) => ({ ...d, panel_damage: fn(d.panel_damage) }));
  const setOption = (key: string, val: boolean) => setDraft((d) => ({ ...d, vehicle_options: { ...d.vehicle_options, [key]: val } }));
  const updateZone = (zone: string, field: "rating" | "notes", value: string | number) =>
    setDraft((d) => ({ ...d, body_condition: { ...d.body_condition, [zone]: { ...d.body_condition[zone], [field]: value } } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.vin || !draft.mileage) { toast.error("VIN and Mileage are required."); return; }
    if (!draft.make || !draft.model) { toast.error("Make and Model are required."); return; }
    if (draft.media.length < 5) { toast.error("Minimum 5 photos required before submitting."); return; }

    setIsSubmitting(true);

    // Build overall_rating from body_condition average
    const bodyRatings = Object.values(draft.body_condition).map((z) => z.rating);
    const overall_rating = bodyRatings.reduce((a, b) => a + b, 0) / bodyRatings.length;

    // Build body_condition object (strip notes into notes_ko field)
    const body_condition = Object.fromEntries(
      Object.entries(draft.body_condition).map(([zone, val]) => [
        zone,
        { rating: val.rating, notes_ko: val.notes || null },
      ])
    );

    const inspectionDraft = {
      vin: draft.vin,
      inspector_id: null,
      inspector_name: draft.inspector_name || "Unknown",
      inspector_license: draft.facility_reg_no || "PENDING",
      public_slug: nanoid(8).toLowerCase(),
      mileage: parseInt(draft.mileage) || 0,
      odometer_unit: draft.odometer_unit,
      odometer_tampered: draft.odometer_tampered,
      accident_status: draft.accident_status,
      accident_notes_ko: draft.accident_notes || null,
      flood_engine: draft.flood_engine,
      flood_transmission: draft.flood_transmission,
      flood_interior: draft.flood_interior,
      fire_damage: draft.fire_damage,
      tuning_illegal: draft.tuning_illegal,
      tuning_structural: draft.tuning_structural,
      tuning_notes: draft.tuning_notes || null,
      body_condition,
      panel_damage: draft.panel_damage,
      vehicle_options: draft.vehicle_options,
      leaks: draft.leaks,
      conditions: draft.conditions,
      emission_co: draft.emission_co ? parseFloat(draft.emission_co) : null,
      emission_hc: draft.emission_hc ? parseFloat(draft.emission_hc) : null,
      emission_smoke: draft.emission_smoke ? parseFloat(draft.emission_smoke) : null,
      overall_rating,
      report_no: draft.report_no || null,
      first_reg_date: draft.first_reg_date || null,
      vehicle_type: draft.vehicle_type || null,
      reg_region: draft.reg_region || null,
      usage_rental: draft.usage_rental,
      usage_commercial: draft.usage_commercial,
      usage_lease: draft.usage_lease,
      facility_reg_no: draft.facility_reg_no || null,
      facility_address: draft.facility_address || null,
      company_name: draft.company_name || null,
      document_image_url: draft.document_image_url || null,
      signature_data_url: draft.signature_data_url || null,
    };

    const mediaFiles = draft.media.map((m, i) => ({
      file: m.file,
      visibility: (i === 0 ? "public" : "public") as "public" | "internal",
      caption: null,
    }));

    try {
      const result = await submitInspection(inspectionDraft as any, mediaFiles);
      if (!result) {
        toast.error("Submission failed. Please try again.");
        setIsSubmitting(false);
        return;
      }
      setSubmittedCert({ uid: result.certUid || `VCP-${new Date().getFullYear()}-${result.slug.toUpperCase()}`, slug: result.slug });
      setMode("success");
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelCls = "text-[10px] font-body font-medium text-muted-foreground mb-1 block uppercase tracking-wider";
  const inputCls = "rounded h-9 text-sm bg-background border-border";

  // ── SUCCESS ──
  if (mode === "success" && submittedCert) {
    const certUrl = `${window.location.origin}/car/${submittedCert.slug}`;
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container max-w-lg py-16 text-center space-y-6 page-fade">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-success/10 border border-success/30 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-success" />
            </div>
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">{t("inspector_locked")}</h2>
            <p className="text-sm text-muted-foreground font-body mt-1">{t("inspector_locked_desc")}</p>
          </div>
          <div className="bg-card border border-border rounded p-5 text-left space-y-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">{t("inspector_cert_id")}</p>
              <p className="font-mono-data font-bold text-primary text-lg">{submittedCert.uid}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">{t("inspector_cert_url")}</p>
              <p className="font-mono-data text-sm text-foreground break-all">{certUrl}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(certUrl); toast.success("URL copied to clipboard"); }}
              className="w-full h-9 rounded border border-primary text-primary text-sm font-body font-semibold hover:bg-primary hover:text-primary-foreground transition-colors">
              {t("inspector_copy_url")}
            </button>
          </div>
          <Button onClick={() => { setMode("list"); setDraft({ ...emptyDraft }); setSubmittedCert(null); }}
            className="h-10 text-sm font-display font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded">
            {t("inspector_back")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="container max-w-4xl py-6 space-y-6 page-fade">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">{t("inspector_title")}</h1>
            <p className="text-xs text-muted-foreground font-body mt-0.5">박민준 · INS-2023-00421</p>
          </div>
          {mode === "list" && (
            <Button onClick={() => setMode("new")} className="h-9 text-xs font-display font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> {t("inspector_new")}
            </Button>
          )}
          {mode === "new" && (
            <Button variant="outline" onClick={() => { setMode("list"); setDraft({ ...emptyDraft }); }} className="h-9 text-xs font-body rounded border-border">
              {t("inspector_cancel")}
            </Button>
          )}
        </div>

        {/* LIST */}
        {mode === "list" && (
          <div className="bg-card border border-border rounded overflow-hidden">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Vehicle", "Inspector", "Rating", "Submitted", "Status"].map((h, i) => (
                    <th key={h} className={`text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${i === 1 ? "hidden sm:table-cell" : ""} ${i === 3 ? "hidden md:table-cell" : ""} ${[2, 4].includes(i) ? "text-center" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listInspections.map((ins, idx) => {
                  const vehicle = listVehicles.find((v) => v.vin === ins.vin); if (!vehicle) return null;
                  const cert = listCertificates.find((c) => c.inspection_id === ins.id);
                  return (
                    <tr key={ins.id} className={`border-b border-border table-row-hover ${idx % 2 === 1 ? "bg-muted/20" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-display font-semibold text-sm text-foreground">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                        <p className="font-mono-data text-[10px] text-muted-foreground">{cert?.certificate_uid || vehicle.vin}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-sm text-foreground">{ins.inspector_name}</td>
                      <td className="px-4 py-3 text-center font-mono-data text-sm font-semibold text-foreground">{ins.overall_rating}/5</td>
                      <td className="px-4 py-3 hidden md:table-cell font-mono-data text-xs text-muted-foreground">{new Date(ins.submitted_at).toLocaleDateString("en-CA")}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono-data font-semibold bg-success/10 text-success">
                          <CheckCircle className="w-3 h-3" /> LOCKED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FORM */}
        {mode === "new" && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* 1: Make & Model Select */}
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <StepBadge n={1} label={t("insp_step1")} />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Make */}
                <div>
                  <label className={labelCls}>{t("insp_make")} *</label>
                  <select
                    required
                    value={draft.make}
                    onChange={(e) => {
                      const make = e.target.value;
                      setDraft(d => ({ ...d, make, model: "", fuel_type: "", transmission: "", drivetrain: "", engine_cc: "" }));
                    }}
                    className="w-full rounded h-9 text-sm font-body bg-background border border-border px-3 outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">{t("insp_select_make")}</option>
                    {carMakes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Model */}
                <div>
                  <label className={labelCls}>{t("insp_model")} *</label>
                  <select
                    required
                    value={draft.model}
                    disabled={!draft.make}
                    onChange={(e) => {
                      const model = e.target.value;
                      const specs = getDefaultSpecs(draft.make, model);
                      if (specs) {
                        setDraft(d => ({
                          ...d, model,
                          fuel_type: specs.fuel_type || d.fuel_type,
                          engine_cc: specs.engine_cc ? String(specs.engine_cc) : d.engine_cc,
                        }));
                      } else {
                        setDraft(d => ({ ...d, model }));
                      }
                    }}
                    className="w-full rounded h-9 text-sm font-body bg-background border border-border px-3 outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="">{t("insp_select_model")}</option>
                    {draft.make && (carDatabase[draft.make] || []).map(m => (
                      <option key={m.model} value={m.model}>{m.model}</option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className={labelCls}>{t("insp_year")} *</label>
                  <select
                    required
                    value={draft.year}
                    onChange={(e) => set("year", e.target.value)}
                    className="w-full rounded h-9 text-sm font-mono-data bg-background border border-border px-3 outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">{t("insp_select_year")}</option>
                    {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Fuel Type */}
                <div>
                  <label className={labelCls}>{t("insp_fuel")}</label>
                  <select
                    value={draft.fuel_type}
                    onChange={(e) => set("fuel_type", e.target.value)}
                    className="w-full rounded h-9 text-sm font-body bg-background border border-border px-3 outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">{t("insp_select_fuel")}</option>
                    {["Petrol","Diesel","Hybrid","Plug-in Hybrid","Electric","Hydrogen"].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Transmission */}
                <div>
                  <label className={labelCls}>{t("insp_transmission")}</label>
                  <select
                    value={draft.transmission}
                    onChange={(e) => set("transmission", e.target.value)}
                    className="w-full rounded h-9 text-sm font-body bg-background border border-border px-3 outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">{t("insp_select_trans")}</option>
                    {["Automatic","Manual","CVT","DCT / Dual-Clutch","Semi-Automatic"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Drivetrain */}
                <div>
                  <label className={labelCls}>{t("insp_drivetrain")}</label>
                  <select
                    value={draft.drivetrain}
                    onChange={(e) => set("drivetrain", e.target.value)}
                    className="w-full rounded h-9 text-sm font-body bg-background border border-border px-3 outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">{t("insp_select_drive")}</option>
                    {["2WD (FWD)","2WD (RWD)","AWD","4WD"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Engine CC */}
                <div>
                  <label className={labelCls}>{t("insp_cc")}</label>
                  <Input
                    type="number"
                    placeholder="e.g. 2000"
                    value={draft.engine_cc}
                    onChange={(e) => set("engine_cc", e.target.value)}
                    className={`${inputCls} font-mono-data`}
                  />
                </div>

                {/* Trim */}
                <div>
                  <label className={labelCls}>{t("insp_trim")}</label>
                  <Input
                    placeholder="e.g. Smart, Premium, Calligraphy"
                    value={draft.vin}
                    onChange={(e) => set("vin", e.target.value)}
                    className={`${inputCls} font-body`}
                  />
                </div>

                {/* Color */}
                <div>
                  <label className={labelCls}>{t("insp_color")}</label>
                  <Input
                    placeholder="e.g. Phantom Black"
                    value={draft.color}
                    onChange={(e) => set("color", e.target.value)}
                    className={`${inputCls} font-body`}
                  />
                </div>
              </div>

              {/* Auto-fill notice when model selected */}
              {draft.model && draft.fuel_type && (
                <div className="bg-success/5 border border-success/20 rounded px-3 py-2">
                  <p className="text-xs text-success font-body font-semibold">
                    {t("insp_specs_autofill")}
                  </p>
                </div>
              )}
            </div>

            {/* 2: Registration & Inspection Details */}
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <StepBadge n={2} label={t("insp_step2")} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><label className={labelCls}>{t("insp_mileage")} *</label>
                  <div className="flex gap-1">
                    <Input type="number" required value={draft.mileage} onChange={(e) => set("mileage", e.target.value)} placeholder="e.g. 38420" className={`${inputCls} font-mono-data flex-1`} />
                    <select value={draft.odometer_unit} onChange={(e) => set("odometer_unit", e.target.value)} className="rounded h-9 text-xs font-body bg-background border border-border px-2">
                      <option value="km">km</option><option value="miles">mi</option>
                    </select>
                  </div>
                </div>
                <div><label className={labelCls}>{t("insp_report_no")}</label><Input value={draft.report_no} onChange={(e) => set("report_no", e.target.value)} placeholder="e.g. 2024-001" className={`${inputCls} font-mono-data`} /></div>
                <div><label className={labelCls}>{t("insp_insp_date")}</label><Input type="date" value={draft.inspection_date} onChange={(e) => set("inspection_date", e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>{t("insp_first_reg")}</label><Input type="date" value={draft.first_reg_date} onChange={(e) => set("first_reg_date", e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>{t("insp_vehicle_type")}</label>
                  <select value={draft.vehicle_type} onChange={(e) => set("vehicle_type", e.target.value)} className="w-full rounded h-9 text-sm font-body bg-background border border-border px-3 outline-none focus:ring-1 focus:ring-primary">
                    <option value="">{t("insp_select_vtype")}</option>
                    {["승용 (Sedan/SUV)","승합 (Van/Minibus)","화물 (Truck/Cargo)","특수 (Special)"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>{t("insp_reg_region")}</label>
                  <select value={draft.reg_region} onChange={(e) => set("reg_region", e.target.value)} className="w-full rounded h-9 text-sm font-body bg-background border border-border px-3 outline-none focus:ring-1 focus:ring-primary">
                    <option value="">{t("insp_select_region")}</option>
                    {["서울","경기","인천","부산","대구","광주","대전","울산","세종","강원","충북","충남","전북","전남","경북","경남","제주"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Odometer tamper flag */}
              <div className="border border-border rounded p-3 space-y-1 bg-muted/20">
                <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider">{t("insp_odo_status")}</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={draft.odometer_tampered} onChange={(e) => set("odometer_tampered", e.target.checked)} className="w-4 h-4 rounded border-border accent-destructive" />
                  <span className="text-sm font-body text-foreground">{t("insp_odo_tampered")}</span>
                </label>
                {draft.odometer_tampered && <p className="text-xs text-destructive font-body ml-7">{`⚠ ${t("insp_odo_warning")}`}</p>}
              </div>

              {/* Usage history */}
              <div className="border border-border rounded p-3 space-y-2 bg-muted/20">
                <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider">{t("insp_usage_history")}</p>
                {[
                  { key: "usage_rental",     label: t("insp_usage_rental") },
                  { key: "usage_commercial", label: t("insp_usage_commercial") },
                  { key: "usage_lease",      label: t("insp_usage_lease") },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={draft[key as keyof InspectionDraft] as boolean} onChange={(e) => set(key as keyof InspectionDraft, e.target.checked)} className="w-4 h-4 rounded border-border accent-warning" />
                    <span className="text-sm font-body text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 3: Flood / Fire / Tuning flags */}
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <StepBadge n={3} label={t("insp_step3")} />
              {/* Flood */}
              <div className="border border-border rounded p-3 space-y-2 bg-muted/20">
                <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider">{t("insp_flood")}</p>
                {[
                  { key: "flood_engine",      label: t("insp_flood_engine") },
                  { key: "flood_transmission",label: t("insp_flood_trans") },
                  { key: "flood_interior",    label: t("insp_flood_interior") },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={draft[key as keyof InspectionDraft] as boolean} onChange={(e) => set(key as keyof InspectionDraft, e.target.checked)} className="w-4 h-4 rounded border-border accent-destructive" />
                    <span className="text-sm font-body text-foreground">{label}</span>
                  </label>
                ))}
              </div>
              {/* Fire */}
              <div className="border border-border rounded p-3 bg-muted/20">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={draft.fire_damage} onChange={(e) => set("fire_damage", e.target.checked)} className="w-4 h-4 rounded border-border accent-destructive" />
                  <span className="text-sm font-body text-foreground">{t("insp_fire")}</span>
                </label>
              </div>
              {/* Tuning */}
              <div className="border border-border rounded p-3 space-y-2 bg-muted/20">
                <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider">{t("insp_tuning")}</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={draft.tuning_illegal} onChange={(e) => set("tuning_illegal", e.target.checked)} className="w-4 h-4 rounded border-border accent-warning" />
                  <span className="text-sm font-body text-foreground">{t("insp_tuning_illegal")}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={draft.tuning_structural} onChange={(e) => set("tuning_structural", e.target.checked)} className="w-4 h-4 rounded border-border accent-warning" />
                  <span className="text-sm font-body text-foreground">{t("insp_tuning_structural")}</span>
                </label>
                {(draft.tuning_illegal || draft.tuning_structural) && (
                  <div>
                    <label className={labelCls}>{t("insp_tuning_notes")}</label>
                    <Textarea value={draft.tuning_notes} onChange={(e) => set("tuning_notes", e.target.value)} placeholder={t("insp_tuning_notes")} className="rounded text-sm font-body bg-background border-border min-h-[60px]" />
                  </div>
                )}
              </div>
            </div>

            {/* 4: Performance & Condition Checklist */}
            <div className="bg-card border border-border rounded p-5 space-y-5">
              <StepBadge n={4} label={t("insp_step4_checklist")} />
              <p className="text-xs text-muted-foreground font-body -mt-2">중고자동차 성능·상태점검기록부 (별지 제82호서식)</p>

              {/* Leak grades — 3 state */}
              <div>
                <p className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("insp_leak_grade")}</p>
                <div className="grid grid-cols-[1fr_72px_80px_72px] text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider px-1 pb-1 border-b border-border">
                  <span>항목</span>
                  <span className="text-center text-success">{t("insp_leak_none")}</span>
                  <span className="text-center text-warning">{t("insp_leak_micro")}</span>
                  <span className="text-center text-destructive">{t("insp_leak_leak")}</span>
                </div>
                <div className="divide-y divide-border">
                  {LEAK_ITEMS.map(({ ko, en }) => {
                    const val = draft.leaks[ko] || "없음";
                    return (
                      <div key={ko} className="grid grid-cols-[1fr_72px_80px_72px] items-center py-2 px-1 hover:bg-muted/20 rounded transition-colors">
                        <div><p className="text-xs font-body font-medium text-foreground">{ko}</p><p className="text-[10px] text-muted-foreground font-body">{en}</p></div>
                        {(["없음", "미세누유", "누유"] as LeakValue[]).map((opt) => (
                          <div key={opt} className="flex justify-center">
                            <input type="radio" name={`leak-${ko}`} checked={val === opt} onChange={() => setLeak(ko, opt)} className="w-4 h-4 accent-primary cursor-pointer" />
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Standard good/bad/replace — grouped by section */}
              {Object.entries(CONDITION_SECTIONS).map(([section, sectionLabel]) => {
                const items = CONDITION_ITEMS.filter(i => i.section === section);
                if (!items.length) return null;
                return (
                  <div key={section}>
                    <p className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">{sectionLabel}</p>
                    <div className="grid grid-cols-[1fr_72px_72px_80px] text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider px-1 pb-1 border-b border-border">
                      <span>항목</span>
                      <span className="text-center">{t("insp_cond_good")}</span>
                      <span className="text-center">{t("insp_cond_bad")}</span>
                      <span className="text-center">{t("insp_cond_replace")}</span>
                    </div>
                    <div className="divide-y divide-border">
                      {items.map(({ ko, en }) => {
                        const val = draft.conditions[ko] || "good";
                        return (
                          <div key={ko} className="grid grid-cols-[1fr_72px_72px_80px] items-center py-2 px-1 hover:bg-muted/20 rounded transition-colors">
                            <div><p className="text-xs font-body font-medium text-foreground">{ko}</p><p className="text-[10px] text-muted-foreground font-body">{en}</p></div>
                            {(["good", "bad", "replace"] as ConditionValue[]).map((opt) => (
                              <div key={opt} className="flex justify-center">
                                <input type="radio" name={`cond-${ko}`} checked={val === opt} onChange={() => setCondition(ko, opt)} className="w-4 h-4 accent-primary cursor-pointer" />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Summary counts */}
              <div className="flex gap-3 pt-1 border-t border-border">
                {[
                  { label: t("insp_cond_summary_good"),    val: "good",    cls: "bg-success/10 text-success border-success/20" },
                  { label: t("insp_cond_summary_bad"),     val: "bad",     cls: "bg-destructive/10 text-destructive border-destructive/20" },
                  { label: t("insp_cond_summary_replace"), val: "replace", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
                ].map(({ label, val, cls }) => (
                  <div key={val} className={`flex-1 text-center rounded border py-1.5 ${cls}`}>
                    <p className="font-mono-data font-bold text-base leading-none">{Object.values(draft.conditions).filter((v) => v === val).length}</p>
                    <p className="text-[10px] font-body mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5: Emissions */}
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <StepBadge n={5} label={t("insp_step5_emissions")} />
              <p className="text-xs text-muted-foreground font-body -mt-2">{t("insp_emissions_note")}</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>CO (%)</label>
                  <Input type="number" step="0.01" placeholder="e.g. 0.12" value={draft.emission_co} onChange={(e) => set("emission_co", e.target.value)} className={`${inputCls} font-mono-data`} />
                  <p className="text-[10px] text-muted-foreground font-body mt-1">{t("insp_co_hint")}</p>
                </div>
                <div>
                  <label className={labelCls}>HC (ppm)</label>
                  <Input type="number" step="1" placeholder="e.g. 85" value={draft.emission_hc} onChange={(e) => set("emission_hc", e.target.value)} className={`${inputCls} font-mono-data`} />
                  <p className="text-[10px] text-muted-foreground font-body mt-1">{t("insp_hc_hint")}</p>
                </div>
                <div>
                  <label className={labelCls}>매연 Smoke (%)</label>
                  <Input type="number" step="0.1" placeholder="e.g. 8" value={draft.emission_smoke} onChange={(e) => set("emission_smoke", e.target.value)} className={`${inputCls} font-mono-data`} />
                  <p className="text-[10px] text-muted-foreground font-body mt-1">{t("insp_smoke_hint")}</p>
                </div>
              </div>
            </div>

            {/* 4: Diagram */}
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <StepBadge n={4} label={t("insp_step4_diagram")} />
              <CarDiagram panelDamage={draft.panel_damage} setPanelDamage={setPanelDamage} lang={lang} />
            </div>

            {/* 5: Accident */}
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <StepBadge n={5} label={t("insp_step5_accident")} />
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={draft.accident_status} onChange={(e) => set("accident_status", e.target.checked)} className="w-4 h-4 rounded border-border accent-primary" />
                <span className="text-sm font-body text-foreground">{t("insp_accident_on_record")}</span>
              </label>
              {draft.accident_status && (
                <div>
                  <label className={labelCls}>{t("insp_accident_notes_label")}</label>
                  <Textarea value={draft.accident_notes} onChange={(e) => set("accident_notes", e.target.value)} placeholder={t("insp_body_notes_placeholder")} className="rounded text-sm font-body bg-background border-border min-h-[80px]" />
                  <p className="text-[11px] text-muted-foreground font-body mt-1">{t("insp_accident_notes_hint")}</p>
                </div>
              )}
            </div>

            {/* 6: Body */}
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <StepBadge n={6} label={t("insp_step6_body")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {zones.map((zone) => (
                  <div key={zone} className="border border-border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-body font-semibold text-foreground capitalize">{zone}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button key={r} type="button" onClick={() => updateZone(zone, "rating", r)}
                            className={`w-7 h-7 rounded text-xs font-mono-data font-semibold transition-colors ${draft.body_condition[zone].rating === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>{r}</button>
                        ))}
                      </div>
                    </div>
                    <Input placeholder={t("insp_body_notes_placeholder")} value={draft.body_condition[zone].notes} onChange={(e) => updateZone(zone, "notes", e.target.value)} className="rounded h-8 text-xs font-body bg-background border-border" />
                  </div>
                ))}
              </div>
            </div>

            {/* 7: Options */}
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <StepBadge n={7} label={t("insp_step7_options")} />
              <p className="text-xs text-muted-foreground font-body -mt-2">{t("insp_options_note")}</p>
              <VehicleOptionsSelector selected={draft.vehicle_options} onChange={setOption} />
            </div>

            {/* 8: Media */}
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono-data font-bold flex items-center justify-center">8</span>
                  <Camera className="w-4 h-4" /> Photos & Videos · 사진 및 영상
                </h2>
                <span className={`text-xs font-mono-data font-semibold ${draft.media.length >= 5 ? "text-success" : "text-destructive"}`}>{draft.media.length}/5 {t("insp_min_photos")}</span>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileUpload} />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 rounded border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground">
                <div className="flex gap-2"><Image className="w-4 h-4" /><Video className="w-4 h-4" /></div>
                <span className="text-xs font-body">{t("insp_media_tap")}</span>
                <span className="text-[11px] font-body text-muted-foreground/70">{t("insp_media_types")}</span>
              </button>
              {draft.media.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {draft.media.map((m) => (
                    <div key={m.id} className="relative group aspect-square">
                      {m.type === "image" ? <img src={m.previewUrl} alt="" className="w-full h-full object-cover rounded border border-border" /> : <div className="w-full h-full rounded border border-border bg-muted flex flex-col items-center justify-center gap-1"><Video className="w-4 h-4 text-primary" /><span className="text-[9px] font-mono-data text-muted-foreground">VIDEO</span></div>}
                      <button type="button" onClick={() => removeMedia(m.id)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 9: Document */}
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <StepBadge n={9} label={t("insp_step9_doc")} icon={<FileText className="w-4 h-4" />} />
              <p className="text-xs text-muted-foreground font-body -mt-2">{t("insp_doc_note")}</p>
              <input ref={docInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleDocUpload} />
              {draft.document_image_url ? (
                <div className="space-y-2">
                  <img src={draft.document_image_url} alt="Original document" className="w-full max-h-72 object-contain rounded border border-border bg-muted/20" />
                  <button type="button" onClick={() => docInputRef.current?.click()} className="text-xs text-muted-foreground underline hover:text-foreground font-body">{t("insp_doc_replace")}</button>
                </div>
              ) : (
                <button type="button" onClick={() => docInputRef.current?.click()}
                  className="w-full h-24 rounded border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                  <FileText className="w-5 h-5" />
                  <span className="text-xs font-body">{t("insp_doc_upload")}</span>
                  <span className="text-[11px] font-body text-muted-foreground/60">Click to upload · JPG, PNG, PDF</span>
                </button>
              )}
            </div>

            {/* 10: Signature */}
            <div className="bg-card border border-border rounded p-5 space-y-4">
              <StepBadge n={10} label={t("insp_step10_sig")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={labelCls}>{t("insp_inspector_name")}</label><Input value={draft.inspector_name} onChange={(e) => set("inspector_name", e.target.value)} className={`${inputCls} font-body`} /></div>
                <div><label className={labelCls}>{t("insp_company")}</label><Input value={draft.company_name} onChange={(e) => set("company_name", e.target.value)} className={`${inputCls} font-body`} /></div>
                <div><label className={labelCls}>{t("insp_facility_reg")}</label><Input value={draft.facility_reg_no} onChange={(e) => set("facility_reg_no", e.target.value)} placeholder="e.g. 제2024-서울-0042호" className={`${inputCls} font-mono-data`} /></div>
                <div><label className={labelCls}>{t("insp_facility_addr")}</label><Input value={draft.facility_address} onChange={(e) => set("facility_address", e.target.value)} placeholder="e.g. 서울시 강남구 테헤란로 123" className={`${inputCls} font-body`} /></div>
              </div>
              <div>
                <label className={labelCls}>{t("insp_sig_label")}</label>
                <SignaturePad onSave={(url) => set("signature_data_url", url)} clearLabel={t("insp_sig_clear")} />
                {draft.signature_data_url && <p className="text-[10px] text-success font-body mt-1">✓ {t("insp_sig_captured")}</p>}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pb-8">
              <Button type="button" variant="outline" onClick={() => { setMode("list"); setDraft({ ...emptyDraft }); }} className="h-10 text-sm font-body rounded border-border">{t("inspector_cancel")}</Button>
              <Button type="submit" disabled={isSubmitting} className="h-10 text-sm font-display font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded px-6 disabled:opacity-70">
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Submitting...</> : <><Save className="w-4 h-4 mr-1.5" />{t("inspector_submit")}</>}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}