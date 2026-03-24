export function calculateEstimatedPrice(baseFare: number, perKmRate: number, distanceKm: number): number {
  const rawTotal = baseFare + perKmRate * distanceKm;
  return Math.round(rawTotal * 100) / 100;
}
