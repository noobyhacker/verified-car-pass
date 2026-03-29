import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Language } from "@/i18n/translations";
import { useState } from "react";
import { Menu, X, Phone, Mail } from "lucide-react";

const LANG_OPTIONS: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
  { code: "sw", label: "Swahili" },
];

const NAV_LINKS = [
  { to: "/catalog",        label: "Buy Car" },
  { to: "/purchase-guide", label: "Purchase Guide" },
  { to: "/about",          label: "About Us" },
  { to: "/contact",        label: "Contact Us" },
  { to: "/inspector",      label: "Inspector" },
  { to: "/admin",          label: "Admin" },
];

const SOCIAL_LINKS = [
  { href: "https://wa.me/821027058645",           icon: "/icon-whatsapp.svg",  label: "WhatsApp" },
  { href: "https://instagram.com/sstrading.korea", icon: "/icon-instagram.svg", label: "Instagram" },
  { href: "https://facebook.com/sstrading.korea",  icon: "/icon-facebook.svg",  label: "Facebook" },
  { href: "https://youtube.com/@sstrading",        icon: "/icon-youtube.svg",   label: "YouTube" },
];

const NAV_BG = "linear-gradient(160deg, #06101f 0%, #0b1e3a 40%, #0e2647 100%)";
const TOPBAR_BG = "linear-gradient(160deg, #040d18 0%, #08172e 50%, #0b1e3a 100%)";

export function Navbar() {
  const location = useLocation();
  const { lang, setLang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const currentLang = LANG_OPTIONS.find(o => o.code === lang) || LANG_OPTIONS[0];

  return (
    <header className="sticky top-0 z-50">

      {/* Top bar */}
      <div style={{ background: TOPBAR_BG, borderBottom: "2px solid #c8912a" }}>
        <div className="container flex items-center justify-between h-9 gap-4">

          {/* Left: contact info */}
          <div className="flex items-center gap-4">
            <a href="tel:+821027058645"
              className="flex items-center gap-1.5 text-[11px] font-body transition-colors"
              style={{ color: "rgba(255,255,255,0.72)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.72)")}>
              <Phone className="w-3 h-3 flex-shrink-0" />
              +82-10-2705-8645
            </a>
            <a href="mailto:info@sstrading.kr"
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-body transition-colors"
              style={{ color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}>
              <Mail className="w-3 h-3 flex-shrink-0" />
              info@sstrading.kr
            </a>
          </div>

          {/* Right: socials + language */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {SOCIAL_LINKS.map(({ href, icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  aria-label={label}
                  className="w-7 h-7 flex items-center justify-center rounded transition-opacity hover:opacity-70">
                  {/* No filter — keep brand colors */}
                  <img src={icon} alt={label} className="w-[17px] h-[17px] object-contain" />
                </a>
              ))}
            </div>

            {/* Language dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(o => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-body font-medium transition-colors"
                style={{
                  color: "rgba(255,255,255,0.88)",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                {currentLang.label}
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 9 }}>▾</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden z-50 min-w-[140px]">
                  {LANG_OPTIONS.map(opt => (
                    <button key={opt.code}
                      onClick={() => { setLang(opt.code); setLangOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-body transition-colors"
                      style={lang === opt.code
                        ? { background: "#EEF2FF", color: "#0b1e3a", fontWeight: 600 }
                        : { color: "#374151" }}
                      onMouseEnter={e => { if (lang !== opt.code) (e.currentTarget as HTMLElement).style.background = "#f9fafb"; }}
                      onMouseLeave={e => { if (lang !== opt.code) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ background: NAV_BG, borderBottom: "1px solid rgba(200,145,42,0.18)" }}>
        <div className="container flex items-center justify-between h-14">

          {/* Logo — raw, no CSS filter */}
          <Link to="/" className="flex items-center flex-shrink-0 py-1">
            <img
              src="/ss-trading-logo.png"
              alt="SS Trading Korea"
              className="h-9 w-auto object-contain"
              style={{ filter: "none" }}
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(link => {
              const active = location.pathname === link.to ||
                (link.to !== "/" && location.pathname.startsWith(link.to));
              return (
                <Link key={link.to} to={link.to}
                  className="relative px-3.5 py-1.5 text-[11px] font-body font-semibold tracking-wide rounded-sm transition-colors"
                  style={{ color: active ? "#E8A830" : "rgba(255,255,255,0.72)" }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.72)"; }}>
                  {link.label.toUpperCase()}
                  {active && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{ background: "#E8A830" }} />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded transition-colors"
            style={{ color: "rgba(255,255,255,0.8)" }}
            onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: "#06101f", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {NAV_LINKS.map(link => (
              <Link key={link.to} to={link.to}
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-3.5 text-sm font-body font-medium transition-colors"
                style={{ color: "rgba(255,255,255,0.72)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#E8A830"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.72)"; }}>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
