import { z } from "zod";
import { DriverProfileModel } from "../models/DriverProfile";
import { UserModel } from "../models/User";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/api-error";
import { toGeoPoint } from "../utils/geo";

const meUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    language: z.enum(["en", "hi"]).optional(),
    themeMode: z.enum(["light", "dark", "system"]).optional(),
    lastKnownLocation: z.object({
      address: z.string().min(2),
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const meValidators = {
  update: meUpdateSchema
};

export const getMe = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.auth?.userId).lean();
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const driverProfile = user.role === "driver"
    ? await DriverProfileModel.findOne({ userId: user._id }).lean()
    : null;

  res.json({
    user,
    driverProfile
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const update: Record<string, unknown> = {};
  if (req.body.name) update.name = req.body.name;
  if (req.body.language) update.language = req.body.language;
  if (req.body.themeMode) update.themeMode = req.body.themeMode;
  if (req.body.lastKnownLocation) {
    update.lastKnownLocation = {
      address: req.body.lastKnownLocation.address,
      point: toGeoPoint(req.body.lastKnownLocation.lat, req.body.lastKnownLocation.lng),
      updatedAt: new Date()
    };
  }

  const user = await UserModel.findByIdAndUpdate(req.auth?.userId, { $set: update }, { new: true });
  res.json({ user });
});
