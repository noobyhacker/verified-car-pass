import { useLanguage } from "@/i18n/LanguageContext";

interface ZoneData {
  rating: number;
  notes_ko: string | null;
}

interface BodyConditionGridProps {
  bodyCondition: Record<string, ZoneData>;
  translatedNotes: Record<string, string>;
}

const ZONE_KEYS = ["front", "rear", "left", "right", "roof", "underbody"] as const;

function getRatingColor(rating: number) {
  if (rating >= 5) return { bar: "bg-success", text: "text-success", bg: "bg-success/8 border-success/20" };
  if (rating >= 4) return { bar: "bg-success/70", text: "text-success", bg: "bg-success/5 border-success/15" };
  if (rating >= 3) return { bar: "bg-warning", text: "text-warning", bg: "bg-warning/8 border-warning/20" };
  if (rating >= 2) return { bar: "bg-destructive/70", text: "text-destructive", bg: "bg-destructive/5 border-destructive/15" };
  return { bar: "bg-destructive", text: "text-destructive", bg: "bg-destructive/8 border-destructive/20" };
}

export function BodyConditionGrid({ bodyCondition, translatedNotes }: BodyConditionGridProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="font-display font-semibold text-sm text-foreground">
          {t("body_condition")}
        </h3>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ZONE_KEYS.map((zone) => {
          const data = bodyCondition[zone];
          if (!data) return null;

          const colors = getRatingColor(data.rating);
          const note = translatedNotes[zone] || null;
          const conditionLabel = t(`condition_${data.rating}`);

          return (
            <div
              key={zone}
              className={`rounded border p-3 space-y-2 ${colors.bg}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-body font-semibold text-foreground capitalize">
                  {t(`zone_${zone}`)}
                </span>
                <span className={`font-mono-data text-xs font-bold ${colors.text}`}>
                  {data.rating}/5
                </span>
              </div>

              {/* Rating bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${colors.bar}`}
                  style={{ width: `${(data.rating / 5) * 100}%` }}
                />
              </div>

              <p className={`text-[11px] font-body ${colors.text}`}>{conditionLabel}</p>

              {note && (
                <p className="text-[11px] text-muted-foreground font-body leading-snug border-t border-border/50 pt-1.5">
                  {note}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
