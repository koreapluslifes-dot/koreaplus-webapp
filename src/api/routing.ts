/**
 * Route optimization utilities.
 * K-means++ clustering for day grouping, Nearest-Neighbor TSP per day.
 * No external routing API required — haversine estimates are accurate enough
 * for scheduling purposes (±20% vs actual transit time).
 */

export interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
  [key: string]: unknown;
}

// ── Haversine distance (km) ───────────────────────────────────────────────────

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// ── K-means++ initialisation ──────────────────────────────────────────────────

function kMeansInit(points: GeoPoint[], k: number): GeoPoint[] {
  if (points.length <= k) return [...points];
  const centers: GeoPoint[] = [points[Math.floor(Math.random() * points.length)]];
  while (centers.length < k) {
    const dists = points.map(p => Math.min(...centers.map(c => haversineKm(p, c))));
    const total = dists.reduce((s, d) => s + d * d, 0);
    let r = Math.random() * total;
    for (let i = 0; i < points.length; i++) {
      r -= dists[i] * dists[i];
      if (r <= 0) { centers.push(points[i]); break; }
    }
    if (centers.length < k + 1 - 1) centers.push(points[points.length - 1]);
  }
  return centers;
}

/**
 * Cluster `places` into `numDays` geographic groups using Lloyd's K-means.
 * Returns array of clusters (one per day). Empty-cluster redistribution is
 * handled by assigning straggler points to the nearest non-empty cluster.
 */
export function clusterByDay(places: GeoPoint[], numDays: number): GeoPoint[][] {
  const k = Math.min(numDays, places.length);
  if (k <= 1) return [places];

  let centers = kMeansInit(places, k);

  for (let iter = 0; iter < 30; iter++) {
    const clusters: GeoPoint[][] = Array.from({ length: k }, () => []);
    for (const p of places) {
      let best = 0, bestDist = Infinity;
      for (let i = 0; i < k; i++) {
        const d = haversineKm(p, centers[i]);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      clusters[best].push(p);
    }

    // Redistribute empty clusters
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) {
        // Steal the farthest point from the largest cluster
        const largest = clusters.reduce((mx, cl, j) => cl.length > clusters[mx].length ? j : mx, 0);
        const farthest = clusters[largest].reduce((fi, p, j) =>
          haversineKm(p, centers[i]) > haversineKm(clusters[largest][fi], centers[i]) ? j : fi, 0);
        clusters[i].push(...clusters[largest].splice(farthest, 1));
      }
    }

    const newCenters = clusters.map(cl => ({
      id: '__c__',
      lat: cl.reduce((s, p) => s + p.lat, 0) / cl.length,
      lng: cl.reduce((s, p) => s + p.lng, 0) / cl.length,
    }));

    const converged = newCenters.every((c, i) => haversineKm(c, centers[i]) < 0.05);
    centers = newCenters;
    if (converged) { return clusters; }
  }

  // Return final assignment
  const clusters: GeoPoint[][] = Array.from({ length: k }, () => []);
  for (const p of places) {
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < k; i++) {
      const d = haversineKm(p, centers[i]);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    clusters[best].push(p);
  }
  return clusters;
}

/**
 * Nearest-neighbor TSP heuristic.
 * Greedy: start at first point, always go to the closest unvisited next.
 * O(n²) — fine for n ≤ 15 (spots per day).
 */
export function nearestNeighborSort<T extends GeoPoint>(points: T[]): T[] {
  if (points.length <= 2) return [...points];
  const remaining = [...points];
  const result: T[] = [remaining.shift()!];
  while (remaining.length) {
    const last = result[result.length - 1];
    let nearestIdx = 0, nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(last, remaining[i]);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    }
    result.push(...remaining.splice(nearestIdx, 1));
  }
  return result;
}

/**
 * Estimate transit time between two geo points.
 * Uses heuristics: walk < 0.5km, subway for 0.5–20km, taxi for longer.
 * Returns minutes.
 */
export function estimateTravelMinutes(from: GeoPoint, to: GeoPoint): {
  minutes: number; method: 'walk' | 'subway' | 'taxi'; note: string;
} {
  const km = haversineKm(from, to);
  if (km < 0.5)  return { minutes: Math.round(km * 12), method: 'walk',   note: `${(km * 1000).toFixed(0)}m walk` };
  if (km < 20)   return { minutes: Math.round(km * 4 + 5), method: 'subway', note: `subway ~${Math.round(km * 4 + 5)} min` };
  return         { minutes: Math.round(km * 2.5 + 10),    method: 'taxi',  note: `taxi ~${Math.round(km * 2.5 + 10)} min` };
}
