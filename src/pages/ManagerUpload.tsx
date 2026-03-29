/**
 * /manager-upload
 *
 * Sales Manager uploads inspection images manually.
 * Each submission creates a new inspection_media record (never overwrites).
 * Supports batch upload per stage.
 */

import { Navbar } from "@/components/Navbar";
import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Image, CheckCircle, Loader2, Search, Camera, MapPin, User, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { isSupabaseEnabled } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "pre_sale" | "pre_shipping" | "post_arrival";

interface MediaFile {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
}

interface VehicleMatch {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  inspectionId: string | null;
}

const STAGES: Array<{ value: Stage; label: string; desc: string }> = [
  { value: "pre_sale", label: "Pre-Sale", desc: "Before listing — initial condition" },
  { value: "pre_shipping", label: "Pre-Shipping", desc: "Before export — loading condition" },
  { value: "post_arrival", label: "Post-Arrival", desc: "After delivery — arrival condition" },
];

const STAGE_COLOR: Record<Stage, string> = {
  pre_sale: "bg-primary/10 text-primary border-primary/30",
  pre_shipping: "bg-[#E8A830]/10 text-[#E8A830] border-[#E8A830]/30",
  post_arrival: "bg-success/10 text-success border-success/30",
};

// ─── Vehicle Search ───────────────────────────────────────────────────────────

function VehicleSearchBox({ onSelect }: { onSelect: (v: VehicleMatch) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VehicleMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<VehicleMatch | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return; }
    setLoading(true);
    if (!isSupabaseEnabled) {
      // Mock fallback
      setResults([{ id: "mock-1", vin: "KMHD84LF0MU000001", make: "Hyundai", model: "Elantra", year: 2022, inspectionId: "mock-insp-1" }]);
      setLoading(false); return;
    }
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: vehicles } = await supabase!
        .from("vehicles")
        .select("id, vin, make, model, year")
        .or(`vin.ilike.%${q}%,make.ilike.%${q}%,model.ilike.%${q}%`)
        .limit(8);

      if (!vehicles?.length) { setResults([]); setLoading(false); return; }

      // Get latest inspection per vehicle
      const vins = vehicles.map(v => v.vin);
      const { data: inspections } = await supabase!
        .from("inspections")
        .select("id, vin")
        .in("vin", vins)
        .order("submitted_at", { ascending: false });

      setResults(vehicles.map(v => ({
        ...v,
        inspectionId: inspections?.find(i => i.vin === v.vin)?.id ?? null,
      })));
    } catch { setResults([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  if (selected) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border border-success/30 bg-success/5">
        <div>
          <p className="font-display font-bold text-sm text-foreground">{selected.year} {selected.make} {selected.model}</p>
          <p className="font-mono-data text-[10px] text-muted-foreground">{selected.vin}</p>
        </div>
        <button onClick={() => { setSelected(null); setQuery(""); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by VIN, make, or model..."
          className="pl-9 h-10 text-sm"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />}
      </div>
      {results.length > 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          {results.map(v => (
            <button key={v.id} onClick={() => { setSelected(v); onSelect(v); setResults([]); }}
              className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
              <p className="font-display font-semibold text-sm text-foreground">{v.year} {v.make} {v.model}</p>
              <p className="font-mono-data text-[10px] text-muted-foreground">{v.vin}</p>
            </button>
          ))}
        </div>
      )}
      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow px-4 py-3">
          <p className="text-xs text-muted-foreground">No vehicles found for "{query}"</p>
        </div>
      )}
    </div>
  );
}

// ─── Image Drop Zone ──────────────────────────────────────────────────────────

function DropZone({ files, onAdd, onRemove, onCaptionChange }: {
  files: MediaFile[];
  onAdd: (files: MediaFile[]) => void;
  onRemove: (id: string) => void;
  onCaptionChange: (id: string, caption: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFiles = (raw: FileList | null) => {
    if (!raw) return;
    const newFiles: MediaFile[] = Array.from(raw)
      .filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"))
      .map(f => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        previewUrl: URL.createObjectURL(f),
        caption: "",
      }));
    if (!newFiles.length) { toast.error("Only images and videos are accepted."); return; }
    onAdd(newFiles);
  };

  return (
    <div className="space-y-3">
      {/* Drop area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
      >
        <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="font-body text-sm font-medium text-foreground">Drop images here or click to browse</p>
        <p className="font-body text-xs text-muted-foreground mt-1">Supports JPG, PNG, WebP, MP4 — batch upload supported</p>
        <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => processFiles(e.target.files)} />
      </div>

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {files.map(f => (
            <div key={f.id} className="group relative bg-muted rounded-lg overflow-hidden border border-border">
              {f.file.type.startsWith("video/") ? (
                <div className="w-full h-28 flex items-center justify-center bg-muted">
                  <div className="text-center"><Camera className="w-6 h-6 text-muted-foreground mx-auto" /><p className="text-[10px] text-muted-foreground mt-1">Video</p></div>
                </div>
              ) : (
                <img src={f.previewUrl} alt="" className="w-full h-28 object-cover" />
              )}
              <button onClick={() => onRemove(f.id)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
              <div className="p-1.5">
                <input
                  value={f.caption}
                  onChange={e => onCaptionChange(f.id, e.target.value)}
                  placeholder="Caption (optional)"
                  className="w-full text-[10px] font-body bg-transparent border-0 outline-none text-muted-foreground placeholder:text-muted-foreground/50 focus:text-foreground"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManagerUpload() {
  const [vehicle, setVehicle] = useState<VehicleMatch | null>(null);
  const [stage, setStage] = useState<Stage>("pre_sale");
  const [location, setLocation] = useState("");
  const [inspectorName, setInspectorName] = useState("");
  const [timestamp, setTimestamp] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const addFiles = (newFiles: MediaFile[]) => setFiles(prev => [...prev, ...newFiles]);
  const removeFile = (id: string) => setFiles(prev => { const f = prev.find(f => f.id === id); if (f) URL.revokeObjectURL(f.previewUrl); return prev.filter(f => f.id !== id); });
  const updateCaption = (id: string, caption: string) => setFiles(prev => prev.map(f => f.id === id ? { ...f, caption } : f));

  const handleSubmit = async () => {
    if (!vehicle) { toast.error("Select a vehicle first."); return; }
    if (!files.length) { toast.error("Add at least one image."); return; }
    if (!inspectorName.trim()) { toast.error("Enter the inspector / source name."); return; }

    setSubmitting(true);

    if (!isSupabaseEnabled) {
      await new Promise(r => setTimeout(r, 1200));
      toast.success(`Uploaded ${files.length} file${files.length !== 1 ? "s" : ""} (mock mode — not saved)`);
      setSubmitting(false);
      setSubmitted(true);
      return;
    }

    try {
      const { supabase } = await import("@/lib/supabase");
      if (!supabase) throw new Error("Supabase not available");

      // Use existing inspection or we'll create a media-only upload
      const inspectionId = vehicle.inspectionId;
      if (!inspectionId) {
        toast.error("This vehicle has no inspection record yet. Submit a full inspection first.");
        setSubmitting(false);
        return;
      }

      let successCount = 0;

      for (let i = 0; i < files.length; i++) {
        const { file, caption } = files[i];
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${vehicle.vin}/${inspectionId}/${stage}_${Date.now()}_${i}.${ext}`;

        const { data: upload, error: uploadErr } = await supabase.storage
          .from("inspection-media")
          .upload(path, file, { upsert: false });

        if (uploadErr || !upload) continue;

        const { data: { publicUrl } } = supabase.storage
          .from("inspection-media")
          .getPublicUrl(path);

        const { error: insertErr } = await supabase.from("inspection_media").insert({
          vin: vehicle.vin,
          inspection_id: inspectionId,
          type: file.type.startsWith("video/") ? "video" : "image",
          visibility: "internal",
          storage_url: publicUrl,
          thumbnail_url: publicUrl,
          sort_order: i,
          uploaded_by: null,
          caption: caption || `${stage} — ${inspectorName} — ${location || ""}`.trim(),
        });

        if (!insertErr) successCount++;
      }

      // Write audit log
      await supabase.from("audit_logs").insert({
        entity: "inspection_media",
        entity_id: inspectionId,
        action: `manager_upload_${stage}`,
        performed_by: null,
        performed_by_email: "manager@ss-trading.com",
        changes: { files: successCount, stage, location, inspector: inspectorName },
      });

      if (successCount === 0) {
        toast.error("Upload failed — check storage bucket permissions.");
      } else {
        toast.success(`${successCount} of ${files.length} file${files.length !== 1 ? "s" : ""} uploaded successfully.`);
        setSubmitted(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Check console.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setVehicle(null); setFiles([]); setStage("pre_sale");
    setLocation(""); setInspectorName(""); setNotes("");
    setTimestamp(new Date().toISOString().slice(0, 16));
    setSubmitted(false);
  };

  // ── Success state ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="font-display font-bold text-xl text-foreground mb-2">Upload Complete</h2>
          <p className="font-body text-sm text-muted-foreground mb-2">
            {files.length} file{files.length !== 1 ? "s" : ""} uploaded for{" "}
            <span className="font-semibold text-foreground">{vehicle?.year} {vehicle?.make} {vehicle?.model}</span>
          </p>
          <p className="font-body text-xs text-muted-foreground mb-8">
            Stage: <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono-data font-semibold border ${STAGE_COLOR[stage]}`}>{stage.replace("_", " ").toUpperCase()}</span>
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleReset} className="px-5 py-2.5 rounded bg-primary text-white text-sm font-body font-medium hover:bg-primary/90 transition-colors">
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-foreground">Manager Upload</h1>
              <p className="font-body text-xs text-muted-foreground">Upload inspection images by stage — each upload creates a new record</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 max-w-2xl space-y-6">

        {/* Step 1 — Vehicle */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">1</span>
            <p className="font-display font-semibold text-sm text-foreground">Select Vehicle</p>
          </div>
          <VehicleSearchBox onSelect={v => setVehicle(v)} />
        </div>

        {/* Step 2 — Stage */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">2</span>
            <p className="font-display font-semibold text-sm text-foreground">Inspection Stage</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {STAGES.map(s => (
              <button key={s.value} onClick={() => setStage(s.value)}
                className={`p-3 rounded-lg border text-left transition-all ${stage === s.value ? `${STAGE_COLOR[s.value]} border` : "border-border hover:bg-muted/30"}`}>
                <p className="font-display font-semibold text-xs text-foreground">{s.label}</p>
                <p className="font-body text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3 — Details */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">3</span>
            <p className="font-display font-semibold text-sm text-foreground">Details</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-body font-medium text-muted-foreground mb-1 block uppercase tracking-wider">
                <User className="w-3 h-3 inline mr-1" />Inspector / Source *
              </label>
              <Input value={inspectorName} onChange={e => setInspectorName(e.target.value)} placeholder="Kim Jae-won" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-body font-medium text-muted-foreground mb-1 block uppercase tracking-wider">
                <MapPin className="w-3 h-3 inline mr-1" />Location
              </label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Busan port / Seoul depot" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-body font-medium text-muted-foreground mb-1 block uppercase tracking-wider">
                <Calendar className="w-3 h-3 inline mr-1" />Date & Time
              </label>
              <Input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-body font-medium text-muted-foreground mb-1 block uppercase tracking-wider">Notes</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="General notes about this upload batch..." className="text-sm min-h-[60px] resize-none" />
          </div>
        </div>

        {/* Step 4 — Images */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">4</span>
              <p className="font-display font-semibold text-sm text-foreground">Upload Images</p>
            </div>
            {files.length > 0 && <span className="text-xs font-mono-data text-muted-foreground">{files.length} file{files.length !== 1 ? "s" : ""} selected</span>}
          </div>
          <DropZone files={files} onAdd={addFiles} onRemove={removeFile} onCaptionChange={updateCaption} />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || !vehicle || !files.length || !inspectorName.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded bg-primary text-white font-display font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload {files.length > 0 ? `${files.length} File${files.length !== 1 ? "s" : ""}` : "Files"}</>}
          </button>
          {(vehicle || files.length > 0) && (
            <button onClick={handleReset} className="text-xs font-body text-muted-foreground hover:text-foreground transition-colors">Clear all</button>
          )}
        </div>

        {/* Validation hints */}
        {(!vehicle || !files.length || !inspectorName.trim()) && (
          <div className="text-xs font-body text-muted-foreground space-y-1">
            {!vehicle && <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />Select a vehicle</p>}
            {!inspectorName.trim() && <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />Enter inspector name</p>}
            {!files.length && <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />Add at least one image</p>}
          </div>
        )}
      </div>
    </div>
  );
}
