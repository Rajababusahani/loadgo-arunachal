import { z } from "zod";
import { BookingModel } from "../models/Booking";
import { asyncHandler } from "../utils/async-handler";
import { createBooking, cancelBooking, getBookingHistory } from "../services/booking.service";
import { serializeBooking } from "../utils/serializers";
import { ApiError } from "../utils/api-error";

const createBookingSchema = z.object({
  body: z.object({
    pickup: z.object({
      address: z.string().min(2),
      lat: z.number(),
      lng: z.number(),
      landmark: z.string().optional()
    }),
    drop: z.object({
      address: z.string().min(2),
      lat: z.number(),
      lng: z.number(),
      landmark: z.string().optional()
    }),
    vehicleType: z.enum(["bike", "mini_truck", "pickup_truck"]),
    paymentMethod: z.enum(["upi", "card", "cash"]),
    notes: z.string().max(300).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

const bookingIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({})
});

export const bookingValidators = {
  create: createBookingSchema,
  bookingId: bookingIdSchema
};

export const createBookingController = asyncHandler(async (req, res) => {
  const booking = await createBooking({
    userId: req.auth!.userId,
    pickup: req.body.pickup,
    drop: req.body.drop,
    vehicleType: req.body.vehicleType,
    paymentMethod: req.body.paymentMethod,
    notes: req.body.notes
  });

  res.status(201).json({ booking: serializeBooking(booking) });
});

export const listBookings = asyncHandler(async (req, res) => {
  const bookings = await getBookingHistory(req.auth!.userId, req.auth!.role);
  res.json({ bookings: bookings.map(serializeBooking) });
});

export const getBooking = asyncHandler(async (req, res) => {
  const bookingId = String(req.params.id);
  const booking = await BookingModel.findById(bookingId).lean();
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const actorId = req.auth!.userId;
  const isAdmin = req.auth!.role === "admin";
  const belongsToUser = booking.userId?.toString?.() === actorId || booking.driverId?.toString?.() === actorId;
  if (!isAdmin && !belongsToUser) {
    throw new ApiError(403, "Booking does not belong to the current user");
  }

  res.json({ booking: serializeBooking(booking) });
});

export const cancelBookingController = asyncHandler(async (req, res) => {
  const booking = await cancelBooking(String(req.params.id), req.auth!.userId);
  res.json({ booking: serializeBooking(booking) });
});
