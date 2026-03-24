export interface LocationPoint {
  address: string;
  lat: number;
  lng: number;
  landmark?: string;
}

export interface PlaceSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  description: string;
}

export interface TrackingEvent {
  bookingId: string;
  driverId: string;
  lat: number;
  lng: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  recordedAt: string;
}
