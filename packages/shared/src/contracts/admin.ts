import type { DriverApprovalStatus, VehicleType } from "../constants/enums";

export interface PricingRule {
  vehicleType: VehicleType;
  baseFare: number;
  perKmRate: number;
  isActive: boolean;
}

export interface DriverKycDocument {
  kind: "license" | "vehicle_rc" | "profile_photo";
  url: string;
  publicId: string;
  uploadedAt: string;
}

export interface DriverProfileSummary {
  userId: string;
  vehicleType: VehicleType;
  approvalStatus: DriverApprovalStatus;
  availability: "offline" | "online" | "busy";
  earningsToday: number;
  totalEarnings: number;
}
