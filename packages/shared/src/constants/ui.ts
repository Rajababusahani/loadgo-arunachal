import type { VehicleType } from "./enums";

export const vehicleLabels: Record<VehicleType, { en: string; hi: string }> = {
  bike: { en: "Bike", hi: "Baik" },
  mini_truck: { en: "Mini Truck", hi: "Mini Truck" },
  pickup_truck: { en: "Pickup Truck", hi: "Pickup Truck" }
};

export const statusLabels = {
  created: { en: "Created", hi: "Ban gaya" },
  searching: { en: "Finding driver", hi: "Driver dhoondh rahe hain" },
  assigned: { en: "Driver assigned", hi: "Driver mil gaya" },
  arriving: { en: "Driver arriving", hi: "Driver aa raha hai" },
  in_transit: { en: "In transit", hi: "Samaan raaste mein hai" },
  completed: { en: "Completed", hi: "Poora hua" },
  cancelled: { en: "Cancelled", hi: "Radd" }
} as const;

export const paymentLabels = {
  upi: "UPI",
  card: "Card",
  cash: "Cash"
} as const;
