export const USER_ROLES = ["customer", "driver", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const VEHICLE_TYPES = ["bike", "mini_truck", "pickup_truck"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const DRIVER_APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type DriverApprovalStatus = (typeof DRIVER_APPROVAL_STATUSES)[number];

export const DRIVER_AVAILABILITY = ["offline", "online", "busy"] as const;
export type DriverAvailability = (typeof DRIVER_AVAILABILITY)[number];

export const BOOKING_STATUSES = [
  "created",
  "searching",
  "assigned",
  "arriving",
  "in_transit",
  "completed",
  "cancelled"
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_METHODS = ["upi", "card", "cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["pending", "authorized", "cash_due", "paid", "failed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const COMPLAINT_STATUSES = ["open", "in_review", "resolved"] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const DOCUMENT_KINDS = ["license", "vehicle_rc", "profile_photo"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];
