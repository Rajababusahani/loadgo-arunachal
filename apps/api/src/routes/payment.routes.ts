import { Router } from "express";
import { createOrder, paymentValidators, verifyPayment } from "../controllers/payment.controller";
import { validate } from "../middleware/validate";

export const paymentRouter = Router();

paymentRouter.post("/create-order", validate(paymentValidators.createOrder), createOrder);
paymentRouter.post("/verify", validate(paymentValidators.verify), verifyPayment);
