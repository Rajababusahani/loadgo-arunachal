import { Router } from "express";
import { profileRouter } from "./profile.routes";
import { driverRouter } from "./driver.routes";
import { locationRouter } from "./location.routes";
import { bookingRouter } from "./booking.routes";
import { paymentRouter } from "./payment.routes";
import { adminRouter } from "./admin.routes";

export const apiRouter = Router();

apiRouter.use(profileRouter);
apiRouter.use("/drivers", driverRouter);
apiRouter.use("/locations", locationRouter);
apiRouter.use("/bookings", bookingRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/admin", adminRouter);
