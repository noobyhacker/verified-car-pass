/**
 * /staff — Staff-only management page
 * Tabs: Queue | Listings | CRM | Transactions | Archive
 */

import { Navbar } from "@/components/Navbar";
import { getPendingReviews as getMockPending, vehicles as mockVehicles, inspections as mockInspections, certificates as mockCertificates } from "@/data/mockData";
import {
  CheckCircle, XCircle, Clock, Eye, AlertTriangle, Car, Loader2, DollarSign,
  Users, ReceiptText, Archive, Star, Plus, Pencil, Trash2, Phone, Globe,
  Search, Link2, Unlink,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getPendingReviews, approveInspection, rejectInspection,
  getAllListings, updateVehicleStatus, updateVehicleTrending, updateVehiclePrice, updateVehicleDescription,
  getAllBuyers, createBuyer, updateBuyer, deleteBuyer, assignVinToBuyer, unassignVinFromBuyer,
  getAllTransactions, createTransaction, getArchivedVehicles,
} from "@/lib/queries";
import type { AccessTokenResult } from "@/lib/queries";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { PendingReview, Buyer, Vehicle, Inspection, Transaction } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ─── Shared ───────────────────────────────────────────────────────────────────

const labelCls = "text-[10px] font-body font-medium text-muted-foreground mb-1 block uppercase tracking-wider";
const inputCls = "rounded h-9 text-sm bg-background border-border";

const B = {
  green:  "bg-emerald-100 text-emerald-800 border border-emerald-300",
  red:    "bg-red-100 text-red-800 border border-red-300",
  yellow: "bg-amber-100 text-amber-800 border border-amber-300",
  blue:   "bg-blue-100 text-blue-800 border border-blue-300",
  gray:   "bg-gray-100 text-gray-700 border border-gray-300",
};
function Badge({ color, text }: { color: keyof typeof B; text: string }) {
  return <span className={`px-2 py-0.5 rounded text-[10px] font-mono-data font-semibold ${B[color]}`}>{text}</span>;
}

function SectionEmpty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="py-16 text-center bg-card border border-border rounded-lg">
      <Icon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
      <p className="font-body text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
function LoadingBox() {
  return (
    <div className="py-16 text-center bg-card border border-border rounded-lg">
      <Loader2 className="w-6 h-6 text-muted-foreground mx-auto animate-spin mb-2" />
      <p className="text-sm font-body text-muted-foreground">Loading...</p>
    </div>
  );
}
function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-border bg-gray-50">
        {cols.map(c => <th key={c} className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{c}</th>)}
      </tr>
    </thead>
  );
}

// ─── Listing Fields Form ──────────────────────────────────────────────────────

interface ListingFields {
  price_usd: string; price_aed: string; price_negotiable: boolean;
  additional_price_notes: string; description: string; export_ready: boolean;
  port_of_loading: string; estimated_delivery_weeks: string; target_markets: string;
}
const emptyListing: ListingFields = {
  price_usd: "", price_aed: "", price_negotiable: false, additional_price_notes: "",
  description: "", export_ready: false, port_of_loading: "", estimated_delivery_weeks: "", target_markets: "",
};

function ListingFieldsForm({ fields, onChange }: { fields: ListingFields; onChange: (f: ListingFields) => void }) {
  const set = (key: keyof ListingFields, val: any) => onChange({ ...fields, [key]: val });
  const handleUsdChange = (val: string) => {
    if (val && !isNaN(Number(val))) onChange({ ...fields, price_usd: val, price_aed: Math.round(Number(val) * 3.67).toString() });
    else set("price_usd", val);
  };
  return (
    <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <DollarSign className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold text-foreground font-display">Listing Details — set before approving</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div><label className={labelCls}>Price (USD) *</label><Input type="number" placeholder="e.g. 18500" value={fields.price_usd} onChange={e => handleUsdChange(e.target.value)} className={`${inputCls} font-mono-data`} /></div>
        <div><label className={labelCls}>Price (AED)</label><Input type="number" placeholder="auto-filled" value={fields.price_aed} onChange={e => set("price_aed", e.target.value)} className={`${inputCls} font-mono-data`} /></div>
        <div>
          <label className={labelCls}>Port of Loading</label>
          <select value={fields.port_of_loading} onChange={e => set("port_of_loading", e.target.value)} className="w-full rounded h-9 text-sm font-body bg-background border border-border px-3">
            <option value="">Select port</option>
            {["Busan", "Incheon", "Pyeongtaek"].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div><label className={labelCls}>Est. Delivery (weeks)</label><Input type="number" placeholder="e.g. 4" value={fields.estimated_delivery_weeks} onChange={e => set("estimated_delivery_weeks", e.target.value)} className={`${inputCls} font-mono-data`} /></div>
        <div><label className={labelCls}>Target Markets</label><Input placeholder="UAE, Saudi Arabia, Ghana" value={fields.target_markets} onChange={e => set("target_markets", e.target.value)} className={`${inputCls} font-body`} /></div>
      </div>
      <div><label className={labelCls}>Description</label><Textarea placeholder="Optional buyer-facing description..." value={fields.description} onChange={e => set("description", e.target.value)} className="rounded text-sm font-body bg-background border-border min-h-[60px]" /></div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={fields.price_negotiable} onChange={e => set("price_negotiable", e.target.checked)} className="w-4 h-4 rounded accent-primary" /><span className="text-xs font-body">Price Negotiable</span></label>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={fields.export_ready} onChange={e => set("export_ready", e.target.checked)} className="w-4 h-4 rounded accent-primary" /><span className="text-xs font-body">Export Ready</span></label>
      </div>
      <div><label className={labelCls}>Additional Price Notes</label><Input placeholder="e.g. Price includes shipping to Dubai" value={fields.additional_price_notes} onChange={e => set("additional_price_notes", e.target.value)} className={`${inputCls} font-body`} /></div>
    </div>
  );
}

// ─── QUEUE TAB ────────────────────────────────────────────────────────────────

function QueueTab() {
  type RS = "pending" | "approved" | "rejected";
  const [queue, setQueue] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, RS>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [showReject, setShowReject] = useState<Record<string, boolean>>({});
  const [listingFields, setListingFields] = useState<Record<string, ListingFields>>({});

  useEffect(() => {
    setLoading(true);
    const loadMock = () => {
      const mock = getMockPending();
      setQueue(mock as any);
      setStatuses(Object.fromEntries(mock.map(r => [r.inspection.id, "pending" as RS])));
      setListingFields(Object.fromEntries(mock.map(r => [r.inspection.id, { ...emptyListing }])));
      setLoading(false);
    };
    if (!isSupabaseEnabled) { loadMock(); return; }
    getPendingReviews().then(data => {
      if (!data.length) { loadMock(); return; }
      setQueue(data);
      setStatuses(Object.fromEntries(data.map(r => [r.inspection.id, "pending" as RS])));
      setListingFields(Object.fromEntries(data.map(r => [r.inspection.id, { ...emptyListing }])));
      setLoading(false);
    });
  }, []);

  const handleApprove = async (inspId: string, vehicleId: string) => {
    const fields = listingFields[inspId] || emptyListing;
    if (!fields.price_usd) { toast.error("Set a USD price before approving."); return; }
    setProcessingId(inspId);
    if (!isSupabaseEnabled) {
      await new Promise(r => setTimeout(r, 600));
      setStatuses(p => ({ ...p, [inspId]: "approved" }));
      toast.success("Approved (mock mode)"); setProcessingId(null); return;
    }
    try {
      const { supabaseAdmin } = await import("@/lib/supabase");
      if (supabaseAdmin) await supabaseAdmin.from("vehicles").update({
        price_usd: parseInt(fields.price_usd), price_aed: fields.price_aed ? parseInt(fields.price_aed) : null,
        price_negotiable: fields.price_negotiable, additional_price_notes: fields.additional_price_notes || null,
        description: fields.description || null, export_ready: fields.export_ready,
        port_of_loading: fields.port_of_loading || null,
        estimated_delivery_weeks: fields.estimated_delivery_weeks ? parseInt(fields.estimated_delivery_weeks) : null,
        target_markets: fields.target_markets ? fields.target_markets.split(",").map(s => s.trim()).filter(Boolean) : null,
      }).eq("id", vehicleId);
      const result = await approveInspection(inspId);
      if (!result) { toast.error("Approval failed."); setProcessingId(null); return; }
      setStatuses(p => ({ ...p, [inspId]: "approved" }));
      toast.success(`Approved — ${result.certificateUid} is live`);
    } catch { toast.error("An error occurred."); }
    finally { setProcessingId(null); }
  };

  const handleReject = async (inspId: string) => {
    setProcessingId(inspId);
    if (!isSupabaseEnabled) {
      await new Promise(r => setTimeout(r, 400));
      setStatuses(p => ({ ...p, [inspId]: "rejected" }));
      toast.success("Rejected (mock)"); setProcessingId(null); return;
    }
    try {
      const ok = await rejectInspection(inspId, rejectNotes[inspId]);
      if (!ok) { toast.error("Rejection failed."); return; }
      setStatuses(p => ({ ...p, [inspId]: "rejected" }));
      toast.success("Rejected.");
    } catch { toast.error("Error."); }
    finally { setProcessingId(null); setShowReject(p => ({ ...p, [inspId]: false })); }
  };

  if (loading) return <LoadingBox />;
  if (!queue.length) return <SectionEmpty icon={CheckCircle} text="Queue is clear." />;

  return (
    <div className="space-y-4">
      {queue.map(({ inspection, vehicle, photo }) => {
        if (!vehicle || !inspection) return null;
        const status = statuses[inspection.id] || "pending";
        const isProcessing = processingId === inspection.id;
        const fields = listingFields[inspection.id] || emptyListing;
        return (
          <div key={inspection.id} className={`bg-card border rounded-lg overflow-hidden transition-all ${status === "approved" ? "border-emerald-300 bg-emerald-50" : status === "rejected" ? "border-red-300 bg-red-50" : "border-amber-300"}`}>
            <div className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-40 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {photo?.storage_url ? <img src={photo.storage_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Car className="w-6 h-6 text-muted-foreground" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-display font-bold text-base text-foreground">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}</p>
                      <p className="font-mono-data text-[10px] text-muted-foreground">{vehicle.vin}</p>
                    </div>
                    <Badge color={status === "approved" ? "green" : status === "rejected" ? "red" : "yellow"} text={status.toUpperCase()} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    {[{ label: "Mileage", value: `${inspection.mileage.toLocaleString()} km` }, { label: "Rating", value: `${inspection.overall_rating}/5` }, { label: "Inspector", value: inspection.inspector_name }, { label: "Date", value: new Date(inspection.submitted_at).toLocaleDateString() }].map(s => (
                      <div key={s.label}><p className="font-body text-[10px] text-muted-foreground">{s.label}</p><p className="font-mono-data text-xs text-foreground font-semibold mt-0.5">{s.value}</p></div>
                    ))}
                  </div>
                  {inspection.accident_status && (
                    <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded bg-red-50 border border-red-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-700 flex-shrink-0" />
                      <p className="font-body text-xs text-red-700">Accident: {inspection.accident_notes_ko}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Body Condition</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(inspection.body_condition).map(([zone, data]) => (
                    <div key={zone} className="flex items-center gap-1.5 bg-gray-100 rounded px-2 py-1">
                      <span className="font-body text-[10px] text-muted-foreground capitalize">{zone}</span>
                      <span className={`font-mono-data text-[10px] font-bold ${data.rating >= 5 ? "text-emerald-700" : data.rating >= 4 ? "text-blue-700" : "text-amber-700"}`}>{data.rating}/5</span>
                    </div>
                  ))}
                </div>
              </div>
              {status === "pending" && <ListingFieldsForm fields={fields} onChange={f => setListingFields(p => ({ ...p, [inspection.id]: f }))} />}
              {status === "pending" && (
                <div className="border-t border-border pt-4 space-y-3">
                  {showReject[inspection.id] && <textarea className="w-full rounded border border-border bg-background text-sm font-body p-2 min-h-[60px] resize-none outline-none focus:ring-1 focus:ring-red-400" placeholder="Rejection reason (optional)..." value={rejectNotes[inspection.id] || ""} onChange={e => setRejectNotes(p => ({ ...p, [inspection.id]: e.target.value }))} />}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleApprove(inspection.id, vehicle.id)} disabled={isProcessing} className="flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60">
                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve & Publish
                    </button>
                    {!showReject[inspection.id] ? (
                      <button onClick={() => setShowReject(p => ({ ...p, [inspection.id]: true }))} disabled={isProcessing} className="flex items-center gap-1.5 px-4 py-2 rounded bg-red-100 text-red-800 border border-red-300 text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-60">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => handleReject(inspection.id)} disabled={isProcessing} className="flex items-center gap-1.5 px-4 py-2 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-60">
                          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Confirm Reject
                        </button>
                        <button onClick={() => setShowReject(p => ({ ...p, [inspection.id]: false }))} className="px-3 py-2 rounded border border-border text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {status !== "pending" && <div className="border-t border-border pt-3"><button onClick={() => setStatuses(p => ({ ...p, [inspection.id]: "pending" }))} className="text-xs font-body text-muted-foreground hover:text-foreground">↩ Undo</button></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LISTINGS TAB ─────────────────────────────────────────────────────────────

function ListingsTab() {
  const [listings, setListings] = useState<Array<{ vehicle: Vehicle; inspection: Inspection | null; cert: { certificate_uid: string; public_url: string } | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editPrice, setEditPrice] = useState<Record<string, { usd: string; aed: string }>>({});
  const [editDesc, setEditDesc] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => { setLoading(true); setListings(await getAllListings()); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = listings.filter(({ vehicle }) => {
    const q = search.toLowerCase();
    return !q || vehicle.make.toLowerCase().includes(q) || vehicle.model.toLowerCase().includes(q) || vehicle.vin.toLowerCase().includes(q) || String(vehicle.year).includes(q);
  });

  const toggleStatus = async (vin: string, current: string) => {
    const next = current === "active" ? "rejected" : "active";
    setSaving(vin);
    const ok = await updateVehicleStatus(vin, next as any);
    if (ok) { toast.success(`Vehicle ${next === "active" ? "listed ✓" : "unlisted"}`); await load(); } else toast.error("Update failed — check service key env var");
    setSaving(null);
  };

  const toggleTrending = async (vin: string, current: boolean) => {
    setSaving(vin + "_t");
    const ok = await updateVehicleTrending(vin, !current);
    if (ok) { toast.success(!current ? "Marked trending ⭐" : "Removed from trending"); await load(); } else toast.error("Update failed");
    setSaving(null);
  };

  const savePrice = async (vin: string) => {
    const p = editPrice[vin];
    if (!p?.usd) { toast.error("Enter USD price"); return; }
    setSaving(vin + "_p");
    const ok = await updateVehiclePrice(vin, parseInt(p.usd), parseInt(p.aed || String(Math.round(parseInt(p.usd) * 3.67))));
    if (ok) { toast.success("Price updated"); setEditPrice(prev => { const n = { ...prev }; delete n[vin]; return n; }); await load(); } else toast.error("Failed");
    setSaving(null);
  };

  const saveDesc = async (vin: string) => {
    setSaving(vin + "_d");
    const ok = await updateVehicleDescription(vin, editDesc[vin] ?? "");
    if (ok) { toast.success("Description updated"); setEditDesc(prev => { const n = { ...prev }; delete n[vin]; return n; }); await load(); } else toast.error("Failed");
    setSaving(null);
  };

  if (loading) return <LoadingBox />;
  return (
    <div className="space-y-4">
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input placeholder="Search make, model, year, VIN..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" /></div>
      {!filtered.length ? <SectionEmpty icon={Car} text="No vehicles found." /> : (
        <div className="space-y-2">
          {filtered.map(({ vehicle, cert }) => {
            const pe = editPrice[vehicle.vin];
            const de = editDesc[vehicle.vin];
            const isSaving = saving?.startsWith(vehicle.vin);
            return (
              <div key={vehicle.vin} className="bg-card border border-border rounded-lg p-4">
                <div className="flex flex-wrap items-start gap-3 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-bold text-sm text-foreground">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ""}</p>
                      <Badge color={vehicle.status === "active" ? "green" : vehicle.status === "pending" ? "yellow" : "gray"} text={vehicle.status} />
                      {vehicle.trending && <Badge color="yellow" text="⭐ Trending" />}
                    </div>
                    <p className="font-mono-data text-[10px] text-muted-foreground mt-0.5">{vehicle.vin}</p>
                    {cert && <p className="font-mono-data text-[10px] text-blue-700 mt-0.5">{cert.certificate_uid}</p>}
                    {vehicle.description && de === undefined && <p className="text-xs text-muted-foreground mt-1 italic">"{vehicle.description}"</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {/* Trending toggle */}
                    <button onClick={() => toggleTrending(vehicle.vin, vehicle.trending)} disabled={isSaving} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded border font-medium transition-colors ${vehicle.trending ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200" : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"} disabled:opacity-40`}>
                      <Star className={`w-3.5 h-3.5 ${vehicle.trending ? "fill-amber-500" : ""}`} />{vehicle.trending ? "Trending" : "Set Trending"}
                    </button>
                    {/* List/Unlist */}
                    <button onClick={() => toggleStatus(vehicle.vin, vehicle.status)} disabled={isSaving || vehicle.status === "pending"} className={`text-xs px-2.5 py-1 rounded font-medium border transition-colors ${vehicle.status === "active" ? "bg-red-100 text-red-800 border-red-300 hover:bg-red-200" : "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"} disabled:opacity-40`}>
                      {vehicle.status === "active" ? "Unlist" : "List"}
                    </button>
                    {cert && <Link to={cert.public_url} className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 hover:bg-gray-100 transition-colors"><Eye className="w-3.5 h-3.5 text-gray-500" /></Link>}
                  </div>
                </div>

                {/* Price edit */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-0">
                    <p className={labelCls}>Price</p>
                    {pe ? (
                      <div className="flex items-center gap-1">
                        <Input type="number" placeholder="USD" value={pe.usd} onChange={e => setEditPrice(p => ({ ...p, [vehicle.vin]: { usd: e.target.value, aed: String(Math.round(Number(e.target.value) * 3.67)) } }))} className="h-7 w-24 text-xs" />
                        <span className="text-[10px] text-muted-foreground">≈ AED {pe.aed}</span>
                        <button onClick={() => savePrice(vehicle.vin)} disabled={isSaving} className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-medium">Save</button>
                        <button onClick={() => setEditPrice(p => { const n = { ...p }; delete n[vehicle.vin]; return n; })} className="px-2 py-1 rounded border border-border text-[10px]">✕</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono-data text-sm font-bold text-foreground">{vehicle.price_usd ? `$${vehicle.price_usd.toLocaleString()}` : "—"}</span>
                        {vehicle.price_aed && <span className="text-[10px] text-muted-foreground">/ AED {vehicle.price_aed.toLocaleString()}</span>}
                        <button onClick={() => setEditPrice(p => ({ ...p, [vehicle.vin]: { usd: String(vehicle.price_usd ?? ""), aed: String(vehicle.price_aed ?? "") } }))} className="text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>

                  {/* Description edit */}
                  <div className="flex-1 min-w-[200px]">
                    <p className={labelCls}>Description</p>
                    {de !== undefined ? (
                      <div className="flex gap-1">
                        <Input value={de} onChange={e => setEditDesc(p => ({ ...p, [vehicle.vin]: e.target.value }))} className="h-7 text-xs flex-1" placeholder="Buyer-facing description..." />
                        <button onClick={() => saveDesc(vehicle.vin)} disabled={isSaving} className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-medium">Save</button>
                        <button onClick={() => setEditDesc(p => { const n = { ...p }; delete n[vehicle.vin]; return n; })} className="px-2 py-1 rounded border border-border text-[10px]">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setEditDesc(p => ({ ...p, [vehicle.vin]: vehicle.description ?? "" }))} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Pencil className="w-3 h-3" />{vehicle.description ? "Edit description" : "Add description"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CRM TAB ──────────────────────────────────────────────────────────────────

function CrmTab() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", country: "" });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", country: "" });
  const [expandId, setExpandId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [linkVin, setLinkVin] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [b, listings] = await Promise.all([getAllBuyers(), getAllListings()]);
    setBuyers(b);
    setAllVehicles(listings.map(l => l.vehicle));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.name || !form.phone || !form.country) { toast.error("Name, phone, and country required."); return; }
    setSaving(true);
    const result = await createBuyer(form);
    if (result) { toast.success("Client added."); setShowAdd(false); setForm({ name: "", phone: "", country: "" }); await load(); }
    else toast.error("Failed — phone may already exist.");
    setSaving(false);
  };

  const handleEditSave = async (id: string) => {
    setSaving(true);
    const ok = await updateBuyer(id, editForm);
    if (ok) { toast.success("Updated."); setEditId(null); await load(); } else toast.error("Failed.");
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client? This cannot be undone.")) return;
    setDeletingId(id);
    const ok = await deleteBuyer(id);
    if (ok) { toast.success("Client deleted."); await load(); } else toast.error("Failed.");
    setDeletingId(null);
  };

  const handleAssign = async (buyerId: string) => {
    const vin = linkVin[buyerId];
    if (!vin) { toast.error("Select a vehicle to link"); return; }
    const ok = await assignVinToBuyer(buyerId, vin);
    if (ok) { toast.success("Vehicle linked to client"); setLinkVin(p => ({ ...p, [buyerId]: "" })); await load(); } else toast.error("Failed");
  };

  const handleUnassign = async (buyerId: string, vin: string) => {
    const ok = await unassignVinFromBuyer(buyerId, vin);
    if (ok) { toast.success("Vehicle unlinked"); await load(); } else toast.error("Failed");
  };

  const filtered = buyers.filter(b => {
    const q = search.toLowerCase();
    return !q || b.name.toLowerCase().includes(q) || (b.phone ?? "").includes(q) || b.country.toLowerCase().includes(q);
  });

  if (loading) return <LoadingBox />;
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input placeholder="Search name, phone, country..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" /></div>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"><Plus className="w-3.5 h-3.5" /> Add Client</button>
      </div>

      {showAdd && (
        <div className="bg-card border border-blue-200 rounded-lg p-4 space-y-3">
          <p className="text-xs font-display font-semibold text-foreground">New Client</p>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>Full Name *</label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Ahmed Al-Rashid" /></div>
            <div><label className={labelCls}>Phone * (unique)</label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+971 50 000 0000" /></div>
            <div><label className={labelCls}>Country *</label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} className={inputCls} placeholder="UAE" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-600 text-white text-xs font-medium disabled:opacity-60">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Save</button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-2 rounded border border-border text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {!filtered.length ? <SectionEmpty icon={Users} text="No clients yet." /> : (
        <div className="space-y-2">
          {filtered.map(b => (
            <div key={b.id} className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Main row */}
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                {editId === b.id ? (
                  <div className="flex gap-2 flex-1 flex-wrap">
                    <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="h-8 text-xs w-36" placeholder="Name" />
                    <Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="h-8 text-xs w-36" placeholder="Phone" />
                    <Input value={editForm.country} onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))} className="h-8 text-xs w-24" placeholder="Country" />
                    <button onClick={() => handleEditSave(b.id)} disabled={saving} className="px-3 py-1 rounded bg-emerald-600 text-white text-[10px] font-medium">Save</button>
                    <button onClick={() => setEditId(null)} className="px-3 py-1 rounded border border-border text-[10px]">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-sm text-foreground">{b.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono-data"><Phone className="w-3 h-3" />{b.phone ?? "—"}</span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Globe className="w-3 h-3" />{b.country}</span>
                        <span className="text-[10px] text-muted-foreground">{b.assigned_vins.length} vehicle{b.assigned_vins.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setExpandId(expandId === b.id ? null : b.id)} className="px-2 py-1 rounded border border-gray-200 text-[10px] text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
                    {expandId === b.id ? "Collapse" : "Manage VINs"}
                  </button>
                  <button onClick={() => { setEditId(b.id); setEditForm({ name: b.name, phone: b.phone ?? "", country: b.country }); }} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(b.id)} disabled={deletingId === b.id} className="w-7 h-7 rounded hover:bg-red-50 flex items-center justify-center transition-colors group">
                    {deletingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : <Trash2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-red-600 transition-colors" />}
                  </button>
                </div>
              </div>

              {/* Expanded VIN management */}
              {expandId === b.id && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
                  <p className={labelCls}>Linked Vehicles</p>
                  {b.assigned_vins.length === 0 && <p className="text-xs text-muted-foreground">No vehicles linked yet.</p>}
                  <div className="flex flex-wrap gap-2">
                    {b.assigned_vins.map(vin => {
                      const v = allVehicles.find(av => av.vin === vin);
                      return (
                        <div key={vin} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded px-2 py-1">
                          <span className="text-xs font-mono-data text-foreground">{v ? `${v.year} ${v.make} ${v.model}` : vin}</span>
                          <button onClick={() => handleUnassign(b.id, vin)} className="text-muted-foreground hover:text-red-600 transition-colors"><Unlink className="w-3 h-3" /></button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <select value={linkVin[b.id] ?? ""} onChange={e => setLinkVin(p => ({ ...p, [b.id]: e.target.value }))} className="flex-1 rounded h-8 text-xs font-body bg-white border border-border px-2">
                      <option value="">Select vehicle to link...</option>
                      {allVehicles.filter(v => !b.assigned_vins.includes(v.vin)).map(v => <option key={v.vin} value={v.vin}>{v.year} {v.make} {v.model} — {v.vin}</option>)}
                    </select>
                    <button onClick={() => handleAssign(b.id)} className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"><Link2 className="w-3 h-3" /> Link</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TRANSACTIONS TAB ─────────────────────────────────────────────────────────

function TransactionsTab() {
  const [transactions, setTransactions] = useState<Array<Transaction & { buyer: Buyer | null; vehicle: Vehicle | null }>>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [activeVehicles, setActiveVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [lastAccessToken, setLastAccessToken] = useState<AccessTokenResult | null>(null);
  const [form, setForm] = useState({ vin: "", buyer_id: "", purchase_date: "", delivery_date: "", sold_price_usd: "", notes: "", nb_name: "", nb_phone: "", nb_country: "" });
  const [buyerMode, setBuyerMode] = useState<"existing" | "new">("existing");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [txns, b, listings] = await Promise.all([getAllTransactions(), getAllBuyers(), getAllListings()]);
    setTransactions(txns); setBuyers(b);
    setActiveVehicles(listings.map(l => l.vehicle).filter(v => v.status === "active"));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.vin || !form.purchase_date) { toast.error("VIN and purchase date required."); return; }
    setSaving(true);
    let buyerId = form.buyer_id;
    if (buyerMode === "new") {
      if (!form.nb_name || !form.nb_phone || !form.nb_country) { toast.error("Fill all new client fields."); setSaving(false); return; }
      const nb = await createBuyer({ name: form.nb_name, phone: form.nb_phone, country: form.nb_country });
      if (!nb) { toast.error("Failed to create client."); setSaving(false); return; }
      buyerId = nb.id;
    }
    if (!buyerId) { toast.error("Select or create a client."); setSaving(false); return; }
    const result = await createTransaction({ vin: form.vin, buyer_id: buyerId, purchase_date: form.purchase_date, delivery_date: form.delivery_date || undefined, sold_price_usd: form.sold_price_usd ? parseInt(form.sold_price_usd) : undefined, notes: form.notes || undefined });
    if (result) {
      toast.success("Transaction recorded. Vehicle marked sold.");
      setShowForm(false);
      setForm({ vin: "", buyer_id: "", purchase_date: "", delivery_date: "", sold_price_usd: "", notes: "", nb_name: "", nb_phone: "", nb_country: "" });
      if (result.accessToken) setLastAccessToken(result.accessToken);
      await load();
    } else toast.error("Failed.");
    setSaving(false);
  };

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    return !q || t.vin.toLowerCase().includes(q) || (t.vehicle ? `${t.vehicle.make} ${t.vehicle.model} ${t.vehicle.year}`.toLowerCase().includes(q) : false) || (t.buyer?.name ?? "").toLowerCase().includes(q);
  });

  if (loading) return <LoadingBox />;
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input placeholder="Search VIN, car name, client..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" /></div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"><Plus className="w-3.5 h-3.5" /> Mark Car as Sold</button>
      </div>

      {showForm && (
        <div className="bg-card border border-blue-200 rounded-lg p-4 space-y-4">
          <p className="text-xs font-display font-semibold text-foreground">New Transaction</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Vehicle *</label>
              <select value={form.vin} onChange={e => setForm(p => ({ ...p, vin: e.target.value }))} className="w-full rounded h-9 text-sm font-body bg-background border border-border px-3">
                <option value="">Select vehicle...</option>
                {activeVehicles.map(v => <option key={v.vin} value={v.vin}>{v.year} {v.make} {v.model} — {v.vin}</option>)}
              </select>
              {activeVehicles.length === 0 && <p className="text-[10px] text-amber-700 mt-1">No active listings found</p>}
            </div>
            <div><label className={labelCls}>Purchase Date *</label><Input type="date" value={form.purchase_date} onChange={e => setForm(p => ({ ...p, purchase_date: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Delivery Date</label><Input type="date" value={form.delivery_date} onChange={e => setForm(p => ({ ...p, delivery_date: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Sold Price (USD)</label><Input type="number" value={form.sold_price_usd} onChange={e => setForm(p => ({ ...p, sold_price_usd: e.target.value }))} className={`${inputCls} font-mono-data`} placeholder="18500" /></div>
          </div>
          <div>
            <label className={labelCls}>Client</label>
            <div className="flex gap-2 mb-2">
              {(["existing", "new"] as const).map(m => <button key={m} onClick={() => setBuyerMode(m)} className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${buyerMode === m ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{m === "existing" ? "Existing" : "New Client"}</button>)}
            </div>
            {buyerMode === "existing" ? (
              <select value={form.buyer_id} onChange={e => setForm(p => ({ ...p, buyer_id: e.target.value }))} className="w-full rounded h-9 text-sm font-body bg-background border border-border px-3">
                <option value="">Select client...</option>
                {buyers.map(b => <option key={b.id} value={b.id}>{b.name} — {b.phone} ({b.country})</option>)}
              </select>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div><label className={labelCls}>Name *</label><Input value={form.nb_name} onChange={e => setForm(p => ({ ...p, nb_name: e.target.value }))} className={inputCls} placeholder="Ahmed Al-Rashid" /></div>
                <div><label className={labelCls}>Phone *</label><Input value={form.nb_phone} onChange={e => setForm(p => ({ ...p, nb_phone: e.target.value }))} className={inputCls} placeholder="+971..." /></div>
                <div><label className={labelCls}>Country *</label><Input value={form.nb_country} onChange={e => setForm(p => ({ ...p, nb_country: e.target.value }))} className={inputCls} placeholder="UAE" /></div>
              </div>
            )}
          </div>
          <div><label className={labelCls}>Notes</label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="rounded text-sm font-body bg-background border-border min-h-[60px]" placeholder="Optional notes..." /></div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-600 text-white text-xs font-medium disabled:opacity-60">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ReceiptText className="w-3.5 h-3.5" />} Confirm Sale</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-2 rounded border border-border text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Access credentials — shown once after sale */}
      {lastAccessToken && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-display font-bold text-emerald-900">🔐 Tracking Access Generated</p>
            <button onClick={() => setLastAccessToken(null)} className="text-[10px] text-emerald-700 hover:text-emerald-900">Dismiss</button>
          </div>
          <p className="text-xs text-emerald-800 font-body">Send the link to the buyer. Share the password <strong>separately</strong> (e.g. WhatsApp). This is shown only once.</p>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider mb-1">Tracking Link</p>
              <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded px-3 py-2">
                <span className="font-mono-data text-xs text-foreground flex-1 break-all">{window.location.origin}{lastAccessToken.trackingUrl}</span>
                <button onClick={() => { navigator.clipboard.writeText(window.location.origin + lastAccessToken.trackingUrl); toast.success("Link copied!"); }} className="text-[10px] px-2 py-1 rounded bg-emerald-600 text-white font-medium flex-shrink-0">Copy</button>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider mb-1">Password (share separately)</p>
              <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded px-3 py-2">
                <span className="font-mono-data text-sm font-bold text-foreground tracking-widest flex-1">{lastAccessToken.rawPassword}</span>
                <button onClick={() => { navigator.clipboard.writeText(lastAccessToken.rawPassword); toast.success("Password copied!"); }} className="text-[10px] px-2 py-1 rounded bg-emerald-600 text-white font-medium flex-shrink-0">Copy</button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-emerald-700">⚠️ Password is stored hashed — cannot be recovered after dismissal</p>
        </div>
      )}

      {!filtered.length ? <SectionEmpty icon={ReceiptText} text={search ? "No transactions match your search." : "No transactions yet."} /> : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs font-body">
            <THead cols={["Vehicle", "Client", "Purchase Date", "Delivery", "Sold Price", "Notes"]} />
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><p className="font-display font-semibold text-foreground">{t.vehicle ? `${t.vehicle.year} ${t.vehicle.make} ${t.vehicle.model}` : t.vin}</p><p className="font-mono-data text-[10px] text-muted-foreground">{t.vin}</p></td>
                  <td className="px-4 py-3"><p className="font-semibold text-foreground">{t.buyer?.name ?? "—"}</p><p className="text-muted-foreground">{t.buyer?.phone}{t.buyer?.country ? ` · ${t.buyer.country}` : ""}</p></td>
                  <td className="px-4 py-3 text-foreground">{new Date(t.purchase_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.delivery_date ? new Date(t.delivery_date).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 font-mono-data font-bold text-foreground">{t.sold_price_usd ? `$${t.sold_price_usd.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{t.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── ARCHIVE TAB ──────────────────────────────────────────────────────────────

function ArchiveTab() {
  const [data, setData] = useState<Array<{ vehicle: Vehicle; inspection: Inspection | null; transaction: Transaction | null; buyer: Buyer | null }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getArchivedVehicles().then(d => { setData(d); setLoading(false); }); }, []);
  if (loading) return <LoadingBox />;
  if (!data.length) return <SectionEmpty icon={Archive} text="No archived vehicles yet." />;
  return (
    <div className="space-y-3">
      <p className="text-xs font-body text-muted-foreground">{data.length} sold vehicle{data.length !== 1 ? "s" : ""} — full history preserved</p>
      {data.map(({ vehicle, inspection, transaction, buyer }) => (
        <div key={vehicle?.vin} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="font-display font-bold text-foreground">{vehicle?.year} {vehicle?.make} {vehicle?.model}</p><p className="font-mono-data text-[10px] text-muted-foreground">{vehicle?.vin}</p></div>
            <Badge color="gray" text="SOLD" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
            <div><p className={labelCls}>Buyer</p><p className="text-xs font-semibold text-foreground">{buyer?.name ?? "—"}</p></div>
            <div><p className={labelCls}>Phone</p><p className="text-xs font-mono-data text-foreground">{buyer?.phone ?? "—"}</p></div>
            <div><p className={labelCls}>Purchase Date</p><p className="text-xs text-foreground">{transaction?.purchase_date ? new Date(transaction.purchase_date).toLocaleDateString() : "—"}</p></div>
            <div><p className={labelCls}>Sold Price</p><p className="text-xs font-mono-data font-bold text-foreground">{transaction?.sold_price_usd ? `$${transaction.sold_price_usd.toLocaleString()}` : "—"}</p></div>
            {inspection && <>
              <div><p className={labelCls}>Inspector</p><p className="text-xs text-foreground">{inspection.inspector_name}</p></div>
              <div><p className={labelCls}>Mileage</p><p className="text-xs font-mono-data text-foreground">{inspection.mileage.toLocaleString()} km</p></div>
              <div><p className={labelCls}>Rating</p><p className="text-xs font-mono-data font-bold text-foreground">{inspection.overall_rating}/5</p></div>
              <div><p className={labelCls}>Accident</p><p className={`text-xs font-semibold ${inspection.accident_status ? "text-red-700" : "text-emerald-700"}`}>{inspection.accident_status ? "Recorded" : "Clean"}</p></div>
            </>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

type StaffTab = "queue" | "listings" | "crm" | "transactions" | "archive";

const TABS: Array<{ id: StaffTab; label: string; icon: any }> = [
  { id: "queue", label: "Review Queue", icon: Clock },
  { id: "listings", label: "Listings", icon: Car },
  { id: "crm", label: "CRM", icon: Users },
  { id: "transactions", label: "Transactions", icon: ReceiptText },
  { id: "archive", label: "Archive", icon: Archive },
];

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<StaffTab>("queue");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isSupabaseEnabled) { setPendingCount(getMockPending().length); return; }
    getPendingReviews().then(d => setPendingCount(d.length > 0 ? d.length : getMockPending().length));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-card border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">Staff Panel</h1>
            <p className="font-body text-xs text-muted-foreground mt-0.5">Listings · CRM · Transactions · Archive</p>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-mono-data font-semibold border border-amber-300">
              <Clock className="w-3 h-3" /> {pendingCount} pending
            </span>
          )}
        </div>
        <div className="container">
          <div className="flex gap-0 overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-body font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === "queue" && pendingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-mono-data font-bold">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="container py-5 space-y-5">
        {activeTab === "queue" && <QueueTab />}
        {activeTab === "listings" && <ListingsTab />}
        {activeTab === "crm" && <CrmTab />}
        {activeTab === "transactions" && <TransactionsTab />}
        {activeTab === "archive" && <ArchiveTab />}
      </div>
    </div>
  );
}
