import mongoose from "mongoose";
import { z } from "zod";
import { BookingModel } from "../models/Booking";
import { ComplaintModel } from "../models/Complaint";
import { DriverProfileModel } from "../models/DriverProfile";
import { PaymentModel } from "../models/Payment";
import { PricingConfigModel } from "../models/PricingConfig";
import { UserModel } from "../models/User";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import { createBooking, acceptDriverOffer, transitionBookingStatus } from "../services/booking.service";
import { serializeBooking } from "../utils/serializers";
import { env } from "../config/env";
import { toGeoPoint } from "../utils/geo";

const approveRejectSchema = z.object({
  body: z.object({ note: z.string().max(300).optional() }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({})
});

const pricingUpdateSchema = z.object({
  body: z.object({
    baseFare: z.number().min(0),
    perKmRate: z.number().min(0),
    isActive: z.boolean().default(true)
  }),
  params: z.object({ vehicleType: z.enum(["bike", "mini_truck", "pickup_truck"]) }),
  query: z.object({})
});

const manualBookingSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    pickup: z.object({ address: z.string().min(2), lat: z.number(), lng: z.number(), landmark: z.string().optional() }),
    drop: z.object({ address: z.string().min(2), lat: z.number(), lng: z.number(), landmark: z.string().optional() }),
    vehicleType: z.enum(["bike", "mini_truck", "pickup_truck"]),
    paymentMethod: z.enum(["upi", "card", "cash"]),
    notes: z.string().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

const complaintUpdateSchema = z.object({
  body: z.object({
    status: z.enum(["open", "in_review", "resolved"]),
    resolutionNotes: z.string().optional()
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({})
});

const devSeedSchema = z.object({
  body: z.object({ reset: z.boolean().default(false) }).default({ reset: false }),
  params: z.object({}),
  query: z.object({})
});

export const adminValidators = {
  approveReject: approveRejectSchema,
  pricingUpdate: pricingUpdateSchema,
  manualBooking: manualBookingSchema,
  complaintUpdate: complaintUpdateSchema,
  devSeed: devSeedSchema
};

export const getDashboard = asyncHandler(async (_req, res) => {
  const [activeRides, totalBookings, totalRevenue, pendingDrivers] = await Promise.all([
    BookingModel.countDocuments({ status: { $in: ["assigned", "arriving", "in_transit"] } }),
    BookingModel.countDocuments({}),
    BookingModel.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$finalPrice" } } }]),
    DriverProfileModel.countDocuments({ approvalStatus: "pending" })
  ]);

  res.json({
    activeRides,
    totalBookings,
    totalRevenue: totalRevenue[0]?.total ?? 0,
    pendingDrivers
  });
});

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await UserModel.find({}).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ users });
});

export const listDrivers = asyncHandler(async (_req, res) => {
  const drivers = await DriverProfileModel.find({}).populate("userId", "name phone role").sort({ createdAt: -1 }).lean();
  res.json({ drivers });
});

export const approveDriver = asyncHandler(async (req, res) => {
  const driver = await DriverProfileModel.findByIdAndUpdate(req.params.id, { $set: { approvalStatus: "approved" } }, { new: true });
  if (!driver) {
    throw new ApiError(404, "Driver not found");
  }

  res.json({ driver });
});

export const rejectDriver = asyncHandler(async (req, res) => {
  const driver = await DriverProfileModel.findByIdAndUpdate(req.params.id, { $set: { approvalStatus: "rejected", availability: "offline" } }, { new: true });
  if (!driver) {
    throw new ApiError(404, "Driver not found");
  }

  res.json({ driver, note: req.body.note ?? null });
});

export const getPricing = asyncHandler(async (_req, res) => {
  const pricing = await PricingConfigModel.find({}).sort({ vehicleType: 1 }).lean();
  res.json({ pricing });
});

export const updatePricing = asyncHandler(async (req, res) => {
  const pricing = await PricingConfigModel.findOneAndUpdate(
    { vehicleType: req.params.vehicleType },
    { $set: req.body },
    { upsert: true, new: true }
  );

  res.json({ pricing });
});

export const listBookingsAdmin = asyncHandler(async (_req, res) => {
  const bookings = await BookingModel.find({}).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ bookings: bookings.map(serializeBooking) });
});

export const createManualBooking = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.body.userId);
  if (!user) {
    throw new ApiError(404, "Customer not found");
  }

  const booking = await createBooking({
    userId: req.body.userId,
    pickup: req.body.pickup,
    drop: req.body.drop,
    vehicleType: req.body.vehicleType,
    paymentMethod: req.body.paymentMethod,
    notes: req.body.notes
  });

  res.status(201).json({ booking: serializeBooking(booking) });
});

export const listComplaints = asyncHandler(async (_req, res) => {
  const complaints = await ComplaintModel.find({}).sort({ createdAt: -1 }).lean();
  res.json({ complaints });
});

export const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await ComplaintModel.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  );

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  res.json({ complaint });
});

export const seedDevData = asyncHandler(async (req, res) => {
  if (!env.USE_MOCK_SERVICES) {
    throw new ApiError(404, "Dev seed is only available in mock mode");
  }

  if (req.body.reset) {
    await Promise.all([
      ComplaintModel.deleteMany({}),
      PaymentModel.deleteMany({}),
      BookingModel.deleteMany({}),
      DriverProfileModel.deleteMany({}),
      UserModel.deleteMany({ firebaseUid: { $in: ["dev-admin", "dev-driver", "dev-driver-2", "dev-customer", "dev-customer-2"] } })
    ]);
  }

  const adminUser = await UserModel.findOneAndUpdate(
    { firebaseUid: "dev-admin" },
    { $set: { name: "Dev Admin", phone: "+919999999999", role: "admin" } },
    { upsert: true, new: true }
  );

  const approvedDriverUser = await UserModel.findOneAndUpdate(
    { firebaseUid: "dev-driver" },
    { $set: { name: "Tsering Lhamu", phone: "+919876543210", role: "driver" } },
    { upsert: true, new: true }
  );

  const pendingDriverUser = await UserModel.findOneAndUpdate(
    { firebaseUid: "dev-driver-2" },
    { $set: { name: "Abo Tayeng", phone: "+919812345678", role: "driver" } },
    { upsert: true, new: true }
  );

  const customerUser = await UserModel.findOneAndUpdate(
    { firebaseUid: "dev-customer" },
    { $set: { name: "Maya Taki", phone: "+919811111111", role: "customer" } },
    { upsert: true, new: true }
  );

  const customerUserTwo = await UserModel.findOneAndUpdate(
    { firebaseUid: "dev-customer-2" },
    { $set: { name: "Nabam Rina", phone: "+919822222222", role: "customer" } },
    { upsert: true, new: true }
  );

  await DriverProfileModel.findOneAndUpdate(
    { userId: approvedDriverUser._id },
    {
      $set: {
        vehicleType: "mini_truck",
        approvalStatus: "approved",
        availability: "online",
        currentAddress: "Naharlagun market",
        currentLocation: toGeoPoint(27.1045, 93.6951),
        lastLocationAt: new Date(),
        documents: [
          { kind: "license", url: "https://example.com/license.jpg", publicId: "mock/license", uploadedAt: new Date() },
          { kind: "vehicle_rc", url: "https://example.com/rc.jpg", publicId: "mock/rc", uploadedAt: new Date() }
        ]
      }
    },
    { upsert: true, new: true }
  );

  await DriverProfileModel.findOneAndUpdate(
    { userId: pendingDriverUser._id },
    {
      $set: {
        vehicleType: "pickup_truck",
        approvalStatus: "pending",
        availability: "offline",
        currentAddress: "Doimukh main road",
        currentLocation: toGeoPoint(27.1501, 93.7274),
        lastLocationAt: new Date(),
        documents: [
          { kind: "license", url: "https://example.com/license2.jpg", publicId: "mock/license2", uploadedAt: new Date() },
          { kind: "vehicle_rc", url: "https://example.com/rc2.jpg", publicId: "mock/rc2", uploadedAt: new Date() }
        ]
      }
    },
    { upsert: true, new: true }
  );

  const existingDemoBookings = await BookingModel.countDocuments({ notes: { $regex: "demo-seed" } });
  if (!existingDemoBookings) {
    const firstBooking = await createBooking({
      userId: customerUser._id.toString(),
      pickup: { address: "Naharlagun market", lat: 27.1045, lng: 93.6951, landmark: "Near main circle" },
      drop: { address: "Itanagar sector E", lat: 27.0844, lng: 93.6053, landmark: "Near government quarter" },
      vehicleType: "mini_truck",
      paymentMethod: "cash",
      notes: "demo-seed active ride"
    });

    await acceptDriverOffer(firstBooking.id, approvedDriverUser._id.toString());

    const secondBooking = await createBooking({
      userId: customerUserTwo._id.toString(),
      pickup: { address: "Ganga market", lat: 27.0977, lng: 93.6176, landmark: "Near taxi stand" },
      drop: { address: "Yupia circle", lat: 27.1757, lng: 93.7876, landmark: "Near police point" },
      vehicleType: "mini_truck",
      paymentMethod: "upi",
      notes: "demo-seed completed ride"
    });

    await acceptDriverOffer(secondBooking.id, approvedDriverUser._id.toString());
    await transitionBookingStatus(secondBooking.id, "arriving", approvedDriverUser._id.toString());
    await transitionBookingStatus(secondBooking.id, "in_transit", approvedDriverUser._id.toString());
    await transitionBookingStatus(secondBooking.id, "completed", approvedDriverUser._id.toString());
    await Promise.all([
      BookingModel.findByIdAndUpdate(secondBooking.id, { $set: { paymentStatus: "paid" } }),
      PaymentModel.findOneAndUpdate({ bookingId: secondBooking.id }, { $set: { status: "paid", paidAt: new Date() } })
    ]);

    await ComplaintModel.create({
      bookingId: new mongoose.Types.ObjectId(secondBooking.id),
      userId: customerUserTwo._id,
      driverId: approvedDriverUser._id,
      description: "Driver arrived late because of traffic near Ganga market.",
      status: "open"
    });

    await DriverProfileModel.findOneAndUpdate(
      { userId: approvedDriverUser._id },
      {
        $set: { availability: "online" },
        $inc: { earningsToday: secondBooking.finalPrice, totalEarnings: secondBooking.finalPrice }
      }
    );
  }

  const [dashboard, drivers, bookings, complaints] = await Promise.all([
    Promise.all([
      BookingModel.countDocuments({ status: { $in: ["assigned", "arriving", "in_transit"] } }),
      BookingModel.countDocuments({}),
      BookingModel.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$finalPrice" } } }]),
      DriverProfileModel.countDocuments({ approvalStatus: "pending" })
    ]),
    DriverProfileModel.countDocuments({}),
    BookingModel.countDocuments({}),
    ComplaintModel.countDocuments({})
  ]);

  res.json({
    message: "Demo data is ready",
    users: { adminId: adminUser._id, customerId: customerUser._id, driverId: approvedDriverUser._id },
    summary: {
      activeRides: dashboard[0],
      totalBookings: dashboard[1],
      totalRevenue: dashboard[2][0]?.total ?? 0,
      pendingDrivers: dashboard[3],
      driverProfiles: drivers,
      bookings,
      complaints
    }
  });
});
