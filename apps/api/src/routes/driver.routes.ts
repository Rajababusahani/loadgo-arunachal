import { Router } from "express";
import {
  acceptOffer,
  completeRide,
  createDriverProfile,
  driverValidators,
  getOffers,
  markArriving,
  postTracking,
  rejectOffer,
  startRide,
  updateAvailability,
  updateDriverProfile,
  uploadDriverKyc
} from "../controllers/driver.controller";
import { requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";

export const driverRouter = Router();

driverRouter.post("/profile", validate(driverValidators.createOrUpdateProfile), createDriverProfile);
driverRouter.patch("/profile", requireRole("driver"), validate(driverValidators.createOrUpdateProfile), updateDriverProfile);
driverRouter.post("/kyc", requireRole("driver"), validate(driverValidators.uploadKyc), uploadDriverKyc);
driverRouter.post("/availability", requireRole("driver"), validate(driverValidators.updateAvailability), updateAvailability);
driverRouter.get("/bookings/offers", requireRole("driver"), getOffers);
driverRouter.post("/bookings/:id/accept", requireRole("driver"), validate(driverValidators.bookingAction), acceptOffer);
driverRouter.post("/bookings/:id/reject", requireRole("driver"), validate(driverValidators.bookingAction), rejectOffer);
driverRouter.post("/bookings/:id/arrive", requireRole("driver"), validate(driverValidators.bookingAction), markArriving);
driverRouter.post("/bookings/:id/start", requireRole("driver"), validate(driverValidators.bookingAction), startRide);
driverRouter.post("/bookings/:id/complete", requireRole("driver"), validate(driverValidators.bookingAction), completeRide);
driverRouter.post("/tracking", requireRole("driver"), validate(driverValidators.tracking), postTracking);
