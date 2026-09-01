import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import WindIndicator from "./WindIndicator";
import SeverityLegend from "./SeverityLegend";

const SEVERITY_COLORS = {
  high: "#d64545",
  medium: "#e8a33d",
  low: "#f0d264",
};

const facilityIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:14px;height:14px;background:#ff6a13;border:2px solid #0f1720;
         border-radius:2px;transform:rotate(45deg);box-shadow:0 0 0 2px #ff6a13aa;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

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

export default function HazardMap({ facility, zones, height = "100%", onPick }) {
  const center = [facility.lat, facility.lon];
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

        <Marker position={center} icon={facilityIcon}>
          <Popup>{facility.name || "Facility"}{onPick ? " — click map to move" : ""}</Popup>
        </Marker>
      </MapContainer>

      <WindIndicator
        windSpeedMps={facility.wind_speed_mps}
        windDirectionDeg={facility.wind_direction_deg}
      />
      <SeverityLegend thermalBands={thermalBands} overpressureBands={overpressureBands} />
    </div>
  );
}
