import { useLanguage } from "@/i18n/LanguageContext";
import { vehicleOptions, getLabelForOption, type OptionCategory } from "@/data/vehicleOptions";
import { CheckCircle2, XCircle, Settings2, Shield, Tv, Palette } from "lucide-react";
import { useState } from "react";

interface VehicleOptionsPanelProps {
  options: Record<string, boolean>;
}

const CATEGORIES: { key: OptionCategory; icon: React.ElementType; labelKey: string }[] = [
  { key: "driving", icon: Shield, labelKey: "opts_driving" },
  { key: "comfort", icon: Settings2, labelKey: "opts_comfort" },
  { key: "av", icon: Tv, labelKey: "opts_av" },
  { key: "exterior", icon: Palette, labelKey: "opts_exterior" },
];

export function VehicleOptionsPanel({ options }: VehicleOptionsPanelProps) {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<OptionCategory>("driving");

  const tabOptions = vehicleOptions.filter((o) => o.category === activeTab);
  const presentCount = tabOptions.filter((o) => options[o.key] === true).length;
  const totalCount = tabOptions.length;

  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm text-foreground">{t("vehicle_options")}</h3>
        <span className="font-mono-data text-xs text-muted-foreground">
          {presentCount}/{totalCount}
        </span>
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {CATEGORIES.map(({ key, icon: Icon, labelKey }) => {
          const catOptions = vehicleOptions.filter((o) => o.category === key);
          const catPresent = catOptions.filter((o) => options[o.key] === true).length;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-body font-medium whitespace-nowrap transition-colors border-b-2 ${
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Icon className="w-3 h-3" />
              {t(labelKey)}
              <span className={`ml-1 font-mono-data text-[10px] px-1 rounded ${
                isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}>
                {catPresent}/{catOptions.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Options grid */}
      <div className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {tabOptions.map((opt) => {
            const present = options[opt.key] === true;
            return (
              <div
                key={opt.key}
                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                  present
                    ? "bg-success/5 border border-success/20"
                    : "bg-muted/30 border border-transparent"
                }`}
              >
                {present ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                )}
                <span className={`font-body text-xs ${present ? "text-foreground" : "text-muted-foreground"}`}>
                  {getLabelForOption(opt, lang)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
