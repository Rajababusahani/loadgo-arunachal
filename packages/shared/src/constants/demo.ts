import type { LocationPoint } from "../contracts/location";

export const demoLocations: LocationPoint[] = [
  { address: "Naharlagun market", lat: 27.1045, lng: 93.6951, landmark: "Near main circle" },
  { address: "Itanagar sector E", lat: 27.0844, lng: 93.6053, landmark: "Near government quarter" },
  { address: "Ganga market", lat: 27.0977, lng: 93.6176, landmark: "Near taxi stand" },
  { address: "Yupia circle", lat: 27.1757, lng: 93.7876, landmark: "Near police point" },
  { address: "Doimukh main road", lat: 27.1501, lng: 93.7274, landmark: "Near bus stop" }
];

export function findDemoLocation(label: string): LocationPoint | undefined {
  return demoLocations.find((item) => item.address.toLowerCase() === label.trim().toLowerCase());
}
