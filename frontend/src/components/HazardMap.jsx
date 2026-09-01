import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import WindIndicator from "./WindIndicator";
import SeverityLegend from "./SeverityLegend";

const SEVERITY_COLORS = {
  high: "#d64545",
  medium: "#e8a33d",
  low: "#f0d264",
};

const FALLBACK_CENTER = [13.0067, 80.2206];

const facilityIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:14px;height:14px;background:#ff6a13;border:2px solid #0f1720;
         border-radius:2px;transform:rotate(45deg);box-shadow:0 0 0 2px #ff6a13aa;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function assetIcon(inHazard) {
  const color = inHazard ? "#d64545" : "#5b8def";
  return new L.DivIcon({
    className: "",
    html: `<div style="width:12px;height:12px;background:${color};border:2px solid #0f1720;
           border-radius:50%;box-shadow:0 0 0 2px ${color}aa;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function ClickPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function severityOrderDesc(bands) {
  const order = { low: 0, medium: 1, high: 2 };
  return [...bands].sort((a, b) => order[b.severity] - order[a.severity]);
}

export default function HazardMap({ facility, zones, height = "100%", onPick, assets = [], loading = false }) {
  const hasLocation = Number.isFinite(facility.lat) && Number.isFinite(facility.lon);
  const center = hasLocation ? [facility.lat, facility.lon] : FALLBACK_CENTER;
  const thermalBands = zones?.thermal_bands || [];
  const overpressureBands = zones?.overpressure_bands || [];

  return (
    <div className="relative w-full" style={{ height }}>
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom
        className="w-full h-full rounded-sm border border-ink-700"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {onPick && <ClickPicker onPick={onPick} />}

        {severityOrderDesc(thermalBands).map((band, i) => (
          <Polygon
            key={`thermal-${i}`}
            positions={band.polygon}
            pathOptions={{
              color: SEVERITY_COLORS[band.severity] || "#ff6a13",
              weight: 2,
              fillOpacity: 0.22,
              dashArray: undefined,
            }}
          >
            <Popup>
              Thermal · {band.severity} · {band.threshold_label}
            </Popup>
          </Polygon>
        ))}

        {severityOrderDesc(overpressureBands).map((band, i) => (
          <Polygon
            key={`overpressure-${i}`}
            positions={band.polygon}
            pathOptions={{
              color: "#5b8def",
              weight: 2,
              fill: false,
              dashArray: "6,5",
            }}
          >
            <Popup>
              Overpressure · {band.severity} · {band.threshold_label}
            </Popup>
          </Polygon>
        ))}

        {hasLocation && (
          <Marker position={center} icon={facilityIcon}>
            <Popup>{facility.name || "Facility"}{onPick ? " — click map to move" : ""}</Popup>
          </Marker>
        )}

        {assets.map((asset) => (
          <Marker key={asset.id} position={[asset.lat, asset.lon]} icon={assetIcon(asset.inHazard)}>
            <Popup>
              {asset.label}
              <br />
              {asset.inHazard ? "⚠ Inside a hazard zone" : "Outside all hazard zones"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-[1000] flex items-center justify-center
                     bg-ink-950/50 backdrop-blur-[1px] rounded-sm pointer-events-none"
        >
          <span className="flex items-center gap-2 bg-ink-900/95 border border-ink-700
                           rounded-sm px-3 py-2 text-xs text-ink-100">
            <span
              className="w-3 h-3 rounded-full border-2 border-ink-700 border-t-hazard-500 animate-spin"
              aria-hidden="true"
            />
            Calculating hazard zones…
          </span>
        </div>
      )}

      {!hasLocation && !loading && (
        <div className="absolute inset-x-0 top-3 z-[1000] flex justify-center pointer-events-none">
          <span className="bg-ink-900/95 border border-ink-700 rounded-sm px-3 py-1.5 text-xs text-ink-400">
            Click the map to place the facility
          </span>
        </div>
      )}

      <WindIndicator
        windSpeedMps={facility.wind_speed_mps}
        windDirectionDeg={facility.wind_direction_deg}
      />
      <SeverityLegend thermalBands={thermalBands} overpressureBands={overpressureBands} />
    </div>
  );
}
