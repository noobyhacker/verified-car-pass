/**
 * /track-order?token=xxx
 *
 * Client-facing private tracking page.
 * Requires valid token (in URL) + password (entered by user).
 * Completely separate from public catalog — full inspection data shown.
 */

import { useSearchParams, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { validateAndFetchTracking, type TrackingData } from "@/lib/queries";
import { Navbar } from "@/components/Navbar";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Loader2, Lock, CheckCircle, AlertTriangle, Eye, EyeOff,
  Car, Calendar, MapPin, User, Clock, Package, Ship, Flag, FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ─── Shipment status config ───────────────────────────────────────────────────

const SHIPMENT_STAGES = [
  { key: "purchased",   label: "Purchase Confirmed", icon: CheckCircle },
  { key: "processing",  label: "Processing / Documentation", icon: FileText },
  { key: "shipping",    label: "Shipping to Port", icon: Car },
  { key: "in_transit",  label: "In Transit (Sea Freight)", icon: Ship },
  { key: "customs",     label: "Customs Clearance", icon: Package },
  { key: "arrived",     label: "Arrived at Destination", icon: Flag },
];

function deriveCurrentStage(shipment: TrackingData["shipment"], transaction: TrackingData["transaction"]): string {
  if (shipment?.current_stage) return shipment.current_stage;
  if (transaction.delivery_date && new Date(transaction.delivery_date) <= new Date()) return "arrived";
  return "purchased";
}

// ─── Password gate ────────────────────────────────────────────────────────────

function PasswordGate({ onUnlock, token }: { onUnlock: (data: TrackingData) => void; token: string }) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async () => {
    if (!password.trim()) { setError("Enter your password."); return; }
    setLoading(true); setError(null);
    const result = await validateAndFetchTracking(token, password.trim());
    setLoading(false);
    if (result.success) {
      onUnlock(result.data);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPassword("");
      if (result.reason === "locked") {
        setError("Too many failed attempts. Access locked for 15 minutes.");
      } else if (result.reason === "expired") {
        setError("This tracking link has expired. Contact your sales representative.");
      } else if (result.reason === "wrong_password") {
        const remaining = Math.max(0, 5 - newAttempts);
        setError(`Incorrect password.${remaining > 0 ? ` ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` : ""}`);
      } else {
        setError("Invalid tracking link. Please check the URL.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-display font-bold text-xl text-foreground">Track Your Order</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Enter the password provided by your sales representative</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <label className="text-[10px] font-body font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Access Password</label>
              <div className="relative">
                <Input
                  ref={inputRef as any}
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="Enter your password"
                  className="h-11 pr-10 font-mono-data text-sm tracking-widest"
                  disabled={loading}
                />
                <button onClick={() => setShowPw(v => !v)} type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-body text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !password.trim()}
              className="w-full h-11 rounded-lg bg-primary text-white font-display font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <><Lock className="w-4 h-4" /> Access Order</>}
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground font-body">
            Need help? <a href="https://wa.me/821027058645" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Contact SS Trading Korea</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Tracking content ─────────────────────────────────────────────────────────

function TrackingContent({ data }: { data: TrackingData }) {
  const { vehicle, transaction, buyer, inspections, mediaByInspection, shipment } = data;
  const currentStage = deriveCurrentStage(shipment, transaction);
  const currentIdx = SHIPMENT_STAGES.findIndex(s => s.key === currentStage);

  const inspectionsByCaption: Record<string, typeof inspections[0] & { mediaList: typeof data.mediaByInspection[string] }> = {};
  inspections.forEach(ins => {
    const caption = (ins as any).vehicle_type || ins.id;
    inspectionsByCaption[ins.id] = {
      ...ins,
      mediaList: mediaByInspection[ins.id] ?? [],
    };
  });

  // Group inspections by stage (using caption or fallback ordering)
  const stageGroups: Array<{ stage: string; label: string; inspections: typeof inspections }> = [
    { stage: "pre_sale", label: "Pre-Sale Inspection", inspections: [] },
    { stage: "pre_shipping", label: "Pre-Shipping Inspection", inspections: [] },
    { stage: "post_arrival", label: "Post-Arrival Inspection", inspections: [] },
    { stage: "other", label: "Other Inspections", inspections: [] },
  ];

  inspections.forEach((ins, idx) => {
    // Heuristic: first inspection = pre_sale, second = pre_shipping, third = post_arrival
    const g = stageGroups[Math.min(idx, 2)];
    g.inspections.push(ins);
  });

  const hasInspections = inspections.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header banner */}
      <div className="bg-card border-b border-border">
        <div className="container py-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-body text-emerald-700 font-medium">Order Confirmed</span>
              </div>
              <h1 className="font-display font-bold text-xl text-foreground">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="font-mono-data text-xs text-muted-foreground mt-0.5">
                VIN: {vehicle.vin} {vehicle.trim ? `· ${vehicle.trim}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">Purchase Date</p>
              <p className="font-mono-data text-sm font-bold text-foreground">{new Date(transaction.purchase_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
              {transaction.delivery_date && (
                <>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body mt-1">Est. Delivery</p>
                  <p className="font-mono-data text-sm font-semibold text-primary">{new Date(transaction.delivery_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-3xl py-6 space-y-6">

        {/* Section 1 — Car Overview */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center gap-2">
            <Car className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-sm text-foreground">Vehicle Details</h2>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Make", value: vehicle.make },
              { label: "Model", value: vehicle.model },
              { label: "Year", value: String(vehicle.year) },
              { label: "Fuel", value: vehicle.fuel_type },
              { label: "Transmission", value: vehicle.transmission },
              { label: "Engine", value: `${vehicle.engine_cc}cc` },
              { label: "Color", value: vehicle.color },
              { label: "Drivetrain", value: vehicle.drivetrain },
              { label: "VIN", value: vehicle.vin },
            ].map(row => (
              <div key={row.label} className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">{row.label}</p>
                <p className="text-xs font-mono-data font-semibold text-foreground">{row.value}</p>
              </div>
            ))}
          </div>
          {vehicle.description && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Description</p>
              <p className="text-xs font-body text-foreground leading-relaxed">{vehicle.description}</p>
            </div>
          )}
        </div>

        {/* Section 2 — Shipment Status */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center gap-2">
            <Ship className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-sm text-foreground">Order Status</h2>
          </div>
          <div className="p-4">
            <div className="space-y-0">
              {SHIPMENT_STAGES.map((stage, idx) => {
                const isCompleted = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                const isLast = idx === SHIPMENT_STAGES.length - 1;
                return (
                  <div key={stage.key} className="flex gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isCurrent ? "bg-primary border-primary text-white" :
                        isCompleted ? "bg-emerald-100 border-emerald-400 text-emerald-700" :
                        "bg-gray-50 border-gray-200 text-gray-400"
                      }`}>
                        <stage.icon className="w-3.5 h-3.5" />
                      </div>
                      {!isLast && <div className={`w-0.5 flex-1 my-1 ${isCompleted && idx < currentIdx ? "bg-emerald-300" : "bg-gray-200"}`} style={{ minHeight: "20px" }} />}
                    </div>
                    {/* Content */}
                    <div className={`pb-4 flex-1 min-w-0 ${isLast ? "" : ""}`}>
                      <div className="flex items-center gap-2 pt-1.5">
                        <p className={`text-sm font-body font-medium ${isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                          {stage.label}
                        </p>
                        {isCurrent && <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono-data font-bold border border-primary/20">Current</span>}
                        {isCompleted && !isCurrent && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                      {/* Show dates from shipment stages if available */}
                      {shipment?.stages && (() => {
                        const s = shipment.stages.find(ss => ss.stage === stage.key);
                        if (s?.timestamp) return <p className="text-[10px] text-muted-foreground font-mono-data mt-0.5">{new Date(s.timestamp).toLocaleDateString()}{s.note ? ` · ${s.note}` : ""}</p>;
                        return null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3 — Inspection Timeline */}
        {hasInspections && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold text-sm text-foreground">Inspection Timeline</h2>
              <span className="ml-auto text-[10px] font-mono-data text-muted-foreground">{inspections.length} inspection{inspections.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {stageGroups.filter(g => g.inspections.length > 0).map(group => (
                <div key={group.stage} className="p-4 space-y-3">
                  <p className="text-xs font-display font-bold text-foreground">{group.label}</p>
                  {group.inspections.map(ins => {
                    const media = mediaByInspection[ins.id] ?? [];
                    return (
                      <div key={ins.id} className="space-y-3">
                        {/* Inspection meta */}
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                            <User className="w-3.5 h-3.5" />
                            <span>{ins.inspector_name} · {ins.inspector_license}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-mono-data text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(ins.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                          {ins.facility_address && (
                            <div className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{ins.facility_address}</span>
                            </div>
                          )}
                        </div>

                        {/* Key findings */}
                        <div className="flex flex-wrap gap-2">
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-data font-semibold border bg-gray-50 border-gray-200 text-gray-700">
                            Mileage: {ins.mileage.toLocaleString()} km
                          </span>
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-data font-semibold border bg-gray-50 border-gray-200 text-gray-700">
                            Rating: {ins.overall_rating}/5
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono-data font-semibold border ${ins.accident_status ? "bg-red-100 text-red-800 border-red-200" : "bg-emerald-100 text-emerald-800 border-emerald-200"}`}>
                            {ins.accident_status ? "⚠ Accident Recorded" : "✓ No Accident"}
                          </span>
                        </div>

                        {/* Body condition summary */}
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(ins.body_condition).map(([zone, d]) => (
                            <div key={zone} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border ${d.rating >= 4 ? "bg-emerald-50 border-emerald-200 text-emerald-800" : d.rating >= 3 ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                              <span className="capitalize">{zone}</span>
                              <span className="font-mono-data font-bold">{d.rating}/5</span>
                            </div>
                          ))}
                        </div>

                        {/* Image gallery */}
                        {media.length > 0 && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{media.length} photo{media.length !== 1 ? "s" : ""}</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {media.map(m => (
                                <a key={m.id} href={m.storage_url ?? "#"} target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-primary transition-colors">
                                  <img src={m.thumbnail_url ?? m.storage_url ?? ""} alt={m.caption ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                  {m.caption && (
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <p className="text-[9px] text-white truncate">{m.caption}</p>
                                    </div>
                                  )}
                                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                                      <Eye className="w-2.5 h-2.5 text-white" />
                                    </div>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4 — Documents */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-gray-50 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-sm text-foreground">Documents</h2>
          </div>
          <div className="p-4 space-y-2">
            {inspections.filter(ins => ins.document_image_url).map(ins => (
              <a key={ins.id} href={ins.document_image_url!} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary/30 transition-colors group">
                <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-body font-medium text-foreground">Inspection Document</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(ins.submitted_at).toLocaleDateString()} · {ins.inspector_name}</p>
                </div>
                <span className="text-[10px] text-primary font-body">View →</span>
              </a>
            ))}
            {inspections.every(ins => !ins.document_image_url) && (
              <p className="text-xs text-muted-foreground font-body py-2">Documents will appear here once uploaded by the inspection team.</p>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground font-body">Questions about your order?</p>
          <a href="https://wa.me/821027058645" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-body font-medium">
            Contact SS Trading Korea on WhatsApp →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const rawToken = searchParams.get("token");
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [sessionValid, setSessionValid] = useState(false);

  // Check sessionStorage for cached session (so password isn't re-entered on refresh)
  useEffect(() => {
    if (!rawToken) return;
    const cached = sessionStorage.getItem(`track_session_${rawToken}`);
    if (cached) {
      try {
        const data = JSON.parse(cached) as TrackingData;
        setTrackingData(data);
        setSessionValid(true);
      } catch { /* ignore */ }
    }
  }, [rawToken]);

  const handleUnlock = (data: TrackingData) => {
    setTrackingData(data);
    setSessionValid(true);
    // Cache session for the tab lifetime
    if (rawToken) {
      try { sessionStorage.setItem(`track_session_${rawToken}`, JSON.stringify(data)); } catch { /* ignore */ }
    }
  };

  if (!rawToken) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="font-display font-bold text-lg text-foreground">Invalid Tracking Link</p>
            <p className="text-sm text-muted-foreground font-body">No access token found in the URL. Please check your link.</p>
            <Link to="/" className="text-xs text-primary hover:underline">Return to homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  if (sessionValid && trackingData) {
    return <TrackingContent data={trackingData} />;
  }

  return <PasswordGate token={rawToken} onUnlock={handleUnlock} />;
}
