// ─── Core domain types ────────────────────────────────────────────────────────
// These mirror the Supabase table shapes exactly.
// The mockData arrays satisfy these types too, so migration is incremental.

export type VehicleStatus = "active" | "pending" | "rejected";
export type AdminStatus = "approved" | "pending" | "rejected";
export type MediaType = "image" | "video";
export type MediaVisibility = "public" | "internal";
export type LeadStage = "new" | "contacted" | "negotiating" | "purchased" | "shipped" | "arrived";
export type UserRole = "inspector" | "admin" | "staff";
export type Language = "en" | "ar" | "fr" | "sw" | "ko";

export interface Vehicle {
  id: string;
  vin: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  generation: string | null;
  trim: string | null;
  fuel_type: string;
  transmission: string;
  drivetrain: string;
  engine_cc: number;
  color: string;
  color_hex: string | null;
  brake_type: string | null;
  price_usd: number | null;
  price_aed: number | null;
  status: VehicleStatus;
  trending: boolean;
  created_at: string;
  updated_at: string;
}

export interface BodyZone {
  rating: number;           // 1–5
  notes_ko: string | null;
}

export interface BodyCondition {
  front: BodyZone;
  rear: BodyZone;
  left: BodyZone;
  right: BodyZone;
  roof: BodyZone;
  underbody: BodyZone;
}

export interface Inspection {
  id: string;
  vin: string;
  inspector_id: string | null;
  inspector_name: string;
  inspector_license: string;
  public_slug: string;
  mileage: number;
  odometer_unit: "km" | "miles";
  odometer_tampered: boolean;
  accident_status: boolean;
  accident_notes_ko: string | null;
  flood_engine: boolean;
  flood_transmission: boolean;
  flood_interior: boolean;
  fire_damage: boolean;
  tuning_illegal: boolean;
  tuning_structural: boolean;
  tuning_notes: string | null;
  body_condition: BodyCondition;
  panel_damage: Record<string, "normal" | "repaired" | "replaced">;
  vehicle_options: Record<string, boolean>;
  leaks: Record<string, "없음" | "미세누유" | "누유">;
  conditions: Record<string, "good" | "bad" | "replace">;
  emission_co: number | null;
  emission_hc: number | null;
  emission_smoke: number | null;
  overall_rating: number;
  report_no: string | null;
  first_reg_date: string | null;
  vehicle_type: string | null;
  reg_region: string | null;
  usage_rental: boolean;
  usage_commercial: boolean;
  usage_lease: boolean;
  facility_reg_no: string | null;
  facility_address: string | null;
  company_name: string | null;
  document_image_url: string | null;
  signature_data_url: string | null;
  submitted_at: string;
  locked_at: string | null;
  admin_status: AdminStatus;
  admin_notes: string | null;
}

export interface Certificate {
  id: string;
  inspection_id: string;
  vin: string;
  certificate_uid: string;
  public_url: string;
  generated_at: string;
}

export interface InspectionMedia {
  id: string;
  vin: string;
  inspection_id: string;
  type: MediaType;
  visibility: MediaVisibility;   // "public" = shown on certificate | "internal" = evidence only
  storage_url: string | null;
  thumbnail_url: string | null;
  embed_url: string | null;      // Cloudflare Stream URL for videos
  duration_sec: number | null;
  sort_order: number;
  uploaded_by: string | null;
  caption: string | null;
  created_at: string;
}

export interface InspectionTranslation {
  id: string;
  inspection_id: string;
  language: Language;
  accident_notes_translated: string | null;
  body_notes_translated: Record<string, string>;
  created_at: string;
}

// Evidence events — multiple inspection events per vehicle over time
export interface EvidenceEvent {
  id: string;
  vehicle_id: string;           // FK → vehicles.id
  vin: string;
  inspection_id: string | null; // FK → inspections.id (null for standalone events)
  event_type: "initial_inspection" | "pre_shipment" | "post_arrival" | "claim" | "re_inspection" | "note";
  notes: string | null;
  created_by: string | null;    // user id
  created_by_name: string | null;
  created_at: string;
}

export interface VehicleOptionsData {
  id: string;
  vin: string;
  inspection_id: string;
  options: Record<string, boolean>;
  updated_at: string;
}

export interface Buyer {
  id: string;
  name: string;
  preferred_language: Language;
  phone: string | null;
  country: string;
  assigned_vins: string[];
  created_at: string;
}

export interface Lead {
  id: string;
  vin: string;
  buyer_id: string | null;        // nullable — linked to buyer account after admin review
  buyer_name: string;
  buyer_country: string;
  buyer_phone: string | null;
  buyer_email: string | null;
  buyer_message: string | null;
  stage: LeadStage;
  last_contact: string | null;
  created_at: string;
  notes: string | null;
}

export interface InquirySubmission {
  id: string;
  vin: string | null;             // null = general inquiry
  name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  message: string | null;
  language: Language;
  converted_to_lead_id: string | null;
  created_at: string;
}

export interface ShipmentStage {
  stage: string;
  completed: boolean;
  timestamp: string | null;
  note: string | null;
}

export interface ShipmentTimeline {
  id: string;
  vin: string;
  buyer_id: string;
  current_stage: string;
  stages: ShipmentStage[];
  updated_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  license_no: string | null;
  company: string | null;
  created_at: string;
}

// ─── Composite types used by pages ───────────────────────────────────────────

export interface CarPageData {
  vehicle: Vehicle;
  inspection: Inspection;
  certificate: Certificate;
  media: InspectionMedia[];
  translations: InspectionTranslation[];
  options: Record<string, boolean>;
}

export interface CatalogEntry {
  vehicle: Vehicle;
  inspection: Inspection;
  certificate: Certificate;
  photo: InspectionMedia | null;
}

export interface PendingReview {
  inspection: Inspection;
  vehicle: Vehicle;
  photo: InspectionMedia | null;
}

export interface EvidenceBundle {
  vehicle: Vehicle;
  events: EvidenceEvent[];
  media: InspectionMedia[];        // visibility = "internal"
  inspections: Inspection[];       // all inspections for this vehicle
}

export interface Transaction {
  id: string;
  vin: string;
  buyer_id: string;
  purchase_date: string;
  delivery_date: string | null;
  sold_price_usd: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AccessToken {
  id: string;
  transaction_id: string;
  vin: string;
  token_hash: string;
  password_hash: string;
  expires_at: string | null;
  attempt_count: number;
  locked_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  entity: string;
  entity_id: string;
  action: string;
  performed_by: string | null;
  performed_by_email: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

// ─── Supabase Database generic ────────────────────────────────────────────────
// Used by createClient<Database>() for typed queries.

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: Vehicle;
        Insert: Omit<Vehicle, "created_at" | "updated_at">;
        Update: Partial<Omit<Vehicle, "id" | "created_at">>;
      };
      inspections: {
        Row: Inspection;
        Insert: Omit<Inspection, "id" | "submitted_at">;
        Update: Partial<Omit<Inspection, "id" | "submitted_at">>;
      };
      certificates: {
        Row: Certificate;
        Insert: Omit<Certificate, "id" | "generated_at">;
        Update: Partial<Omit<Certificate, "id" | "generated_at">>;
      };
      inspection_media: {
        Row: InspectionMedia;
        Insert: Omit<InspectionMedia, "id" | "created_at">;
        Update: Partial<Omit<InspectionMedia, "id" | "created_at">>;
      };
      inspection_translations: {
        Row: InspectionTranslation;
        Insert: Omit<InspectionTranslation, "id" | "created_at">;
        Update: Partial<Omit<InspectionTranslation, "id" | "created_at">>;
      };
      evidence_events: {
        Row: EvidenceEvent;
        Insert: Omit<EvidenceEvent, "id" | "created_at">;
        Update: Partial<Omit<EvidenceEvent, "id" | "created_at">>;
      };
      vehicle_options: {
        Row: VehicleOptionsData;
        Insert: Omit<VehicleOptionsData, "id" | "updated_at">;
        Update: Partial<Omit<VehicleOptionsData, "id">>;
      };
      buyers: {
        Row: Buyer;
        Insert: Omit<Buyer, "id" | "created_at">;
        Update: Partial<Omit<Buyer, "id" | "created_at">>;
      };
      leads: {
        Row: Lead;
        Insert: Omit<Lead, "id" | "created_at">;
        Update: Partial<Omit<Lead, "id" | "created_at">>;
      };
      shipment_timelines: {
        Row: ShipmentTimeline;
        Insert: Omit<ShipmentTimeline, "id" | "updated_at">;
        Update: Partial<Omit<ShipmentTimeline, "id">>;
      };
      app_users: {
        Row: AppUser;
        Insert: Omit<AppUser, "id" | "created_at">;
        Update: Partial<Omit<AppUser, "id" | "created_at">>;
      };
      inquiry_submissions: {
        Row: InquirySubmission;
        Insert: Omit<InquirySubmission, "id" | "created_at">;
        Update: Partial<Omit<InquirySubmission, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
