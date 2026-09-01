// Ray-casting point-in-polygon test. `point` is [lat, lon], `ring` is a
// closed list of [lat, lon] pairs (first === last), matching the shape the
// backend returns for hazard band polygons.
export function pointInPolygon([lat, lon], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lonI] = ring[i];
    const [latJ, lonJ] = ring[j];
    const intersects =
      latI > lat !== latJ > lat &&
      lon < ((lonJ - lonI) * (lat - latI)) / (latJ - latI) + lonI;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function polygonBounds(ring) {
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const [lat, lon] of ring) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  return { minLat, maxLat, minLon, maxLon };
}

// Widest ring in a band list (the outermost/lowest-severity band, which
// contains all the others) — used as the area to query exposure over.
export function outermostRing(bands) {
  if (!bands || bands.length === 0) return null;
  let widest = bands[0];
  let widestSpan = 0;
  for (const band of bands) {
    const b = polygonBounds(band.polygon);
    const span = (b.maxLat - b.minLat) * (b.maxLon - b.minLon);
    if (span > widestSpan) {
      widestSpan = span;
      widest = band;
    }
  }
  return widest.polygon;
}
