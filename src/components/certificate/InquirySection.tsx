import { useState } from "react";
import { MessageSquare, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { submitInquiry } from "@/lib/queries";

interface InquirySectionProps {
  vin: string;
}

const COUNTRIES = [
  "UAE", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman",
  "Ghana", "Nigeria", "Kenya", "Tanzania", "Uganda", "Guinea",
  "Senegal", "Ivory Coast", "Cameroon", "Ethiopia", "Other",
];

export function InquirySection({ vin }: InquirySectionProps) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await submitInquiry({
        vin,
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        country: form.country || undefined,
        message: form.message || undefined,
        language: lang,
      });
      if (result) {
        toast.success("Inquiry submitted. We will contact you within 24 hours.");
        setOpen(false);
        setForm({ name: "", email: "", phone: "", country: "", message: "" });
      } else {
        toast.error("Submission failed. Please try WhatsApp instead.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Sticky bottom bar on mobile */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden z-40 p-3 bg-background border-t border-border">
        <button
          onClick={() => setOpen(true)}
          className="w-full h-11 rounded bg-primary text-primary-foreground font-display font-bold text-sm flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          {t("inquire")}
        </button>
      </div>

      {/* Desktop inline button */}
      <div className="hidden sm:block">
        <button
          onClick={() => setOpen(true)}
          className="w-full h-11 rounded bg-primary text-primary-foreground font-display font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          {t("inquire")}
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-background rounded-t-xl sm:rounded-xl border border-border w-full sm:max-w-md mx-0 sm:mx-4 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-foreground">
                {t("inquire")}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground font-body">
              VIN: <span className="font-mono-data text-foreground">{vin}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                    {t("name")} *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-9 rounded border border-border bg-background px-3 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                    {t("phone")} *
                  </label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+971..."
                    className="w-full h-9 rounded border border-border bg-background px-3 text-sm font-mono-data text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-9 rounded border border-border bg-background px-3 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                  {t("country")} *
                </label>
                <select
                  required
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full h-9 rounded border border-border bg-background px-3 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">— Select —</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-body font-medium text-muted-foreground mb-1 block">
                  {t("message")}
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded bg-primary text-primary-foreground font-display font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Submitting..." : t("submit")}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
