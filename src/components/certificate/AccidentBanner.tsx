import { ShieldCheck, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface AccidentBannerProps {
  accidentStatus: boolean;
  accidentNotes: string | null;
}

export function AccidentBanner({ accidentStatus, accidentNotes }: AccidentBannerProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="font-display font-semibold text-sm text-foreground">
          {t("accident_history")}
        </h3>
      </div>

      <div className="p-4">
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded border ${
            accidentStatus
              ? "bg-destructive/8 border-destructive/30 text-destructive"
              : "bg-success/8 border-success/30 text-success"
          }`}
        >
          {accidentStatus ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-display font-bold text-base">
            {accidentStatus ? t("accident_recorded") : t("accident_free")}
          </span>
        </div>

        {accidentStatus && accidentNotes && (
          <div className="mt-3 px-3 py-2.5 bg-muted/40 rounded border border-border">
            <p className="text-xs text-muted-foreground font-body leading-relaxed">
              {accidentNotes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
