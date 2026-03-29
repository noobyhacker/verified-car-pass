/**
 * /admin — Admin-only dashboard
 * Tabs: Overview | Users | Audit Log
 */

import { Navbar } from "@/components/Navbar";
import { getPendingReviews as getMockPending, getInspectedVehicles, inspections as mockInspections, vehicles as mockVehicles } from "@/data/mockData";
import { CheckCircle, XCircle, Clock, Eye, Car, Loader2, Users, ScrollText, ShieldCheck, Plus, Trash2, Search } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { getPendingReviews, getAllAppUsers, createAppUser, updateAppUserRole, deleteAppUser, getAuditLogs, getCatalogVehicles } from "@/lib/queries";
import { isSupabaseEnabled } from "@/lib/supabase";
import type { AppUser, AuditLog } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ─── Shared ───────────────────────────────────────────────────────────────────

const labelCls = "text-[10px] font-body font-medium text-muted-foreground mb-1 block uppercase tracking-wider";
const inputCls = "rounded h-9 text-sm bg-background border-border";

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

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

function OverviewTab({ pendingCount }: { pendingCount: number }) {
  const { t } = useLanguage();
  const [liveApproved, setLiveApproved] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadMock = () => {
      setLiveApproved(getInspectedVehicles() as any);
      setStats({ total: mockVehicles.length, approved: mockInspections.filter(i => i.admin_status === "approved").length, rejected: mockInspections.filter(i => i.admin_status === "rejected").length });
      setLoading(false);
    };
    if (!isSupabaseEnabled) { loadMock(); return; }
    Promise.all([
      import("@/lib/supabase").then(({ supabase }) => supabase!.from("vehicles").select("id, status").then(r => r.data ?? [])),
      getCatalogVehicles(),
    ]).then(([vehicles, catalogEntries]) => {
      setStats({ total: vehicles.length, approved: vehicles.filter((v: any) => v.status === "active").length, rejected: vehicles.filter((v: any) => v.status === "rejected").length });
      setLiveApproved(catalogEntries.map(e => ({ vehicle: e.vehicle, inspection: e.inspection, cert: e.certificate, photo: e.photo })) as any);
      setLoading(false);
    }).catch(() => { loadMock(); });
  }, []);

  const filtered = liveApproved.filter(({ vehicle, inspection, cert }: any) => {
    if (!vehicle || !inspection || !cert) return false;
    const q = search.toLowerCase();
    return !q || vehicle.make?.toLowerCase().includes(q) || vehicle.model?.toLowerCase().includes(q) || vehicle.vin?.toLowerCase().includes(q) || String(vehicle.year).includes(q) || cert.certificate_uid?.toLowerCase().includes(q);
  });

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Car,         label: "Total Vehicles",    value: stats.total,    cls: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
          { icon: CheckCircle, label: "Active / Approved", value: stats.approved, cls: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
          { icon: Clock,       label: "Pending Review",    value: pendingCount,   cls: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
          { icon: XCircle,     label: "Rejected / Sold",   value: stats.rejected, cls: "text-red-700",     bg: "bg-red-50 border-red-200" },
        ].map(s => (
          <div key={s.label} className={`border rounded-lg p-4 ${s.bg}`}>
            <s.icon className={`w-4 h-4 ${s.cls} mb-2`} />
            <p className={`font-display font-bold text-2xl ${s.cls}`}>{s.value}</p>
            <p className="font-body text-xs text-gray-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex gap-2 flex-wrap">
        <Link to="/staff" className="flex items-center gap-1.5 px-4 py-2 rounded border border-border bg-card text-xs font-body text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
          → Staff Panel (Listings, CRM, Transactions)
        </Link>
        <Link to="/manager-upload" className="flex items-center gap-1.5 px-4 py-2 rounded border border-border bg-card text-xs font-body text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
          → Manager Upload
        </Link>
      </div>

      {/* Published certificates with search */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <p className="font-display font-semibold text-sm text-foreground">Published Certificates</p>
          <div className="relative ml-auto w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search make, model, VIN..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
          </div>
          {!loading && <span className="text-[10px] font-mono-data text-muted-foreground flex-shrink-0">{filtered.length} vehicles</span>}
        </div>
        {loading ? <LoadingBox /> : (
          <table className="w-full text-xs font-body">
            <THead cols={["Vehicle", "Inspector", "Rating", "Accident", ""]} />
            <tbody>
              {filtered.map(({ vehicle, inspection, cert, photo }: any) => {
                if (!vehicle || !inspection || !cert) return null;
                return (
                  <tr key={inspection.id} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {photo?.thumbnail_url
                          ? <img src={photo.thumbnail_url} alt="" className="w-10 h-8 rounded object-cover border border-border" />
                          : <div className="w-10 h-8 rounded bg-gray-100 border border-border flex items-center justify-center"><Car className="w-3 h-3 text-gray-400" /></div>}
                        <div>
                          <p className="font-display font-semibold text-foreground">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                          <p className="font-mono-data text-[10px] text-muted-foreground">{cert.certificate_uid} · {vehicle.vin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground text-xs">{inspection.inspector_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono-data font-bold text-foreground">{inspection.overall_rating}</span>
                      <span className="text-muted-foreground">/5</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono-data font-semibold border ${inspection.accident_status ? "bg-red-100 text-red-800 border-red-300" : "bg-emerald-100 text-emerald-800 border-emerald-300"}`}>
                        {inspection.accident_status ? t("accident_recorded") : t("accident_free")}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <Link to={cert.public_url} className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 transition-colors">
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">{search ? "No results match your search." : "No approved vehicles yet."}</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", role: "inspector" as "admin" | "inspector" | "staff" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => { setLoading(true); setUsers(await getAllAppUsers()); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.email || !form.full_name) { toast.error("Email and name required."); return; }
    setSaving(true);
    const result = await createAppUser(form);
    if (result) { toast.success("User added — role assigned."); setShowAdd(false); setForm({ email: "", full_name: "", role: "inspector" }); await load(); }
    else toast.error("Failed — email may already exist.");
    setSaving(false);
  };

  const handleRoleChange = async (id: string, role: "admin" | "inspector" | "staff") => {
    const ok = await updateAppUserRole(id, role);
    if (ok) { toast.success("Role updated."); await load(); } else toast.error("Failed.");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this user?")) return;
    setDeletingId(id);
    const ok = await deleteAppUser(id);
    if (ok) { toast.success("User removed."); await load(); } else toast.error("Failed.");
    setDeletingId(null);
  };

  const roleStyle = (role: string) => role === "admin" ? "bg-blue-100 text-blue-800 border border-blue-200" : role === "staff" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-gray-100 text-gray-700 border border-gray-200";

  if (loading) return <LoadingBox />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-display font-semibold text-foreground">{users.length} registered user{users.length !== 1 ? "s" : ""}</p>
          <p className="text-xs text-muted-foreground font-body mt-0.5">Auth shell — roles will enforce permissions when auth is connected (Phase 2)</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"><Plus className="w-3.5 h-3.5" /> Add User</button>
      </div>

      {showAdd && (
        <div className="bg-card border border-blue-200 rounded-lg p-4 space-y-3">
          <p className="text-xs font-display font-semibold text-foreground">New User</p>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>Email *</label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="inspector@example.com" /></div>
            <div><label className={labelCls}>Full Name *</label><Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className={inputCls} placeholder="Kim Jae-won" /></div>
            <div>
              <label className={labelCls}>Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))} className="w-full rounded h-9 text-sm font-body bg-background border border-border px-3">
                <option value="inspector">Inspector</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-600 text-white text-xs font-medium disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Add User
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-2 rounded border border-border text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {!users.length ? <SectionEmpty icon={Users} text="No users yet." /> : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs font-body">
            <THead cols={["Name", "Email", "Role", "Added", ""]} />
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-display font-semibold text-foreground">{u.full_name}</td>
                  <td className="px-4 py-3 font-mono-data text-[10px] text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value as any)}
                      className={`rounded px-2 py-1 text-[10px] font-semibold font-mono-data border-0 outline-none cursor-pointer ${roleStyle(u.role)}`}>
                      <option value="inspector">Inspector</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(u.id)} disabled={deletingId === u.id} className="w-7 h-7 rounded hover:bg-red-50 flex items-center justify-center group transition-colors">
                      {deletingId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : <Trash2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-red-600 transition-colors" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── AUDIT TAB ────────────────────────────────────────────────────────────────

function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { getAuditLogs(200).then(d => { setLogs(d); setLoading(false); }); }, []);

  const actionColor = (action: string) => {
    if (action.includes("sold") || action.includes("rejected")) return "bg-red-100 text-red-800 border border-red-200";
    if (action.includes("approved") || action.includes("created") || action.includes("active")) return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    if (action.includes("updated") || action.includes("changed") || action.includes("upload")) return "bg-blue-100 text-blue-800 border border-blue-200";
    return "bg-gray-100 text-gray-700 border border-gray-200";
  };

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    return !q || log.entity.toLowerCase().includes(q) || log.action.toLowerCase().includes(q) || (log.performed_by_email ?? "").toLowerCase().includes(q) || log.entity_id.toLowerCase().includes(q);
  });

  if (loading) return <LoadingBox />;
  if (!logs.length) return <SectionEmpty icon={ScrollText} text="No audit logs yet." />;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input placeholder="Search entity, action, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs font-body">
          <THead cols={["Time", "Entity", "Entity ID", "Action", "Performed By"]} />
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono-data text-[10px] text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 capitalize text-foreground font-semibold">{log.entity}</td>
                <td className="px-4 py-3 font-mono-data text-[10px] text-muted-foreground max-w-[120px] truncate">{log.entity_id}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono-data font-semibold ${actionColor(log.action)}`}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{log.performed_by_email ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No logs match your search.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

type AdminTab = "overview" | "users" | "audit";

const TABS: Array<{ id: AdminTab; label: string; icon: any }> = [
  { id: "overview", label: "Overview", icon: Car },
  { id: "users", label: "Users", icon: Users },
  { id: "audit", label: "Audit Log", icon: ScrollText },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
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
            <h1 className="font-display font-bold text-xl text-foreground">Admin Dashboard</h1>
            <p className="font-body text-xs text-muted-foreground mt-0.5">SS Trading Korea</p>
          </div>
          {pendingCount > 0 && (
            <Link to="/staff" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-mono-data font-semibold border border-amber-300 hover:bg-amber-200 transition-colors">
              <Clock className="w-3 h-3" /> {pendingCount} pending → Staff Panel
            </Link>
          )}
        </div>
        <div className="container">
          <div className="flex gap-0 overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-body font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="container py-5 space-y-5">
        {activeTab === "overview" && <OverviewTab pendingCount={pendingCount} />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "audit" && <AuditTab />}
      </div>
    </div>
  );
}
