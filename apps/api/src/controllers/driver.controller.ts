import { z } from "zod";
import { DriverProfileModel } from "../models/DriverProfile";
import { UserModel } from "../models/User";
import { BookingModel } from "../models/Booking";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import { toGeoPoint } from "../utils/geo";
import { acceptDriverOffer, rejectDriverOffer, transitionBookingStatus } from "../services/booking.service";
import { cacheDriverTracking } from "../services/tracking.service";

const driverProfileSchema = z.object({
  body: z.object({
    vehicleType: z.enum(["bike", "mini_truck", "pickup_truck"]),
    currentAddress: z.string().min(2).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

const driverKycSchema = z.object({
  body: z.object({
    documents: z.array(z.object({
      kind: z.enum(["license", "vehicle_rc", "profile_photo"]),
      url: z.string().url(),
      publicId: z.string().min(1),
      uploadedAt: z.string().datetime()
    })).min(2)
  }),
  params: z.object({}),
  query: z.object({})
});

const availabilitySchema = z.object({
  body: z.object({
    availability: z.enum(["offline", "online", "busy"]),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().min(2).optional()
    }).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

const bookingIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({})
});

const trackingSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number(),
    speed: z.number().optional(),
    heading: z.number().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const driverValidators = {
  createOrUpdateProfile: driverProfileSchema,
  uploadKyc: driverKycSchema,
  updateAvailability: availabilitySchema,
  bookingAction: bookingIdSchema,
  tracking: trackingSchema
};

export const createDriverProfile = asyncHandler(async (req, res) => {
  const userId = req.auth!.userId;
  await UserModel.findByIdAndUpdate(userId, { $set: { role: "driver" } });

  const profile = await DriverProfileModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        vehicleType: req.body.vehicleType,
        currentAddress: req.body.currentAddress
      }
    },
    { upsert: true, new: true }
  );

  res.status(201).json({ profile });
});

export const updateDriverProfile = asyncHandler(async (req, res) => {
  const profile = await DriverProfileModel.findOneAndUpdate(
    { userId: req.auth!.userId },
    {
      $set: {
        vehicleType: req.body.vehicleType,
        currentAddress: req.body.currentAddress
      }
    },
    { new: true }
  );

  res.json({ profile });
});

export const uploadDriverKyc = asyncHandler(async (req, res) => {
  const profile = await DriverProfileModel.findOneAndUpdate(
    { userId: req.auth!.userId },
    {
      $set: {
        documents: req.body.documents,
        approvalStatus: "pending"
      }
    },
    { new: true }
  );

  if (!profile) {
    throw new ApiError(404, "Driver profile not found");
  }

  res.json({ profile });
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const profile = await DriverProfileModel.findOne({ userId: req.auth!.userId });
  if (!profile) {
    throw new ApiError(404, "Driver profile not found");
  }

  if (req.body.availability === "online" && profile.approvalStatus !== "approved") {
    throw new ApiError(400, "Driver must be approved before going online");
  }

  profile.availability = req.body.availability;
  if (req.body.location) {
    profile.currentLocation = toGeoPoint(req.body.location.lat, req.body.location.lng) as any;
    profile.currentAddress = req.body.location.address ?? profile.currentAddress;
    profile.lastLocationAt = new Date();
  }

  await profile.save();
  res.json({ profile });
});

export const getOffers = asyncHandler(async (req, res) => {
  const offers = await BookingModel.find({
    "offerState.driverId": req.auth!.userId,
    status: "searching",
    "offerState.expiresAt": { $gte: new Date() }
  }).sort({ createdAt: 1 }).lean();

  res.json({ offers });
});

export const acceptOffer = asyncHandler(async (req, res) => {
  const booking = await acceptDriverOffer(String(req.params.id), req.auth!.userId);
  await DriverProfileModel.findOneAndUpdate({ userId: req.auth!.userId }, { $set: { availability: "busy" } });
  res.json({ booking });
});

export const rejectOffer = asyncHandler(async (req, res) => {
  const booking = await rejectDriverOffer(String(req.params.id), req.auth!.userId);
  await DriverProfileModel.findOneAndUpdate({ userId: req.auth!.userId }, { $set: { availability: "online" } });
  res.json({ booking });
});

export const markArriving = asyncHandler(async (req, res) => {
  const booking = await transitionBookingStatus(String(req.params.id), "arriving", req.auth!.userId);
  res.json({ booking });
});

export const startRide = asyncHandler(async (req, res) => {
  const booking = await transitionBookingStatus(String(req.params.id), "in_transit", req.auth!.userId);
  res.json({ booking });
});

export const completeRide = asyncHandler(async (req, res) => {
  const booking = await transitionBookingStatus(String(req.params.id), "completed", req.auth!.userId);
  await DriverProfileModel.findOneAndUpdate(
    { userId: req.auth!.userId },
    {
      $inc: {
        earningsToday: booking.finalPrice,
        totalEarnings: booking.finalPrice
      },
      $set: { availability: "online" }
    }
  );

  res.json({ booking });
});

export const postTracking = asyncHandler(async (req, res) => {
  await cacheDriverTracking({
    bookingId: req.body.bookingId,
    driverId: req.auth!.userId,
    lat: req.body.lat,
    lng: req.body.lng,
    accuracy: req.body.accuracy,
    speed: req.body.speed,
    heading: req.body.heading
  });

  res.status(202).json({ success: true });
});
