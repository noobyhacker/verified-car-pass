import { Lock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface CertificateFooterProps {
  lockedAt: string;
  certificateUid: string;
}

export function CertificateFooter({ lockedAt, certificateUid }: CertificateFooterProps) {
  const { t } = useLanguage();

  const formattedLockedAt = new Date(lockedAt).toLocaleString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).replace(",", "") + " KST";

  return (
    <footer className="border-t border-border bg-muted/30 mt-8">
      <div className="container max-w-2xl py-6 space-y-3">
        {/* Locked statement */}
        <div className="flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground font-body leading-relaxed">
            <span className="font-semibold text-foreground">{t("locked_statement")} </span>
            <span className="font-mono-data text-foreground">{formattedLockedAt}</span>
            <span className="font-semibold text-foreground"> {t("locked_statement_2")}</span>
          </p>
        </div>

        {/* Certificate ID repeat */}
        <p className="text-[11px] text-muted-foreground font-body">
          Certificate:{" "}
          <span className="font-mono-data text-foreground font-semibold">{certificateUid}</span>
        </p>

        {/* Company info */}
        <div className="pt-2 border-t border-border flex flex-wrap gap-x-4 gap-y-1">
          <p className="text-[11px] text-muted-foreground font-body">
            <span className="font-semibold text-foreground">SS Trading Korea</span>
          </p>
          <p className="text-[11px] text-muted-foreground font-body">
            contact@sstrading.kr
          </p>
          <p className="text-[11px] text-muted-foreground font-body">
            +82-10-0000-0000
          </p>
        </div>
      </div>
    </footer>
  );
}
