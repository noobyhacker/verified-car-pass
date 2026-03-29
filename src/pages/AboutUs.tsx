import { Navbar } from "@/components/Navbar";
import { Shield, Globe, FileCheck, Users, Award, TrendingUp, MapPin, Phone, Mail } from "lucide-react";

const STATS = [
  { value: "1,240+", label: "Cars Exported" },
  { value: "22",     label: "Countries Served" },
  { value: "8+",     label: "Years Experience" },
  { value: "4.6/5",  label: "Avg Inspection Rating" },
];

const TEAM = [
  { name: "김민준 / Min-Jun Kim",    role: "Founder & CEO",           bio: "15 years in Korean automotive export. Former Hyundai Glovis logistics manager." },
  { name: "이수진 / Su-Jin Lee",     role: "Head of Inspections",      bio: "Licensed Korean vehicle inspector with 200+ certified reports issued." },
  { name: "Ahmed Al-Rashidi",        role: "Middle East Sales Lead",   bio: "Based in Dubai. Manages buyer relationships across UAE, Saudi Arabia, and Qatar." },
  { name: "Kwame Mensah",            role: "Africa Regional Manager",  bio: "Based in Accra. Covers West Africa with deep knowledge of import regulations." },
];

const VALUES = [
  { icon: Shield,    title: "Transparency First",    body: "Every vehicle comes with a tamper-proof digital inspection certificate. No hidden damage, no inflated mileage." },
  { icon: FileCheck, title: "Certified Inspections", body: "All inspections follow the official Korean 성능점검기록부 standard — the same form used by Korean government-registered facilities." },
  { icon: Globe,     title: "Global Reach",          body: "We export to 22 countries across the Middle East and Africa, with logistics partners in Busan, Incheon, and Pyeongtaek ports." },
  { icon: Users,     title: "Buyer-First Service",   body: "We communicate in English, Arabic, French, and Swahili. Your inquiry gets a response within 1 business hour." },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0d1f3c 0%, #1A3C6E 100%)" }}>
        <div className="container py-16">
          <p className="font-mono-data text-[11px] tracking-widest uppercase mb-3" style={{ color: "#E8A830" }}>
            About SS Trading Korea
          </p>
          <h1 className="font-display font-bold text-3xl text-white mb-4 max-w-xl">
            Korea's Most Trusted Used Car Export Platform
          </h1>
          <p className="font-body text-sm max-w-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            Founded in Seoul, we connect buyers across the Middle East and Africa with verified, inspected Korean used vehicles — shipped directly from port to door.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center py-8 px-4">
                <p className="font-display font-bold text-3xl mb-1" style={{ color: "#1A3C6E" }}>{value}</p>
                <p className="font-body text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Story */}
      <section className="container py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono-data text-[11px] tracking-widest uppercase mb-3" style={{ color: "#E8A830" }}>Our Story</p>
            <h2 className="font-display font-bold text-2xl text-gray-900 mb-4">
              Built on Trust, Driven by Transparency
            </h2>
            <div className="space-y-4 font-body text-sm text-gray-600 leading-relaxed">
              <p>
                SS Trading Korea was founded with one goal: to fix the trust problem in used car exports. Buyers in Dubai, Lagos, or Nairobi were purchasing vehicles sight-unseen, relying only on seller photos and verbal assurances.
              </p>
              <p>
                We changed that by making the full Korean inspection report — the official 성능점검기록부 — available in 5 languages, verified with a QR code, and immutable once submitted.
              </p>
              <p>
                Every vehicle in our catalog has been physically inspected in Korea by a licensed inspector. The report shows accident history, flood damage, panel condition, mileage authenticity, and 20+ mechanical checks. Nothing is hidden.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: "rgba(26,60,110,0.08)" }}>
                  <Icon className="w-4 h-4" style={{ color: "#1A3C6E" }} />
                </div>
                <p className="font-display font-semibold text-sm text-gray-900 mb-1">{title}</p>
                <p className="font-body text-xs text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-white border-t border-gray-100 py-14">
        <div className="container">
          <p className="font-mono-data text-[11px] tracking-widest uppercase mb-2 text-center" style={{ color: "#E8A830" }}>Our Team</p>
          <h2 className="font-display font-bold text-2xl text-gray-900 text-center mb-10">The People Behind Every Car</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map(({ name, role, bio }) => (
              <div key={name} className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #1A3C6E, #2a5298)" }}>
                  {name[0]}
                </div>
                <p className="font-display font-bold text-sm text-gray-900">{name}</p>
                <p className="font-body text-xs font-semibold mt-0.5 mb-2" style={{ color: "#E8A830" }}>{role}</p>
                <p className="font-body text-xs text-gray-500 leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location + Contact */}
      <section className="container py-14">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {[
              { icon: MapPin,  label: "Location",       value: "Mapo-gu, Seoul",      sub: "Republic of Korea" },
              { icon: Phone,   label: "Phone",          value: "+82-10-2705-8645",    sub: "Mon–Sat 09:00–19:00 KST" },
              { icon: Mail,    label: "Email",          value: "info@sstrading.kr",   sub: "Response within 1 hour" },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="flex items-center gap-4 p-8">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(26,60,110,0.08)" }}>
                  <Icon className="w-5 h-5" style={{ color: "#1A3C6E" }} />
                </div>
                <div>
                  <p className="text-[10px] font-body text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="font-display font-semibold text-sm text-gray-900 mt-0.5">{value}</p>
                  <p className="font-body text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-display font-bold text-sm" style={{ color: "#1A3C6E" }}>SS Trading Korea</p>
          <p className="font-body text-xs text-gray-400">© 2025 SS Trading Korea. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
