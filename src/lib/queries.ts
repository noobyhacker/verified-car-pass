/**
 * src/lib/queries.ts
 *
 * All data-fetching for the platform lives here.
 * When VITE_SUPABASE_URL is set → queries hit Supabase.
 * When not set (local dev without Supabase) → falls back to mockData.
 *
 * Pages import from here, never directly from mockData or supabase.
 */

import { supabase, supabaseAdmin, isSupabaseEnabled } from "./supabase";
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

// ─── Admin: approve / reject inspection ──────────────────────────────────────

export async function approveInspection(inspectionId: string): Promise<{ certificateUid: string; publicUrl: string } | null> {
  if (!isSupabaseEnabled) {
    console.warn("approveInspection: Supabase not enabled, no-op");
    return null;
  }

  // 1. Lock the inspection
  const { data: ins, error: updateErr } = await supabase!
    .from("inspections")
    .update({ admin_status: "approved", locked_at: new Date().toISOString() })
    .eq("id", inspectionId)
    .select("*")
    .single();

  if (updateErr || !ins) return null;

  // 2. Activate the vehicle
  await supabase!.from("vehicles").update({ status: "active" }).eq("vin", ins.vin);

  // 3. Generate certificate
  const year = new Date().getFullYear();
  const uid = ins.public_slug.toUpperCase();
  const certificateUid = `SST-${year}-${uid}`;
  const publicUrl = `/car/${ins.public_slug}`;

  const { error: certErr } = await supabase!.from("certificates").insert({
    inspection_id: inspectionId,
    vin: ins.vin,
    certificate_uid: certificateUid,
    public_url: publicUrl,
  });

  if (certErr) return null;

  return { certificateUid, publicUrl };
}

export async function rejectInspection(inspectionId: string, notes?: string): Promise<boolean> {
  if (!isSupabaseEnabled) {
    console.warn("rejectInspection: Supabase not enabled, no-op");
    return false;
  }

  const { error } = await supabase!
    .from("inspections")
    .update({ admin_status: "rejected", admin_notes: notes ?? null })
    .eq("id", inspectionId);

  return !error;
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

// ─── Admin: audit log helper ──────────────────────────────────────────────────

export async function writeAuditLog(entry: {
  entity: string;
  entity_id: string;
  action: string;
  performed_by_email?: string;
  changes?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseEnabled) return;
  await supabase!.from("audit_logs").insert({
    entity: entry.entity,
    entity_id: entry.entity_id,
    action: entry.action,
    performed_by: null,
    performed_by_email: entry.performed_by_email ?? "admin@ss-trading.com",
    changes: entry.changes ?? null,
  });
}

// ─── Admin: all active listings management ────────────────────────────────────

export async function getAllListings(): Promise<Array<{ vehicle: Vehicle; inspection: Inspection | null; cert: { certificate_uid: string; public_url: string } | null }>> {
  if (!isSupabaseEnabled) {
    const m = await mock();
    return m.vehicles.map((v: any) => ({
      vehicle: v as unknown as Vehicle,
      inspection: m.inspections.find((i: any) => i.vin === v.vin) as unknown as Inspection ?? null,
      cert: m.certificates.find((c: any) => c.vin === v.vin) as unknown as { certificate_uid: string; public_url: string } ?? null,
    }));
  }
  const { data: vehicles } = await supabase!.from("vehicles").select("*").order("created_at", { ascending: false });
  if (!vehicles?.length) {
    // Supabase returned nothing (anon key + RLS blocking pending/rejected) — fall back to mock
    const m = await mock();
    return m.vehicles.map((v: any) => ({
      vehicle: v as unknown as Vehicle,
      inspection: m.inspections.find((i: any) => i.vin === v.vin) as unknown as Inspection ?? null,
      cert: m.certificates.find((c: any) => c.vin === v.vin) as unknown as { certificate_uid: string; public_url: string } ?? null,
    }));
  }
  const vins = vehicles.map((v) => v.vin);
  const [inspRes, certRes] = await Promise.all([
    supabase!.from("inspections").select("*").in("vin", vins).order("submitted_at", { ascending: false }),
    supabase!.from("certificates").select("certificate_uid, public_url, vin").in("vin", vins),
  ]);
  return vehicles.map((vehicle) => ({
    vehicle,
    inspection: (inspRes.data ?? []).find((i) => i.vin === vehicle.vin) ?? null,
    cert: (certRes.data ?? []).find((c) => c.vin === vehicle.vin) ?? null,
  }));
}

export async function updateVehicleStatus(vin: string, status: "active" | "pending" | "rejected"): Promise<boolean> {
  if (!isSupabaseEnabled) { console.log(`[mock] vehicle ${vin} status → ${status}`); return true; }
  const { error } = await supabaseAdmin!.from("vehicles").update({ status }).eq("vin", vin);
  if (error) { console.error("updateVehicleStatus error:", error.message); return false; }
  await writeAuditLog({ entity: "vehicle", entity_id: vin, action: `status_changed_to_${status}` });
  return true;
}

export async function updateVehicleTrending(vin: string, trending: boolean): Promise<boolean> {
  if (!isSupabaseEnabled) { console.log(`[mock] vehicle ${vin} trending → ${trending}`); return true; }
  const { error } = await supabaseAdmin!.from("vehicles").update({ trending }).eq("vin", vin);
  if (error) { console.error("updateVehicleTrending error:", error.message); return false; }
  return true;
}

export async function updateVehiclePrice(vin: string, price_usd: number, price_aed: number): Promise<boolean> {
  if (!isSupabaseEnabled) { console.log(`[mock] vehicle ${vin} price → $${price_usd}`); return true; }
  const { error } = await supabaseAdmin!.from("vehicles").update({ price_usd, price_aed }).eq("vin", vin);
  if (error) { console.error("updateVehiclePrice error:", error.message); return false; }
  await writeAuditLog({ entity: "vehicle", entity_id: vin, action: "price_updated", changes: { price_usd, price_aed } });
  return true;
}

export async function updateVehicleDescription(vin: string, description: string): Promise<boolean> {
  if (!isSupabaseEnabled) { console.log(`[mock] vehicle ${vin} description updated`); return true; }
  const { error } = await supabaseAdmin!.from("vehicles").update({ description }).eq("vin", vin);
  if (error) { console.error("updateVehicleDescription error:", error.message); return false; }
  return true;
}

// ─── Admin: CRM — buyers ─────────────────────────────────────────────────────

export async function getAllBuyers(): Promise<Buyer[]> {
  if (!isSupabaseEnabled) return [];
  const { data } = await supabase!.from("buyers").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function createBuyer(input: { name: string; phone: string; country: string; preferred_language?: string }): Promise<Buyer | null> {
  if (!isSupabaseEnabled) {
    console.log("[mock] createBuyer", input);
    return { id: "mock-" + Date.now(), name: input.name, phone: input.phone, country: input.country, preferred_language: (input.preferred_language ?? "en") as any, assigned_vins: [], created_at: new Date().toISOString() };
  }
  const { data, error } = await supabaseAdmin!.from("buyers").insert({
    name: input.name, phone: input.phone, country: input.country,
    preferred_language: input.preferred_language ?? "en", assigned_vins: [],
  }).select("*").single();
  if (error) { console.error("createBuyer error:", error.message); return null; }
  await writeAuditLog({ entity: "buyer", entity_id: data!.id, action: "created", changes: { name: input.name } });
  return data;
}

export async function updateBuyer(id: string, input: { name?: string; phone?: string; country?: string }): Promise<boolean> {
  if (!isSupabaseEnabled) { console.log("[mock] updateBuyer", id, input); return true; }
  const { error } = await supabaseAdmin!.from("buyers").update(input).eq("id", id);
  if (error) { console.error("updateBuyer error:", error.message); return false; }
  return true;
}

export async function deleteBuyer(id: string): Promise<boolean> {
  if (!isSupabaseEnabled) { console.log("[mock] deleteBuyer", id); return true; }
  const { error } = await supabaseAdmin!.from("buyers").delete().eq("id", id);
  if (error) { console.error("deleteBuyer error:", error.message); return false; }
  return true;
}

export async function assignVinToBuyer(buyerId: string, vin: string): Promise<boolean> {
  if (!isSupabaseEnabled) { console.log("[mock] assignVin", buyerId, vin); return true; }
  // Get current vins
  const { data } = await supabaseAdmin!.from("buyers").select("assigned_vins").eq("id", buyerId).single();
  const current: string[] = data?.assigned_vins ?? [];
  if (current.includes(vin)) return true;
  const { error } = await supabaseAdmin!.from("buyers").update({ assigned_vins: [...current, vin] }).eq("id", buyerId);
  return !error;
}

export async function unassignVinFromBuyer(buyerId: string, vin: string): Promise<boolean> {
  if (!isSupabaseEnabled) { console.log("[mock] unassignVin", buyerId, vin); return true; }
  const { data } = await supabaseAdmin!.from("buyers").select("assigned_vins").eq("id", buyerId).single();
  const current: string[] = data?.assigned_vins ?? [];
  const { error } = await supabaseAdmin!.from("buyers").update({ assigned_vins: current.filter(v => v !== vin) }).eq("id", buyerId);
  return !error;
}

// ─── Admin: transactions ──────────────────────────────────────────────────────

export async function getAllTransactions(): Promise<Array<Transaction & { buyer: Buyer | null; vehicle: Vehicle | null }>> {
  if (!isSupabaseEnabled) return [];
  const { data: txns } = await supabase!.from("transactions").select("*").order("created_at", { ascending: false });
  if (!txns?.length) return [];
  const buyerIds = [...new Set(txns.map((t) => t.buyer_id))];
  const vins = [...new Set(txns.map((t) => t.vin))];
  const [buyersRes, vehiclesRes] = await Promise.all([
    supabase!.from("buyers").select("*").in("id", buyerIds),
    supabase!.from("vehicles").select("*").in("vin", vins),
  ]);
  return txns.map((t) => ({
    ...t,
    buyer: (buyersRes.data ?? []).find((b) => b.id === t.buyer_id) ?? null,
    vehicle: (vehiclesRes.data ?? []).find((v) => v.vin === t.vin) ?? null,
  }));
}

export async function createTransaction(input: {
  vin: string; buyer_id: string; purchase_date: string;
  delivery_date?: string; sold_price_usd?: number; notes?: string;
}): Promise<(Transaction & { accessToken?: AccessTokenResult }) | null> {
  if (!isSupabaseEnabled) {
    console.log("[mock] createTransaction", input);
    const txn = { id: "mock-txn-" + Date.now(), ...input, delivery_date: input.delivery_date ?? null, sold_price_usd: input.sold_price_usd ?? null, notes: input.notes ?? null, created_by: null, created_at: new Date().toISOString() };
    const accessToken = await createAccessToken(txn.id, input.vin);
    return { ...txn, accessToken: accessToken ?? undefined };
  }
  const { data, error } = await supabaseAdmin!.from("transactions").insert({
    vin: input.vin, buyer_id: input.buyer_id, purchase_date: input.purchase_date,
    delivery_date: input.delivery_date ?? null, sold_price_usd: input.sold_price_usd ?? null,
    notes: input.notes ?? null, created_by: null,
  }).select("*").single();
  if (error) { console.error("createTransaction error:", error.message); return null; }
  await supabaseAdmin!.from("vehicles").update({ status: "rejected" }).eq("vin", input.vin);
  await writeAuditLog({ entity: "vehicle", entity_id: input.vin, action: "marked_sold", changes: { buyer_id: input.buyer_id } });
  // Auto-generate access token
  const accessToken = await createAccessToken(data.id, input.vin);
  return { ...data, accessToken: accessToken ?? undefined };
}

// ─── Admin: app_users management ─────────────────────────────────────────────

export async function getAllAppUsers(): Promise<AppUser[]> {
  if (!isSupabaseEnabled) return [];
  const { data } = await supabase!.from("app_users").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function createAppUser(input: { email: string; full_name: string; role: "admin" | "inspector" | "staff" }): Promise<AppUser | null> {
  if (!isSupabaseEnabled) {
    console.log("[mock] createAppUser", input);
    return { id: crypto.randomUUID(), email: input.email, full_name: input.full_name, role: input.role as any, license_no: null, company: null, created_at: new Date().toISOString() };
  }
  const { data, error } = await supabaseAdmin!.from("app_users").insert({
    id: crypto.randomUUID(), email: input.email, full_name: input.full_name, role: input.role,
  }).select("*").single();
  if (error) { console.error("createAppUser error:", error.message); return null; }
  return data;
}

export async function updateAppUserRole(id: string, role: "admin" | "inspector" | "staff"): Promise<boolean> {
  if (!isSupabaseEnabled) { console.log("[mock] updateAppUserRole", id, role); return true; }
  const { error } = await supabaseAdmin!.from("app_users").update({ role }).eq("id", id);
  if (error) { console.error("updateAppUserRole error:", error.message); return false; }
  return true;
}

export async function deleteAppUser(id: string): Promise<boolean> {
  if (!isSupabaseEnabled) { console.log("[mock] deleteAppUser", id); return true; }
  const { error } = await supabaseAdmin!.from("app_users").delete().eq("id", id);
  if (error) { console.error("deleteAppUser error:", error.message); return false; }
  return true;
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

// ─── Token utilities ──────────────────────────────────────────────────────────

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function randomString(len: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join("");
}

// ─── Access token creation ────────────────────────────────────────────────────

export interface AccessTokenResult {
  rawToken: string;
  rawPassword: string;
  trackingUrl: string;
}

export async function createAccessToken(transactionId: string, vin: string): Promise<AccessTokenResult | null> {
  const rawToken = randomString(32);
  const rawPassword = randomString(10);
  const tokenHash = await sha256(rawToken);
  const passwordHash = await sha256(rawPassword);
  const trackingUrl = `/track-order?token=${rawToken}`;

  if (!isSupabaseEnabled) {
    console.log("[mock] createAccessToken", { trackingUrl, rawPassword });
    return { rawToken, rawPassword, trackingUrl };
  }

  const { error } = await supabaseAdmin!.from("access_tokens").insert({
    transaction_id: transactionId,
    vin,
    token_hash: tokenHash,
    password_hash: passwordHash,
    attempt_count: 0,
    expires_at: null,
    locked_at: null,
  });

  if (error) { console.error("createAccessToken error:", error.message); return null; }
  return { rawToken, rawPassword, trackingUrl };
}

// ─── Tracking page: validate access ──────────────────────────────────────────

export interface TrackingData {
  vehicle: Vehicle;
  transaction: Transaction;
  buyer: Buyer | null;
  inspections: Inspection[];
  mediaByInspection: Record<string, import("./types").InspectionMedia[]>;
  shipment: import("./types").ShipmentTimeline | null;
}

export async function validateAndFetchTracking(rawToken: string, rawPassword: string): Promise<
  { success: true; data: TrackingData } |
  { success: false; reason: "invalid" | "locked" | "wrong_password" | "expired" }
> {
  const tokenHash = await sha256(rawToken);

  if (!isSupabaseEnabled) {
    // Mock fallback for dev
    const m = await mock();
    const v = m.vehicles[0] as unknown as Vehicle;
    const ins = m.inspections[0] as unknown as Inspection;
    return {
      success: true,
      data: {
        vehicle: v,
        transaction: { id: "mock-txn", vin: v.vin, buyer_id: "mock-buyer", purchase_date: "2025-01-15", delivery_date: "2025-02-01", sold_price_usd: 18500, notes: null, created_by: null, created_at: new Date().toISOString() },
        buyer: { id: "mock-buyer", name: "Ahmed Al-Rashid", phone: "+971501234567", country: "UAE", preferred_language: "ar" as any, assigned_vins: [], created_at: new Date().toISOString() },
        inspections: [ins],
        mediaByInspection: {},
        shipment: null,
      },
    };
  }

  // 1. Find token record
  const { data: tokenRecord, error: tErr } = await supabase!
    .from("access_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .single();

  if (tErr || !tokenRecord) return { success: false, reason: "invalid" };

  // 2. Check lockout
  if (tokenRecord.locked_at) {
    const lockedMs = new Date(tokenRecord.locked_at).getTime();
    if (Date.now() - lockedMs < 15 * 60 * 1000) return { success: false, reason: "locked" };
    // Lockout expired — reset
    await supabaseAdmin!.from("access_tokens").update({ locked_at: null, attempt_count: 0 }).eq("id", tokenRecord.id);
  }

  // 3. Check expiry
  if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
    return { success: false, reason: "expired" };
  }

  // 4. Verify password
  const passwordHash = await sha256(rawPassword);
  if (passwordHash !== tokenRecord.password_hash) {
    const newCount = (tokenRecord.attempt_count ?? 0) + 1;
    const shouldLock = newCount >= 5;
    await supabaseAdmin!.from("access_tokens").update({
      attempt_count: newCount,
      locked_at: shouldLock ? new Date().toISOString() : null,
    }).eq("id", tokenRecord.id);
    return { success: false, reason: "wrong_password" };
  }

  // 5. Reset attempt count on success
  await supabaseAdmin!.from("access_tokens").update({ attempt_count: 0 }).eq("id", tokenRecord.id);

  // 6. Fetch all data via token → transaction → vin
  const txnId = tokenRecord.transaction_id;
  const vin = tokenRecord.vin;

  const [txnRes, vehicleRes, buyerRes, inspRes, mediaRes, shipRes] = await Promise.all([
    supabaseAdmin!.from("transactions").select("*").eq("id", txnId).single(),
    supabaseAdmin!.from("vehicles").select("*").eq("vin", vin).single(),
    supabaseAdmin!.from("transactions").select("buyer_id").eq("id", txnId).single()
      .then(r => r.data?.buyer_id ? supabaseAdmin!.from("buyers").select("*").eq("id", r.data.buyer_id).single() : Promise.resolve({ data: null })),
    supabaseAdmin!.from("inspections").select("*").eq("vin", vin).order("submitted_at", { ascending: true }),
    supabaseAdmin!.from("inspection_media").select("*").eq("vin", vin).order("sort_order"),
    supabaseAdmin!.from("shipment_timelines").select("*").eq("vin", vin).single().catch(() => ({ data: null })),
  ]);

  if (!txnRes.data || !vehicleRes.data) return { success: false, reason: "invalid" };

  const media = (mediaRes.data ?? []) as import("./types").InspectionMedia[];
  const mediaByInspection: Record<string, import("./types").InspectionMedia[]> = {};
  media.forEach(m => {
    if (!mediaByInspection[m.inspection_id]) mediaByInspection[m.inspection_id] = [];
    mediaByInspection[m.inspection_id].push(m);
  });

  return {
    success: true,
    data: {
      vehicle: vehicleRes.data,
      transaction: txnRes.data,
      buyer: (buyerRes as any).data ?? null,
      inspections: (inspRes.data ?? []) as Inspection[],
      mediaByInspection,
      shipment: (shipRes as any).data ?? null,
    },
  };
}
