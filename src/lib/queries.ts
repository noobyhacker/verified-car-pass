/**
 * src/lib/queries.ts
 *
 * Public data-fetching (anon key — safe in browser).
 * Admin mutations are in src/lib/adminApi.ts → /api/admin (server-side).
 */

import { supabase, isSupabaseEnabled } from "./supabase";
import type {
  CarPageData,
  CatalogEntry,
  PendingReview,
  EvidenceBundle,
  InspectionMedia,
  Vehicle,
  Inspection,
  Certificate,
  Buyer,
  Transaction,
  AppUser,
  AuditLog,
} from "./types";

// Re-export admin mutations from adminApi so existing imports still work
export {
  updateVehicleStatus, updateVehicleTrending, updateVehiclePrice, updateVehicleDescription,
  approveInspection, rejectInspection,
  createBuyer, updateBuyer, deleteBuyer, assignVinToBuyer, unassignVinFromBuyer,
  createTransaction,
  createAppUser, updateAppUserRole, deleteAppUser,
  validateAndFetchTracking,
  type AccessTokenResult,
} from "./adminApi";

// Lazy-load mockData so it tree-shakes out in production with Supabase enabled
const mock = () => import("@/data/mockData");

// ─── Public certificate page ──────────────────────────────────────────────────

export async function getCarDataBySlug(slug: string): Promise<CarPageData | null> {
  if (!isSupabaseEnabled) {
    const m = await mock();
    const data = m.getCarDataBySlug(slug);
    if (!data || !data.vehicle || !data.inspection || !data.certificate) return null;
    // Adapt mock media to typed InspectionMedia (add missing fields with defaults)
    const media = data.media.map((med) => ({
      ...med,
      visibility: "public" as const,
      uploaded_by: null,
      caption: null,
      created_at: data.inspection!.submitted_at,
    }));
    return {
      vehicle: data.vehicle as unknown as Vehicle,
      inspection: data.inspection as unknown as Inspection,
      certificate: data.certificate as unknown as Certificate,
      media,
      translations: data.translations as unknown as CarPageData["translations"],
      options: data.options,
    };
  }

  // ── Supabase path ──
  const { data: inspection, error: iErr } = await supabase!
    .from("inspections")
    .select("*")
    .eq("public_slug", slug)
    .eq("admin_status", "approved")
    .single();

  if (iErr || !inspection) return null;

  const [vehicleRes, certRes, mediaRes, transRes, optionsRes] = await Promise.all([
    supabase!.from("vehicles").select("*").eq("vin", inspection.vin).single(),
    supabase!.from("certificates").select("*").eq("inspection_id", inspection.id).single(),
    supabase!.from("inspection_media").select("*").eq("inspection_id", inspection.id).eq("visibility", "public").order("sort_order"),
    supabase!.from("inspection_translations").select("*").eq("inspection_id", inspection.id),
    supabase!.from("vehicle_options").select("options").eq("inspection_id", inspection.id).single(),
  ]);

  if (!vehicleRes.data || !certRes.data) return null;

  return {
    vehicle: vehicleRes.data,
    inspection,
    certificate: certRes.data,
    media: mediaRes.data ?? [],
    translations: transRes.data ?? [],
    options: optionsRes.data?.options ?? {},
  };
}

// ─── Public catalog ───────────────────────────────────────────────────────────

export async function getCatalogVehicles(): Promise<CatalogEntry[]> {
  if (!isSupabaseEnabled) {
    const m = await mock();
    return m.getInspectedVehicles().map(({ vehicle, inspection, cert, photo }) => ({
      vehicle: vehicle as unknown as Vehicle,
      inspection: inspection as unknown as Inspection,
      certificate: cert as unknown as Certificate,
      photo: photo
        ? ({ ...photo, visibility: "public" as const, uploaded_by: null, caption: null, created_at: inspection!.submitted_at } as InspectionMedia)
        : null,
    }));
  }

  const { data: inspections } = await supabase!
    .from("inspections")
    .select("*")
    .eq("admin_status", "approved")
    .order("submitted_at", { ascending: false });

  if (!inspections?.length) return [];

  const vins = [...new Set(inspections.map((i) => i.vin))];

  const [vehiclesRes, certsRes, mediaRes] = await Promise.all([
    supabase!.from("vehicles").select("*").in("vin", vins),
    supabase!.from("certificates").select("*").in("vin", vins),
    supabase!.from("inspection_media").select("*").in("vin", vins).eq("visibility", "public").eq("type", "image").eq("sort_order", 1),
  ]);

  const vehicles = vehiclesRes.data ?? [];
  const certs = certsRes.data ?? [];
  const photos = mediaRes.data ?? [];

  return inspections.flatMap((ins) => {
    const vehicle = vehicles.find((v) => v.vin === ins.vin);
    const certificate = certs.find((c) => c.inspection_id === ins.id);
    if (!vehicle || !certificate) return [];
    const photo = photos.find((p) => p.vin === ins.vin) ?? null;
    return [{ vehicle, inspection: ins, certificate, photo }];
  });
}

// ─── Admin: pending review queue ─────────────────────────────────────────────

export async function getPendingReviews(): Promise<PendingReview[]> {
  if (!isSupabaseEnabled) {
    const m = await mock();
    return m.getPendingReviews().map(({ inspection, vehicle, photo }) => ({
      inspection: inspection as unknown as Inspection,
      vehicle: vehicle as unknown as Vehicle,
      photo: photo
        ? ({ ...photo, visibility: "public" as const, uploaded_by: null, caption: null, created_at: inspection!.submitted_at } as InspectionMedia)
        : null,
    }));
  }

  const { data: inspections } = await supabase!
    .from("inspections")
    .select("*")
    .eq("admin_status", "pending")
    .order("submitted_at", { ascending: true });

  if (!inspections?.length) return [];

  const vins = [...new Set(inspections.map((i) => i.vin))];

  const [vehiclesRes, mediaRes] = await Promise.all([
    supabase!.from("vehicles").select("*").in("vin", vins),
    supabase!.from("inspection_media").select("*").in("vin", vins).eq("type", "image").order("sort_order"),
  ]);

  const vehicles = vehiclesRes.data ?? [];
  const photos = mediaRes.data ?? [];

  return inspections.flatMap((ins) => {
    const vehicle = vehicles.find((v) => v.vin === ins.vin);
    if (!vehicle) return [];
    const photo = photos.find((p) => p.vin === ins.vin) ?? null;
    return [{ inspection: ins, vehicle, photo }];
  });
}

// ─── Inspector: submit new inspection ────────────────────────────────────────

export async function submitInspection(
  draft: Omit<Inspection, "id" | "submitted_at" | "locked_at" | "admin_status" | "admin_notes">,
  mediaFiles: Array<{ file: File; visibility: "public" | "internal"; caption?: string }>
): Promise<{ slug: string; certUid: string } | null> {
  if (!isSupabaseEnabled) {
    // Dev mode — just return a fake slug as before
    const { nanoid } = await import("nanoid");
    const slug = nanoid(6).toLowerCase();
    return { slug, certUid: `SST-DEV-${nanoid(6).toUpperCase()}` };
  }

  // 1. Upsert vehicle record
  await supabase!.from("vehicles").upsert({
    vin: draft.vin,
    plate_number: draft.vin, // will be overwritten by plate lookup
    make: draft.vin,         // placeholder — real data from InspectorPage draft
    model: "",
    year: 0,
    fuel_type: "",
    transmission: "",
    drivetrain: "",
    engine_cc: 0,
    color: "",
    status: "pending",
    trending: false,
  }, { onConflict: "vin", ignoreDuplicates: true });

  // 2. Insert inspection
  const { data: ins, error: insErr } = await supabase!
    .from("inspections")
    .insert({ ...draft, admin_status: "pending" })
    .select("id, public_slug")
    .single();

  if (insErr || !ins) return null;

  // 3. Upload media to Supabase Storage and insert media records
  for (let i = 0; i < mediaFiles.length; i++) {
    const { file, visibility, caption } = mediaFiles[i];
    const ext = file.name.split(".").pop();
    const path = `${draft.vin}/${ins.id}/${i}.${ext}`;

    const { data: upload } = await supabase!.storage
      .from("inspection-media")
      .upload(path, file, { upsert: true });

    if (!upload) continue;

    const { data: { publicUrl } } = supabase!.storage
      .from("inspection-media")
      .getPublicUrl(path);

    await supabase!.from("inspection_media").insert({
      vin: draft.vin,
      inspection_id: ins.id,
      type: file.type.startsWith("video/") ? "video" : "image",
      visibility,
      storage_url: publicUrl,
      thumbnail_url: publicUrl,
      sort_order: i,
      uploaded_by: draft.inspector_id,
      caption: caption ?? null,
    });
  }

  return { slug: ins.public_slug, certUid: "" };
}

// ─── Evidence: internal media for a vehicle ───────────────────────────────────

export async function getEvidenceBundle(vin: string): Promise<EvidenceBundle | null> {
  if (!isSupabaseEnabled) {
    console.warn("getEvidenceBundle: Supabase not enabled");
    return null;
  }

  const [vehicleRes, eventsRes, mediaRes, inspRes] = await Promise.all([
    supabase!.from("vehicles").select("*").eq("vin", vin).single(),
    supabase!.from("evidence_events").select("*").eq("vin", vin).order("created_at", { ascending: false }),
    supabase!.from("inspection_media").select("*").eq("vin", vin).eq("visibility", "internal").order("created_at", { ascending: false }),
    supabase!.from("inspections").select("*").eq("vin", vin).order("submitted_at", { ascending: false }),
  ]);

  if (!vehicleRes.data) return null;

  return {
    vehicle: vehicleRes.data,
    events: eventsRes.data ?? [],
    media: mediaRes.data ?? [],
    inspections: inspRes.data ?? [],
  };
}

export async function addEvidenceMedia(
  vin: string,
  inspectionId: string,
  file: File,
  caption?: string
): Promise<InspectionMedia | null> {
  if (!isSupabaseEnabled) return null;

  const ext = file.name.split(".").pop();
  const path = `evidence/${vin}/${Date.now()}.${ext}`;

  const { data: upload } = await supabase!.storage
    .from("inspection-media")
    .upload(path, file, { upsert: true });

  if (!upload) return null;

  const { data: { publicUrl } } = supabase!.storage
    .from("inspection-media")
    .getPublicUrl(path);

  const { data, error } = await supabase!.from("inspection_media").insert({
    vin,
    inspection_id: inspectionId,
    type: file.type.startsWith("video/") ? "video" : "image",
    visibility: "internal",
    storage_url: publicUrl,
    thumbnail_url: publicUrl,
    sort_order: 0,
    caption: caption ?? null,
    uploaded_by: null,
  }).select("*").single();

  return error ? null : data;
}

// ─── Trending vehicles for landing page ──────────────────────────────────────

export async function getTrendingVehicles(): Promise<CatalogEntry[]> {
  if (!isSupabaseEnabled) {
    const m = await mock();
    return m.getTrendingVehicles().map(({ vehicle, inspection, cert, photo }) => ({
      vehicle: vehicle as unknown as Vehicle,
      inspection: inspection as unknown as Inspection,
      certificate: cert as unknown as Certificate,
      photo: photo
        ? ({ ...photo, visibility: "public" as const, uploaded_by: null, caption: null, created_at: inspection!.submitted_at } as InspectionMedia)
        : null,
    }));
  }

  const { data: vehicles } = await supabase!
    .from("vehicles")
    .select("*")
    .eq("status", "active")
    .eq("trending", true)
    .limit(6);

  if (!vehicles?.length) return [];

  const vins = vehicles.map((v) => v.vin);

  const [inspRes, certsRes, mediaRes] = await Promise.all([
    supabase!.from("inspections").select("*").in("vin", vins).eq("admin_status", "approved"),
    supabase!.from("certificates").select("*").in("vin", vins),
    supabase!.from("inspection_media").select("*").in("vin", vins).eq("visibility", "public").eq("type", "image").eq("sort_order", 1),
  ]);

  return vehicles.flatMap((vehicle) => {
    const inspection = (inspRes.data ?? []).find((i) => i.vin === vehicle.vin);
    const certificate = (certsRes.data ?? []).find((c) => c.vin === vehicle.vin);
    if (!inspection || !certificate) return [];
    const photo = (mediaRes.data ?? []).find((p) => p.vin === vehicle.vin) ?? null;
    return [{ vehicle, inspection, certificate, photo }];
  });
}
// ─── Public: submit inquiry (contact form, no auth) ───────────────────────────

export interface InquiryInput {
  vin?: string;
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  message?: string;
  language?: string;
}

export async function submitInquiry(input: InquiryInput): Promise<{ id: string } | null> {
  if (!isSupabaseEnabled) {
    console.warn("submitInquiry: Supabase not enabled, no-op in dev mode");
    return { id: "dev-inquiry-" + Date.now() };
  }

  const { data, error } = await supabase!
    .from("inquiry_submissions")
    .insert({
      vin: input.vin ?? null,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      country: input.country ?? null,
      message: input.message ?? null,
      language: input.language ?? "en",
      converted_to_lead_id: null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("submitInquiry error:", error.message);
    return null;
  }

  return { id: data.id };
}

// ─── Admin: audit logs ────────────────────────────────────────────────────────

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  if (!isSupabaseEnabled) return [];
  const { data } = await supabase!.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as AuditLog[];
}

// ─── Admin: archive (sold vehicles) ──────────────────────────────────────────

export async function getArchivedVehicles(): Promise<Array<{ vehicle: Vehicle; inspection: Inspection | null; transaction: Transaction | null; buyer: Buyer | null }>> {
  if (!isSupabaseEnabled) return [];
  // "sold" = vehicle status is not active (we use rejected as sold flag for now, or we can filter by having a transaction)
  const { data: txns } = await supabase!.from("transactions").select("*").order("created_at", { ascending: false });
  if (!txns?.length) return [];
  const vins = [...new Set(txns.map((t) => t.vin))];
  const buyerIds = [...new Set(txns.map((t) => t.buyer_id))];
  const [vehiclesRes, inspRes, buyersRes] = await Promise.all([
    supabase!.from("vehicles").select("*").in("vin", vins),
    supabase!.from("inspections").select("*").in("vin", vins).eq("admin_status", "approved"),
    supabase!.from("buyers").select("*").in("id", buyerIds),
  ]);
  return txns.map((txn) => ({
    vehicle: (vehiclesRes.data ?? []).find((v) => v.vin === txn.vin) ?? null,
    inspection: (inspRes.data ?? []).find((i) => i.vin === txn.vin) ?? null,
    transaction: txn,
    buyer: (buyersRes.data ?? []).find((b) => b.id === txn.buyer_id) ?? null,
  })).filter((r) => r.vehicle) as any;
}
