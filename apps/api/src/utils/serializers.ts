export function serializeLocation(stop: any) {
  return {
    address: stop.address,
    landmark: stop.landmark,
    lat: stop.point.coordinates[1],
    lng: stop.point.coordinates[0]
  };
}

export function serializeBooking(booking: any) {
  return {
    id: booking._id?.toString() ?? booking.id,
    userId: booking.userId?.toString?.() ?? booking.userId,
    driverId: booking.driverId?.toString?.() ?? booking.driverId,
    pickup: serializeLocation(booking.pickup),
    drop: serializeLocation(booking.drop),
    distanceKm: booking.distanceKm,
    estimatedPrice: booking.estimatedPrice,
    finalPrice: booking.finalPrice,
    vehicleType: booking.vehicleType,
    status: booking.status,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    durationMinutes: booking.durationMinutes,
    lastTrackingAt: booking.lastTrackingAt,
    lastKnownDriverLocation: booking.lastKnownDriverLocation
      ? {
          lat: booking.lastKnownDriverLocation.point.coordinates[1],
          lng: booking.lastKnownDriverLocation.point.coordinates[0],
          accuracy: booking.lastKnownDriverLocation.accuracy,
          speed: booking.lastKnownDriverLocation.speed,
          recordedAt: booking.lastKnownDriverLocation.recordedAt
        }
      : null
  };
}
