import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface QRCodeSectionProps {
  slug: string;
  certificateUid: string;
}

export function QRCodeSection({ slug, certificateUid }: QRCodeSectionProps) {
  const { t } = useLanguage();
  const qrRef = useRef<SVGSVGElement>(null);

  // Build the full public URL for this certificate
  const certUrl = `${window.location.origin}/car/${slug}`;

  const handleDownload = () => {
    const svg = qrRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 400;
    canvas.height = 400;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 0, 0, 400, 400);

      const link = document.createElement("a");
      link.download = `${certificateUid}-QR.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  return (
    <div className="bg-card border border-border rounded p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <QrCode className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-sm text-foreground">
          {t("scan_to_verify")}
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* QR Code */}
        <div className="flex-shrink-0 p-3 bg-white border border-border rounded">
          <QRCodeSVG
            ref={qrRef}
            value={certUrl}
            size={160}
            level="H"
            includeMargin={false}
            fgColor="#1A3C6E"
            bgColor="#ffffff"
          />
        </div>

        {/* Info + Download */}
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div>
            <p className="text-xs text-muted-foreground font-body mb-1">
              {t("certificate_id")}
            </p>
            <p className="font-mono-data text-sm font-semibold text-primary">
              {certificateUid}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-body mb-1">
              Certificate URL
            </p>
            <p className="font-mono-data text-[11px] text-foreground break-all">
              {certUrl}
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded border border-primary text-primary text-xs font-body font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {t("download_qr")}
          </button>
        </div>
      </div>
    </div>
  );
}
