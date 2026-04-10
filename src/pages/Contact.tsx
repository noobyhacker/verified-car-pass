import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useLanguage } from "@/i18n/LanguageContext";
import { MapPin, Phone, Mail, Clock, MessageCircle, Send, CheckCircle } from "lucide-react";

const COMPANY = {
  name: "Verified Car Pass",
  phone: "+82-10-2705-8645",
  whatsapp: "https://wa.me/821027058645",
  email: "info@verifiedcarpass.com",
  address: "Seoul, Republic of Korea",
  addressDetail: "Mapo-gu, Seoul 04108",
  hours: "Mon – Sat: 09:00 – 19:00 KST",
  instagram: "https://instagram.com/verifiedcarpass",
  youtube: "https://youtube.com/@verifiedcarpass",
  facebook: "https://facebook.com/verifiedcarpass",
};

const SOCIAL = [
  { label: "WhatsApp",  href: COMPANY.whatsapp,   icon: "/icon-whatsapp.svg",   color: "#25D366" },
  { label: "Instagram", href: COMPANY.instagram,  icon: "/icon-instagram.svg",  color: "#E1306C" },
  { label: "YouTube",   href: COMPANY.youtube,    icon: "/icon-youtube.svg",    color: "#FF0000" },
  { label: "Facebook",  href: COMPANY.facebook,   icon: "/icon-facebook.svg",   color: "#1877F2" },
];

export default function Contact() {
  const { t, isRTL } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", phone: "", country: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Build WhatsApp pre-filled message
    const msg = encodeURIComponent(
      `New inquiry from Verified Car Pass website\n\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nCountry: ${form.country}\n\nMessage:\n${form.message}`
    );
    window.open(`https://wa.me/821027058645?text=${msg}`, "_blank");
    setSent(true);
  };

  const inputCls = `w-full h-10 rounded-md border border-border bg-background px-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all`;
  const labelCls = `block text-xs font-body font-semibold text-foreground/70 mb-1.5 tracking-wide uppercase`;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />

      {/* ── Hero banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1f3c 50%, #0f2545 100%)",
        borderBottom: "2px solid rgba(232,168,48,0.2)",
      }}>
        <div className="container py-12">
          <p className="font-mono-data text-[11px] tracking-widest uppercase mb-3" style={{ color: "#E8A830" }}>
            Get In Touch
          </p>
          <h1 className="font-display font-bold text-3xl text-white mb-3">
            Contact Verified Car Pass
          </h1>
          <p className="font-body text-sm max-w-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
            Whether you're sourcing a single vehicle or a fleet, our team in Seoul is ready to help.
            Reach out via WhatsApp for the fastest response.
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Left column: contact cards ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Direct contact */}
            <div className="bg-card rounded-xl p-6"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.09), 0 4px 20px rgba(0,0,0,0.07)" }}>
              <h2 className="font-display font-bold text-sm text-foreground mb-4 tracking-wide uppercase" style={{ color: "hsl(var(--primary))" }}>
                Direct Contact
              </h2>
              <div className="space-y-4">
                <a href={`tel:${COMPANY.phone}`}
                  className="flex items-start gap-3 group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(13,31,60,0.08)" }}>
                    <Phone className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Phone</p>
                    <p className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {COMPANY.phone}
                    </p>
                  </div>
                </a>

                <a href={`mailto:${COMPANY.email}`}
                  className="flex items-start gap-3 group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(13,31,60,0.08)" }}>
                    <Mail className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Email</p>
                    <p className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {COMPANY.email}
                    </p>
                  </div>
                </a>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(13,31,60,0.08)" }}>
                    <MapPin className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Location</p>
                    <p className="font-display font-semibold text-sm text-foreground">{COMPANY.address}</p>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">{COMPANY.addressDetail}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(13,31,60,0.08)" }}>
                    <Clock className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Business Hours</p>
                    <p className="font-display font-semibold text-sm text-foreground">{COMPANY.hours}</p>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">Sunday closed · Korea Standard Time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a href={COMPANY.whatsapp} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl p-5 transition-transform hover:scale-[1.02] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, #075E54, #128C7E)",
                boxShadow: "0 4px 20px rgba(7,94,84,0.35)",
              }}>
              <img src="/icon-whatsapp.svg" alt="WhatsApp" className="w-10 h-10 flex-shrink-0" />
              <div>
                <p className="font-display font-bold text-white text-sm">Chat on WhatsApp</p>
                <p className="font-body text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Fastest response — usually within 1 hour
                </p>
              </div>
            </a>

            {/* Social links */}
            <div className="bg-card rounded-xl p-5"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.09), 0 4px 20px rgba(0,0,0,0.07)" }}>
              <h2 className="font-display font-bold text-sm text-foreground mb-4 tracking-wide uppercase" style={{ color: "hsl(var(--primary))" }}>
                Follow Us
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {SOCIAL.map(({ label, href, icon, color }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border hover:border-transparent transition-all duration-200 group"
                    style={{ "--hover-color": color } as React.CSSProperties}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = `${color}15`;
                      e.currentTarget.style.borderColor = `${color}40`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "";
                      e.currentTarget.style.borderColor = "";
                    }}
                  >
                    <img src={icon} alt={label} className="w-5 h-5 flex-shrink-0" />
                    <span className="font-body font-medium text-xs text-foreground">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column: inquiry form ── */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-xl p-8"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.09), 0 4px 20px rgba(0,0,0,0.07)" }}>

              {sent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ background: "rgba(37,211,102,0.12)" }}>
                    <CheckCircle className="w-8 h-8" style={{ color: "#25D366" }} />
                  </div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-2">Message Sent!</h3>
                  <p className="font-body text-sm text-muted-foreground max-w-sm">
                    Your inquiry has been forwarded via WhatsApp. Our team will respond within 1 hour during business hours.
                  </p>
                  <button onClick={() => setSent(false)}
                    className="mt-6 px-5 py-2 rounded-md text-sm font-body font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "hsl(var(--primary))" }}>
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <p className="font-mono-data text-[11px] tracking-widest uppercase mb-1" style={{ color: "#E8A830" }}>
                      Vehicle Inquiry
                    </p>
                    <h2 className="font-display font-bold text-xl text-foreground">Send Us a Message</h2>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      Fill in the form below and we'll reach out via WhatsApp instantly.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Full Name *</label>
                        <input
                          type="text" required placeholder="Ahmed Al-Rashidi"
                          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Country *</label>
                        <input
                          type="text" required placeholder="UAE, Nigeria, Kenya..."
                          value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Email</label>
                        <input
                          type="email" placeholder="you@email.com"
                          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>WhatsApp / Phone</label>
                        <input
                          type="tel" placeholder="+971 50 000 0000"
                          value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Message *</label>
                      <textarea
                        required rows={5}
                        placeholder="I'm looking for a 2022 Hyundai Tucson, Diesel, AWD. Please send available options and pricing to UAE..."
                        value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        className={`${inputCls} h-auto resize-none py-2.5`}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                      <button type="submit"
                        className="flex-1 flex items-center justify-center gap-2 h-11 rounded-md font-display font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{
                          background: "linear-gradient(135deg, #075E54, #128C7E)",
                          boxShadow: "0 4px 14px rgba(7,94,84,0.35)",
                        }}>
                        <img src="/icon-whatsapp.svg" alt="" className="w-4 h-4" />
                        Send via WhatsApp
                      </button>
                      <a href={`mailto:${COMPANY.email}?subject=Vehicle Inquiry&body=${encodeURIComponent(form.message || "Hello, I have an inquiry about a vehicle.")}`}
                        className="flex items-center justify-center gap-2 px-4 h-11 rounded-md font-display font-semibold text-sm border border-border transition-all hover:bg-muted text-foreground">
                        <Send className="w-3.5 h-3.5" />
                        Email
                      </a>
                    </div>

                    <p className="text-[10px] font-body text-muted-foreground text-center pt-1">
                      Your inquiry is saved so we can follow up. WhatsApp opens with your message pre-filled.
                    </p>
                  </form>
                </>
              )}
            </div>

            {/* Business info strip */}
            <div className="mt-4 rounded-xl border border-border bg-card px-6 py-4 grid grid-cols-3 gap-4"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              {[
                { label: "Response Time",  value: "< 1 hour",    sub: "during business hours" },
                { label: "Export Markets", value: "22 Countries", sub: "Middle East & Africa" },
                { label: "Cars Exported",  value: "1,240+",       sub: "since founding" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="text-center">
                  <p className="font-display font-bold text-lg" style={{ color: "hsl(var(--primary))" }}>{value}</p>
                  <p className="font-body text-[10px] font-semibold text-foreground mt-0.5">{label}</p>
                  <p className="font-body text-[10px] text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 mt-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-display font-bold text-sm" style={{ color: "hsl(var(--primary))" }}>Verified Car Pass</p>
          <p className="font-body text-xs text-muted-foreground">© 2025 Verified Car Pass. All rights reserved.</p>
          <div className="flex gap-3">
            {SOCIAL.map(({ label, href, icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <img src={icon} alt={label} className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}