import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface CertificateBlockProps {
  certificateUid: string;
  inspectionDate: string;
  inspectorName: string;
  inspectorLicense: string;
  overallRating: number;
}

export function CertificateBlock({
  certificateUid,
  inspectionDate,
  inspectorName,
  inspectorLicense,
  overallRating,
}: CertificateBlockProps) {
  const { t } = useLanguage();

  const formattedDate = new Date(inspectionDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  });

  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      {/* Gold top rule */}
      <div className="h-0.5 bg-accent" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-3 flex-1">
            {/* Certificate ID */}
            <div>
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mb-0.5">
                {t("certificate_id")}
              </p>
              <p className="font-mono-data text-base font-bold text-primary">
                {certificateUid}
              </p>
            </div>

            {/* Inspector row */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mb-0.5">
                  {t("inspector")}
                </p>
                <p className="font-body text-sm font-semibold text-foreground">{inspectorName}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mb-0.5">
                  {t("license")}
                </p>
                <p className="font-mono-data text-sm text-foreground">{inspectorLicense}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mb-0.5">
                  {t("inspection_date")}
                </p>
                <p className="font-mono-data text-sm text-foreground">{formattedDate} KST</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mb-0.5">
                  Overall Rating
                </p>
                <p className="font-mono-data text-sm font-bold text-foreground">
                  {overallRating.toFixed(1)}<span className="text-muted-foreground font-normal">/5.0</span>
                </p>
              </div>
            </div>
          </div>

          {/* Verified stamp */}
          <div className="stamp-badge flex flex-col items-center gap-1.5 px-4 py-3 rounded text-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-accent" />
            <p className="font-display font-bold text-[10px] text-primary leading-tight max-w-[90px]">
              {t("verified_badge")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
