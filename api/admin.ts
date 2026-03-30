/**
 * api/admin.ts
 * Vercel serverless function — runs server-side only.
 * Service role key NEVER reaches the browser.
 *
 * All admin mutations route through here.
 * Frontend calls: POST /api/admin  { action: "...", ...params }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// These env vars are set in Vercel dashboard — never in frontend
const supabaseUrl = process.env.SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_KEY!;

function getAdmin() {
  if (!supabaseUrl || !serviceKey) throw new Error("SUPABASE_URL or SUPABASE_SERVICE_KEY not set");
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

async function sha256(str: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(str).digest("hex");
}

function randomString(len: number): string {
  const { randomBytes } = require("crypto");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const buf = randomBytes(len);
  return Array.from(buf as Buffer).map((b: number) => chars[b % chars.length]).join("");
}

async function writeAuditLog(db: ReturnType<typeof createClient>, entry: {
  entity: string; entity_id: string; action: string;
  performed_by_email?: string; changes?: Record<string, unknown>;
}) {
  await db.from("audit_logs").insert({
    entity: entry.entity, entity_id: entry.entity_id, action: entry.action,
    performed_by: null, performed_by_email: entry.performed_by_email ?? "admin@ss-trading.com",
    changes: entry.changes ?? null,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body: Record<string, unknown>;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { action, ...params } = body as { action: string; [key: string]: unknown };

  try {
    const db = getAdmin();
    const result = await dispatch(db, action, params);
    return res.status(200).json({ ok: true, data: result });
  } catch (err: any) {
    console.error(`[api/admin] action=${action} error:`, err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

// ─── Action dispatcher ────────────────────────────────────────────────────────

async function dispatch(db: ReturnType<typeof createClient>, action: string, p: Record<string, unknown>) {
  switch (action) {

    // ── Vehicles ──
    case "updateVehicleStatus": {
      const { vin, status } = p as { vin: string; status: string };
      const { error } = await db.from("vehicles").update({ status }).eq("vin", vin);
      if (error) throw new Error(error.message);
      await writeAuditLog(db, { entity: "vehicle", entity_id: vin, action: `status_changed_to_${status}` });
      return true;
    }

    case "updateVehicleTrending": {
      const { vin, trending } = p as { vin: string; trending: boolean };
      const { error } = await db.from("vehicles").update({ trending }).eq("vin", vin);
      if (error) throw new Error(error.message);
      return true;
    }

    case "updateVehiclePrice": {
      const { vin, price_usd, price_aed } = p as { vin: string; price_usd: number; price_aed: number };
      const { error } = await db.from("vehicles").update({ price_usd, price_aed }).eq("vin", vin);
      if (error) throw new Error(error.message);
      await writeAuditLog(db, { entity: "vehicle", entity_id: vin, action: "price_updated", changes: { price_usd, price_aed } });
      return true;
    }

    case "updateVehicleDescription": {
      const { vin, description } = p as { vin: string; description: string };
      const { error } = await db.from("vehicles").update({ description }).eq("vin", vin);
      if (error) throw new Error(error.message);
      return true;
    }

    case "approveInspection": {
      const { inspectionId, vehicleId, fields } = p as {
        inspectionId: string; vehicleId: string;
        fields: Record<string, unknown>;
      };
      // Update vehicle listing fields
      await db.from("vehicles").update({
        price_usd: fields.price_usd ? parseInt(fields.price_usd as string) : null,
        price_aed: fields.price_aed ? parseInt(fields.price_aed as string) : null,
        price_negotiable: fields.price_negotiable,
        additional_price_notes: fields.additional_price_notes || null,
        description: fields.description || null,
        export_ready: fields.export_ready,
        port_of_loading: fields.port_of_loading || null,
        estimated_delivery_weeks: fields.estimated_delivery_weeks ? parseInt(fields.estimated_delivery_weeks as string) : null,
        target_markets: fields.target_markets
          ? (fields.target_markets as string).split(",").map((s: string) => s.trim()).filter(Boolean)
          : null,
      }).eq("id", vehicleId);

      // Lock inspection + set approved
      const { data: ins, error: iErr } = await db.from("inspections")
        .update({ admin_status: "approved", locked_at: new Date().toISOString() })
        .eq("id", inspectionId).select("*").single();
      if (iErr || !ins) throw new Error(iErr?.message ?? "Inspection not found");

      // Activate vehicle
      await db.from("vehicles").update({ status: "active" }).eq("vin", ins.vin);

      // Generate certificate
      const year = new Date().getFullYear();
      const uid = ins.public_slug.toUpperCase();
      const certificateUid = `SST-${year}-${uid}`;
      const publicUrl = `/car/${ins.public_slug}`;

      const { error: certErr } = await db.from("certificates").insert({
        inspection_id: inspectionId, vin: ins.vin,
        certificate_uid: certificateUid, public_url: publicUrl,
      });
      if (certErr) throw new Error(certErr.message);

      await writeAuditLog(db, { entity: "inspection", entity_id: inspectionId, action: "approved" });
      return { certificateUid, publicUrl };
    }

    case "rejectInspection": {
      const { inspectionId, notes } = p as { inspectionId: string; notes?: string };
      const { error } = await db.from("inspections")
        .update({ admin_status: "rejected", admin_notes: notes ?? null })
        .eq("id", inspectionId);
      if (error) throw new Error(error.message);
      await writeAuditLog(db, { entity: "inspection", entity_id: inspectionId, action: "rejected" });
      return true;
    }

    // ── Buyers ──
    case "createBuyer": {
      const { name, phone, country, preferred_language } = p as { name: string; phone: string; country: string; preferred_language?: string };
      const { data, error } = await db.from("buyers").insert({
        name, phone, country, preferred_language: preferred_language ?? "en", assigned_vins: [],
      }).select("*").single();
      if (error) throw new Error(error.message);
      await writeAuditLog(db, { entity: "buyer", entity_id: data.id, action: "created", changes: { name } });
      return data;
    }

    case "updateBuyer": {
      const { id, ...fields } = p as { id: string; name?: string; phone?: string; country?: string };
      const { error } = await db.from("buyers").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return true;
    }

    case "deleteBuyer": {
      const { id } = p as { id: string };
      const { error } = await db.from("buyers").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return true;
    }

    case "assignVin": {
      const { buyerId, vin } = p as { buyerId: string; vin: string };
      const { data } = await db.from("buyers").select("assigned_vins").eq("id", buyerId).single();
      const current: string[] = data?.assigned_vins ?? [];
      if (!current.includes(vin)) {
        const { error } = await db.from("buyers").update({ assigned_vins: [...current, vin] }).eq("id", buyerId);
        if (error) throw new Error(error.message);
      }
      return true;
    }

    case "unassignVin": {
      const { buyerId, vin } = p as { buyerId: string; vin: string };
      const { data } = await db.from("buyers").select("assigned_vins").eq("id", buyerId).single();
      const current: string[] = data?.assigned_vins ?? [];
      const { error } = await db.from("buyers").update({ assigned_vins: current.filter(v => v !== vin) }).eq("id", buyerId);
      if (error) throw new Error(error.message);
      return true;
    }

    // ── Transactions ──
    case "createTransaction": {
      const { vin, buyer_id, purchase_date, delivery_date, sold_price_usd, notes } = p as {
        vin: string; buyer_id: string; purchase_date: string;
        delivery_date?: string; sold_price_usd?: number; notes?: string;
      };
      const { data, error } = await db.from("transactions").insert({
        vin, buyer_id, purchase_date,
        delivery_date: delivery_date ?? null,
        sold_price_usd: sold_price_usd ?? null,
        notes: notes ?? null, created_by: null,
      }).select("*").single();
      if (error) throw new Error(error.message);

      // Mark vehicle sold
      await db.from("vehicles").update({ status: "rejected" }).eq("vin", vin);
      await writeAuditLog(db, { entity: "vehicle", entity_id: vin, action: "marked_sold", changes: { buyer_id } });

      // Generate access token
      const rawToken = randomString(32);
      const rawPassword = randomString(10);
      const tokenHash = await sha256(rawToken);
      const passwordHash = await sha256(rawPassword);

      await db.from("access_tokens").insert({
        transaction_id: data.id, vin,
        token_hash: tokenHash, password_hash: passwordHash,
        attempt_count: 0, expires_at: null, locked_at: null,
      });

      return {
        transaction: data,
        accessToken: {
          rawToken,
          rawPassword,
          trackingUrl: `/track-order?token=${rawToken}`,
        },
      };
    }

    // ── App Users ──
    case "createAppUser": {
      const { email, full_name, role } = p as { email: string; full_name: string; role: string };
      const { data, error } = await db.from("app_users").insert({
        id: crypto.randomUUID(), email, full_name, role,
      }).select("*").single();
      if (error) throw new Error(error.message);
      return data;
    }

    case "updateAppUserRole": {
      const { id, role } = p as { id: string; role: string };
      const { error } = await db.from("app_users").update({ role }).eq("id", id);
      if (error) throw new Error(error.message);
      return true;
    }

    case "deleteAppUser": {
      const { id } = p as { id: string };
      const { error } = await db.from("app_users").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return true;
    }

    // ── Tracking validation ──
    case "validateTracking": {
      const { rawToken, rawPassword } = p as { rawToken: string; rawPassword: string };
      const tokenHash = await sha256(rawToken);

      const { data: tokenRecord, error: tErr } = await db
        .from("access_tokens").select("*").eq("token_hash", tokenHash).single();

      if (tErr || !tokenRecord) return { success: false, reason: "invalid" };

      // Check lockout
      if (tokenRecord.locked_at) {
        const lockedMs = new Date(tokenRecord.locked_at).getTime();
        if (Date.now() - lockedMs < 15 * 60 * 1000) return { success: false, reason: "locked" };
        await db.from("access_tokens").update({ locked_at: null, attempt_count: 0 }).eq("id", tokenRecord.id);
      }

      // Check expiry
      if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
        return { success: false, reason: "expired" };
      }

      // Verify password
      const passwordHash = await sha256(rawPassword);
      if (passwordHash !== tokenRecord.password_hash) {
        const newCount = (tokenRecord.attempt_count ?? 0) + 1;
        const shouldLock = newCount >= 5;
        await db.from("access_tokens").update({
          attempt_count: newCount,
          locked_at: shouldLock ? new Date().toISOString() : null,
        }).eq("id", tokenRecord.id);
        return { success: false, reason: "wrong_password" };
      }

      // Reset attempt count
      await db.from("access_tokens").update({ attempt_count: 0 }).eq("id", tokenRecord.id);

      const txnId = tokenRecord.transaction_id;
      const vin = tokenRecord.vin;

      const [txnRes, vehicleRes, inspRes, mediaRes, shipRes] = await Promise.all([
        db.from("transactions").select("*").eq("id", txnId).single(),
        db.from("vehicles").select("*").eq("vin", vin).single(),
        db.from("inspections").select("*").eq("vin", vin).order("submitted_at", { ascending: true }),
        db.from("inspection_media").select("*").eq("vin", vin).order("sort_order"),
        db.from("shipment_timelines").select("*").eq("vin", vin).maybeSingle(),
      ]);

      // Get buyer
      let buyer = null;
      if (txnRes.data?.buyer_id) {
        const { data: b } = await db.from("buyers").select("*").eq("id", txnRes.data.buyer_id).single();
        buyer = b;
      }

      if (!txnRes.data || !vehicleRes.data) return { success: false, reason: "invalid" };

      const media = mediaRes.data ?? [];
      const mediaByInspection: Record<string, unknown[]> = {};
      media.forEach((m: any) => {
        if (!mediaByInspection[m.inspection_id]) mediaByInspection[m.inspection_id] = [];
        mediaByInspection[m.inspection_id].push(m);
      });

      return {
        success: true,
        data: {
          vehicle: vehicleRes.data,
          transaction: txnRes.data,
          buyer,
          inspections: inspRes.data ?? [],
          mediaByInspection,
          shipment: shipRes.data ?? null,
        },
      };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
