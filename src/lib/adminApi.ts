/**
 * src/lib/adminApi.ts
 *
 * Frontend client for all admin mutations.
 * Calls /api/admin (Vercel serverless) — service role key never in browser.
 * Public reads still use supabase anon client directly (safe).
 */

async function call<T = unknown>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });

  const json = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.error ?? `API error ${res.status}`);
  }

  return json.data as T;
}

// ── Vehicles ──────────────────────────────────────────────────────────────────

export async function updateVehicleStatus(vin: string, status: "active" | "pending" | "rejected"): Promise<boolean> {
  try { await call("updateVehicleStatus", { vin, status }); return true; }
  catch (e: any) { console.error(e.message); return false; }
}

export async function updateVehicleTrending(vin: string, trending: boolean): Promise<boolean> {
  try { await call("updateVehicleTrending", { vin, trending }); return true; }
  catch (e: any) { console.error(e.message); return false; }
}

export async function updateVehiclePrice(vin: string, price_usd: number, price_aed: number): Promise<boolean> {
  try { await call("updateVehiclePrice", { vin, price_usd, price_aed }); return true; }
  catch (e: any) { console.error(e.message); return false; }
}

export async function updateVehicleDescription(vin: string, description: string): Promise<boolean> {
  try { await call("updateVehicleDescription", { vin, description }); return true; }
  catch (e: any) { console.error(e.message); return false; }
}

export async function approveInspection(
  inspectionId: string,
  vehicleId: string,
  fields: Record<string, unknown>
): Promise<{ certificateUid: string; publicUrl: string } | null> {
  try {
    return await call("approveInspection", { inspectionId, vehicleId, fields });
  } catch (e: any) { console.error(e.message); return null; }
}

export async function rejectInspection(inspectionId: string, notes?: string): Promise<boolean> {
  try { await call("rejectInspection", { inspectionId, notes }); return true; }
  catch (e: any) { console.error(e.message); return false; }
}

// ── Buyers ────────────────────────────────────────────────────────────────────

export async function createBuyer(input: { name: string; phone: string; country: string; preferred_language?: string }) {
  try { return await call<any>("createBuyer", input); }
  catch (e: any) { console.error(e.message); return null; }
}

export async function updateBuyer(id: string, input: { name?: string; phone?: string; country?: string }): Promise<boolean> {
  try { await call("updateBuyer", { id, ...input }); return true; }
  catch (e: any) { console.error(e.message); return false; }
}

export async function deleteBuyer(id: string): Promise<boolean> {
  try { await call("deleteBuyer", { id }); return true; }
  catch (e: any) { console.error(e.message); return false; }
}

export async function assignVinToBuyer(buyerId: string, vin: string): Promise<boolean> {
  try { await call("assignVin", { buyerId, vin }); return true; }
  catch (e: any) { console.error(e.message); return false; }
}

export async function unassignVinFromBuyer(buyerId: string, vin: string): Promise<boolean> {
  try { await call("unassignVin", { buyerId, vin }); return true; }
  catch (e: any) { console.error(e.message); return false; }
}

// ── Transactions ──────────────────────────────────────────────────────────────

export interface AccessTokenResult {
  rawToken: string;
  rawPassword: string;
  trackingUrl: string;
}

export async function createTransaction(input: {
  vin: string; buyer_id: string; purchase_date: string;
  delivery_date?: string; sold_price_usd?: number; notes?: string;
}): Promise<{ transaction: any; accessToken?: AccessTokenResult } | null> {
  try { return await call("createTransaction", input as Record<string, unknown>); }
  catch (e: any) { console.error(e.message); return null; }
}

// ── App Users ─────────────────────────────────────────────────────────────────

export async function createAppUser(input: { email: string; full_name: string; role: string }) {
  try { return await call<any>("createAppUser", input); }
  catch (e: any) { console.error(e.message); return null; }
}

export async function updateAppUserRole(id: string, role: string): Promise<boolean> {
  try { await call("updateAppUserRole", { id, role }); return true; }
  catch (e: any) { console.error(e.message); return false; }
}

export async function deleteAppUser(id: string): Promise<boolean> {
  try { await call("deleteAppUser", { id }); return true; }
  catch (e: any) { console.error(e.message); return false; }
}

// ── Tracking validation ───────────────────────────────────────────────────────

export async function validateAndFetchTracking(rawToken: string, rawPassword: string): Promise<
  { success: true; data: any } | { success: false; reason: "invalid" | "locked" | "wrong_password" | "expired" }
> {
  try {
    const result = await call<any>("validateTracking", { rawToken, rawPassword });
    return result;
  } catch (e: any) {
    return { success: false, reason: "invalid" };
  }
}
