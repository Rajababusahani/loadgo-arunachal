import { BookingStatus, PaymentStatus } from "@loadgo/shared";

export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  created: ["searching", "cancelled"],
  searching: ["assigned", "cancelled"],
  assigned: ["arriving", "cancelled"],
  arriving: ["in_transit", "cancelled"],
  in_transit: ["completed"],
  completed: [],
  cancelled: []
};

export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["authorized", "cash_due", "failed"],
  authorized: ["paid", "failed"],
  cash_due: ["paid", "failed"],
  paid: [],
  failed: []
};
