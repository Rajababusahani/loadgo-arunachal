import { describe, expect, it } from "vitest";
import { haversineDistanceKm, isGpsPlausible } from "./geo";

describe("geo utilities", () => {
  it("calculates approximate distance in kilometers", () => {
    const distance = haversineDistanceKm(27.0844, 93.6053, 27.1023, 93.6920);
    expect(distance).toBeGreaterThan(8);
    expect(distance).toBeLessThan(11);
  });

  it("rejects implausible gps accuracy and speed", () => {
    expect(isGpsPlausible(20, 30)).toBe(true);
    expect(isGpsPlausible(50, 30)).toBe(false);
    expect(isGpsPlausible(10, 200)).toBe(false);
  });
});
