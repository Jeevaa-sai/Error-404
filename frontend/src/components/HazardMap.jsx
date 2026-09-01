import { useEffect } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import WindIndicator from "./WindIndicator";
import SeverityLegend from "./SeverityLegend";
import { bandStyle, drawOrder } from "../utils/severity";

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

// Leaflet caches the pixel size of its container at init time and never
// re-measures it on its own. In a flex layout the container's real height
// often isn't final until after that first measurement (sidebar content,
// fonts, or the loading overlay can still shift things), so the map ends up
// projecting tiles/markers/polygons against a stale size — which is exactly
// what produces a map that looks cut off with a marker floating outside it.
// A ResizeObserver keeps it honest any time the container's actual size
// changes, plus one measurement a frame after mount to catch the initial
// flex settle.
function MapResize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    const raf = requestAnimationFrame(() => map.invalidateSize());
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [map]);
  return null;
}

// Pans the map whenever the facility's coordinates change from outside a
// map click (geolocation, typed lat/lon, a loaded share link) — a plain
// click already leaves that point in view, so this only recenters when the
// numbers themselves move.
function Recenter({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      map.flyTo([lat, lon], map.getZoom());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);
  return null;
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

        <MapResize />
        {onPick && <ClickPicker onPick={onPick} />}
        {hasLocation && <Recenter lat={facility.lat} lon={facility.lon} />}

        {drawOrder(thermalBands).map((band) => (
          <Polygon
            key={`thermal-${band.severity}`}
            positions={band.polygon}
            pathOptions={bandStyle(band, "thermal")}
          >
            <Popup>
              Thermal · {band.severity} · {band.threshold_label}
            </Popup>
          </Polygon>
        ))}

        {drawOrder(overpressureBands).map((band) => (
          <Polygon
            key={`overpressure-${band.severity}`}
            positions={band.polygon}
            pathOptions={bandStyle(band, "overpressure")}
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
