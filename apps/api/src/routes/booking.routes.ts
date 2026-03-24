import { Router } from "express";
import {
  bookingValidators,
  cancelBookingController,
  createBookingController,
  getBooking,
  listBookings
} from "../controllers/booking.controller";
import { validate } from "../middleware/validate";

export const bookingRouter = Router();

bookingRouter.post("/", validate(bookingValidators.create), createBookingController);
bookingRouter.get("/", listBookings);
bookingRouter.get("/:id", validate(bookingValidators.bookingId), getBooking);
bookingRouter.post("/:id/cancel", validate(bookingValidators.bookingId), cancelBookingController);
