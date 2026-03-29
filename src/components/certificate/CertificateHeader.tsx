import { Link } from "react-router-dom";
import { useLanguage, type Language } from "@/i18n/LanguageContext";
import { ShieldCheck } from "lucide-react";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ar", label: "AR" },
  { code: "fr", label: "FR" },
  { code: "sw", label: "SW" },
];

export function CertificateHeader() {
  const { lang, setLang } = useLanguage();

  return (
    <header className="nav-bg sticky top-0 z-50">
      <div className="container flex items-center justify-between h-12">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <span className="font-display font-bold text-sm text-white">SS Trading Korea</span>
        </Link>

        {/* Language toggle */}
        <div className="flex items-center gap-0.5">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono-data font-semibold transition-colors ${
                lang === code
                  ? "bg-accent text-foreground"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
