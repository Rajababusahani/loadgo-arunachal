import { z } from "zod";
import { asyncHandler } from "../utils/async-handler";
import { createPaymentOrder, verifyPaymentSignature } from "../services/payment.service";

const orderSchema = z.object({
  body: z.object({ bookingId: z.string().min(1) }),
  params: z.object({}),
  query: z.object({})
});

const verifySchema = z.object({
  body: z.object({
    bookingId: z.string().min(1),
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1)
  }),
  params: z.object({}),
  query: z.object({})
});

export const paymentValidators = {
  createOrder: orderSchema,
  verify: verifySchema
};

export const createOrder = asyncHandler(async (req, res) => {
  const order = await createPaymentOrder(req.body.bookingId);
  res.json({ order });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const result = await verifyPaymentSignature(req.body);
  res.json(result);
});
