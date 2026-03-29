import { useParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useState, useEffect } from "react";
import { getCarDataBySlug } from "@/lib/queries";
import { Loader2, ShieldCheck, AlertTriangle, CheckCircle, Droplets, Flame, Wrench, Gauge } from "lucide-react";
import type { CarPageData } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { HeroGallery } from "@/components/certificate/HeroGallery";
import { CertificateBlock } from "@/components/certificate/CertificateBlock";
import { SpecsTable } from "@/components/certificate/SpecsTable";
import { AccidentBanner } from "@/components/certificate/AccidentBanner";
import { BodyConditionGrid } from "@/components/certificate/BodyConditionGrid";
import { InquirySection } from "@/components/certificate/InquirySection";
import { QRCodeSection } from "@/components/certificate/QRCodeSection";
import { CertificateFooter } from "@/components/certificate/CertificateFooter";
import { VehicleOptionsPanel } from "@/components/certificate/VehicleOptionsPanel";

// ─── Full Inspection Report section ──────────────────────────────────────────

function InspectionReport({ inspection }: { inspection: CarPageData["inspection"] }) {
  const flags = [
    { label: "Odometer Tampered", value: inspection.odometer_tampered, icon: Gauge },
    { label: "Flood (Engine)", value: inspection.flood_engine, icon: Droplets },
    { label: "Flood (Transmission)", value: inspection.flood_transmission, icon: Droplets },
    { label: "Flood (Interior)", value: inspection.flood_interior, icon: Droplets },
    { label: "Fire Damage", value: inspection.fire_damage, icon: Flame },
    { label: "Illegal Tuning", value: inspection.tuning_illegal, icon: Wrench },
    { label: "Structural Tuning", value: inspection.tuning_structural, icon: Wrench },
  ];

  const hasIssues = flags.some(f => f.value);

  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-sm text-foreground">Full Inspection Report</h3>
      </div>
      <div className="p-4 space-y-4">

        {/* VIN prominently */}
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Vehicle Identification Number (VIN)</span>
          <span className="font-mono-data text-sm font-bold text-foreground tracking-widest">{inspection.vin}</span>
        </div>

        {/* Usage history */}
        <div>
          <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">Usage History</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Rental", active: inspection.usage_rental },
              { label: "Commercial", active: inspection.usage_commercial },
              { label: "Lease", active: inspection.usage_lease },
            ].map(u => (
              <span key={u.label} className={`px-2.5 py-1 rounded text-xs font-mono-data font-semibold border ${u.active ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                {u.label}: {u.active ? "Yes" : "No"}
              </span>
            ))}
            {inspection.first_reg_date && (
              <span className="px-2.5 py-1 rounded text-xs font-mono-data border bg-gray-100 text-gray-700 border-gray-200">
                First Registered: {new Date(inspection.first_reg_date).toLocaleDateString()}
              </span>
            )}
            {inspection.reg_region && (
              <span className="px-2.5 py-1 rounded text-xs font-mono-data border bg-gray-100 text-gray-700 border-gray-200">
                Region: {inspection.reg_region}
              </span>
            )}
          </div>
        </div>

        {/* Safety flags */}
        <div>
          <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">Safety Checks</p>
          {!hasIssues ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded bg-emerald-50 border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-body text-emerald-800 font-medium">No issues found — clean record on all safety checks</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {flags.map(f => (
                <div key={f.label} className={`flex items-center gap-2 px-2.5 py-2 rounded border text-xs font-body ${f.value ? "bg-red-50 border-red-200 text-red-800" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                  {f.value ? <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" /> : <CheckCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                  {f.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emissions */}
        {(inspection.emission_co != null || inspection.emission_hc != null || inspection.emission_smoke != null) && (
          <div>
            <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">Emissions</p>
            <div className="flex flex-wrap gap-2">
              {inspection.emission_co != null && <span className="px-2.5 py-1 rounded text-xs font-mono-data border bg-gray-50 border-gray-200 text-gray-700">CO: {inspection.emission_co}%</span>}
              {inspection.emission_hc != null && <span className="px-2.5 py-1 rounded text-xs font-mono-data border bg-gray-50 border-gray-200 text-gray-700">HC: {inspection.emission_hc} ppm</span>}
              {inspection.emission_smoke != null && <span className="px-2.5 py-1 rounded text-xs font-mono-data border bg-gray-50 border-gray-200 text-gray-700">Smoke: {inspection.emission_smoke}%</span>}
            </div>
          </div>
        )}

        {/* Inspector details */}
        <div>
          <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">Inspector Details</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-body">
            <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
              <p className="text-[10px] text-muted-foreground mb-0.5">Inspector</p>
              <p className="font-semibold text-foreground">{inspection.inspector_name}</p>
              <p className="text-muted-foreground">{inspection.inspector_license}</p>
            </div>
            {inspection.facility_address && (
              <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">Facility</p>
                <p className="font-semibold text-foreground">{inspection.company_name}</p>
                <p className="text-muted-foreground">{inspection.facility_address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tuning notes */}
        {inspection.tuning_notes && (
          <div className="px-3 py-2 rounded bg-amber-50 border border-amber-200">
            <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider mb-1">Tuning Notes</p>
            <p className="text-xs text-amber-900 font-body">{inspection.tuning_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CarCertificatePage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, isRTL } = useLanguage();
  const [data, setData] = useState<CarPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    getCarDataBySlug(slug).then((result) => { setData(result); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data || !data.vehicle || !data.inspection || !data.certificate) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-1">
            <p className="font-mono-data text-primary text-sm">404</p>
            <p className="font-display text-lg font-bold text-foreground">Certificate not found</p>
            <p className="text-xs text-muted-foreground font-body">The requested inspection record does not exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const { vehicle, inspection, certificate, media, translations: inspTrans, options } = data;
  const currentTranslation = inspTrans.find(tr => tr.language === lang) || inspTrans.find(tr => tr.language === "en");
  const accidentNotes = currentTranslation?.accident_notes_translated || null;
  const bodyNotes = (currentTranslation?.body_notes_translated || {}) as Record<string, string>;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-background page-fade">
      <Navbar />

      <main className="container max-w-2xl pb-20 sm:pb-8 space-y-5 pt-6">
        {/* Title + VIN */}
        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-display font-bold text-xl sm:text-2xl text-foreground">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <span className="font-mono-data text-xs text-primary font-semibold">
              ${vehicle.price_usd?.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            {vehicle.generation && <span className="text-muted-foreground text-xs font-body">{vehicle.generation}</span>}
            {vehicle.trim && <span className="text-muted-foreground text-xs font-body">{vehicle.trim}</span>}
            <span className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded px-2 py-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">VIN</span>
              <span className="font-mono-data text-xs text-foreground font-bold tracking-widest">{vehicle.vin}</span>
            </span>
          </div>
        </div>

        <HeroGallery media={media} />

        <CertificateBlock
          certificateUid={certificate.certificate_uid}
          inspectionDate={inspection.submitted_at}
          inspectorName={inspection.inspector_name}
          inspectorLicense={inspection.inspector_license}
          overallRating={inspection.overall_rating}
        />

        <SpecsTable vehicle={vehicle} mileage={inspection.mileage} />

        <AccidentBanner accidentStatus={inspection.accident_status} accidentNotes={accidentNotes} />

        <BodyConditionGrid bodyCondition={inspection.body_condition} translatedNotes={bodyNotes} />

        <InspectionReport inspection={inspection} />

        <VehicleOptionsPanel options={options} />

        <QRCodeSection slug={slug!} certificateUid={certificate.certificate_uid} />

        <InquirySection vin={vehicle.vin} />
      </main>

      <CertificateFooter lockedAt={inspection.locked_at} certificateUid={certificate.certificate_uid} />
    </div>
  );
}
