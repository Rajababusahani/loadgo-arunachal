import type { BookingStatus, PaymentMethod, PaymentStatus, VehicleType } from "../constants/enums";
import type { LocationPoint } from "./location";

export interface QuoteRequest {
  pickup: LocationPoint;
  drop: LocationPoint;
  vehicleType: VehicleType;
}

export interface QuoteResponse {
  vehicleType: VehicleType;
  distanceKm: number;
  durationMinutes: number;
  baseFare: number;
  perKmRate: number;
  estimatedPrice: number;
  currency: "INR";
}

export interface BookingSummary {
  id: string;
  userId: string;
  driverId?: string;
  pickup: LocationPoint;
  drop: LocationPoint;
  distanceKm: number;
  estimatedPrice: number;
  finalPrice: number;
  vehicleType: VehicleType;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DriverOffer {
  bookingId: string;
  vehicleType: VehicleType;
  pickup: LocationPoint;
  drop: LocationPoint;
  estimatedPrice: number;
  distanceKm: number;
  expiresAt: string;
}
