import { describe, expect, it } from "vitest";
import { BOOKING_TRANSITIONS, PAYMENT_TRANSITIONS } from "./transitions";

describe("transition rules", () => {
  it("allows booking lifecycle progression", () => {
    expect(BOOKING_TRANSITIONS.searching).toContain("assigned");
    expect(BOOKING_TRANSITIONS.in_transit).toContain("completed");
  });

  it("allows payment completion progression", () => {
    expect(PAYMENT_TRANSITIONS.pending).toContain("cash_due");
    expect(PAYMENT_TRANSITIONS.authorized).toContain("paid");
  });
});
