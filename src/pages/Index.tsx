import { Link } from "react-router-dom";
import { inspections, vehicles, certificates, media } from "@/data/mockData";
import { ExternalLink, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useState } from "react";

export default function Index() {
  const [search, setSearch] = useState("");

  const filteredInspections = inspections.filter((ins) => {
    const vehicle = vehicles.find((v) => v.vin === ins.vin);
    if (!vehicle) return false;
    const term = search.toLowerCase();
    return (
      !term ||
      vehicle.make.toLowerCase().includes(term) ||
      vehicle.model.toLowerCase().includes(term) ||
      vehicle.vin.toLowerCase().includes(term) ||
      String(vehicle.year).includes(term)
    );
  });

  const totalVehicles = inspections.length;
  const cleanCount = inspections.filter((i) => !i.accident_status).length;
  const avgRating = (inspections.reduce((s, i) => s + i.overall_rating, 0) / inspections.length).toFixed(1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-6 space-y-6 page-fade">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Vehicles", value: String(totalVehicles) },
            { label: "Accident Free", value: `${cleanCount}/${totalVehicles}` },
            { label: "Avg Rating", value: `${avgRating}/5.0` },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded p-4 border-l-[3px] border-l-primary">
              <p className="font-display font-bold text-xl text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by make, model, VIN, year..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded border border-border bg-card pl-9 pr-4 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">VIN</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Mileage</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rating</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filteredInspections.map((ins, idx) => {
                const vehicle = vehicles.find((v) => v.vin === ins.vin);
                const cert = certificates.find((c) => c.inspection_id === ins.id);
                const photo = media.find((m) => m.vin === ins.vin && m.type === "image");
                if (!vehicle || !cert) return null;

                return (
                  <tr key={ins.id} className={`border-b border-border table-row-hover transition-colors ${idx % 2 === 1 ? "bg-muted/20" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {photo?.storage_url ? (
                          <img src={photo.storage_url} alt="" className="w-12 h-9 rounded object-cover border border-border" />
                        ) : (
                          <div className="w-12 h-9 rounded bg-muted border border-border" />
                        )}
                        <div>
                          <p className="font-display font-semibold text-sm text-foreground">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          <p className="font-mono-data text-[10px] text-muted-foreground mt-0.5">{cert.certificate_uid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono-data text-xs text-muted-foreground">{vehicle.vin}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono-data text-xs text-foreground">{ins.mileage.toLocaleString()} km</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono-data font-semibold ${
                        ins.accident_status
                          ? "bg-destructive/10 text-destructive"
                          : "bg-success/10 text-success"
                      }`}>
                        {ins.accident_status ? "ACCIDENT" : "CLEAN"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono-data text-sm font-semibold text-foreground">{ins.overall_rating}</span>
                      <span className="text-xs text-muted-foreground">/5</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono-data text-sm font-semibold text-primary">${vehicle.price_usd.toLocaleString()}</span>
                    </td>
                    <td className="px-2 py-3">
                      <Link
                        to={`/car/${ins.public_slug}`}
                        className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-muted transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredInspections.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground font-body">
              No vehicles match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
