import { Router } from "express";
import {
  adminValidators,
  approveDriver,
  createManualBooking,
  getDashboard,
  getPricing,
  listBookingsAdmin,
  listComplaints,
  listDrivers,
  listUsers,
  rejectDriver,
  seedDevData,
  updateComplaint,
  updatePricing
} from "../controllers/admin.controller";
import { requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";

export const adminRouter = Router();

adminRouter.use(requireRole("admin"));
adminRouter.get("/dashboard", getDashboard);
adminRouter.get("/users", listUsers);
adminRouter.get("/drivers", listDrivers);
adminRouter.post("/drivers/:id/approve", validate(adminValidators.approveReject), approveDriver);
adminRouter.post("/drivers/:id/reject", validate(adminValidators.approveReject), rejectDriver);
adminRouter.get("/pricing", getPricing);
adminRouter.put("/pricing/:vehicleType", validate(adminValidators.pricingUpdate), updatePricing);
adminRouter.get("/bookings", listBookingsAdmin);
adminRouter.post("/bookings/manual", validate(adminValidators.manualBooking), createManualBooking);
adminRouter.get("/complaints", listComplaints);
adminRouter.patch("/complaints/:id", validate(adminValidators.complaintUpdate), updateComplaint);
adminRouter.post("/dev/seed", validate(adminValidators.devSeed), seedDevData);
