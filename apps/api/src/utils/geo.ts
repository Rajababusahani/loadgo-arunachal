export function toGeoPoint(lat: number, lng: number) {
  return {
    type: "Point" as const,
    coordinates: [lng, lat] as [number, number]
  };
}

export function haversineDistanceKm(startLat: number, startLng: number, endLat: number, endLng: number): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(endLat - startLat);
  const dLng = toRadians(endLng - startLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(startLat)) * Math.cos(toRadians(endLat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function isGpsPlausible(speed?: number, accuracy?: number): boolean {
  if (typeof accuracy === "number" && accuracy > 150) {
    return false;
  }

  if (typeof speed === "number" && speed > 45) {
    return false;
  }

  return true;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
