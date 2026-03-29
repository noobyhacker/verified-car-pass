import { useLanguage } from "@/i18n/LanguageContext";

interface Vehicle {
  make: string;
  model: string;
  year: number;
  generation?: string;
  trim?: string;
  fuel_type: string;
  transmission: string;
  drivetrain: string;
  engine_cc: number;
  color: string;
  color_hex: string;
  brake_type: string;
  price_usd: number;
  price_aed?: number;
}

interface SpecsTableProps {
  vehicle: Vehicle;
  mileage: number;
}

export function SpecsTable({ vehicle, mileage }: SpecsTableProps) {
  const { t } = useLanguage();

  const rows = [
    { label: t("make"), value: vehicle.make },
    { label: t("model"), value: `${vehicle.model}${vehicle.generation ? ` (${vehicle.generation})` : ""}` },
    { label: t("year"), value: String(vehicle.year) },
    { label: t("fuel_type"), value: vehicle.fuel_type },
    { label: t("engine"), value: `${vehicle.engine_cc}cc` },
    { label: t("transmission"), value: vehicle.transmission },
    { label: t("drivetrain"), value: vehicle.drivetrain },
    { label: t("mileage"), value: `${mileage.toLocaleString()} km` },
    {
      label: t("color"),
      value: vehicle.color,
      extra: (
        <span
          className="inline-block w-3 h-3 rounded-full border border-border ml-1.5 align-middle"
          style={{ backgroundColor: vehicle.color_hex }}
        />
      ),
    },
    { label: t("brake_type"), value: vehicle.brake_type },
  ];

  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="font-display font-semibold text-sm text-foreground">
          {t("vehicle_specs")}
        </h3>
      </div>

      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.label}
              className={`border-b border-border last:border-0 ${idx % 2 === 1 ? "bg-muted/20" : ""}`}
            >
              <td className="px-4 py-2.5 text-xs text-muted-foreground font-body w-2/5">
                {row.label}
              </td>
              <td className="px-4 py-2.5 text-sm font-mono-data font-medium text-foreground">
                {row.value}
                {row.extra}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Price row */}
      <div className="px-4 py-3 border-t border-border bg-primary/5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-body">Asking Price</span>
        <div className="flex items-center gap-3">
          <span className="font-mono-data font-bold text-primary text-base">
            ${vehicle.price_usd.toLocaleString()}
          </span>
          {vehicle.price_aed && (
            <span className="font-mono-data text-xs text-muted-foreground">
              / AED {vehicle.price_aed.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
