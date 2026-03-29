import { Navbar } from "@/components/Navbar";
import { Link } from "react-router-dom";
import { ChevronRight, Shield, FileCheck, Ship, CheckCircle, AlertTriangle, MessageCircle } from "lucide-react";

const STEPS = [
  {
    no: "01",
    icon: Shield,
    title: "Browse & Select a Vehicle",
    body: "Browse our certified catalog at /catalog. Every listed vehicle has passed a full physical inspection in Korea. Filter by make, fuel type, accident history, and price. Click any card to view the full inspection certificate.",
    tips: ["Look for the green 'Accident Free' badge", "Check the overall rating (aim for 4+/5)", "Review the body condition panel grid carefully"],
  },
  {
    no: "02",
    icon: MessageCircle,
    title: "Submit an Inquiry",
    body: "Found a car you like? Click 'Inquire' on the certificate page or reach us via WhatsApp. Tell us your country, preferred port of delivery, and any specific requirements. We respond within 1 business hour.",
    tips: ["WhatsApp is the fastest channel", "Mention your target delivery port", "Ask about current shipping schedules"],
  },
  {
    no: "03",
    icon: FileCheck,
    title: "Review the Full Inspection Report",
    body: "We will send you the complete digital inspection certificate. This includes all 20+ mechanical checks, body panel condition, mileage verification, accident history, and photos. The report is tamper-proof and QR-verifiable.",
    tips: ["Scan the QR code to verify authenticity", "Check the 성능점검기록부 report number", "All notes are translated into your language"],
  },
  {
    no: "04",
    icon: CheckCircle,
    title: "Confirm & Pay Deposit",
    body: "Once you are satisfied with the inspection report, confirm your purchase and pay the agreed deposit via T/T bank transfer. We will provide a proforma invoice and purchase agreement.",
    tips: ["Standard deposit is 20–30% of vehicle price", "Balance paid before shipping", "We accept T/T wire transfers"],
  },
  {
    no: "05",
    icon: Ship,
    title: "Export & Shipping",
    body: "We handle all Korean export documentation, port processing, and loading at Busan, Incheon, or Pyeongtaek port depending on your destination. Transit times are typically 15–30 days to Middle East ports, 25–40 days to Africa.",
    tips: ["We provide B/L, commercial invoice, packing list", "Insurance available on request", "Track your shipment in real time"],
  },
  {
    no: "06",
    icon: CheckCircle,
    title: "Arrival & Customs Clearance",
    body: "We provide all required export documentation for customs clearance at your destination port. Our regional agents in Dubai and Accra can assist with clearance if needed.",
    tips: ["Documents sent digitally and by courier", "Deregistration certificate included", "Contact us for clearance assistance"],
  },
];

const FAQ = [
  { q: "Can I request a specific vehicle not listed in the catalog?", a: "Yes. Contact us via WhatsApp with your requirements — make, model, year, color, mileage range. We source from Korean auctions and dealerships and will find matching options within 3–5 business days." },
  { q: "Are all vehicles right-hand drive?", a: "No. Korea is a left-hand drive country. All vehicles are LHD, which is standard for Middle East and most African markets." },
  { q: "What documents do I receive?", a: "You receive: Korean vehicle deregistration certificate (말소등록증), inspection report (성능점검기록부), bill of lading, commercial invoice, packing list, and export certificate." },
  { q: "Can I have the vehicle re-inspected by a third party?", a: "Yes. We welcome third-party inspection before shipping. We can arrange access at our storage facility in Seoul." },
  { q: "What is your warranty policy?", a: "We are a used car exporter, not a dealer. Vehicles are sold as-is per the inspection report. We guarantee the accuracy of all inspection data — if we have misrepresented any condition, we will cover correction costs." },
  { q: "How long does shipping take?", a: "UAE/Saudi Arabia: 15–20 days from Busan. Ghana/Nigeria: 30–40 days. Kenya/Tanzania: 25–35 days. Exact transit times depend on the shipping line and port congestion." },
];

export default function PurchaseGuide() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0d1f3c 0%, #1A3C6E 100%)" }}>
        <div className="container py-16">
          <p className="font-mono-data text-[11px] tracking-widest uppercase mb-3" style={{ color: "#E8A830" }}>
            Purchase Guide
          </p>
          <h1 className="font-display font-bold text-3xl text-white mb-4 max-w-xl">
            How to Buy a Verified Korean Car
          </h1>
          <p className="font-body text-sm max-w-lg leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
            From browsing the catalog to delivery at your port — here's exactly how the process works, step by step.
          </p>
          <Link to="/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-display font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: "#E8A830", color: "#1A3C6E" }}>
            Browse Catalog <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Steps */}
      <section className="container py-14">
        <div className="space-y-6">
          {STEPS.map(({ no, icon: Icon, title, body, tips }) => (
            <div key={no} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Step number */}
                <div className="flex items-center justify-center w-full md:w-24 py-6 md:py-0 flex-shrink-0"
                  style={{ background: "rgba(26,60,110,0.05)" }}>
                  <p className="font-display font-bold text-3xl" style={{ color: "#E8A830" }}>{no}</p>
                </div>
                {/* Content */}
                <div className="flex-1 p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(26,60,110,0.08)" }}>
                      <Icon className="w-4 h-4" style={{ color: "#1A3C6E" }} />
                    </div>
                    <h3 className="font-display font-bold text-base text-gray-900">{title}</h3>
                  </div>
                  <p className="font-body text-sm text-gray-600 leading-relaxed mb-4">{body}</p>
                  <div className="flex flex-wrap gap-2">
                    {tips.map((tip) => (
                      <span key={tip} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body"
                        style={{ background: "rgba(26,60,110,0.06)", color: "#1A3C6E" }}>
                        <CheckCircle className="w-3 h-3" />
                        {tip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Warning box */}
      <section className="container pb-10">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 flex gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-semibold text-sm text-amber-900 mb-1">Important: Verify Before You Pay</p>
            <p className="font-body text-xs text-amber-800 leading-relaxed">
              Always verify the inspection certificate using the QR code on the certificate page before sending any payment. Our certificates are hosted on our server and cannot be forged. If a seller sends you a PDF certificate without a verifiable QR link, do not trust it.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-gray-100 py-14">
        <div className="container max-w-3xl">
          <p className="font-mono-data text-[11px] tracking-widest uppercase mb-2 text-center" style={{ color: "#E8A830" }}>FAQ</p>
          <h2 className="font-display font-bold text-2xl text-gray-900 text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="border border-gray-100 rounded-xl p-6">
                <p className="font-display font-semibold text-sm text-gray-900 mb-2">{q}</p>
                <p className="font-body text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 text-center" style={{ background: "#1A3C6E" }}>
        <div className="container">
          <h2 className="font-display font-bold text-xl text-white mb-2">Ready to find your car?</h2>
          <p className="font-body text-sm mb-6 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.7)" }}>
            Browse our certified inventory or contact us directly on WhatsApp.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded font-display font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: "#E8A830", color: "#1A3C6E" }}>
              Browse Catalog <ChevronRight className="w-4 h-4" />
            </Link>
            <a href="https://wa.me/821027058645" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded font-body text-sm text-white border border-white/30 hover:bg-white/10 transition-colors">
              WhatsApp Us
            </a>
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
